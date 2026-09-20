// Geospatial Reasoning — deterministic location graph and distance/time
// calculations. NEVER allows an LLM to determine physical possibility.
const bus = require('./bus');
const { distanceKm, isImpossibleTravel, minutesBetween, parseISO } = require('./util');

/**
 * Build a location graph from evidence claims.
 * Returns { locations[], connections[], impossibleTravels[] }
 */
function buildLocationGraph(store) {
  bus.emit('GEO', 'Building location graph from evidence claims');
  const locations = new Map(); // normalized name → location node
  const connections = [];
  const impossibleTravels = [];

  // Gather all location mentions with their metadata
  for (const entity of store.entities.filter(e => e.kind === 'location')) {
    const loc = {
      entityId: entity.entityId,
      name: entity.canonical,
      aliases: entity.aliases,
      latitude: null,
      longitude: null,
      accuracy: null,
      zone: extractZone(entity.canonical),
      building: extractBuilding(entity.canonical),
      floor: extractFloor(entity.canonical),
      room: extractRoom(entity.canonical),
      mentions: entity.mentions.length,
      evidenceIds: [...new Set(entity.mentions.map(m => m.evidenceId))],
      visitedBy: [],
    };
    locations.set(entity.entityId, loc);
  }

  // Extract GPS coordinates from telemetry claims
  for (const c of store.claims.filter(c => c.type === 'telemetry' && c.locationMention)) {
    const coords = extractCoordinates(c.sourceQuote);
    if (coords && c.locationEntityId && locations.has(c.locationEntityId)) {
      const loc = locations.get(c.locationEntityId);
      if (!loc.latitude) {
        loc.latitude = coords.lat;
        loc.longitude = coords.lon;
        loc.accuracy = coords.accuracy || 'gps';
      }
    }
  }

  // Build person → location connections
  const personLocations = {}; // entityId → [{locationId, tISO, evidenceId, source}]
  for (const c of store.claims.filter(c => c.subjectEntityId && c.locationEntityId && c.tISO)) {
    const entry = {
      locationId: c.locationEntityId,
      locationName: getLocationName(store, c.locationEntityId) || c.locationMention,
      tISO: c.tISO,
      evidenceId: c.evidenceId,
      claimId: c.claimId,
      source: c.type,
      reliability: c.reliability,
    };
    (personLocations[c.subjectEntityId] = personLocations[c.subjectEntityId] || []).push(entry);
  }

  // Create connections: person → location edges
  for (const [personId, locs] of Object.entries(personLocations)) {
    const personName = getEntityName(store, personId);
    const uniqueLocations = [...new Set(locs.map(l => l.locationId))];
    for (const locId of uniqueLocations) {
      const visits = locs.filter(l => l.locationId === locId);
      connections.push({
        personId,
        personName,
        locationId: locId,
        locationName: visits[0].locationName,
        visitCount: visits.length,
        firstSeen: visits[0].tISO,
        lastSeen: visits[visits.length - 1].tISO,
        sources: [...new Set(visits.map(v => v.source))],
        evidenceIds: [...new Set(visits.map(v => v.evidenceId))],
      });
    }

    // Detect impossible travel
    const sorted = locs.sort((a, b) => parseISO(a.tISO) - parseISO(b.tISO));
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      if (prev.locationId === curr.locationId) continue;

      const prevLoc = locations.get(prev.locationId);
      const currLoc = locations.get(curr.locationId);
      const gap = minutesBetween(prev.tISO, curr.tISO);

      // If we have coordinates, do precise impossible travel check
      if (prevLoc?.latitude && currLoc?.latitude) {
        if (isImpossibleTravel(prevLoc.latitude, prevLoc.longitude,
            currLoc.latitude, currLoc.longitude, gap)) {
          impossibleTravels.push({
            personId, personName,
            from: { locationId: prev.locationId, name: prev.locationName, time: prev.tISO },
            to: { locationId: curr.locationId, name: curr.locationName, time: curr.tISO },
            minutesElapsed: Math.round(gap),
            distanceKm: Math.round(distanceKm(prevLoc.latitude, prevLoc.longitude,
              currLoc.latitude, currLoc.longitude)),
            evidenceIds: [prev.evidenceId, curr.evidenceId],
            severity: gap < 5 ? 'critical' : 'high',
          });
        }
      }
      // If different named locations within very short time, flag it
      else if (gap < 3 && prev.locationName !== curr.locationName) {
        impossibleTravels.push({
          personId, personName,
          from: { locationId: prev.locationId, name: prev.locationName, time: prev.tISO },
          to: { locationId: curr.locationId, name: curr.locationName, time: curr.tISO },
          minutesElapsed: Math.round(gap),
          distanceKm: null,
          evidenceIds: [prev.evidenceId, curr.evidenceId],
          severity: 'medium',
          note: 'No coordinates — flagged by time proximity alone',
        });
      }
    }
  }

  const result = {
    locations: [...locations.values()],
    connections,
    impossibleTravels,
    personLocationIndex: personLocations,
  };

  store.locationGraph = result;
  bus.emit('GEO', `Location graph: ${locations.size} locations, ${connections.length} connections, ${impossibleTravels.length} impossible travel(s)`);
  return result;
}

// ── Helpers ──────────────────────────────────────────────

function getEntityName(store, id) {
  const e = store.entities.find(x => x.entityId === id);
  return e ? e.canonical : null;
}

function getLocationName(store, id) {
  const e = store.entities.find(x => x.entityId === id);
  return e ? e.canonical : null;
}

function extractCoordinates(text) {
  // "GPS: 40.7128, -74.0060" or "lat: 40.7128 lon: -74.0060"
  const m = text.match(/(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/);
  if (m) return { lat: parseFloat(m[1]), lon: parseFloat(m[2]) };
  return null;
}

function extractZone(name) {
  const m = name.match(/\b(east|west|north|south|central|zone\s*\w+)\b/i);
  return m ? m[1].toUpperCase() : null;
}

function extractBuilding(name) {
  const m = name.match(/\b(building|tower|block|wing|campus|facility)\s*\w*/i);
  return m ? m[0] : null;
}

function extractFloor(name) {
  const m = name.match(/\b(floor|level|basement|underground|ground)\s*\d*/i);
  return m ? m[0] : null;
}

function extractRoom(name) {
  const m = name.match(/\b(room|office|suite|lab|server\s*room)\s*\w*/i);
  return m ? m[0] : null;
}

module.exports = { buildLocationGraph };
