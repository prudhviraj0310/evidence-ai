// Canonical entity resolution — the structural fix for "can't identify
// the culprit". "Thorne", "Marcus Thorne" and "the CEO" become ONE person,
// so suspicion can finally accumulate across evidence files.
// Deterministic tiers first; the LLM is only consulted for the residue.
const { nextId } = require('./util');
const { NAME_STOP } = require('./parsers');
const bus = require('./bus');

const HONORIFIC_RE = /^(mr|mrs|ms|dr|det|detective|officer|prof)\.?\s+/i;

function norm(name) {
  return String(name || '').replace(HONORIFIC_RE, '').replace(/[^\w\s+-]/g, '').trim().toLowerCase();
}

function lastToken(name) {
  const parts = norm(name).split(/\s+/);
  return parts[parts.length - 1];
}

/**
 * Registry entry:
 * { entityId, kind: 'person'|'phone'|'vehicle'|'location'|'device',
 *   canonical, aliases[], provisional, mentions:[{evidenceId, line, text}], notes }
 */
function findMatch(registry, mention, kind) {
  const n = norm(mention);
  if (!n) return null;
  for (const e of registry) {
    if (e.kind !== kind) continue;
    const names = [e.canonical, ...e.aliases].map(norm);
    // Tier 1: exact normalized match
    if (names.includes(n)) return { entity: e, tier: 'exact' };
    // Tier 2: surname / single-token containment ("Thorne" ⊂ "Marcus Thorne")
    if (kind === 'person') {
      const nTokens = n.split(/\s+/);
      for (const full of names) {
        const fTokens = full.split(/\s+/);
        if (nTokens.length === 1 && fTokens.includes(nTokens[0]) && nTokens[0].length > 2) {
          return { entity: e, tier: 'surname' };
        }
        if (fTokens.length === 1 && nTokens.includes(fTokens[0]) && fTokens[0].length > 2) {
          return { entity: e, tier: 'surname' };
        }
      }
    }
    // Phones / plates: digit-only comparison
    if (kind === 'phone' || kind === 'vehicle') {
      const digits = (s) => s.replace(/\D/g, '');
      if (digits(n).length >= 7 && names.some((x) => digits(x) === digits(n))) {
        return { entity: e, tier: 'canonical-id' };
      }
    }
  }
  return null;
}

function registerMention(store, mentionText, kind, evidenceId, line, opts = {}) {
  const registry = store.entities;
  if (!mentionText || norm(mentionText).length < 2) return null;

  const match = findMatch(registry, mentionText, kind);
  if (match) {
    const e = match.entity;
    const nMention = norm(mentionText);
    if (![e.canonical, ...e.aliases].map(norm).includes(nMention)) {
      e.aliases.push(mentionText);
      // Longest name wins as canonical (Marcus Thorne over Thorne)
      if (kind === 'person' && mentionText.split(/\s+/).length > e.canonical.split(/\s+/).length) {
        const old = e.canonical;
        e.canonical = mentionText;
        if (!e.aliases.includes(old)) e.aliases.push(old);
      }
      if (match.tier !== 'exact') {
        const ev = {
          type: 'alias-merge', entityId: e.entityId,
          message: `Resolved "${mentionText}" (${evidenceId}) → ${e.canonical} [${match.tier} match]`,
          evidenceId, confidence: match.tier === 'exact' ? 0.99 : 0.92,
        };
        store.mergeEvents.push(ev);
        bus.emit('RESOLVE', ev.message);
      }
    }
    e.mentions.push({ evidenceId, line, text: mentionText });
    return e;
  }

  // New person entities require a plausible full name: single tokens can
  // ATTACH to existing entities (surname tier above) but never create one,
  // and no token may be a structural stopword. Kills phantom suspects.
  if (kind === 'person' && !opts.provisional) {
    const tokens = mentionText.trim().split(/\s+/);
    if (tokens.length < 2) return null;
    if (tokens.some((t) => NAME_STOP.has(t.replace(/[^A-Za-z]/g, '')))) return null;
  }

  const entity = {
    entityId: nextId(kind === 'person' ? 'P' : kind === 'vehicle' ? 'V' : kind === 'phone' ? 'PH' : kind === 'location' ? 'L' : 'D'),
    kind,
    canonical: mentionText,
    aliases: [],
    provisional: !!opts.provisional,
    mentions: [{ evidenceId, line, text: mentionText }],
    notes: opts.notes || null,
  };
  registry.push(entity);
  return entity;
}

/**
 * Merge a provisional entity (e.g. "unidentified SUV driver") into a named
 * one — rendered in the UI as a displayable inference, never a silent join.
 */
function mergeEntities(store, fromId, intoId, reason, confidence, evidenceIds = []) {
  const registry = store.entities;
  const from = registry.find((e) => e.entityId === fromId);
  const into = registry.find((e) => e.entityId === intoId);
  if (!from || !into || from === into) return null;
  into.aliases.push(from.canonical, ...from.aliases);
  into.mentions.push(...from.mentions);
  store.entities = registry.filter((e) => e.entityId !== fromId);
  const ev = {
    type: 'identity-merge', entityId: into.entityId, mergedFrom: from.canonical,
    message: `IDENTIFIED: "${from.canonical}" → ${into.canonical} (${Math.round(confidence * 100)}%) — ${reason}`,
    confidence, evidenceIds, reason,
  };
  store.mergeEvents.push(ev);
  bus.emit('RESOLVE', ev.message);
  // Repoint claims that referenced the provisional entity
  for (const c of store.claims) {
    if (c.subjectEntityId === fromId) c.subjectEntityId = into.entityId;
    if (c.speakerEntityId === fromId) c.speakerEntityId = into.entityId;
  }
  return ev;
}

/**
 * Resolve all mention-level fields on claims into entity IDs, and register
 * harvested mentions. Runs incrementally after each upload.
 */
function resolveEvidence(store, evidenceId, parsed, rawText) {
  const before = store.entities.length;

  for (const p of parsed.mentions.persons) registerMention(store, p, 'person', evidenceId, 0);
  for (const ph of parsed.mentions.phones) registerMention(store, ph, 'phone', evidenceId, 0);
  for (const v of parsed.mentions.vehicles) registerMention(store, v, 'vehicle', evidenceId, 0);

  // Provisional identities are created FIRST so their claims can attach
  // during resolution below.
  createProvisionals(store, evidenceId);

  for (const c of store.claims.filter((c) => c.evidenceId === evidenceId)) {
    if (c.subjectMention) {
      const kind = /sedan|suv|vehicle|plate/i.test(c.subjectMention) ? 'vehicle'
        : /^card \d{4}$/i.test(c.subjectMention) ? 'device' : 'person';
      // GPS subjects like "ELIAS VANCE VEHICLE (QX7-992)" → the person AND the vehicle
      const vm = c.subjectMention.match(/^([A-Z][A-Za-z ]+?)\s+VEHICLE\s*\(([^)]+)\)/i);
      if (vm) {
        const person = registerMention(store, titleCaseName(vm[1]), 'person', evidenceId, c.line);
        const veh = registerMention(store, `Plate ${vm[2].toUpperCase()}`, 'vehicle', evidenceId, c.line);
        c.subjectEntityId = person?.entityId || null;
        c.vehicleEntityId = veh?.entityId || null;
      } else {
        const e = registerMention(store, c.subjectMention, kind, evidenceId, c.line);
        c.subjectEntityId = e?.entityId || null;
      }
    }
    if (c.speakerMention) {
      const e = registerMention(store, c.speakerMention, 'person', evidenceId, c.line);
      c.speakerEntityId = e?.entityId || null;
    }
    if (c.locationMention) {
      const e = registerMention(store, c.locationMention, 'location', evidenceId, c.line);
      c.locationEntityId = e?.entityId || null;
    }
    // Names inside observation text ("Elias Vance is seen exiting…")
    if (c.type === 'observation') {
      const inline = c.sourceQuote.match(/\b([A-Z][a-z]{2,}\s+[A-Z][a-z]{2,})\b/g) || [];
      for (const name of inline) {
        if (!/Camera|Level|East|West|Black|Silver|State|Route/i.test(name)) {
          const e = registerMention(store, name, 'person', evidenceId, c.line);
          if (!c.subjectEntityId && e) c.subjectEntityId = e.entityId;
        }
      }
    }
  }

  const added = store.entities.length - before;
  if (added > 0) bus.emit('RESOLVE', `${evidenceId}: registry now ${store.entities.length} entities (+${added})`);
  return store.entities;
}

// Provisional identities for unnamed actors seen in observations, plus
// resemblance-based identity merges (each merge is a displayed inference).
function createProvisionals(store, evidenceId) {
  const provisionalPatterns = [
    { re: /driver(?:'s)? (?:face|silhouette|body)[^.]*(?:obscured|does not match|unidentified)/i, name: 'Unidentified driver (departing vehicle)' },
    { re: /two (?:unidentified individuals|men|suited individuals)/i, name: 'Two unidentified individuals (dark suits)' },
  ];
  for (const c of store.claims.filter((c) => c.evidenceId === evidenceId && c.type === 'observation')) {
    for (const pat of provisionalPatterns) {
      if (pat.re.test(c.sourceQuote)) {
        const existing = store.entities.find((e) => e.canonical === pat.name);
        if (!existing) {
          registerMention(store, pat.name, 'person', evidenceId, c.line, { provisional: true, notes: c.sourceQuote });
          bus.emit('RESOLVE', `Provisional identity created: "${pat.name}" (${evidenceId} L${c.line})`);
        }
      }
    }
    // "Driver resembles Julianne Reed" → merge inference with stated confidence
    const rm = c.sourceQuote.match(/[Dd]river resembles\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/);
    if (rm) {
      const named = registerMention(store, rm[1], 'person', evidenceId, c.line);
      const suvDriver = registerMention(store, 'Black SUV driver', 'person', evidenceId, c.line, { provisional: true });
      if (named && suvDriver && named.entityId !== suvDriver.entityId) {
        mergeEntities(store, suvDriver.entityId, named.entityId,
          `visual identification on camera (${evidenceId} L${c.line})`, 0.75, [evidenceId]);
      }
    }
  }
}

function titleCaseName(s) {
  return s.trim().split(/\s+/).map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function personByName(store, name) {
  if (!name) return null;
  const m = findMatch(store.entities, name, 'person');
  return m ? m.entity : null;
}

module.exports = { resolveEvidence, registerMention, mergeEntities, personByName, norm };
