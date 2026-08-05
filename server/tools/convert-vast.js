// Distills the official IEEE VAST Challenge 2021 "Kronos Incident" data
// (benchmark_data/, from github.com/vast-challenge/2021-sample-data) into
// EVIDENCE-ingestable text artifacts under benchmark_case/.
// Run: node tools/convert-vast.js
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'benchmark_data');
const OUT = path.join(ROOT, 'benchmark_case');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

// The documented security-team clique from published Kronos solutions.
const CLIQUE = ['Bodrogi', 'Vann', 'Osvaldo', 'Ferro', 'Mies'];

function emailName(addr) {
  return addr.trim().split('@')[0].split('.').filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
}
function usDateToISO(d) {
  // "1/6/2014 10:28" → "2014-01-06 10:28:00"
  const m = d.trim().match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')} ${m[4].padStart(2, '0')}:${m[5]}:00`;
}
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

// ── 1. Security-team email log → chat-format evidence ──────────────
const emailCsv = fs.readFileSync(path.join(SRC, 'MC1', 'MC1', 'email headers.csv'), 'latin1').split('\n').slice(1);
const emailLines = [];
for (const line of emailCsv) {
  if (!line.trim()) continue;
  const [from, to, date, ...subj] = parseCsvLine(line);
  const subject = subj.join(',').trim();
  const involved = CLIQUE.some((n) => (from + to).includes(n));
  if (!involved) continue;
  const iso = usDateToISO(date);
  if (!iso) continue;
  const recipients = to.split(',').map(emailName).filter((n) => n !== emailName(from)).slice(0, 4);
  emailLines.push({ iso, text: `[${iso}] ${emailName(from)}: (to ${recipients.join(', ')}) ${subject}` });
}
emailLines.sort((a, b) => a.iso.localeCompare(b.iso));
const emailBody = 'CORPORATE EMAIL METADATA EXPORT - GASTECH INTERNAL SECURITY REVIEW\n' +
  'Scope: messages involving facilities/security staff, two weeks before the disappearance\n' +
  'Date: January 6, 2014 - January 17, 2014\n\n' +
  emailLines.slice(0, 90).map((e) => e.text).join('\n') + '\n';
fs.writeFileSync(path.join(OUT, 'BM-001_EMAIL_LOG.txt'), emailBody);
console.log(`BM-001_EMAIL_LOG.txt: ${Math.min(90, emailLines.length)} security-clique emails`);

// ── 2. Credit-card records → financial evidence ────────────────────
const ccCsv = fs.readFileSync(path.join(SRC, 'MC2', 'MC2', 'MC2', 'cc_data.csv'), 'latin1').split('\n').slice(1);
const tx = [];
for (const line of ccCsv) {
  if (!line.trim()) continue;
  const [ts, loc, price, last4] = parseCsvLine(line);
  const iso = usDateToISO(ts);
  if (!iso || !last4) continue;
  tx.push({ iso, loc: loc.trim(), price: parseFloat(price), last4: last4.trim() });
}
// Card 9551's full history (the documented anomaly) + a deterministic
// sample of typical spend for median context.
const hot = tx.filter((t) => t.last4 === '9551');
const context = tx.filter((t, i) => t.last4 !== '9551' && i % 40 === 0).slice(0, 40);
const finLines = [...hot, ...context].sort((a, b) => a.iso.localeCompare(b.iso))
  .map((t) => `[${t.iso}] CARD ${t.last4}: ${t.loc} - ${t.price.toFixed(2)}`);
const finBody = 'FINANCIAL RECORDS - GASTECH CORPORATE CARD EXPORT\n' +
  'Source: acquiring processor subpoena return\n' +
  'Date: January 6, 2014 - January 19, 2014\n\n' +
  finLines.join('\n') + '\n';
fs.writeFileSync(path.join(OUT, 'BM-002_FINANCIAL_RECORDS.txt'), finBody);
console.log(`BM-002_FINANCIAL_RECORDS.txt: ${finLines.length} transactions (card 9551 history + context sample)`);

// ── 3. One contemporaneous news article (generic/LLM path) ─────────
const artDir = path.join(SRC, 'MC1', 'MC1', 'News Articles', 'Kronos Star');
const art = fs.readdirSync(artDir).map((f) => path.join(artDir, f))
  .map((p) => fs.readFileSync(p, 'latin1'))
  .find((t) => /POK|kidnap|missing|GAStech/i.test(t)) || '';
fs.writeFileSync(path.join(OUT, 'BM-003_NEWS_ARTICLE.txt'), art.slice(0, 6000));
console.log('BM-003_NEWS_ARTICLE.txt: contemporaneous press coverage');

console.log('\nBenchmark case written to benchmark_case/ — load via POST /api/demo {"case":"benchmark"}');
