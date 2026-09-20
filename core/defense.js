// Strengthened Defense Counsel — the engine's own adversarial pass.
// After the primary hypothesis is generated, Defense Counsel asks five
// explicit questions and deterministically recalibrates confidence.
// The result powers the PROSECUTION VIEW vs DEFENSE VIEW in the UI.
const bus = require('./bus');

/**
 * Run the defense counsel pass over a case.
 * Returns { prosecutionView, defenseView, recalibratedConfidence, attacks[] }
 */
function runDefenseCounsel(store) {
  bus.emit('DEFENSE', 'Defense Counsel pass initiated — attacking the primary hypothesis');

  const v = store.verdict;
  if (!v || !v.primeSuspect) {
    bus.emit('DEFENSE', 'No accusation to attack — defense counsel has nothing to do');
    return null;
  }

  const attacks = [];
  const prime = v.primeSuspect;
  const allClaims = store.claims || [];
  const allContradictions = store.contradictions || [];

  // ── ATTACK 1: What is the strongest evidence AGAINST this hypothesis? ──
  const contradictingEvidence = findContradictingEvidence(store, prime);
  if (contradictingEvidence.length > 0) {
    attacks.push({
      question: 'What is the strongest evidence against this hypothesis?',
      findings: contradictingEvidence,
      severity: contradictingEvidence.some(e => e.weight > 0.7) ? 'critical' : 'moderate',
      confidenceImpact: -0.03 * contradictingEvidence.length,
    });
  }

  // ── ATTACK 2: What evidence could have an innocent explanation? ──
  const innocentExplanations = findInnocentExplanations(store, prime);
  if (innocentExplanations.length > 0) {
    attacks.push({
      question: 'What evidence could have an innocent explanation?',
      findings: innocentExplanations,
      severity: 'moderate',
      confidenceImpact: -0.02 * innocentExplanations.length,
    });
  }

  // ── ATTACK 3: Which inference relies on a single source? ──
  const singleSourceInferences = findSingleSourceInferences(store, prime);
  if (singleSourceInferences.length > 0) {
    attacks.push({
      question: 'Which inference relies on a single source?',
      findings: singleSourceInferences,
      severity: singleSourceInferences.length >= 2 ? 'critical' : 'moderate',
      confidenceImpact: -0.04 * singleSourceInferences.length,
    });
  }

  // ── ATTACK 4: Which claim has not been independently corroborated? ──
  const uncorroboratedClaims = findUncorroboratedClaims(store, prime);
  if (uncorroboratedClaims.length > 0) {
    attacks.push({
      question: 'Which claim has not been independently corroborated?',
      findings: uncorroboratedClaims,
      severity: uncorroboratedClaims.length >= 3 ? 'critical' : 'moderate',
      confidenceImpact: -0.02 * uncorroboratedClaims.length,
    });
  }

  // ── ATTACK 5: Which missing artifact would most change the conclusion? ──
  const criticalMissing = findCriticalMissing(store, prime);
  if (criticalMissing.length > 0) {
    attacks.push({
      question: 'Which missing artifact would most change the conclusion?',
      findings: criticalMissing,
      severity: 'critical',
      confidenceImpact: -0.05 * Math.min(criticalMissing.length, 2),
    });
  }

  // ── Recalibrate confidence ──
  const totalImpact = attacks.reduce((sum, a) => sum + a.confidenceImpact, 0);
  const recalibratedConfidence = Math.max(0, Math.min(0.97,
    v.confidence + totalImpact));

  // ── Build prosecution vs defense views ──
  const prosecutionView = buildProsecutionView(store, prime);
  const defenseView = buildDefenseView(attacks);

  const result = {
    prosecutionView,
    defenseView,
    attacks,
    originalConfidence: v.confidence,
    recalibratedConfidence,
    confidenceDelta: totalImpact,
    attackCount: attacks.length,
    criticalAttacks: attacks.filter(a => a.severity === 'critical').length,
  };

  // Update the store — do NOT overwrite v.confidence; Defense Counsel
  // records its own recalibrated view. The verdict confidence remains
  // the prosecution's number; the UI shows both side-by-side.
  store.defenseCounsel = result;

  bus.emit('DEFENSE', `Defense Counsel complete: ${attacks.length} attacks, ${result.criticalAttacks} critical. Confidence: ${Math.round(v.confidence * 100)}% → ${Math.round(recalibratedConfidence * 100)}% (Δ${Math.round(totalImpact * 100)}%)`);
  return result;
}

function findContradictingEvidence(store, suspect) {
  const items = [];
  // Claims where suspect appears innocent
  const helpfulClaims = store.claims.filter(c =>
    c.subjectEntityId === suspect.entityId &&
    c.type === 'communication' &&
    /help|warn|protect|concerned/i.test(c.sourceQuote));
  for (const c of helpfulClaims.slice(0, 2)) {
    items.push({
      text: `${suspect.name} expressed concern or offered help: "${c.sourceQuote.slice(0, 100)}"`,
      evidenceIds: [c.evidenceId],
      weight: 0.5,
    });
  }
  // Observations that place suspect elsewhere
  const elsewhere = store.claims.filter(c =>
    c.subjectEntityId === suspect.entityId &&
    c.type === 'telemetry' &&
    c.locationMention &&
    !store.contradictions.some(x => x.subjectEntityId === suspect.entityId));
  if (elsewhere.length > 0) {
    items.push({
      text: `Physical records place ${suspect.name} at ${elsewhere[0].locationMention} without contradiction`,
      evidenceIds: elsewhere.slice(0, 2).map(c => c.evidenceId),
      weight: 0.6,
    });
  }
  return items;
}

function findInnocentExplanations(store, suspect) {
  const items = [];
  for (const c of suspect.contributions || []) {
    if (c.dimension === 'opportunity' && c.points <= 10) {
      items.push({
        text: `Presence at the scene (${c.reason.slice(0, 80)}) could be explained by normal business activity`,
        evidenceIds: c.evidenceIds,
        weight: 0.4,
      });
    }
    if (c.dimension === 'means' && /senior|authority|ceo/i.test(c.reason)) {
      items.push({
        text: `Authority status (${c.reason.slice(0, 80)}) is a legitimate role, not inherently suspicious`,
        evidenceIds: c.evidenceIds,
        weight: 0.3,
      });
    }
  }
  return items.slice(0, 3);
}

function findSingleSourceInferences(store, suspect) {
  const items = [];
  for (const c of suspect.contributions || []) {
    if (c.evidenceIds.length === 1) {
      items.push({
        text: `"${c.reason.slice(0, 100)}" rests on a single evidence file: ${c.evidenceIds[0]}`,
        evidenceIds: c.evidenceIds,
        weight: 0.7,
        dimension: c.dimension,
      });
    }
  }
  return items;
}

function findUncorroboratedClaims(store, suspect) {
  const items = [];
  for (const c of suspect.contributions || []) {
    const claimIds = c.claimIds || [];
    for (const claimId of claimIds) {
      const claim = store.claims.find(x => x.claimId === claimId);
      if (claim && (claim.type === 'observation' || claim.type === 'assertion') && claim.reliability < 0.8) {
        items.push({
          text: `"${claim.sourceQuote.slice(0, 100)}" (reliability ${claim.reliability}) — ${claim.type}, not independently verified`,
          evidenceIds: [claim.evidenceId],
          weight: 1 - claim.reliability,
        });
      }
    }
  }
  return items.slice(0, 4);
}

function findCriticalMissing(store, suspect) {
  const items = [];
  const kinds = new Set(store.evidence.map(e => e.kind));

  if (!kinds.has('phone')) {
    items.push({
      text: `Phone records for ${suspect.name} — could confirm or demolish alibi and establish coordination`,
      wouldResolveBy: `Carrier subpoena for ${suspect.name}'s phone`,
      projectedImpact: '+22% confidence',
      weight: 0.9,
    });
  }
  if (!store.claims.some(c => /forensic|fingerprint|dna/i.test(c.sourceQuote))) {
    items.push({
      text: 'No forensic evidence links any person to the physical scene',
      wouldResolveBy: 'Crime scene forensic analysis (fingerprints, DNA, device forensics)',
      projectedImpact: '+18% confidence',
      weight: 0.8,
    });
  }
  if (!kinds.has('financial')) {
    items.push({
      text: 'Financial motive is alleged but no transaction records are submitted',
      wouldResolveBy: 'Bank records, corporate accounts audit',
      projectedImpact: '+12% confidence',
      weight: 0.7,
    });
  }
  return items;
}

function buildProsecutionView(store, suspect) {
  const v = store.verdict;
  return {
    title: `Case against ${suspect.name}`,
    role: suspect.role,
    score: suspect.total,
    confidence: Math.round(v.confidence * 100),
    keyPoints: (suspect.contributions || [])
      .filter(c => c.points >= 5)
      .sort((a, b) => b.points - a.points)
      .slice(0, 6)
      .map(c => ({
        dimension: c.dimension,
        text: c.reason,
        points: c.points,
        evidenceIds: c.evidenceIds,
      })),
    reasoningChain: v.reasoningChain || [],
    contradictions: store.contradictions.filter(c =>
      c.asserterEntityId === suspect.entityId || c.subjectEntityId === suspect.entityId),
  };
}

function buildDefenseView(attacks) {
  return {
    title: 'Defense Counsel challenges',
    attackCount: attacks.length,
    criticalCount: attacks.filter(a => a.severity === 'critical').length,
    attacks: attacks.map(a => ({
      question: a.question,
      severity: a.severity,
      findings: a.findings.map(f => ({
        text: f.text,
        evidenceIds: f.evidenceIds || [],
      })),
      confidenceImpact: `${Math.round(a.confidenceImpact * 100)}%`,
    })),
  };
}

module.exports = { runDefenseCounsel };
