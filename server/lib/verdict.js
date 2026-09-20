// The Verdict Engine. Deterministic MEANS / MOTIVE / OPPORTUNITY / DECEPTION
// scoring over the resolved entity graph. Every point cites evidence.
// The LLM extracts facts; THIS code does the accusing — same evidence,
// same verdict, every time. It refuses to accuse when the evidence is
// insufficient, and names exactly what would resolve the case.
const config = require('../config');
const { minutesBetween, within, isoAddMinutes } = require('./util');
const { entityName, locationsMatch } = require('./correlate');
const { norm } = require('./entities');
const bus = require('./bus');

const W = config.WEIGHTS;
const G = config.GATES;

const DISTRESS_RE = /they know|if i don'?t see you|give the drive to|taking the back stairwell|shouldn'?t be here|missing|disappear|abduct|kidnap|hostage|vanish|attacked|shot|assault|victim|threatened/i;
const EMBEZZLE_RE = /bleeding the accounts|cayman|embezzl|ledger|routing|accounts dry|fraud|bribe|debt|money|payment|smuggl|poach|illegal|threat|dispute|fired|revenge|contract|stole|theft|kickback|unauthorized|traffick/i;
const EXPOSURE_RE = /\bsec\b|expose|whistle|authorities|regulators|police|fbi|doj|audit|subpoena|investigat|warrant/i;
const SENIOR_RE = /\b(ceo|chief executive|president|director|head of security|chairman|manager|captain|officer|supervisor|lead|commander|vp|chief)\b/i;

function computeVerdict(store) {
  bus.emit('VERDICT', 'Scoring engine started — weights: ' + JSON.stringify(W));
  const persons = store.entities.filter((e) => e.kind === 'person');
  const victim = detectVictim(store, persons);
  if (victim) bus.emit('VERDICT', `Victim established: ${victim.canonical}`);

  const { windowStart, windowEnd, crimeLocations } = crimeWindow(store);
  bus.emit('VERDICT', `Crime window: ${windowStart?.slice(11, 16)}–${windowEnd?.slice(11, 16)} · scene(s): ${crimeLocations.join(' / ') || 'n/a'}`);

  const suspects = [];
  for (const p of persons) {
    if (victim && p.entityId === victim.entityId) continue;
    const s = scorePerson(store, p, victim, { windowStart, windowEnd, crimeLocations });
    suspects.push(s);
  }
  suspects.sort((a, b) => b.total - a.total);

  for (const s of suspects.slice(0, 4)) {
    bus.emit('VERDICT', `${s.name}: ${s.total}/100 (O:${s.breakdown.opportunity} M:${s.breakdown.means} Mo:${s.breakdown.motive} D:${s.breakdown.deception})`);
  }

  const top1 = suspects[0];
  const top2 = suspects[1];
  const conspiracy = top1 && top2 ? conspiracyLinks(store, top1.entityId, top2.entityId, windowStart, windowEnd) : [];
  const isConspiracy = conspiracy.length >= 2;
  if (isConspiracy) bus.emit('VERDICT', `Conspiracy detected between ${top1.name} and ${top2.name}: ${conspiracy.map((l) => l.kind).join(', ')}`);

  const outsider = isConspiracy ? suspects[2] : top2;
  const margin = top1 ? top1.total - (outsider?.total || 0) : 0;
  const contributingFiles = top1 ? [...new Set(top1.contributions.flatMap((c) => c.evidenceIds))] : [];
  const coverage = store.evidence.length ? contributingFiles.length / store.evidence.length : 0;

  const objections = buildObjections(store, [top1, isConspiracy ? top2 : null].filter(Boolean));
  let confidence = top1
    ? (0.45 + 0.5 * Math.min(1, margin / 30)) * (0.6 + 0.4 * coverage) - objections.length * 0.02
    : 0;
  confidence = Math.max(0, Math.min(0.97, confidence));

  const insufficient =
    !top1 ||
    top1.total < G.MIN_TOP_SCORE ||
    margin < G.MIN_MARGIN ||
    contributingFiles.length < G.MIN_EVIDENCE_SOURCES;

  const cleared = suspects
    .filter((s) => s.total < 15 && !s.provisional)
    .map((s) => ({
      entityId: s.entityId,
      name: s.name,
      reason: clearedReason(store, s, victim),
    }));

  const verdict = {
    status: insufficient ? 'INSUFFICIENT_EVIDENCE' : 'IDENTIFIED',
    confidence: Math.round(confidence * 100) / 100,
    computedAt: new Date().toISOString(),
    source: 'deterministic-engine',
    weights: W,
    gates: G,
    crimeWindow: { start: windowStart, end: windowEnd, locations: crimeLocations },
    victim: victim ? { entityId: victim.entityId, name: victim.canonical, basis: victimBasis(store, victim) } : null,
    primeSuspect: null,
    coConspirators: [],
    suspects,
    cleared,
    reasoningChain: [],
    objections,
    unresolvedQuestions: [],
    margin,
    coverage: Math.round(coverage * 100) / 100,
  };

  if (!insufficient) {
    const role = top1.breakdown.opportunity >= 20 ? 'EXECUTOR' : 'ORCHESTRATOR';
    verdict.primeSuspect = { ...top1, role };
    if (isConspiracy) {
      const role2 = role === 'ORCHESTRATOR' ? 'EXECUTOR' : 'ORCHESTRATOR';
      verdict.coConspirators = [{ ...top2, role: role2, links: conspiracy }];
    }
    verdict.reasoningChain = buildChain(store, verdict, conspiracy);
    bus.emit('VERDICT', `★ PRIME SUSPECT: ${top1.name} — ${role} — ${Math.round(confidence * 100)}% confidence`);
  } else {
    verdict.unresolvedQuestions = buildUnresolved(store, suspects, { windowStart, windowEnd });
    bus.emit('VERDICT', `INSUFFICIENT EVIDENCE — top score ${top1?.total ?? 0}/100, margin ${margin}. ${verdict.unresolvedQuestions.length} unresolved question(s) named.`);
  }

  store.verdict = verdict;
  return verdict;
}

// ── Victim detection ───────────────────────────────────────────────
function detectVictim(store, persons) {
  let best = null; let bestScore = 0;
  for (const p of persons) {
    let score = 0;
    const mine = store.claims.filter((c) => c.subjectEntityId === p.entityId || c.speakerEntityId === p.entityId);
    if (mine.some((c) => c.type === 'communication' && DISTRESS_RE.test(c.sourceQuote))) score++;
    if (mine.some((c) => /driver missing|vehicle found|abandoned/i.test(c.sourceQuote))) score++;
    if (mine.some((c) => c.type === 'observation' && /hastily|flee|back stairwell|run/i.test(c.sourceQuote))) score++;
    if (score > bestScore) { bestScore = score; best = p; }
  }
  return bestScore >= 2 ? best : null;
}
function victimBasis(store, victim) {
  return store.claims
    .filter((c) => (c.subjectEntityId === victim.entityId || c.speakerEntityId === victim.entityId)
      && (DISTRESS_RE.test(c.sourceQuote) || /driver missing|hastily|abandoned/i.test(c.sourceQuote)))
    .slice(0, 4)
    .map((c) => ({ quote: c.sourceQuote, evidenceId: c.evidenceId, line: c.line }));
}

// ── Crime window: first alert → last telemetry event ───────────────
function crimeWindow(store) {
  const flagged = store.timeline.filter((t) => t.type === 'alert' || t.type === 'critical');
  const all = store.timeline;
  if (!flagged.length && !all.length) return { windowStart: null, windowEnd: null, crimeLocations: [] };
  const first = flagged[0] || all[0];
  const last = all[all.length - 1];
  const start = isoAddMinutes(first.tISO, -30);
  const crimeLocations = [...new Set(flagged.map((t) => t.location).filter(Boolean))];
  return { windowStart: start, windowEnd: last.tISO, crimeLocations };
}

// ── Per-person MMO+D ───────────────────────────────────────────────
function scorePerson(store, p, victim, ctx) {
  const contributions = [];
  const add = (dimension, points, reason, evidenceIds, claimIds = []) =>
    contributions.push({ dimension, points, reason, evidenceIds: [...new Set(evidenceIds)], claimIds });

  // OPPORTUNITY — physical placement at a crime scene inside the window
  let opportunity = 0;
  const placements = store.claims.filter((c) =>
    c.subjectEntityId === p.entityId &&
    (c.type === 'observation' || c.type === 'telemetry') &&
    c.tISO && ctx.windowStart && within(c.tISO, ctx.windowStart, ctx.windowEnd) &&
    ctx.crimeLocations.some((L) => locationsMatch(norm(entityName(store, c.locationEntityId) || c.locationMention || ''), norm(L))));
  const hardPlace = placements.filter((c) => c.type === 'telemetry' || c.reliability >= 0.85);
  const softPlace = placements.filter((c) => !hardPlace.includes(c));
  if (hardPlace.length) {
    opportunity += Math.min(20, 15 + (hardPlace.length - 1) * 3);
    add('opportunity', Math.min(20, 15 + (hardPlace.length - 1) * 3),
      `Physically recorded at the scene during the crime window (${hardPlace.map((c) => `${c.tISO.slice(11, 16)}`).join(', ')})`,
      hardPlace.map((c) => c.evidenceId), hardPlace.map((c) => c.claimId));
  }
  if (softPlace.length) {
    opportunity += 10;
    add('opportunity', 10,
      `Placed at the scene by visual inference only (${softPlace[0].sourceQuote.slice(0, 80)}…)`,
      softPlace.map((c) => c.evidenceId), softPlace.map((c) => c.claimId));
  }
  // Co-located with the victim's last known position
  for (const l of store.coLocations || []) {
    const other = l.aEntityId === p.entityId ? l.bEntityId : l.bEntityId === p.entityId ? l.aEntityId : null;
    if (other && victim && (other === victim.entityId || vehicleOf(store, victim)?.entityId === other)) {
      opportunity += 10;
      add('opportunity', 10, `Co-located with the victim's last known position: ${l.detail}`, l.evidenceIds, l.claimIds);
      break;
    }
  }
  // Their alibi was broken inside the window
  const broken = store.contradictions.filter((c) => c.kind === 'alibi_broken' && c.subjectEntityId === p.entityId && c.severity === 'critical');
  if (broken.length && opportunity > 0) {
    opportunity += 5;
    add('opportunity', 5, 'Stated alibi for the crime window is contradicted by physical records', broken.flatMap((c) => c.evidence));
  }
  opportunity = Math.min(W.OPPORTUNITY_MAX, opportunity);

  // MEANS — command, control, access
  let means = 0;
  const employed = employees(store, p.entityId);
  for (const emp of employed) {
    const empScore = store.claims.some((c) => c.subjectEntityId === emp.entityId && (c.type === 'telemetry' || c.type === 'observation'));
    if (empScore) {
      const strong = store.contradictions.some((c) => c.subjectEntityId === emp.entityId && c.severity === 'critical');
      means += strong ? 10 : 5;
      add('means', strong ? 10 : 5,
        `Commands ${emp.canonical}, who is ${strong ? 'physically implicated' : 'potentially implicated'} at the scene`,
        [...new Set(emp.mentions.map((m) => m.evidenceId))].slice(0, 3));
    }
  }
  // Direct call coordination with a physically implicated party during the window
  for (const c of store.claims.filter((c) => c.type === 'telemetry' && /Call (?:to|from)/i.test(c.sourceQuote))) {
    const m = c.sourceQuote.match(/Call (?:to|from)\s+[\d+\-() ]+\s*\(([^)]+)\)/i);
    if (!m) continue;
    const isParty = [p.canonical, ...p.aliases].some((n) => norm(n) === norm(m[1]));
    if (!isParty || !c.tISO || !ctx.windowStart || !within(c.tISO, ctx.windowStart, ctx.windowEnd)) continue;
    const otherImplicated = c.subjectEntityId && store.contradictions.some((x) => x.subjectEntityId === c.subjectEntityId && x.severity === 'critical');
    if (otherImplicated) {
      means += 5;
      add('means', 5, `Direct phone contact with ${entityName(store, c.subjectEntityId)} DURING the crime window (${c.tISO.slice(11, 16)}) — while claiming to be together elsewhere`, [c.evidenceId], [c.claimId]);
      break;
    }
  }
  if (roleText(store, p.entityId, SENIOR_RE)) {
    means += 7;
    add('means', 7, `Senior authority (${roleText(store, p.entityId, SENIOR_RE)}) — controls facility access, personnel and records`, roleEvidence(store, p.entityId));
  }
  const veh = vehicleOf(store, p);
  if (veh && store.claims.some((c) => c.vehicleEntityId === veh.entityId || (c.subjectEntityId === p.entityId && c.type === 'observation' && /suv|sedan|vehicle/i.test(c.sourceQuote)))) {
    means += 4;
    add('means', 4, `Operates a vehicle placed in the evidence record (${veh.canonical})`, veh.mentions.map((m) => m.evidenceId));
  }
  means = Math.min(W.MEANS_MAX, means);

  // MOTIVE — accused of financial or criminal wrongdoing, threat of exposure, anomalous funds
  let motive = 0;
  const surname = p.canonical.split(' ').pop().toLowerCase();
  const accusations = store.claims.filter((c) =>
    (c.type === 'communication' || c.type === 'assertion') &&
    c.sourceQuote.toLowerCase().includes(surname) &&
    EMBEZZLE_RE.test(c.sourceQuote));
  if (accusations.length) {
    motive += 15;
    add('motive', 15, `Named in financial or illicit allegations: "${accusations[0].sourceQuote.slice(0, 90)}"`, accusations.map((c) => c.evidenceId), accusations.map((c) => c.claimId));
  }
  const exposure = store.claims.filter((c) =>
    c.sourceQuote.toLowerCase().includes(surname) && EXPOSURE_RE.test(c.sourceQuote));
  if (accusations.length && exposure.length) {
    motive += 10;
    add('motive', 10, `Subject of impending regulatory exposure or investigation: "${exposure[0].sourceQuote.slice(0, 90)}"`, exposure.map((c) => c.evidenceId), exposure.map((c) => c.claimId));
  }
  const reframe = store.contradictions.filter((c) => c.kind === 'motive_reframe' && c.asserterEntityId === p.entityId);
  if (reframe.length) {
    motive += 5;
    add('motive', 5, 'Actively mischaracterized events or motives in witness statements', reframe.flatMap((c) => c.evidence));
  }
  motive = Math.min(W.MOTIVE_MAX, motive);

  // DECEPTION — contradictions this person AUTHORED
  let deception = 0;
  for (const c of store.contradictions.filter((c) => c.asserterEntityId === p.entityId)) {
    const pts = c.severity === 'critical' ? 5 : c.severity === 'high' ? 3 : 2;
    deception += pts;
    add('deception', pts, `${c.title} (${c.severity}, ${c.confidence}% confidence)`, c.evidence);
  }
  deception = Math.min(W.DECEPTION_MAX, deception);

  return {
    entityId: p.entityId,
    name: p.canonical,
    provisional: !!p.provisional,
    total: opportunity + means + motive + deception,
    breakdown: { opportunity, means, motive, deception },
    contributions,
  };
}

// ── Conspiracy links between two entities ──────────────────────────
function conspiracyLinks(store, aId, bId, windowStart, windowEnd) {
  const links = [];
  for (const c of store.claims.filter((c) => c.type === 'assertion')) {
    const m = c.sourceQuote.match(/([A-Z][a-z]+\s[A-Z][a-z]+),\s*my\s+(Head of Security|assistant|deputy|driver)/i);
    if (m && c.speakerEntityId === aId) {
      const emp = store.entities.find((e) => e.entityId === bId);
      if (emp && [emp.canonical, ...emp.aliases].some((n) => norm(n) === norm(m[1]))) {
        links.push({ kind: 'employs', detail: `${entityName(store, aId)} employs ${m[1]} (${m[2]})`, evidenceIds: [c.evidenceId] });
      }
    }
  }
  for (const c of store.contradictions) {
    if ((c.asserterEntityId === aId && c.subjectEntityId === bId) || (c.asserterEntityId === bId && c.subjectEntityId === aId)) {
      links.push({ kind: 'false-alibi', detail: `${entityName(store, c.asserterEntityId)} supplied a false alibi for ${entityName(store, c.subjectEntityId)}`, evidenceIds: c.evidence });
    }
  }
  for (const c of store.claims.filter((c) => c.type === 'telemetry' && /Call (?:to|from)/i.test(c.sourceQuote))) {
    const m = c.sourceQuote.match(/Call (?:to|from)\s+[\d+\-() ]+\s*\(([^)]+)\)/i);
    if (!m) continue;
    const otherName = m[1].trim();
    const involved = [aId, bId].includes(c.subjectEntityId);
    const other = store.entities.find((e) => [e.canonical, ...e.aliases].some((n) => norm(n) === norm(otherName)));
    if (involved && other && [aId, bId].includes(other.entityId) && other.entityId !== c.subjectEntityId) {
      const inWindow = c.tISO && windowStart && within(c.tISO, windowStart, windowEnd);
      links.push({ kind: inWindow ? 'call-during-window' : 'call', detail: `Direct call between the two ${inWindow ? 'DURING the crime window' : ''} at ${c.tISO?.slice(11, 16)} [${c.evidenceId}]`, evidenceIds: [c.evidenceId] });
    }
  }
  return links;
}

// ── Reasoning chain (every step cites evidence) ────────────────────
function buildChain(store, verdict, conspiracy) {
  const chain = [];
  const step = (text, evidenceIds, kind) => chain.push({ step: chain.length + 1, text, evidenceIds: [...new Set(evidenceIds)].filter(Boolean), kind });

  if (verdict.victim) {
    step(`${verdict.victim.name} is the victim: distress communications, flight from the scene, and an abandoned vehicle with the driver missing.`,
      verdict.victim.basis.map((b) => b.evidenceId), 'victim');
  }
  const prime = verdict.primeSuspect;
  for (const c of prime.contributions.filter((c) => c.dimension === 'motive')) step(c.reason + '.', c.evidenceIds, 'motive');
  for (const cc of verdict.coConspirators) {
    for (const c of cc.contributions.filter((x) => x.dimension === 'opportunity')) {
      step(`${cc.name}: ${c.reason}.`, c.evidenceIds, 'opportunity');
    }
  }
  for (const c of store.contradictions) {
    step(`${c.title} — ${c.description}`, c.evidence, c.kind);
  }
  for (const l of conspiracy) step(l.detail + '.', l.evidenceIds || [], 'coordination');
  for (const l of (store.coLocations || []).slice(0, 3)) step(`Triangulation: ${l.detail}.`, l.evidenceIds, 'co-location');
  step(`Conclusion: ${prime.name} (${prime.role.toLowerCase()}) — Opportunity ${prime.breakdown.opportunity}/${W.OPPORTUNITY_MAX}, Means ${prime.breakdown.means}/${W.MEANS_MAX}, Motive ${prime.breakdown.motive}/${W.MOTIVE_MAX}, Deception ${prime.breakdown.deception}/${W.DECEPTION_MAX} = ${prime.total}/100.`,
    prime.contributions.flatMap((c) => c.evidenceIds), 'conclusion');
  return chain;
}

// ── Defense counsel: the engine attacks its own accusation ─────────
function buildObjections(store, accused) {
  if (!accused.length) return [];
  const objections = [];
  const seen = new Set();
  for (const person of accused) {
    for (const c of person.contributions) {
      for (const claimId of c.claimIds || []) {
        const claim = store.claims.find((x) => x.claimId === claimId);
        if (claim && claim.reliability < 0.8 && (claim.type === 'observation' || claim.type === 'telemetry') && !seen.has(claimId)) {
          seen.add(claimId);
          objections.push({
            text: `"${claim.sourceQuote.slice(0, 90)}" rests on visual inference, not biometric identification (reliability ${claim.reliability}).`,
            evidenceId: claim.evidenceId,
            impact: '-2% confidence',
          });
        }
      }
    }
  }
  if (!store.claims.some((c) => /forensic|fingerprint|dna/i.test(c.sourceQuote))) {
    objections.push({ text: 'No forensic recovery (prints, DNA, the encrypted drive itself) links any suspect to the victim directly.', impact: '-2% confidence' });
  }
  return objections.slice(0, 4);
}

// ── What would resolve the case (INSUFFICIENT state) ───────────────
function buildUnresolved(store, suspects, ctx) {
  const out = [];
  const kinds = new Set(store.evidence.map((e) => e.kind));
  for (const c of store.contradictions.filter((c) => c.severity !== 'critical' && c.kind === 'alibi_broken')) {
    const name = entityName(store, c.subjectEntityId);
    if (name && !kinds.has('phone')) {
      out.push({
        question: `Where was ${name} between ${ctx.windowStart?.slice(11, 16)} and ${ctx.windowEnd?.slice(11, 16)}? The stated alibi is contested only by visual resemblance.`,
        wouldBeResolvedBy: `Cellular tower records for ${name}'s phone`,
        projectedImpact: '+22% confidence',
      });
    }
  }
  if (!kinds.has('phone') && store.claims.some((c) => /burner/i.test(c.sourceQuote))) {
    out.push({
      question: 'Who owns and directed the burner phone that pinged the scene of the vehicle stop?',
      wouldBeResolvedBy: 'Carrier subpoena: tower history + purchase records for the burner number',
      projectedImpact: '+15% confidence',
    });
  }
  for (const p of store.entities.filter((e) => e.provisional)) {
    out.push({
      question: `Identity of "${p.canonical}" is unresolved.`,
      wouldBeResolvedBy: 'Additional camera angles or witness identification',
      projectedImpact: '+8% confidence',
    });
  }
  // Unattributed devices (cards, phones) active at a crime-relevant moment
  for (const d of store.entities.filter((e) => e.kind === 'device')) {
    const flagged = store.claims.some((c) => c.subjectEntityId === d.entityId && /ANOMALOUS/i.test(c.sourceQuote));
    if (flagged) {
      out.push({
        question: `${d.canonical} made an anomalous transaction but is attributed to no individual.`,
        wouldBeResolvedBy: `Card-to-employee attribution records for ${d.canonical}`,
        projectedImpact: '+20% confidence',
      });
    }
  }
  if (!out.length) {
    out.push({
      question: 'The evidence names no individual with sufficient corroboration.',
      wouldBeResolvedBy: 'Any physical record placing a named person at a crime scene',
      projectedImpact: 'required to proceed',
    });
  }
  return out.slice(0, 4);
}

// ── helpers ────────────────────────────────────────────────────────
function employees(store, employerId) {
  const out = [];
  for (const c of store.claims.filter((c) => c.type === 'assertion' && c.speakerEntityId === employerId)) {
    const m = c.sourceQuote.match(/([A-Z][a-z]+\s[A-Z][a-z]+),\s*my\s+(?:Head of Security|assistant|deputy|driver)/i);
    if (m) {
      const e = store.entities.find((x) => x.kind === 'person' && [x.canonical, ...x.aliases].some((n) => norm(n) === norm(m[1])));
      if (e) out.push(e);
    }
  }
  // "(Head of Security)" annotations in observations
  for (const c of store.claims.filter((c) => /head of security/i.test(c.sourceQuote))) {
    const m = c.sourceQuote.match(/([A-Z][a-z]+\s[A-Z][a-z]+)\s*\(Head of Security\)/i);
    if (m) {
      const e = store.entities.find((x) => x.kind === 'person' && [x.canonical, ...x.aliases].some((n) => norm(n) === norm(m[1])));
      const already = out.find((x) => x.entityId === e?.entityId);
      if (e && !already) {
        const employer = store.entities.find((x) => roleTextRaw(store, x.entityId, /ceo|chief executive/i));
        if (employer && employer.entityId === employerId) out.push(e);
      }
    }
  }
  return out;
}
function roleText(store, entityId, re) {
  return roleTextRaw(store, entityId, re);
}
function roleTextRaw(store, entityId, re) {
  const e = store.entities.find((x) => x.entityId === entityId);
  if (!e) return null;
  for (const ev of store.evidence) {
    const raw = ev.rawExcerpt || '';
    for (const name of [e.canonical, ...e.aliases]) {
      const idx = raw.indexOf(name);
      if (idx !== -1) {
        const around = raw.slice(Math.max(0, idx - 60), idx + name.length + 60);
        const m = around.match(re);
        if (m) return m[0];
      }
    }
  }
  return null;
}
function roleEvidence(store, entityId) {
  const e = store.entities.find((x) => x.entityId === entityId);
  return e ? [...new Set(e.mentions.map((m) => m.evidenceId))].slice(0, 2) : [];
}
function vehicleOf(store, person) {
  if (!person) return null;
  const c = store.claims.find((c) => c.subjectEntityId === person.entityId && c.vehicleEntityId);
  return c ? store.entities.find((e) => e.entityId === c.vehicleEntityId) : null;
}
function clearedReason(store, s, victim) {
  const reasons = [];
  if (!s.breakdown.opportunity) reasons.push('no placement at any crime-relevant location');
  if (!s.breakdown.motive) reasons.push('no motive signal in any evidence');
  if (!s.breakdown.deception) reasons.push('no contradiction authored');
  const disclosure = store.claims.find((c) => c.type === 'communication' && victim && c.speakerEntityId === victim.entityId && /give the drive|if i don'?t see you/i.test(c.sourceQuote) && c.sourceQuote.includes(s.name.split(' ')[0]));
  if (store.claims.some((c) => c.type === 'communication' && c.speakerEntityId === s.entityId)) reasons.push('acted as the victim\'s confidant' + (disclosure ? ' and designated custodian of the evidence' : ''));
  return reasons.join('; ') || 'no evidentiary involvement';
}

module.exports = { computeVerdict };
