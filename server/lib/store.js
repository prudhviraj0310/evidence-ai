// Case store with disk persistence — survives a server restart mid-demo.
const fs = require('fs');
const path = require('path');
const { seedCounter } = require('./util');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'case.json');

function emptyCase() {
  return {
    caseId: null,
    createdAt: null,
    evidence: [],          // [{evidenceId, fileName, kind, summary, claimIds, provenance, uploadedAt, rawExcerpt, lines}]
    claims: [],            // atomic, typed, cited — the substrate everything reasons over
    entities: [],          // canonical registry
    mergeEvents: [],       // displayable inference events
    timeline: [],
    contradictions: [],
    relationships: { nodes: [], edges: [] },
    verdict: null,
    summary: null,
    chat: [],
  };
}

let caseStore = emptyCase();

function load() {
  try {
    if (fs.existsSync(DB_FILE)) {
      caseStore = { ...emptyCase(), ...JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) };
      // Reseed ID counters so restarts don't collide
      seedCounter('EV', caseStore.evidence.length);
      seedCounter('CL', caseStore.claims.length);
      seedCounter('P', caseStore.entities.length);
      console.log(`💾 Rehydrated case from disk: ${caseStore.evidence.length} evidence, ${caseStore.claims.length} claims`);
    }
  } catch (e) {
    console.error('Failed to rehydrate case, starting fresh:', e.message);
    caseStore = emptyCase();
  }
  return caseStore;
}

function save() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(caseStore, null, 2));
  } catch (e) {
    console.error('Persist failed:', e.message);
  }
}

function reset() {
  caseStore = emptyCase();
  const { resetCounters } = require('./util');
  resetCounters();
  save();
  return caseStore;
}

function get() { return caseStore; }

module.exports = { get, load, save, reset };
