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
// Evidence uses bare [HH:MM:SS] times, "October 14, 2026", "9:00 PM" etc.
// Everything is anchored to a case date so sorting is real Date math,
// never LLM text ordering. Times before 12:00 on telemetry that follows
// late-night events roll to the next day (the 01:12-after-22:06 case).
function normalizeTime(timeStr, anchorDate, prevISO) {
  if (!timeStr) return null;
  const t = timeStr.trim();

  // Already ISO-ish: 2026-10-14 21:42:00
  let m = t.match(/(\d{4})-(\d{2})-(\d{2})[T ](\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}T${m[4].padStart(2, '0')}:${m[5]}:${m[6] || '00'}`;

  // 12h: 9:00 PM
  m = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (m) {
    let h = parseInt(m[1], 10) % 12;
    if (/pm/i.test(m[3])) h += 12;
    return rollover(`${anchorDate}T${String(h).padStart(2, '0')}:${m[2]}:00`, prevISO);
  }

  // 24h: 21:40:00 or 21:40
  m = t.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (m) {
    return rollover(`${anchorDate}T${m[1].padStart(2, '0')}:${m[2]}:${m[3] || '00'}`, prevISO);
  }
  return null;
}

// Parse naive ISO strings as UTC consistently — never let the machine's
// local timezone shift evidence timestamps.
function parseISO(iso) {
  return new Date(iso.length === 19 ? iso + 'Z' : iso);
}
function isoAddMinutes(iso, mins) {
  return new Date(parseISO(iso).getTime() + mins * 60000).toISOString().slice(0, 19);
}

// If this reading is >6h EARLIER than the previous one in the same file,
// it crossed midnight — advance the day.
function rollover(iso, prevISO) {
  if (!prevISO) return iso;
  if (parseISO(prevISO) - parseISO(iso) > 6 * 3600 * 1000) {
    return new Date(parseISO(iso).getTime() + 24 * 3600 * 1000).toISOString().slice(0, 19);
  }
  return iso;
}

function extractAnchorDate(text) {
  // "October 14, 2026" | "2026-10-14" | "Date: October 14, 2026 - October 15, 2026"
  const months = { january: '01', february: '02', march: '03', april: '04', may: '05', june: '06', july: '07', august: '08', september: '09', october: '10', november: '11', december: '12' };
  let m = text.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/i);
  if (m) return `${m[3]}-${months[m[1].toLowerCase()]}-${String(m[2]).padStart(2, '0')}`;
  m = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return null;
}

// Minutes between two ISO timestamps (absolute)
function minutesBetween(a, b) {
  return Math.abs(parseISO(a) - parseISO(b)) / 60000;
}

function within(iso, startISO, endISO) {
  const t = parseISO(iso);
  return t >= parseISO(startISO) && t <= parseISO(endISO);
}

module.exports = { nextId, seedCounter, resetCounters, sha256, normalizeTime, extractAnchorDate, minutesBetween, within, parseISO, isoAddMinutes };
