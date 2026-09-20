// Core utility functions — pure, deterministic, no infrastructure dependencies.
// These are the mathematical and parsing primitives the entire engine uses.
const crypto = require('crypto');

let counters = {};
function nextId(prefix) {
  counters[prefix] = (counters[prefix] || 0) + 1;
  return `${prefix}-${String(counters[prefix]).padStart(3, '0')}`;
}
function seedCounter(prefix, value) {
  counters[prefix] = Math.max(counters[prefix] || 0, value);
}
function resetCounters() { counters = {}; }

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

// ── Timestamp normalization ─────────────────────────────
function normalizeTime(timeStr, anchorDate, prevISO) {
  if (!timeStr) return null;
  const t = timeStr.trim();

  let m = t.match(/(\d{4})-(\d{2})-(\d{2})[T ](\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}T${m[4].padStart(2, '0')}:${m[5]}:${m[6] || '00'}`;

  m = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (m) {
    let h = parseInt(m[1], 10) % 12;
    if (/pm/i.test(m[3])) h += 12;
    return rollover(`${anchorDate}T${String(h).padStart(2, '0')}:${m[2]}:00`, prevISO);
  }

  m = t.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (m) {
    return rollover(`${anchorDate}T${m[1].padStart(2, '0')}:${m[2]}:${m[3] || '00'}`, prevISO);
  }
  return null;
}

function parseISO(iso) {
  return new Date(iso.length === 19 ? iso + 'Z' : iso);
}
function isoAddMinutes(iso, mins) {
  return new Date(parseISO(iso).getTime() + mins * 60000).toISOString().slice(0, 19);
}

function rollover(iso, prevISO) {
  if (!prevISO) return iso;
  if (parseISO(prevISO) - parseISO(iso) > 6 * 3600 * 1000) {
    return new Date(parseISO(iso).getTime() + 24 * 3600 * 1000).toISOString().slice(0, 19);
  }
  return iso;
}

function extractAnchorDate(text) {
  const months = { january: '01', february: '02', march: '03', april: '04', may: '05', june: '06', july: '07', august: '08', september: '09', october: '10', november: '11', december: '12' };
  let m = text.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/i);
  if (m) return `${m[3]}-${months[m[1].toLowerCase()]}-${String(m[2]).padStart(2, '0')}`;
  m = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return null;
}

function minutesBetween(a, b) {
  return Math.abs(parseISO(a) - parseISO(b)) / 60000;
}

function within(iso, startISO, endISO) {
  const t = parseISO(iso);
  return t >= parseISO(startISO) && t <= parseISO(endISO);
}

// ── Evidence hashing for provenance ─────────────────────
function hashEvidence(content) {
  return sha256(typeof content === 'string' ? content : Buffer.from(content));
}

// ── Deterministic distance calculation (Haversine) ──────
function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Impossible travel detection ─────────────────────────
// Returns true if travel between two points in the given time is physically impossible
function isImpossibleTravel(lat1, lon1, lat2, lon2, minutesElapsed, maxSpeedKmh = 120) {
  if (!lat1 || !lon1 || !lat2 || !lon2 || !minutesElapsed) return false;
  const dist = distanceKm(lat1, lon1, lat2, lon2);
  const maxDist = maxSpeedKmh * (minutesElapsed / 60);
  return dist > maxDist;
}

module.exports = {
  nextId, seedCounter, resetCounters, sha256, hashEvidence,
  normalizeTime, extractAnchorDate, minutesBetween, within, parseISO, isoAddMinutes,
  distanceKm, isImpossibleTravel,
};
