// Cross-evidence correlation — pure JavaScript over typed, timestamped,
// entity-resolved claims. Deterministic: same evidence, same output, every
// time, with zero network. These links ARE the citations the verdict
// engine consumes.
const { nextId, minutesBetween, within, parseISO } = require('./util');
const { extractAlibis } = require('./parsers');
const { personByName, norm } = require('./entities');
const bus = require('./bus');

// ── Timeline ────────────────────────────────────────────────────────
const ALERT_RE = /hastily|flees|fleeing|obscured|abandoned|burner|unidentified|missing|shouldn'?t be here|back stairwell|scaring me|run(?:s|ning)? toward|ANOMALOUS/i;
const CRIT_RE = /driver missing|door locked, driver missing|vehicle found|resembles/i;

function buildTimeline(store) {
  const events = [];
  for (const c of store.claims) {
    if (!c.tISO) continue;
    if (c.type === 'assertion') continue; // statements are tested, not treated as events
    const subject = entityName(store, c.subjectEntityId) || c.subjectMention || '';
    const title =
      c.type === 'communication' ? `${subject}: "${truncate(c.sourceQuote, 60)}"`
      : c.type === 'telemetry' ? `${truncate(subject, 30)} — ${truncate(c.sourceQuote, 70)}`
      : truncate(c.sourceQuote, 90);
    const d = new Date(c.tISO);
    events.push({
      id: nextId('TL'),
      tISO: c.tISO,
      time: c.tISO.slice(11, 16),
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      title,
      location: entityName(store, c.locationEntityId) || c.locationMention || null,
      description: c.sourceQuote,
      evidenceIds: [c.evidenceId],
      claimIds: [c.claimId],
      entityIds: [c.subjectEntityId, c.speakerEntityId].filter(Boolean),
      type: CRIT_RE.test(c.sourceQuote) ? 'critical' : ALERT_RE.test(c.sourceQuote) ? 'alert' : c.type === 'observation' ? 'suspicious' : 'normal',
    });
  }
  events.sort((a, b) => parseISO(a.tISO) - parseISO(b.tISO));
  store.timeline = events;
  bus.emit('CORRELATE', `Timeline: ${events.length} events reconstructed, machine-sorted by real timestamps`);
  return events;
}

// ── Alibi windows + contradiction detection ────────────────────────
function detectContradictions(store) {
  const contradictions = [];
  const anchor = anchorDateOf(store);
  const alibis = extractAlibis(store.claims, anchor);

  // Resolve pronoun alibis ("She was by my side…") to the most recent
  // third-party alibi by the same asserter.
  for (const a of alibis) {
    if (a.pronoun) {
      const prior = alibis.find((x) => !x.pronoun && x.asserter === a.asserter && norm(x.subject) !== norm(x.asserter));
      if (prior) { a.subject = prior.subject; a.location = prior.location; }
    }
  }

  // Crime-relevant places: locations of flagged timeline events. Refutation
  // must place the subject at one of THESE — being elsewhere in general
  // (e.g. at the actual dinner venue) is not evidence of a lie.
  const flaggedLocations = [...new Set(store.timeline
    .filter((t) => t.type === 'alert' || t.type === 'critical')
    .map((t) => t.location).filter(Boolean))];

  for (const alibi of alibis.filter((a) => a.subject && a.subject !== '__PRONOUN_PREV__')) {
    const subjectEntity = personByName(store, alibi.subject);
    const asserterEntity = personByName(store, alibi.asserter);
    if (!subjectEntity || !alibi.startISO || !alibi.endISO) continue;

    // Hunt physical evidence (observation/telemetry) placing the subject
    // at a crime-relevant location inside the alibi window.
    const refuting = store.claims.filter((c) => {
      if (c.type !== 'observation' && c.type !== 'telemetry') return false;
      if (!c.tISO || !within(c.tISO, alibi.startISO, alibi.endISO)) return false;
      // Telemetry places only its SUBJECT (a phone record mentioning a call
      // party does not place that party at the tower); observations can
      // place anyone named in the frame.
      const involved = c.subjectEntityId === subjectEntity.entityId
        || (c.type === 'observation' && c.sourceQuote && [subjectEntity.canonical, ...subjectEntity.aliases].some((n) => n.includes(' ') && c.sourceQuote.includes(n)));
      if (!involved) return false;
      const place = (entityName(store, c.locationEntityId) || c.locationMention || '').toLowerCase();
      if (!place || locationsMatch(place, alibi.location)) return false;
      return flaggedLocations.some((L) => locationsMatch(place, norm(L)));
    });

    if (refuting.length > 0) {
      // Hard refutation = telemetry or a high-reliability observation.
      // Visual resemblance alone yields a SUSPECTED (medium) contradiction —
      // that honesty is what powers the insufficient-evidence demo beat.
      const hard = refuting.some((r) => r.type === 'telemetry' || r.reliability >= 0.85);
      const conf = hard
        ? Math.min(98, 78 + refuting.length * 5)
        : Math.min(70, 50 + refuting.length * 6);
      const c = {
        id: nextId('C'),
        kind: 'alibi_broken',
        severity: hard ? 'critical' : 'medium',
        title: `${hard ? 'Alibi broken' : 'Alibi contested'}: ${subjectEntity.canonical}`,
        description:
          `${alibi.asserter || 'Subject'} stated ${subjectEntity.canonical} was at "${alibi.location}" between ` +
          `${alibi.startISO.slice(11, 16)} and ${alibi.endISO.slice(11, 16)} — but ${refuting.length} independent ` +
          `physical record${refuting.length > 1 ? 's' : ''} place${refuting.length > 1 ? '' : 's'} ${subjectEntity.canonical.split(' ')[0]} at crime-relevant locations in that window: ` +
          refuting.map((r) => `${entityName(store, r.locationEntityId) || r.locationMention} at ${r.tISO.slice(11, 16)} [${r.evidenceId}]`).join('; ') +
          (hard ? '.' : '. (Sole basis is visual resemblance — corroborating records would confirm or clear.)'),
        asserterEntityId: asserterEntity?.entityId || null,
        subjectEntityId: subjectEntity.entityId,
        assertionQuote: alibi.sourceQuote,
        evidence: [...new Set([alibi.evidenceId, ...refuting.map((r) => r.evidenceId)])].filter(Boolean),
        refutingClaimIds: refuting.map((r) => r.claimId),
        assertionClaimLine: alibi.claimLine,
        confidence: conf,
      };
      contradictions.push(c);
      bus.emit('DECEPTION', `${hard ? 'ALIBI BROKEN' : 'ALIBI CONTESTED'} — ${subjectEntity.canonical}: asserted at "${alibi.location}", recorded at ${refuting.length} crime-relevant location(s). Asserter: ${alibi.asserter}`);
    }
  }

  // Dedup: multiple phrasings of the same alibi (vouch, plus-one, pronoun)
  // collapse into one contradiction per subject, keeping the strongest.
  const bySubject = {};
  for (const c of contradictions.filter((c) => c.kind === 'alibi_broken')) {
    const prev = bySubject[c.subjectEntityId];
    if (!prev) { bySubject[c.subjectEntityId] = c; continue; }
    if ((c.severity === 'critical' && prev.severity !== 'critical') || c.refutingClaimIds.length > prev.refutingClaimIds.length) {
      prev.superseded = true;
      c.evidence = [...new Set([...c.evidence, ...prev.evidence])];
      bySubject[c.subjectEntityId] = c;
    } else {
      c.superseded = true;
      prev.evidence = [...new Set([...prev.evidence, ...c.evidence])];
    }
  }
  const deduped = contradictions.filter((c) => !c.superseded);
  contradictions.length = 0;
  contradictions.push(...deduped);

  // Claim-vs-observation diff: what someone SAYS was taken vs what the
  // record shows ("quantum blueprints" vs "the ledger").
  const takenBy = (c, re) => { const m = c.sourceQuote.match(re); return m ? m[1].trim().toLowerCase() : null; };
  const DL_RE = /downloaded\s+(?:the\s+)?([\w\- ]+?)(?:\s+(?:onto|to)\s|\.|,|$)/i;
  const assertions = store.claims.filter((c) => c.type === 'assertion' && DL_RE.test(c.sourceQuote));
  const firsthand = store.claims.filter((c) => (c.type === 'communication' || c.type === 'observation') && DL_RE.test(c.sourceQuote));
  for (const a of assertions) {
    for (const f of firsthand) {
      const objA = takenBy(a, DL_RE);
      const objF = takenBy(f, DL_RE);
      if (!objA || !objF || objA === objF) continue;
      if (objA.split(' ').some((w) => objF.includes(w) && w.length > 3)) continue; // same object, different words
      const asserter = entityName(store, a.speakerEntityId) || a.speakerMention;
      const witness = entityName(store, f.speakerEntityId) || f.speakerMention;
      const spy = /spy|sold us out|corporate espionage/i.test(a.sourceQuote);
      const c = {
        id: nextId('C'),
        kind: spy ? 'motive_reframe' : 'factual_conflict',
        severity: 'high',
        title: spy ? `Motive reframed: ${asserter} mischaracterizes the theft` : `Factual conflict: what was taken`,
        description:
          `${asserter} states the download was "${objA}" [${a.evidenceId}]` +
          (spy ? ` and calls the subject a spy` : '') +
          ` — but the firsthand record says "${objF}" [${f.evidenceId} · ${f.tISO ? f.tISO.slice(11, 16) : ''}]` +
          (witness ? ` (${witness}'s own words)` : '') +
          (spy ? `. Recasting financial records as stolen IP turns a whistleblower into a thief — a motive invented after the fact.` : '.'),
        asserterEntityId: a.speakerEntityId || null,
        subjectEntityId: f.speakerEntityId || null,
        assertionQuote: a.sourceQuote,
        evidence: [a.evidenceId, f.evidenceId],
        refutingClaimIds: [f.claimId],
        assertionClaimLine: a.line,
        confidence: 88,
      };
      contradictions.push(c);
      bus.emit('DECEPTION', `CLAIM vs RECORD — ${asserter} says "${objA}", the record says "${objF}"`);
    }
  }

  store.contradictions = contradictions;
  bus.emit('CORRELATE', `${contradictions.length} contradiction(s) detected across ${store.evidence.length} evidence files`);
  return contradictions;
}

// ── Co-location detection ───────────────────────────────────────────
function detectCoLocations(store) {
  const links = [];
  const placed = store.claims.filter((c) => c.tISO && (c.locationEntityId || c.locationMention) && (c.type === 'telemetry' || c.type === 'observation'));
  for (let i = 0; i < placed.length; i++) {
    for (let j = i + 1; j < placed.length; j++) {
      const a = placed[i]; const b = placed[j];
      if (a.evidenceId === b.evidenceId) continue;
      const sameEntity = a.subjectEntityId && a.subjectEntityId === b.subjectEntityId;
      if (sameEntity) continue;
      const locA = norm(entityName(store, a.locationEntityId) || a.locationMention);
      const locB = norm(entityName(store, b.locationEntityId) || b.locationMention);
      if (!locationsMatch(locA, locB)) continue;
      if (minutesBetween(a.tISO, b.tISO) > 20) continue;
      links.push({
        type: 'co-location',
        aEntityId: a.subjectEntityId, bEntityId: b.subjectEntityId,
        location: entityName(store, a.locationEntityId) || a.locationMention,
        tISO: a.tISO, evidenceIds: [a.evidenceId, b.evidenceId], claimIds: [a.claimId, b.claimId],
        detail: `${entityName(store, a.subjectEntityId) || a.subjectMention} and ${entityName(store, b.subjectEntityId) || b.subjectMention} at "${entityName(store, a.locationEntityId) || a.locationMention}" within ${Math.round(minutesBetween(a.tISO, b.tISO))} min (independent sources)`,
      });
    }
  }
  store.coLocations = links;
  if (links.length) bus.emit('CORRELATE', `${links.length} cross-source co-location event(s) triangulated`);
  return links;
}

// ── Relationship graph ─────────────────────────────────────────────
function buildGraph(store) {
  const nodes = [];
  const edges = [];
  const edgeKey = new Set();
  const perPair = {};
  const addEdge = (source, target, label, strength, evidenceIds) => {
    if (!source || !target || source === target) return;
    if (!kept.has(source) || !kept.has(target)) return;
    const k = `${source}|${target}|${label}`;
    if (edgeKey.has(k)) return;
    // Max 2 edges per node pair — the strongest story, not every fact.
    const pair = [source, target].sort().join('|');
    if ((perPair[pair] || 0) >= 2) return;
    perPair[pair] = (perPair[pair] || 0) + 1;
    edgeKey.add(k);
    edges.push({ id: `e${edges.length + 1}`, source, target, label, strength, evidenceIds });
  };

  const verdictScores = Object.fromEntries((store.verdict?.suspects || []).map((s) => [s.entityId, s.total]));
  const pinned = new Set([
    store.verdict?.primeSuspect?.entityId,
    store.verdict?.victim?.entityId,
    ...(store.verdict?.coConspirators || []).map((c) => c.entityId),
  ].filter(Boolean));

  // Importance-ranked pruning: a readable case graph, not a hairball.
  const ranked = store.entities
    .map((e) => ({
      e,
      importance: (pinned.has(e.entityId) ? 1000 : 0)
        + (verdictScores[e.entityId] || 0) * 5
        + [...new Set(e.mentions.map((m) => m.evidenceId))].length * 6
        + Math.min(e.mentions.length, 8)
        + (e.kind === 'person' ? 4 : 0),
    }))
    .filter(({ e }) => !(e.kind === 'location' && e.mentions.length < 2))
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 26)
    .map(({ e }) => e);
  const kept = new Set(ranked.map((e) => e.entityId));

  for (const e of ranked) {
    nodes.push({
      id: e.entityId,
      label: e.canonical.length > 26 ? e.canonical.slice(0, 25) + '…' : e.canonical,
      type: e.kind === 'person'
        ? (store.verdict?.primeSuspect?.entityId === e.entityId ? 'suspect'
          : store.verdict?.victim?.entityId === e.entityId ? 'victim' : 'person')
        : e.kind,
      detail: e.provisional ? 'provisional identity' : `${e.mentions.length} mention(s) · ${[...new Set(e.mentions.map((m) => m.evidenceId))].length} file(s)`,
      score: verdictScores[e.entityId] || 0,
      provisional: e.provisional,
    });
  }

  // Communication edges (chat participants, phone calls)
  const chatSpeakers = {};
  for (const c of store.claims) {
    if (c.type === 'communication' && c.speakerEntityId) {
      (chatSpeakers[c.evidenceId] = chatSpeakers[c.evidenceId] || new Set()).add(c.speakerEntityId);
    }
    if (c.type === 'telemetry' && /Call (?:to|from)/i.test(c.sourceQuote)) {
      const m = c.sourceQuote.match(/Call (?:to|from)\s+[\d+\-() ]+\s*\(([^)]+)\)/i);
      if (m && c.subjectEntityId) {
        const other = personByName(store, m[1].replace(/UNREGISTERED.*/i, '').trim()) || null;
        if (other) addEdge(c.subjectEntityId, other.entityId, 'phone call', 'strong', [c.evidenceId]);
        if (/UNREGISTERED|burner/i.test(m[1])) {
          const burner = store.entities.find((x) => x.kind === 'phone' && /0199|burner/i.test(x.canonical + x.aliases.join('')));
          if (burner) addEdge(c.subjectEntityId, burner.entityId, 'contacted burner', 'strong', [c.evidenceId]);
        }
      }
    }
  }
  for (const ev of Object.keys(chatSpeakers)) {
    const ids = [...chatSpeakers[ev]];
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) addEdge(ids[i], ids[j], 'messaged', 'medium', [ev]);
  }

  // Employment / role edges from assertions
  for (const c of store.claims.filter((c) => c.type === 'assertion')) {
    const m = c.sourceQuote.match(/([A-Z][a-z]+\s[A-Z][a-z]+),\s*my\s+(Head of Security|assistant|deputy|driver|attorney)/i);
    if (m && c.speakerEntityId) {
      const emp = personByName(store, m[1]);
      if (emp) addEdge(c.speakerEntityId, emp.entityId, `employs (${m[2]})`, 'strong', [c.evidenceId]);
    }
  }

  // Presence edges (person → location, most significant only)
  for (const c of store.claims.filter((c) => (c.type === 'observation' || c.type === 'telemetry') && c.subjectEntityId && c.locationEntityId)) {
    addEdge(c.subjectEntityId, c.locationEntityId, `present ${c.tISO ? c.tISO.slice(11, 16) : ''}`, 'medium', [c.evidenceId]);
  }
  // Vehicle edges
  for (const c of store.claims.filter((c) => c.vehicleEntityId && c.subjectEntityId)) {
    addEdge(c.subjectEntityId, c.vehicleEntityId, 'registered vehicle', 'medium', [c.evidenceId]);
  }
  // Co-location edges
  for (const l of store.coLocations || []) {
    if (l.aEntityId && l.bEntityId) addEdge(l.aEntityId, l.bEntityId, 'co-located', 'strong', l.evidenceIds);
  }
  // Contradiction edges
  for (const c of store.contradictions) {
    if (c.asserterEntityId && c.subjectEntityId && c.asserterEntityId !== c.subjectEntityId) {
      addEdge(c.asserterEntityId, c.subjectEntityId, 'false alibi for', 'strong', c.evidence);
    }
  }

  // Cap total edges — the strongest story wins the screen.
  const strengthRank = { strong: 0, medium: 1, weak: 2 };
  edges.sort((a, b) => (strengthRank[a.strength] ?? 2) - (strengthRank[b.strength] ?? 2));
  edges.length = Math.min(edges.length, 48);

  // Deterministic radial layout — no LLM-invented coordinates.
  const people = nodes.filter((n) => ['person', 'suspect', 'victim'].includes(n.type));
  const others = nodes.filter((n) => !['person', 'suspect', 'victim'].includes(n.type));
  people.forEach((n, i) => {
    const angle = (2 * Math.PI * i) / Math.max(people.length, 1) - Math.PI / 2;
    n.x = Math.round(420 + 190 * Math.cos(angle));
    n.y = Math.round(300 + 190 * Math.sin(angle));
  });
  others.forEach((n, i) => {
    const angle = (2 * Math.PI * i) / Math.max(others.length, 1) - Math.PI / 2 + 0.35;
    n.x = Math.round(420 + 360 * Math.cos(angle));
    n.y = Math.round(300 + 260 * Math.sin(angle));
  });

  store.relationships = { nodes, edges };
  bus.emit('CORRELATE', `Graph: ${nodes.length} nodes, ${edges.length} evidence-cited edges`);
  return store.relationships;
}

// ── helpers ────────────────────────────────────────────────────────
function entityName(store, id) {
  const e = store.entities.find((x) => x.entityId === id);
  return e ? e.canonical : null;
}
function locationsMatch(a, b) {
  if (!a || !b) return false;
  const na = norm(a); const nb = norm(b);
  if (na === nb) return true;
  const tokens = (s) => new Set(s.split(/[\s,/]+/).filter((w) => w.length > 3 && !['level', 'route', 'mile', 'marker', 'underground', 'campus', 'district', 'corridor'].includes(w)));
  const ta = tokens(na); const tb = tokens(nb);
  let shared = 0;
  for (const t of ta) if (tb.has(t)) shared++;
  // "Route 9, Mile Marker 12" vs "Route 9 / Mile Marker 12" ; "Nexus BioTech Underground Parking" vs "Nexus BioTech Campus"
  if (/route 9/.test(na) && /route 9/.test(nb)) return true;
  return shared >= 1 && (ta.size <= 2 || tb.size <= 2 || shared >= 2);
}
function anchorDateOf(store) {
  const dates = {};
  for (const c of store.claims) {
    if (c.tISO && c.tISO.length >= 10) {
      const day = c.tISO.slice(0, 10);
      dates[day] = (dates[day] || 0) + 1;
    }
  }
  const sorted = Object.entries(dates).sort((a, b) => b[1] - a[1]);
  const realDate = sorted.find(([day]) => day !== '2026-01-01');
  return realDate ? realDate[0] : (sorted[0] ? sorted[0][0] : '2026-01-01');
}
function truncate(s, n) { return s.length > n ? s.slice(0, n - 1) + '…' : s; }

module.exports = { buildTimeline, detectContradictions, detectCoLocations, buildGraph, entityName, locationsMatch };
