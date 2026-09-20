// Competing Hypothesis Engine — the system generates MULTIPLE hypotheses
// for what happened, rather than defaulting to "who is the suspect."
// Each hypothesis is scored against supporting, contradicting, and missing
// evidence. This is deterministic: same evidence → same hypotheses.
const bus = require('./bus');

/**
 * Generate competing hypotheses from scored suspects and evidence.
 * Returns an array of hypothesis objects, each with:
 *   - id, title, description
 *   - supporting[], contradicting[], missing[]
 *   - confidence, temporalConsistency, spatialConsistency
 *   - independentSources
 */
function generateHypotheses(store) {
  bus.emit('HYPOTHESIS', 'Generating competing hypotheses from evidence graph');
  const hypotheses = [];
  const v = store.verdict;
  if (!v) return hypotheses;

  const suspects = v.suspects || [];
  const victim = v.victim;

  // H1: Primary suspect orchestrated the incident
  if (suspects[0] && suspects[0].total >= 30) {
    const prime = suspects[0];
    const supporting = gatherSupporting(store, prime);
    const contradicting = gatherContradicting(store, prime);
    const missing = gatherMissing(store, prime, 'primary');
    const independentSources = countIndependentSources(supporting);

    hypotheses.push({
      id: 'H1',
      title: `${prime.name} orchestrated the incident`,
      description: `${prime.name} is the primary actor${victim ? ` in the ${victim.name} case` : ''}. `
        + `Score: ${prime.total}/100 (O:${prime.breakdown.opportunity} M:${prime.breakdown.means} Mo:${prime.breakdown.motive} D:${prime.breakdown.deception}).`,
      entityId: prime.entityId,
      role: 'ORCHESTRATOR',
      supporting,
      contradicting,
      missing,
      independentSources,
      temporalConsistency: computeTemporalConsistency(store, prime),
      spatialConsistency: computeSpatialConsistency(store, prime),
      confidence: hypothesisConfidence(supporting, contradicting, missing, independentSources),
    });
  }

  // H2: Secondary suspect acted independently
  if (suspects[1] && suspects[1].total >= 20) {
    const second = suspects[1];
    const supporting = gatherSupporting(store, second);
    const contradicting = gatherContradicting(store, second);
    const missing = gatherMissing(store, second, 'secondary');
    const independentSources = countIndependentSources(supporting);

    hypotheses.push({
      id: 'H2',
      title: `${second.name} acted independently`,
      description: `${second.name} may have acted alone without orchestration. `
        + `Score: ${second.total}/100.`,
      entityId: second.entityId,
      role: 'INDEPENDENT_ACTOR',
      supporting,
      contradicting,
      missing,
      independentSources,
      temporalConsistency: computeTemporalConsistency(store, second),
      spatialConsistency: computeSpatialConsistency(store, second),
      confidence: hypothesisConfidence(supporting, contradicting, missing, independentSources),
    });
  }

  // H3: External actor not yet identified
  const provisionalActors = store.entities.filter(e => e.kind === 'person' && e.provisional);
  if (provisionalActors.length > 0) {
    const supporting = provisionalActors.flatMap(p => {
      return store.claims
        .filter(c => c.subjectEntityId === p.entityId)
        .slice(0, 3)
        .map(c => ({
          text: `Unidentified actor "${p.canonical}" observed: ${c.sourceQuote.slice(0, 100)}`,
          evidenceIds: [c.evidenceId],
          weight: 0.5,
        }));
    });

    hypotheses.push({
      id: 'H3',
      title: 'External actor not yet identified',
      description: `${provisionalActors.length} unidentified individual(s) appear in the evidence. `
        + `The perpetrator may not yet be in the entity registry.`,
      entityId: null,
      role: 'UNKNOWN',
      supporting,
      contradicting: [],
      missing: [
        { text: 'Identity of provisional actors', wouldResolveBy: 'Additional camera angles, witness identification, or forensic evidence', projectedImpact: '+15% confidence' },
      ],
      independentSources: countIndependentSources(supporting),
      temporalConsistency: 0.5,
      spatialConsistency: 0.5,
      confidence: supporting.length > 0 ? 0.2 : 0.1,
    });
  }

  // H4: Insufficient evidence — always included
  const totalGaps = (store.verdict?.unresolvedQuestions || []).length;
  const missingTypes = identifyMissingEvidenceTypes(store);
  hypotheses.push({
    id: 'H4',
    title: 'Insufficient evidence to determine',
    description: `The available evidence does not conclusively support any single hypothesis. `
      + `${totalGaps} unresolved question(s) remain. ${missingTypes.length} evidence type(s) not yet submitted.`,
    entityId: null,
    role: 'UNDETERMINED',
    supporting: [
      ...(totalGaps > 0 ? [{ text: `${totalGaps} critical question(s) remain unanswered`, evidenceIds: [], weight: 0.8 }] : []),
      ...(missingTypes.map(t => ({ text: `No ${t} evidence submitted`, evidenceIds: [], weight: 0.6 }))),
    ],
    contradicting: suspects.filter(s => s.total >= 50).map(s => ({
      text: `${s.name} scores ${s.total}/100 — evidence exists against this hypothesis`,
      evidenceIds: s.contributions.flatMap(c => c.evidenceIds).slice(0, 3),
      weight: s.total / 100,
    })),
    missing: missingTypes.map(t => ({
      text: `${t} records`, wouldResolveBy: `Obtain ${t.toLowerCase()} evidence`, projectedImpact: '+10-20% confidence',
    })),
    independentSources: 0,
    temporalConsistency: 0.5,
    spatialConsistency: 0.5,
    confidence: totalGaps > 0 ? 0.3 + (totalGaps * 0.1) : 0.15,
  });

  // Normalize: no single weak piece of evidence should dominate
  for (const h of hypotheses) {
    if (h.supporting.length === 1 && h.supporting[0].weight < 0.7) {
      h.confidence *= 0.6; // penalize single-source hypotheses
      h.weaknesses = ['Single supporting evidence source — confidence penalized'];
    }
  }

  // Sort by confidence descending
  hypotheses.sort((a, b) => b.confidence - a.confidence);

  store.hypotheses = hypotheses;
  bus.emit('HYPOTHESIS', `${hypotheses.length} competing hypotheses generated: ${hypotheses.map(h => `${h.id}(${Math.round(h.confidence * 100)}%)`).join(', ')}`);
  return hypotheses;
}

function gatherSupporting(store, suspect) {
  return (suspect.contributions || []).map(c => ({
    text: c.reason,
    evidenceIds: c.evidenceIds,
    dimension: c.dimension,
    weight: c.points / 35, // normalized against max dimension score
  }));
}

function gatherContradicting(store, suspect) {
  const items = [];
  // Objections from defense counsel
  for (const obj of (store.verdict?.objections || [])) {
    if (obj.evidenceId) {
      items.push({
        text: obj.text,
        evidenceIds: [obj.evidenceId],
        weight: 0.5,
      });
    }
  }
  // Claims where suspect is cleared by physical evidence
  const clearInfo = (store.verdict?.cleared || []).find(c => c.entityId === suspect.entityId);
  if (clearInfo) {
    items.push({ text: clearInfo.reason, evidenceIds: [], weight: 0.9 });
  }
  return items;
}

function gatherMissing(store, suspect, role) {
  const items = [];
  const kinds = new Set(store.evidence.map(e => e.kind));
  if (!kinds.has('phone')) items.push({ text: 'Phone/cellular records', wouldResolveBy: `Carrier records for ${suspect.name}`, projectedImpact: '+15-22% confidence' });
  if (!kinds.has('financial')) items.push({ text: 'Financial records', wouldResolveBy: 'Bank and card transaction history', projectedImpact: '+10-15% confidence' });
  if (!store.claims.some(c => /forensic|fingerprint|dna/i.test(c.sourceQuote))) {
    items.push({ text: 'Forensic evidence', wouldResolveBy: 'Fingerprint, DNA, or device forensics', projectedImpact: '+20% confidence' });
  }
  return items;
}

function countIndependentSources(supporting) {
  const files = new Set();
  for (const s of supporting) {
    for (const id of s.evidenceIds || []) files.add(id);
  }
  return files.size;
}

function computeTemporalConsistency(store, suspect) {
  const claims = store.claims.filter(c =>
    c.subjectEntityId === suspect.entityId && c.tISO);
  if (claims.length < 2) return 0.5;
  const sorted = claims.sort((a, b) => new Date(a.tISO) - new Date(b.tISO));
  let consistent = 0;
  for (let i = 1; i < sorted.length; i++) {
    const gap = Math.abs(new Date(sorted[i].tISO) - new Date(sorted[i - 1].tISO)) / 60000;
    if (gap < 120) consistent++; // events within 2 hours are temporally consistent
  }
  return Math.min(1, consistent / Math.max(1, sorted.length - 1));
}

function computeSpatialConsistency(store, suspect) {
  // Check for impossible travel (location contradictions)
  const located = store.claims.filter(c =>
    c.subjectEntityId === suspect.entityId && c.locationMention && c.tISO);
  if (located.length < 2) return 0.5;
  const contradictions = store.contradictions?.filter(c =>
    c.subjectEntityId === suspect.entityId && c.kind === 'alibi_broken') || [];
  if (contradictions.length > 0) return 0.3;
  return 0.8;
}

function hypothesisConfidence(supporting, contradicting, missing, independentSources) {
  let conf = 0.1;
  const supportWeight = supporting.reduce((sum, s) => sum + (s.weight || 0.5), 0);
  const contradictWeight = contradicting.reduce((sum, c) => sum + (c.weight || 0.5), 0);

  conf += Math.min(0.5, supportWeight * 0.1);
  conf -= Math.min(0.3, contradictWeight * 0.1);
  conf += Math.min(0.2, independentSources * 0.05);
  conf -= Math.min(0.15, missing.length * 0.05);

  return Math.max(0, Math.min(0.97, conf));
}

function identifyMissingEvidenceTypes(store) {
  const kinds = new Set(store.evidence.map(e => e.kind));
  const allTypes = ['phone', 'financial', 'cctv', 'gps', 'interview', 'chat'];
  return allTypes.filter(t => !kinds.has(t)).map(t => {
    return { phone: 'Phone/Cellular', financial: 'Financial', cctv: 'CCTV', gps: 'GPS', interview: 'Interview', chat: 'Chat/Communications' }[t];
  });
}

module.exports = { generateHypotheses };
