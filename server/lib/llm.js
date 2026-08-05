// The ONE place a model is called. Task-typed, schema-enforced, queued,
// cached, and honest: on total failure it returns {ok:false} — it never
// fabricates content. (The old build silently swapped in a fictional
// cast of suspects on any rate limit. That class of failure is gone.)
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');
const { sha256 } = require('./util');
const bus = require('./bus');

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
const CACHE_DIR = path.join(__dirname, '..', 'cache');

// ── Serial queue: one call at a time, spaced under the free-tier RPM ──
let chain = Promise.resolve();
let lastCallAt = 0;
function enqueue(fn) {
  const run = chain.then(async () => {
    const wait = config.LLM.MIN_INTERVAL_MS - (Date.now() - lastCallAt);
    if (wait > 0) await sleep(wait);
    try { return await fn(); } finally { lastCallAt = Date.now(); }
  });
  chain = run.catch(() => {}); // keep the chain alive on failure
  return run;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function cacheKey(task, parts) {
  return sha256(task + '::' + JSON.stringify(parts));
}
function readCache(key) {
  try {
    const f = path.join(CACHE_DIR, key + '.json');
    if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8'));
  } catch { /* cache miss */ }
  return null;
}
function writeCache(key, data) {
  try {
    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(path.join(CACHE_DIR, key + '.json'), JSON.stringify(data, null, 2));
  } catch { /* non-fatal */ }
}

function braceExtract(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) throw new Error('No JSON object in model output');
  return text.slice(start, end + 1);
}

function retryDelayFrom(err) {
  // Google 429 bodies carry retryDelay like "37s"
  const m = String(err.message || '').match(/retryDelay[":\s]+(\d+)/);
  return m ? parseInt(m[1], 10) * 1000 : null;
}

async function rawGenerate({ parts, schema, temperature }) {
  const model = genAI.getGenerativeModel({
    model: config.MODEL,
    generationConfig: {
      temperature: temperature ?? config.LLM.TEMPERATURE_EXTRACT,
      maxOutputTokens: config.LLM.MAX_OUTPUT_TOKENS,
      responseMimeType: 'application/json',
      ...(schema ? { responseSchema: schema } : {}),
    },
  });
  const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('TIMEOUT')), config.LLM.TIMEOUT_MS));
  const result = await Promise.race([model.generateContent(parts), timeout]);
  return result.response.text();
}

/**
 * callModel({ task, parts, schema, temperature })
 * → { ok, data, source: 'live'|'cache'|'unavailable', latencyMs, task }
 */
async function callModel({ task, parts, schema, temperature }) {
  if (!task) throw new Error('callModel requires an explicit task enum');
  const key = cacheKey(task, parts);
  const t0 = Date.now();

  // Cache first: re-running the same demo costs zero quota and works offline.
  const cached = readCache(key);
  if (cached) return { ok: true, data: cached, source: 'cache', latencyMs: Date.now() - t0, task };

  if (!genAI || config.MODE === 'replay') {
    return { ok: false, data: null, source: 'unavailable', latencyMs: 0, task };
  }

  return enqueue(async () => {
    let lastErr = null;
    for (let attempt = 1; attempt <= config.LLM.MAX_RETRIES; attempt++) {
      try {
        const text = await rawGenerate({ parts, schema, temperature });
        let data;
        try {
          data = JSON.parse(braceExtract(text));
        } catch (parseErr) {
          // One repair call, then give up honestly.
          bus.emit('LLM', `${task}: malformed JSON, attempting repair`);
          const repaired = await rawGenerate({
            parts: [
              `The following was supposed to be valid JSON but failed to parse (${parseErr.message}). Return ONLY the corrected valid JSON, nothing else:\n\n${text.slice(0, 6000)}`,
            ],
            schema,
            temperature: 0,
          });
          data = JSON.parse(braceExtract(repaired));
        }
        writeCache(key, data);
        return { ok: true, data, source: 'live', latencyMs: Date.now() - t0, task };
      } catch (err) {
        lastErr = err;
        const retriable = err.status === 429 || err.status === 500 || err.status === 503 || err.status === 504 || err.message === 'TIMEOUT';
        if (!retriable || attempt === config.LLM.MAX_RETRIES) break;
        const backoff = retryDelayFrom(err) ?? Math.min(30000, 2000 * 2 ** (attempt - 1) + Math.random() * 1500);
        bus.emit('LLM', `${task}: ${err.status || err.message} — retrying in ${Math.round(backoff / 1000)}s (${attempt}/${config.LLM.MAX_RETRIES})`);
        await sleep(backoff);
      }
    }
    bus.emit('LLM', `${task}: unavailable (${lastErr?.status || lastErr?.message}) — degrading honestly, nothing fabricated`, { level: 'warn' });
    return { ok: false, data: null, source: 'unavailable', latencyMs: Date.now() - t0, task };
  });
}

function isConfigured() { return !!genAI; }

module.exports = { callModel, isConfigured };
