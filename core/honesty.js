// 7-Gate Honesty System — explicit deterministic gates that MUST pass
// before the engine will issue a verdict. If any critical gate fails,
// the system outputs INSUFFICIENT EVIDENCE with projected impact.
const bus = require('./bus');

const GATES = [
  { id: 'GATE_1', name: 'Insufficient independent evidence', critical: true },
  { id: 'GATE_2', name: 'Single-source dependency', critical: true },
  { id: 'GATE_3', name: 'Large confidence gap required', critical: false },
  { id: 'GATE_4', name: 'Contradictory evidence', critical: true },
  { id: 'GATE_5', name: 'Missing critical artifact', critical: true },
  { id: 'GATE_6', name: 'AI extraction uncertainty', critical: false },
  { id: 'GATE_7', name: 'Identity ambiguity', critical: true },
];

/**
 * Evaluate all 7 honesty gates. Returns:
 * { passed: bool, gates: [...], failedCritical: [...], missingEvidence: [...] }
 */
function evaluateHonestyGates(store, config) {
  bus.emit('HONESTY', 'Evaluating 7 honesty gates');
  const v = store.verdict;
  if (!v) return { passed: false, gates: [], failedCritical: GATES.filter(g => g.critical), missingEvidence: [] };

  const results = [];
  const suspects = v.suspects || [];
  const top = suspects[0];
  const contributingFiles = top ? [...new Set(top.contributions.flatMap(c => c.evidenceIds))] : [];

  // GATE 1: Insufficient independent evidence
  const gate1Passed = contributingFiles.length >= (config?.GATES?.MIN_EVIDENCE_SOURCES || 2);
  results.push({
    ...GATES[0],
    passed: gate1Passed,
    detail: gate1Passed
      ? `${contributingFiles.length} independent sources contribute to the accusation (minimum: ${config?.GATES?.MIN_EVIDENCE_SOURCES || 2})`
      : `Only ${contributingFiles.length} source(s) — need at least ${config?.GATES?.MIN_EVIDENCE_SOURCES || 2} independent evidence files`,
    value: contributingFiles.length,
    threshold: config?.GATES?.MIN_EVIDENCE_SOURCES || 2,
  });

  // GATE 2: Single-source dependency
  const singleSourceContributions = top
    ? top.contributions.filter(c => c.evidenceIds.length === 1 && c.points >= 10)
    : [];
  const gate2Passed = singleSourceContributions.length === 0;
  results.push({
    ...GATES[1],
    passed: gate2Passed,
    detail: gate2Passed
      ? 'No high-weight contribution depends on a single evidence source'
      : `${singleSourceContributions.length} high-weight contribution(s) rest on a single source: ${singleSourceContributions.map(c => c.evidenceIds[0]).join(', ')}`,
    value: singleSourceContributions.length,
    threshold: 0,
  });

  // GATE 3: Large confidence gap required
  const outsider = suspects.length > 1 ? suspects[1] : null;
  const isConspiracy = v.coConspirators?.length > 0;
  const compareAgainst = isConspiracy && suspects.length > 2 ? suspects[2] : outsider;
  const margin = top ? top.total - (compareAgainst?.total || 0) : 0;
  const gate3Passed = margin >= (config?.GATES?.MIN_MARGIN || 12);
  results.push({
    ...GATES[2],
    passed: gate3Passed,
    detail: gate3Passed
      ? `Margin of ${margin} points between primary suspect and next outsider (minimum: ${config?.GATES?.MIN_MARGIN || 12})`
      : `Margin only ${margin} — too close to distinguish (need ≥${config?.GATES?.MIN_MARGIN || 12})`,
    value: margin,
    threshold: config?.GATES?.MIN_MARGIN || 12,
  });

  // GATE 4: Contradictory evidence
  const selfContradictions = (store.contradictions || []).filter(c =>
    c.subjectEntityId === top?.entityId && c.kind !== 'alibi_broken');
  const gate4Passed = selfContradictions.length === 0;
  results.push({
    ...GATES[3],
    passed: gate4Passed,
    detail: gate4Passed
      ? 'No contradictory evidence undermines the primary accusation'
      : `${selfContradictions.length} contradiction(s) exist within the evidence supporting the accusation`,
    value: selfContradictions.length,
    threshold: 0,
  });

  // GATE 5: Missing critical artifact
  const kinds = new Set(store.evidence.map(e => e.kind));
  const criticalMissing = [];
  // If there's a broken alibi but no phone records to confirm
  const brokenAlibis = (store.contradictions || []).filter(c => c.kind === 'alibi_broken' && c.severity !== 'critical');
  if (brokenAlibis.length > 0 && !kinds.has('phone')) {
    criticalMissing.push({
      artifact: 'Phone/cellular records',
      reason: 'Alibi is contested only by visual resemblance — phone records would confirm or clear',
      projectedImpact: '+22% confidence',
    });
  }
  if (top && top.breakdown.motive > 0 && !kinds.has('financial')) {
    criticalMissing.push({
      artifact: 'Financial records',
      reason: 'Motive is alleged but no financial evidence submitted',
      projectedImpact: '+15% confidence',
    });
  }
  const gate5Passed = criticalMissing.length === 0;
  results.push({
    ...GATES[4],
    passed: gate5Passed,
    detail: gate5Passed
      ? 'No critical evidence artifacts are missing'
      : `${criticalMissing.length} critical artifact(s) missing: ${criticalMissing.map(m => m.artifact).join(', ')}`,
    missingArtifacts: criticalMissing,
    value: criticalMissing.length,
    threshold: 0,
  });

  // GATE 6: AI extraction uncertainty
  const aiProvenanceEvidence = store.evidence.filter(e => e.provenance === 'live' || e.provenance === 'cache');
  const deterministicEvidence = store.evidence.filter(e => e.provenance === 'deterministic');
  const aiDominant = aiProvenanceEvidence.length > deterministicEvidence.length && deterministicEvidence.length < 2;
  const gate6Passed = !aiDominant;
  results.push({
    ...GATES[5],
    passed: gate6Passed,
    detail: gate6Passed
      ? `${deterministicEvidence.length} deterministic + ${aiProvenanceEvidence.length} AI-enriched evidence files — deterministic base is sufficient`
      : 'AI extraction dominates — insufficient deterministic grounding for the accusation',
    value: deterministicEvidence.length,
    threshold: 2,
  });

  // GATE 7: Identity ambiguity
  const provisionalInAccusation = top
    ? store.entities.filter(e => e.provisional && top.contributions.some(c =>
        store.claims.filter(cl => c.claimIds?.includes(cl.claimId))
          .some(cl => cl.subjectEntityId === e.entityId)))
    : [];
  const mergesInvolved = (store.mergeEvents || []).filter(m =>
    m.confidence < 0.85 && top?.contributions.some(c =>
      c.evidenceIds.some(id => m.evidenceIds?.includes(id))));
  const gate7Passed = provisionalInAccusation.length === 0 && mergesInvolved.length === 0;
  results.push({
    ...GATES[6],
    passed: gate7Passed,
    detail: gate7Passed
      ? 'All identities in the accusation are confirmed (no provisional entities, no low-confidence merges)'
      : `${provisionalInAccusation.length} provisional identit(ies) and ${mergesInvolved.length} low-confidence merge(s) affect the accusation`,
    value: provisionalInAccusation.length + mergesInvolved.length,
    threshold: 0,
  });

  // ── Aggregate ──
  const failedCritical = results.filter(r => !r.passed && r.critical);
  const failedAll = results.filter(r => !r.passed);
  const passed = failedCritical.length === 0;

  const gateResult = {
    passed,
    gates: results,
    failedCritical,
    failedAll,
    passedCount: results.filter(r => r.passed).length,
    totalGates: results.length,
    missingEvidence: criticalMissing,
  };

  store.honestyGates = gateResult;

  if (!passed) {
    bus.emit('HONESTY', `GATES FAILED: ${failedCritical.length} critical gate(s) blocked the verdict: ${failedCritical.map(g => g.name).join(', ')}`);
  } else {
    bus.emit('HONESTY', `All ${results.length} honesty gates PASSED (${failedAll.length} non-critical warning(s))`);
  }

  return gateResult;
}

module.exports = { evaluateHonestyGates, GATES };
