// Deterministic, grammar-based evidence parsers. These cannot hallucinate
// and work with zero network — the timeline spine is machine-read.
// The LLM is only asked to interpret ON TOP of parsed facts.
const { normalizeTime, extractAnchorDate } = require('./util');

const PHONE_RE = /\+?1?[-.\s]?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/g;
const PLATE_RE = /Plate:?\s*([A-Z0-9]{2,4}[-\s]?[A-Z0-9]{2,4})/gi;
const VEHICLE_RE = /\b((?:silver|black|white|red|blue|dark|grey|gray)\s+(?:sedan|suv|truck|van|coupe|hatchback))\b/gi;

function detectKind(text, fileName = '') {
  const t = text.slice(0, 2000);
  const f = fileName.toUpperCase();
  if (/A Number,B Number|IMSI,IMEI|Call_Direction|CALL_TYPE/i.test(t) || f.includes('CDR') || f.includes('CALL')) return 'phone';
  if (/CELLULAR RECORDS|TOWER:\s*T-/i.test(t) || f.includes('PHONE')) return 'phone';
  if (/FINANCIAL RECORDS|^\[[^\]]+\]\s*CARD\s*\d{4}:/im.test(t) || f.includes('FINANCIAL') || f.includes('CREDIT') || f.includes('_CC_')) return 'financial';
  if (/last4ccnum|loyalty/i.test(t)) return 'financial';
  if (/GPS TELEMETRY|GPS Location:|Timestamp,id,lat,long/i.test(t) || f.includes('GPS')) return 'gps';
  if (/CCTV|Camera \d+:/i.test(t) || f.includes('CCTV')) return 'cctv';
  if (/INTERVIEW TRANSCRIPT|^DETECTIVE:/im.test(t) || f.includes('INTERVIEW')) return 'interview';
  if (/From,To,Date,Subject/i.test(t) || f.includes('EMAIL')) return 'chat';
  if (/^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?\]\s*[A-Z][\w .]*:/m.test(t) || f.includes('CHAT')) return 'chat';
  if (f.endsWith('.JSON') || f.endsWith('.GEOJSON') || t.trim().startsWith('{') || t.trim().startsWith('[')) return 'network';
  return 'generic';
}

function mkClaim(fields) {
  return {
    type: 'observation', reliability: 0.9, subjectMention: null, action: null,
    objectMention: null, locationMention: null, tISO: null, speakerMention: null,
    sourceQuote: '', line: 0, ...fields,
  };
}

// Tokens that can never be part of a person's name — kills phantom
// "people" like "Silver Sedan" or "Investigator Note".
const NAME_STOP = new Set(['Security', 'Camera', 'Police', 'Department', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'Route', 'Level', 'Mile', 'Marker', 'Interstate', 'State', 'Patrol', 'Tech', 'Quick', 'Grand', 'The', 'Additional', 'Underground', 'Parking', 'East', 'West', 'North', 'South', 'Charity', 'Data', 'Engine', 'Driver', 'Fuel', 'Event', 'Speed', 'Silver', 'Sedan', 'Black', 'White', 'Suv', 'Plate', 'Vehicle', 'Stopped', 'Note', 'Investigator', 'Communications', 'Date', 'Hotel', 'District', 'Expressway', 'Corridor', 'Campus', 'Records', 'Return', 'Subject', 'Carrier', 'Duration', 'Burner', 'Mart', 'Tower', 'Cell', 'Phone', 'Cellular', 'Subpoena', 'Location', 'Detective', 'Witness', 'Transcript', 'Report', 'Telemetry', 'Metadata', 'Notes', 'Mayor', 'Summit', 'Session', 'Card', 'Financial', 'Purchase', 'Transaction', 'Airport', 'Autosupply', 'More', 'Island', 'Capitol', 'Source', 'Artifact', 'Technical', 'Specifications', 'Cryptographic', 'Hash', 'Evidence', 'Classification', 'Video', 'Surveillance', 'Stream', 'Activity', 'Log', 'Motion', 'Detection', 'Forensic', 'Verification', 'Physical', 'Scene', 'Digital', 'Exhibit', 'Feed', 'Channel', 'Binary', 'Checksum', 'Format', 'NVR']);

function harvestMentions(text) {
  const persons = new Set();
  const phones = new Set((text.match(PHONE_RE) || []).map((p) => p.replace(/[.\s()]/g, '-')));
  const vehicles = new Set();
  let m;
  const vre = new RegExp(VEHICLE_RE.source, 'gi');
  while ((m = vre.exec(text))) vehicles.add(titleCase(m[1]));
  const pre = new RegExp(PLATE_RE.source, 'gi');
  while ((m = pre.exec(text))) vehicles.add(`Plate ${m[1].toUpperCase()}`);
  // Capitalized first-last pairs on the SAME line only
  const nameRe = /\b([A-Z][a-z]{2,})[ \t]+([A-Z][a-z]{2,})\b/g;
  while ((m = nameRe.exec(text))) {
    if (!NAME_STOP.has(m[1]) && !NAME_STOP.has(m[2])) persons.add(`${m[1]} ${m[2]}`);
  }
  return { persons: [...persons], phones: [...phones], vehicles: [...vehicles] };
}

function titleCase(s) { return s.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase()); }

// ── CSV Helpers for Real Investigation Datasets ───────────────────
function parseCsvLine(line) {
  const out = []; let cur = ''; let q = false;
  for (const ch of line) {
    if (ch === '"') q = !q;
    else if (ch === ',' && !q) { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

function parseEmailCsv(text) {
  const claims = [];
  const lines = text.split('\n').filter((l) => l.trim());
  const rows = lines.slice(1, 101);
  rows.forEach((line, i) => {
    const [from, to, dateStr, ...subj] = parseCsvLine(line);
    const subject = subj.join(',').trim();
    const m = (dateStr || '').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/);
    const tISO = m ? `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')} ${m[4].padStart(2, '0')}:${m[5]}:00` : null;
    const sender = (from || '').split('@')[0].replace(/\./g, ' ');
    claims.push(mkClaim({
      type: 'communication',
      speakerMention: titleCase(sender),
      subjectMention: titleCase(sender),
      action: 'sent email',
      sourceQuote: `To ${(to || '').split('@')[0]}: ${subject}`,
      tISO, line: i + 2, reliability: 0.95,
    }));
  });
  return claims;
}

function parseCdrCsv(text) {
  const claims = [];
  const lines = text.split('\n').filter((l) => l.trim());
  const header = (lines[0] || '').toLowerCase();
  const rows = lines.slice(1, 101);
  rows.forEach((line, i) => {
    const parts = parseCsvLine(line);
    if (parts.length < 5) return;
    if (header.includes('a number')) {
      const [aNum, bNum, imsi, imei, startTime, dir, vol, lat, lon, callType, loc] = parts;
      const m = (startTime || '').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/);
      const tISO = m ? `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')} ${m[4].padStart(2, '0')}:${m[5]}:00` : null;
      const locStr = loc ? loc.trim() : (lat && lon ? `Cell Site [${lat}, ${lon}]` : 'Cell Network');
      claims.push(mkClaim({
        type: 'telemetry',
        subjectMention: aNum || 'Subscriber',
        action: `${dir || 'OUTGOING'} ${callType || 'CALL'}`,
        objectMention: bNum ? `to ${bNum}` : '',
        locationMention: locStr,
        sourceQuote: `A-Party ${aNum} -> B-Party ${bNum} (${dir || 'CALL'}) at ${locStr}`,
        tISO, line: i + 2, reliability: 0.98,
      }));
    } else if (header.includes('call_direction')) {
      const dir = parts[1] || 'Call';
      const user = parts[4] || 'User';
      const startTime = parts[10] || '';
      const duration = parts[12] || '0';
      claims.push(mkClaim({
        type: 'telemetry',
        subjectMention: user.split('@')[0],
        action: `${dir} call`,
        objectMention: `${duration}s duration`,
        locationMention: 'Enterprise PBX',
        sourceQuote: `${user} engaged in ${dir} call (duration: ${duration}s)`,
        tISO: startTime ? startTime.slice(0, 19) : null,
        line: i + 2, reliability: 0.98,
      }));
    }
  });
  return claims;
}

function parseCcCsv(text) {
  const claims = [];
  const lines = text.split('\n').filter((l) => l.trim());
  const rows = lines.slice(1, 101);
  rows.forEach((line, i) => {
    const parts = parseCsvLine(line);
    if (parts.length < 4) return;
    let dateStr, card, price, name, loc;
    if (parts[0].includes('/') || parts[0].includes('-')) {
      dateStr = parts[0]; card = parts[1]; price = parts[2]; loc = parts[3]; name = `${parts[4] || ''} ${parts[5] || ''}`.trim();
    } else {
      card = parts[0]; dateStr = parts[1]; price = parts[2]; loc = parts[3]; name = `${parts[4] || ''} ${parts[5] || ''}`.trim();
    }
    const m = (dateStr || '').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/);
    const tISO = m ? `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')} ${m[4].padStart(2, '0')}:${m[5]}:00` : null;
    claims.push(mkClaim({
      type: 'telemetry',
      subjectMention: name || `Card ${card}`,
      action: 'credit transaction',
      locationMention: loc || 'Merchant',
      objectMention: `$${price}`,
      sourceQuote: `${name || 'Cardholder'} spent $${price} at ${loc} (Card ${card})`,
      tISO, line: i + 2, reliability: 0.97,
    }));
  });
  return claims;
}

// ── CHAT: [2026-10-14 21:42:00] Name: message ─────────────────────
function parseChat(text) {
  if (text.includes('From,To,Date,Subject') || text.includes('From,To,date,Subject') || text.includes('from,to,date')) {
    return parseEmailCsv(text);
  }
  const claims = [];
  const lines = text.split('\n');
  let prevISO = null;
  lines.forEach((raw, i) => {
    const m = raw.match(/^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}(?::\d{2})?)\]\s*([^:]+):\s*(.+)$/);
    if (!m) return;
    const tISO = normalizeTime(m[1], m[1].slice(0, 10), prevISO);
    prevISO = tISO;
    claims.push(mkClaim({
      type: 'communication', speakerMention: m[2].trim(), subjectMention: m[2].trim(),
      action: 'sent message', sourceQuote: m[3].trim(), tISO, line: i + 1, reliability: 0.95,
    }));
  });
  return claims;
}

// ── CCTV: header Location/Date + [21:40:00] Camera 04: observation ─
function parseCctv(text) {
  const claims = [];
  const anchor = extractAnchorDate(text) || '2026-01-01';
  const locMatch = text.match(/Location:\s*(.+)/);
  const location = locMatch ? locMatch[1].trim() : null;
  const lines = text.split('\n');
  let prevISO = null;
  lines.forEach((raw, i) => {
    let m = raw.match(/^\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*(Camera[^:]*|Cam[^:]*):\s*(.+)$/i);
    if (m) {
      const tISO = normalizeTime(m[1], anchor, prevISO);
      prevISO = tISO;
      // "Driver resembles X" is a visual INFERENCE, not an identification —
      // it gets the resemblance target as subject but a lower reliability.
      const resembles = m[3].match(/resembles\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/);
      claims.push(mkClaim({
        type: 'observation', action: 'observed on camera', locationMention: location,
        sourceQuote: m[3].trim(), tISO, line: i + 1,
        reliability: resembles ? 0.65 : 0.9,
        subjectMention: resembles ? resembles[1] : firstNameIn(m[3]),
      }));
      return;
    }
    // Investigator note carries relayed ASSERTIONS (someone SAID something — testable)
    m = raw.match(/Investigator Note:\s*(.+)$/i);
    if (m) {
      claims.push(mkClaim({
        type: 'assertion', action: 'stated to police', sourceQuote: m[1].trim(),
        line: i + 1, reliability: 0.6, speakerMention: firstNameIn(m[1]),
        subjectMention: firstNameIn(m[1]),
      }));
    }
  });
  return claims;
}

function parseGpsCsv(text) {
  const claims = [];
  const lines = text.split('\n').filter((l) => l.trim());
  const rows = lines.slice(1, 101);
  rows.forEach((line, i) => {
    const parts = parseCsvLine(line);
    if (parts.length < 4) return;
    const [timeStr, carId, lat, lon] = parts;
    const m = (timeStr || '').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/);
    const tISO = m ? `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')} ${m[4].padStart(2, '0')}:${m[5]}:00` : null;
    claims.push(mkClaim({
      type: 'telemetry',
      subjectMention: `Vehicle ID ${carId}`,
      action: 'GPS tracking fix',
      locationMention: `Coordinates (${parseFloat(lat).toFixed(3)}, ${parseFloat(lon).toFixed(3)})`,
      sourceQuote: `Vehicle ${carId} telematics logged at [${lat}, ${lon}] (${timeStr})`,
      tISO, line: i + 2, reliability: 0.98,
    }));
  });
  return claims;
}

// ── GPS: [22:06:30] GPS Location: X (Speed: Y) / EVENT TRIGGER ─────
function parseGps(text) {
  if (text.includes('Timestamp,id,lat') || text.includes('timestamp,id,lat')) {
    return parseGpsCsv(text);
  }
  const claims = [];
  const anchor = extractAnchorDate(text) || '2026-01-01';
  const subjMatch = text.match(/GPS TELEMETRY DATA\s*[-–]\s*(.+)/i);
  const subject = subjMatch ? subjMatch[1].trim() : 'Tracked vehicle';
  const lines = text.split('\n');
  let prevISO = null;
  lines.forEach((raw, i) => {
    let m = raw.match(/^\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*GPS Location:\s*([^(]+)(?:\(Speed:\s*([\d.]+)\s*mph\))?\s*(.*)$/i);
    if (m) {
      const tISO = normalizeTime(m[1], anchor, prevISO);
      prevISO = tISO;
      claims.push(mkClaim({
        type: 'telemetry', subjectMention: subject, action: 'located at',
        locationMention: m[2].trim().replace(/[-–]\s*$/, '').trim(),
        sourceQuote: raw.trim(), tISO, line: i + 1, reliability: 0.98,
        objectMention: m[3] ? `${m[3]} mph` : null,
      }));
      return;
    }
    m = raw.match(/^\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*EVENT TRIGGER:\s*(.+)$/i);
    if (m) {
      const tISO = normalizeTime(m[1], anchor, prevISO);
      prevISO = tISO;
      claims.push(mkClaim({
        type: 'telemetry', subjectMention: subject, action: 'vehicle event',
        sourceQuote: m[2].trim(), tISO, line: i + 1, reliability: 0.98,
      }));
      return;
    }
    // Metadata lines (burner phone cross-refs etc.). These reference earlier
    // times — no day-rollover against the running sequence.
    if (/burner|unassigned|pinged/i.test(raw) && raw.trim().length > 20) {
      const tm = raw.match(/(\d{1,2}:\d{2}(?::\d{2})?)/);
      claims.push(mkClaim({
        type: 'telemetry', action: 'network correlation', sourceQuote: raw.trim(),
        line: i + 1, reliability: 0.9,
        tISO: tm ? normalizeTime(tm[1], anchor, null) : null,
      }));
    }
  });
  return claims;
}

// ── PHONE: [19:02:11] TOWER: T-231 (District) - Call to +1... ──────
function parsePhone(text) {
  if (text.includes('A Number') || text.includes('IMSI') || text.includes('Call_Direction')) {
    return parseCdrCsv(text);
  }
  const claims = [];
  const anchor = extractAnchorDate(text) || '2026-01-01';
  const subjMatch = text.match(/Subject:\s*([^(\n]+)/);
  const subject = subjMatch ? subjMatch[1].trim() : 'Subscriber';
  const lines = text.split('\n');
  let prevISO = null;
  lines.forEach((raw, i) => {
    const m = raw.match(/^\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*TOWER:\s*(T-\d+)\s*\(([^)]+)\)\s*[-–]\s*(.+)$/i);
    if (m) {
      const tISO = normalizeTime(m[1], anchor, prevISO);
      prevISO = tISO;
      claims.push(mkClaim({
        type: 'telemetry', subjectMention: subject, action: 'phone activity',
        locationMention: m[3].trim(), objectMention: m[2],
        sourceQuote: `${m[2]} (${m[3].trim()}) — ${m[4].trim()}`, tISO, line: i + 1, reliability: 0.98,
      }));
      return;
    }
    if (/^NOTES?:/i.test(raw.trim())) {
      claims.push(mkClaim({
        type: 'telemetry', action: 'carrier note', subjectMention: subject,
        sourceQuote: raw.replace(/^NOTES?:\s*/i, '').trim(), line: i + 1, reliability: 0.9,
      }));
    }
  });
  return claims;
}

// ── INTERVIEW: DETECTIVE: q / SUBJECT: a ───────────────────────────
function parseInterview(text) {
  const claims = [];
  const subjMatch = text.match(/Subject:\s*([^,\n]+)/);
  const subject = subjMatch ? subjMatch[1].trim() : null;
  const lines = text.split('\n');
  let currentSpeaker = null;
  let buffer = [];
  let bufferLine = 0;

  const flush = () => {
    if (!currentSpeaker || buffer.length === 0) return;
    const quote = buffer.join(' ').trim();
    if (!quote) return;
    const isDetective = /detective|officer|investigator/i.test(currentSpeaker);
    if (!isDetective) {
      // Everything the subject says is an ASSERTION — a human claim that can be a lie.
      claims.push(mkClaim({
        type: 'assertion', speakerMention: subject || titleCase(currentSpeaker.toLowerCase()),
        subjectMention: subject || titleCase(currentSpeaker.toLowerCase()),
        action: 'stated in interview', sourceQuote: quote, line: bufferLine, reliability: 0.5,
      }));
    }
    buffer = [];
  };

  lines.forEach((raw, i) => {
    const m = raw.match(/^([A-Z][A-Z .]+):\s*(.*)$/);
    if (m && m[1].length < 30) {
      flush();
      currentSpeaker = m[1].trim();
      buffer = m[2] ? [m[2]] : [];
      bufferLine = i + 1;
    } else if (currentSpeaker && raw.trim()) {
      buffer.push(raw.trim());
    } else if (!raw.trim()) {
      flush();
      currentSpeaker = null;
    }
  });
  flush();
  return claims;
}

function firstNameIn(text) {
  // Prefer full two-word names; single tokens only attach to existing
  // entities downstream, never create new ones.
  const re = /\b([A-Z][a-z]{2,})[ \t]+([A-Z][a-z]{2,})\b/g;
  let m;
  while ((m = re.exec(text))) {
    if (!NAME_STOP.has(m[1]) && !NAME_STOP.has(m[2])) return `${m[1]} ${m[2]}`;
  }
  const single = text.match(/\b([A-Z][a-z]{2,})\b/);
  return single && !NAME_STOP.has(single[1]) ? single[1] : null;
}

// ── FINANCIAL: [YYYY-MM-DD HH:MM] CARD 9551: Merchant - 10000.00 ──
function parseFinancial(text) {
  if (text.includes('last4ccnum') || text.includes('loyaltynum') || text.includes('price')) {
    return parseCcCsv(text);
  }
  const claims = [];
  const lines = text.split('\n');
  const amounts = [];
  lines.forEach((raw) => {
    const m = raw.match(/^\[[^\]]+\]\s*CARD\s*(\d{4}):\s*(.+?)\s*[-–]\s*([\d.]+)\s*$/i);
    if (m) amounts.push(parseFloat(m[3]));
  });
  amounts.sort((a, b) => a - b);
  const median = amounts.length ? amounts[Math.floor(amounts.length / 2)] : 0;
  let prevISO = null;
  lines.forEach((raw, i) => {
    const m = raw.match(/^\[(\d{4}-\d{2}-\d{2} \d{1,2}:\d{2}(?::\d{2})?)\]\s*CARD\s*(\d{4}):\s*(.+?)\s*[-–]\s*([\d.]+)\s*$/i);
    if (!m) return;
    const tISO = normalizeTime(m[1], m[1].slice(0, 10), prevISO);
    prevISO = tISO;
    const amount = parseFloat(m[4]);
    const anomalous = median > 0 && amount > 8 * median;
    claims.push(mkClaim({
      type: 'telemetry', subjectMention: `Card ${m[2]}`, action: 'card transaction',
      locationMention: m[3].trim(), objectMention: `${amount.toFixed(2)}`,
      sourceQuote: `Card ${m[2]} charged ${amount.toFixed(2)} at ${m[3].trim()}` + (anomalous ? ` — ANOMALOUS: ${Math.round(amount / median)}x the median transaction` : ''),
      tISO, line: i + 1, reliability: 0.97,
    }));
  });
  return claims;
}

// ── ALIBI EXTRACTION over parsed assertions (deterministic patterns) ──
// Produces testable windows: {asserter, subject, location, startISO, endISO}
function extractAlibis(claims, anchorDate) {
  const alibis = [];
  for (const c of claims) {
    if (c.type !== 'assertion') continue;
    const q = c.sourceQuote;

    // "X was with him/me at <loc> from 19:00 until 23:00"
    let m = q.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s+was with (?:him|me|her)\s+at\s+(?:a\s+)?([^.]+?)\s+from\s+(\d{1,2}:\d{2})\s+until\s+(\d{1,2}:\d{2})/i);
    if (m) {
      alibis.push({
        asserter: c.speakerMention, subject: m[1], location: m[2].trim(),
        startISO: normalizeTime(m[3], anchorDate), endISO: normalizeTime(m[4], anchorDate),
        claimLine: c.line, sourceQuote: q, evidenceId: c.evidenceId,
      });
      continue;
    }
    // "I was at the <loc> ... plus-one ... all evening" / "We were there all evening"
    m = q.match(/I was at\s+(?:the\s+)?([^.]+?)\.(.*)/i);
    if (m) {
      const loc = m[1].trim();
      const rest = q;
      const allEvening = /all evening|entire (?:night|evening)/i.test(rest);
      // The question context usually fixes the window; default to 21:00–23:00 if "all evening"
      const win = allEvening ? ['21:00', '23:00'] : null;
      const timeQ = q.match(/between\s+(\d{1,2}:\d{2}\s*[AP]M)\s+and\s+(\d{1,2}:\d{2}\s*[AP]M)/i);
      const w = timeQ ? [timeQ[1], timeQ[2]] : win;
      if (w) {
        alibis.push({
          asserter: c.speakerMention, subject: c.speakerMention, location: loc,
          startISO: normalizeTime(w[0], anchorDate), endISO: normalizeTime(w[1], anchorDate),
          claimLine: c.line, sourceQuote: q, evidenceId: c.evidenceId,
        });
        // "X, my <role>, was my plus-one. We were there all evening." → same window for X
        const plusOne = q.match(/([A-Z][a-z]+\s[A-Z][a-z]+),\s*my\s+[^,]+,\s*was my plus-one/i);
        if (plusOne && allEvening) {
          alibis.push({
            asserter: c.speakerMention, subject: plusOne[1], location: loc,
            startISO: normalizeTime(w[0], anchorDate), endISO: normalizeTime(w[1], anchorDate),
            claimLine: c.line, sourceQuote: q, evidenceId: c.evidenceId,
          });
        }
      }
    }
    // "She was by my side the entire night" → vouches subject at asserter's location 19:00-23:59
    m = q.match(/(?:She|He)\s+was by my side the entire night/i);
    if (m) {
      alibis.push({
        asserter: c.speakerMention, subject: '__PRONOUN_PREV__', location: '__WITH_ASSERTER__',
        startISO: normalizeTime('19:00', anchorDate), endISO: normalizeTime('23:59', anchorDate),
        claimLine: c.line, sourceQuote: q, evidenceId: c.evidenceId, pronoun: true,
      });
    }
  }
  return alibis;
}

function parseNetworkJson(text) {
  const claims = [];
  try {
    const data = JSON.parse(text);
    if (data.links && Array.isArray(data.links)) {
      const rows = data.links.slice(0, 100);
      rows.forEach((l, i) => {
        const source = String(l.source || l.source_id || 'Entity A');
        const target = String(l.target || l.target_id || 'Entity B');
        const type = l.type || l.relationship || 'transaction';
        const rawDate = l._date_added || l.timestamp || l.date || null;
        let tISO = null;
        if (rawDate) {
          try {
            const d = new Date(rawDate);
            if (!isNaN(d.getTime())) tISO = d.toISOString().replace('T', ' ').slice(0, 19);
          } catch { /* ignore */ }
        }
        claims.push(mkClaim({
          type: 'communication',
          speakerMention: titleCase(source),
          subjectMention: titleCase(source),
          action: type.toLowerCase(),
          objectMention: titleCase(target),
          sourceQuote: `${source} -> ${target} (${type})`,
          tISO, line: i + 1, reliability: 0.95,
        }));
      });
    } else if (Array.isArray(data)) {
      const rows = data.slice(0, 100);
      rows.forEach((item, i) => {
        const subj = String(item.name || item.user || item.id || item.subject || 'Record');
        const act = String(item.action || item.type || item.event || 'logged entry');
        const rawDate = item.timestamp || item.date || item.time || null;
        let tISO = null;
        if (rawDate) {
          try {
            const d = new Date(rawDate);
            if (!isNaN(d.getTime())) tISO = d.toISOString().replace('T', ' ').slice(0, 19);
          } catch { /* ignore */ }
        }
        claims.push(mkClaim({
          type: 'observation',
          subjectMention: titleCase(subj),
          action: act,
          sourceQuote: JSON.stringify(item).slice(0, 140),
          tISO, line: i + 1, reliability: 0.9,
        }));
      });
    } else if (data.features && Array.isArray(data.features)) {
      const rows = data.features.slice(0, 100);
      rows.forEach((f, i) => {
        const name = f.properties?.name || f.id || `Sector ${i + 1}`;
        claims.push(mkClaim({
          type: 'telemetry',
          subjectMention: 'Survey Sensor',
          action: 'geospatial coordinate mapped',
          locationMention: String(name),
          sourceQuote: `Geospatial point mapped: ${name}`,
          line: i + 1, reliability: 0.95,
        }));
      });
    }
  } catch {
    // If JSON parsing fails, return empty claims
  }
  return claims;
}

function parseEvidence(text, fileName) {
  const kind = detectKind(text, fileName);
  const anchorDate = extractAnchorDate(text) || extractAnchorDate(text.slice(0, 500)) || null;
  let claims = [];
  if (kind === 'chat') claims = parseChat(text);
  else if (kind === 'cctv') claims = parseCctv(text);
  else if (kind === 'gps') claims = parseGps(text);
  else if (kind === 'phone') claims = parsePhone(text);
  else if (kind === 'financial') claims = parseFinancial(text);
  else if (kind === 'interview') claims = parseInterview(text);
  else if (kind === 'network') claims = parseNetworkJson(text);
  const mentions = harvestMentions(text);
  return { kind, anchorDate, claims, mentions };
}

module.exports = { parseEvidence, detectKind, extractAlibis, NAME_STOP };
