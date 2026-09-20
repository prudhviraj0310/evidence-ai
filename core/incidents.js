// Deterministic Incident Detection Engine — detects COMBINATIONS of
// observations that form investigatable patterns. These are EVENTS and
// HYPOTHESES, NOT automatic accusations.
const bus = require('./bus');
const { minutesBetween, within } = require('./util');

const INCIDENT_RULES = [
  {
    id: 'ACCESS_ANOMALY',
    name: 'Access Anomaly',
    description: 'Person enters restricted zone without corresponding badge event',
    severity: 'high',
    detect: (store) => detectAccessAnomaly(store),
  },
  {
    id: 'LOCATION_CONTRADICTION',
    name: 'Location Contradiction',
    description: 'Person appears at location A while records place associated device at location B within impossible travel window',
    severity: 'critical',
    detect: (store) => detectLocationContradiction(store),
  },
  {
    id: 'ASSET_DISCREPANCY',
    name: 'Asset Discrepancy',
    description: 'Object movement detected by camera while inventory/access logs show no corresponding event',
    severity: 'medium',
    detect: (store) => detectAssetDiscrepancy(store),
  },
  {
    id: 'UNAUTHORIZED_ACCESS',
    name: 'Unauthorized Access Event',
    description: 'Door opens without corresponding authentication event',
    severity: 'high',
    detect: (store) => detectUnauthorizedAccess(store),
  },
  {
    id: 'CORRELATED_ACTIVITY',
    name: 'Correlated Activity',
    description: 'Multiple people at same restricted location with coordinated timestamps',
    severity: 'high',
    detect: (store) => detectCorrelatedActivity(store),
  },
];

function detectIncidents(store) {
  bus.emit('INCIDENT', 'Running deterministic incident detection engine');
  const incidents = [];

  for (const rule of INCIDENT_RULES) {
    try {
      const detected = rule.detect(store);
      for (const d of detected) {
        incidents.push({
          id: `INC-${String(incidents.length + 1).padStart(3, '0')}`,
          ruleId: rule.id,
          name: rule.name,
          description: d.description,
          severity: d.severity || rule.severity,
          timestamp: d.timestamp,
          location: d.location,
          entityIds: d.entityIds || [],
          evidenceIds: d.evidenceIds || [],
          cameraId: d.cameraId || null,
          observations: d.observations || [],
          category: 'EVENT', // explicitly NOT 'ACCUSATION'
        });
      }
    } catch (err) {
      bus.emit('INCIDENT', `Rule ${rule.id} failed: ${err.message}`);
    }
  }

  store.incidents = incidents;
  bus.emit('INCIDENT', `${incidents.length} incident(s) detected across ${INCIDENT_RULES.length} rules`);
  return incidents;
}

function detectAccessAnomaly(store) {
  const results = [];
  const zoneEntries = store.claims.filter(c =>
    c.type === 'observation' &&
    /restricted|server room|secure area|authorized personnel/i.test(c.sourceQuote));

  const accessEvents = store.claims.filter(c =>
    c.type === 'telemetry' &&
    /badge|credential|access card|swipe|authenticate/i.test(c.sourceQuote));

  for (const entry of zoneEntries) {
    if (!entry.tISO) continue;
    const matchingAccess = accessEvents.find(a =>
      a.tISO && minutesBetween(entry.tISO, a.tISO) < 5 &&
      a.subjectEntityId === entry.subjectEntityId);

    if (!matchingAccess) {
      results.push({
        description: `Person detected in restricted zone at ${entry.tISO.slice(11, 16)} without corresponding badge event: "${entry.sourceQuote.slice(0, 100)}"`,
        timestamp: entry.tISO,
        location: entry.locationMention,
        entityIds: [entry.subjectEntityId].filter(Boolean),
        evidenceIds: [entry.evidenceId],
        observations: [{ type: 'ZONE_ENTRY', claim: entry }, { type: 'NO_BADGE', missing: true }],
      });
    }
  }
  return results;
}

function detectLocationContradiction(store) {
  const results = [];
  const located = store.claims.filter(c =>
    c.tISO && c.subjectEntityId && c.locationMention &&
    (c.type === 'observation' || c.type === 'telemetry'));

  // Group by entity
  const byEntity = {};
  for (const c of located) {
    (byEntity[c.subjectEntityId] = byEntity[c.subjectEntityId] || []).push(c);
  }

  for (const [entityId, claims] of Object.entries(byEntity)) {
    const sorted = claims.sort((a, b) => new Date(a.tISO) - new Date(b.tISO));
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      const gap = minutesBetween(prev.tISO, curr.tISO);
      // If locations are very different and time gap is too short
      if (gap < 10 && gap > 0 &&
          prev.locationMention && curr.locationMention &&
          prev.locationMention.toLowerCase() !== curr.locationMention.toLowerCase() &&
          prev.evidenceId !== curr.evidenceId) {
        results.push({
          description: `Entity at "${prev.locationMention}" (${prev.tISO.slice(11, 16)}) and "${curr.locationMention}" (${curr.tISO.slice(11, 16)}) — only ${Math.round(gap)} minutes apart across different evidence sources`,
          severity: gap < 3 ? 'critical' : 'high',
          timestamp: curr.tISO,
          location: curr.locationMention,
          entityIds: [entityId],
          evidenceIds: [prev.evidenceId, curr.evidenceId],
          observations: [
            { type: 'LOCATION_A', claim: prev },
            { type: 'LOCATION_B', claim: curr },
          ],
        });
      }
    }
  }
  return results;
}

function detectAssetDiscrepancy(store) {
  const results = [];
  const objectMovements = store.claims.filter(c =>
    c.type === 'observation' &&
    /object|item|device|package|bag|case|drive|laptop|document/i.test(c.sourceQuote) &&
    /mov|remov|take|grab|pick|carry|exit.*with/i.test(c.sourceQuote));

  for (const movement of objectMovements) {
    results.push({
      description: `Object movement detected: "${movement.sourceQuote.slice(0, 100)}" — no corresponding inventory or authorization event found`,
      timestamp: movement.tISO,
      location: movement.locationMention,
      entityIds: [movement.subjectEntityId].filter(Boolean),
      evidenceIds: [movement.evidenceId],
      observations: [{ type: 'OBJECT_MOVEMENT', claim: movement }],
    });
  }
  return results;
}

function detectUnauthorizedAccess(store) {
  const results = [];
  const doorEvents = store.claims.filter(c =>
    /door open|door unlock|entry detect|gate open/i.test(c.sourceQuote) && c.tISO);

  const authEvents = store.claims.filter(c =>
    c.type === 'telemetry' &&
    /badge|credential|key card|authenticate|authorized/i.test(c.sourceQuote));

  for (const door of doorEvents) {
    const matchingAuth = authEvents.find(a =>
      a.tISO && minutesBetween(door.tISO, a.tISO) < 2 &&
      a.locationMention === door.locationMention);

    if (!matchingAuth) {
      results.push({
        description: `Door/entry event at ${door.tISO.slice(11, 16)} without authentication: "${door.sourceQuote.slice(0, 100)}"`,
        timestamp: door.tISO,
        location: door.locationMention,
        entityIds: [door.subjectEntityId].filter(Boolean),
        evidenceIds: [door.evidenceId],
        observations: [{ type: 'DOOR_OPEN', claim: door }, { type: 'NO_AUTH', missing: true }],
      });
    }
  }
  return results;
}

function detectCorrelatedActivity(store) {
  const results = [];
  const restricted = store.claims.filter(c =>
    c.type === 'observation' && c.tISO &&
    /restricted|server|secure|vault/i.test(c.locationMention || c.sourceQuote));

  // Group by location and time window
  const windows = {};
  for (const c of restricted) {
    const key = `${(c.locationMention || 'unknown').toLowerCase()}|${c.tISO.slice(0, 16)}`;
    (windows[key] = windows[key] || []).push(c);
  }

  for (const [key, claims] of Object.entries(windows)) {
    const uniqueEntities = [...new Set(claims.map(c => c.subjectEntityId).filter(Boolean))];
    if (uniqueEntities.length >= 2) {
      results.push({
        description: `${uniqueEntities.length} individuals at ${key.split('|')[0]} within coordinated timestamps`,
        timestamp: claims[0].tISO,
        location: claims[0].locationMention,
        entityIds: uniqueEntities,
        evidenceIds: [...new Set(claims.map(c => c.evidenceId))],
        observations: claims.map(c => ({ type: 'PERSON_PRESENT', claim: c })),
      });
    }
  }
  return results;
}

/**
 * Create a case from a live incident — packages camera frames,
 * timestamps, events, and related data into a new case structure.
 */
function packageIncidentAsCase(incident, cameraEvents = [], relatedClaims = []) {
  return {
    caseId: `CASE-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`,
    incidentId: incident.id,
    incidentType: incident.ruleId,
    createdAt: new Date().toISOString(),
    source: 'LIVE_INCIDENT',
    evidence: [],
    cameraFrames: cameraEvents.map(e => ({
      timestamp: e.timestamp,
      cameraId: e.cameraId,
      frameId: e.frameId,
      s3Key: e.s3Key,
      events: e.detections || [],
    })),
    relatedEntities: incident.entityIds,
    relatedLocations: [incident.location].filter(Boolean),
    initialEvents: incident.observations,
  };
}

module.exports = { detectIncidents, packageIncidentAsCase, INCIDENT_RULES };
