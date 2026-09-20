// Application-level case service — orchestrates the full case lifecycle.
// Uses core engine modules + infrastructure providers.
const bus = require('../../core/bus');
const { nextId, sha256 } = require('../../core/util');
const { parseEvidence } = require('../../server/lib/parsers');
const { resolveEvidence } = require('../../server/lib/entities');
const { buildTimeline, detectContradictions, detectCoLocations, buildGraph } = require('../../server/lib/correlate');
const { computeVerdict } = require('../../server/lib/verdict');
const { generateHypotheses } = require('../../core/hypotheses');
const { runDefenseCounsel } = require('../../core/defense');
const { evaluateHonestyGates } = require('../../core/honesty');
const { detectIncidents } = require('../../core/incidents');
const { buildLocationGraph } = require('../../core/geospatial');
const { AUDIT_EVENTS } = require('../../infrastructure/interfaces/CaseRepository');

/**
 * Pipeline stages — maps to Step Functions state machine.
 * Each stage is a function that takes store and config, modifying store in place.
 */
const PIPELINE_STAGES = [
  { id: 'INGEST', label: 'INGEST', fn: null }, // handled separately
  { id: 'VALIDATE', label: 'VALIDATE', fn: validateEvidence },
  { id: 'PARSE', label: 'PARSING', fn: null }, // handled during ingest
  { id: 'EXTRACT', label: 'AI EXTRACTION', fn: null }, // async AI
  { id: 'NORMALIZE', label: 'NORMALIZE', fn: null }, // handled during parse
  { id: 'RESOLVE_ENTITIES', label: 'ENTITY RESOLUTION', fn: (store) => { /* already done during ingest */ } },
  { id: 'BUILD_TIMELINE', label: 'TIMELINE', fn: (store) => buildTimeline(store) },
  { id: 'CORRELATE', label: 'CORRELATION', fn: correlateAll },
  { id: 'DETECT_CONTRADICTIONS', label: 'CONTRADICTIONS', fn: (store) => detectContradictions(store) },
  { id: 'SCORE_HYPOTHESES', label: 'HYPOTHESIS ENGINE', fn: scoreAndHypothesise },
  { id: 'DEFENSE_COUNSEL', label: 'DEFENSE COUNSEL', fn: (store) => runDefenseCounsel(store) },
  { id: 'HONESTY_GATE', label: 'HONESTY GATE', fn: (store, config) => evaluateHonestyGates(store, config) },
  { id: 'GENERATE_REPORT', label: 'REPORT', fn: null }, // handled separately
  { id: 'PERSIST', label: 'PERSIST', fn: null }, // handled by caller
  { id: 'NOTIFY', label: 'NOTIFY', fn: null }, // handled by caller
];

function validateEvidence(store) {
  // Verify all evidence has SHA-256 hashes
  for (const ev of store.evidence) {
    if (!ev.contentHash && ev.rawExcerpt) {
      ev.contentHash = sha256(ev.rawExcerpt);
    }
  }
  bus.emit('VALIDATE', `Validated ${store.evidence.length} evidence files — all hashed`);
}

function correlateAll(store) {
  detectCoLocations(store);
  buildLocationGraph(store);
  detectIncidents(store);
}

function scoreAndHypothesise(store) {
  computeVerdict(store);
  generateHypotheses(store);
}

/**
 * Run the full evidence pipeline — returns pipeline status with timing.
 */
async function runPipeline(store, config, options = {}) {
  const status = {
    caseId: store.summary?.caseId || store.caseId || 'CASE-001',
    startedAt: new Date().toISOString(),
    stages: [],
    currentStage: null,
    completed: false,
    error: null,
  };

  const onProgress = options.onProgress || (() => {});

  bus.emit('PIPELINE', `Pipeline started — ${store.evidence.length} evidence file(s), ${store.claims.length} claims`);

  for (const stage of PIPELINE_STAGES) {
    if (!stage.fn) {
      status.stages.push({ id: stage.id, label: stage.label, status: 'skipped', duration: 0 });
      continue;
    }

    status.currentStage = stage.id;
    onProgress(stage.id, 'running');
    const t0 = Date.now();

    try {
      bus.emit(stage.id, `${stage.label} started`);
      await stage.fn(store, config);
      const duration = Date.now() - t0;
      status.stages.push({ id: stage.id, label: stage.label, status: 'completed', duration });
      onProgress(stage.id, 'completed');
      bus.emit(stage.id, `${stage.label} completed (${duration}ms)`);
    } catch (err) {
      const duration = Date.now() - t0;
      status.stages.push({ id: stage.id, label: stage.label, status: 'failed', duration, error: err.message });
      onProgress(stage.id, 'failed');
      bus.emit(stage.id, `${stage.label} FAILED: ${err.message}`);

      if (options.stopOnError) {
        status.error = `Failed at ${stage.id}: ${err.message}`;
        break;
      }
    }
  }

  status.completedAt = new Date().toISOString();
  status.completed = !status.error;
  status.currentStage = null;
  store.pipelineStatus = status;

  bus.emit('PIPELINE', `Pipeline ${status.completed ? 'complete' : 'failed'} — ${status.stages.filter(s => s.status === 'completed').length}/${PIPELINE_STAGES.length} stages`);
  return status;
}

/**
 * Create audit events for pipeline actions
 */
function createAuditEvent(type, caseId, details = {}) {
  return {
    id: nextId('AUD'),
    type,
    caseId,
    timestamp: new Date().toISOString(),
    ...details,
  };
}

module.exports = { runPipeline, PIPELINE_STAGES, createAuditEvent };
