// "Interrogate the Case" — every answer cites evidence. Live mode uses
// Gemini grounded on the claim ledger with a hard no-uncited-claims rule;
// offline mode answers by deterministic retrieval over the same ledger.
const { callModel } = require('./llm');
const { entityName } = require('./correlate');
const { norm } = require('./entities');
const config = require('../config');

const ANSWER_SCHEMA = {
  type: 'object',
  properties: {
    answer: { type: 'string' },
    citations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          evidenceId: { type: 'string' },
          quote: { type: 'string' },
        },
        required: ['evidenceId', 'quote'],
      },
    },
    supported: { type: 'boolean' },
    missingEvidence: { type: 'string' },
  },
  required: ['answer', 'citations', 'supported'],
};

function caseDigest(store) {
  const lines = [];
  lines.push('ENTITIES: ' + store.entities.map((e) => `${e.entityId} ${e.canonical} (${e.kind}${e.provisional ? ', provisional' : ''})`).join('; '));
  lines.push('CLAIMS:');
  for (const c of store.claims) {
    lines.push(`[${c.claimId}|${c.evidenceId}|L${c.line}|${c.type}|${c.tISO || 'no-time'}] ${c.speakerMention || c.subjectMention || ''}: ${c.sourceQuote}`);
  }
  if (store.verdict) {
    lines.push('VERDICT: ' + JSON.stringify({
      status: store.verdict.status,
      primeSuspect: store.verdict.primeSuspect ? { name: store.verdict.primeSuspect.name, role: store.verdict.primeSuspect.role, total: store.verdict.primeSuspect.total, breakdown: store.verdict.primeSuspect.breakdown } : null,
      coConspirators: store.verdict.coConspirators.map((c) => c.name),
      victim: store.verdict.victim?.name,
      confidence: store.verdict.confidence,
    }));
    lines.push('CONTRADICTIONS: ' + store.contradictions.map((c) => `${c.id} ${c.title}: ${c.description}`).join(' | '));
  }
  return lines.join('\n').slice(0, 24000);
}

async function ask(store, question) {
  const digest = caseDigest(store);
  // The chat must FEEL instant on stage: race the LLM against a deadline
  // and fall back to deterministic retrieval over the same claim ledger.
  const deadline = new Promise((resolve) => setTimeout(() => resolve({ ok: false, timedOut: true }), 5000));
  const result = await Promise.race([deadline, callModel({
    task: 'INTERROGATE',
    parts: [
      `You are the EVIDENCE case interrogation engine. Answer the investigator's question using ONLY the case file below.
HARD RULES:
- Every factual claim in your answer MUST be supported by a citation into the case file (evidenceId + short exact quote).
- If the case file does not support an answer, set supported=false, say so plainly, and name what evidence would resolve it in missingEvidence.
- Never invent people, times, or places that are not in the case file.
- Be concise: 2-5 sentences.

CASE FILE:
${digest}

QUESTION: ${question}`,
    ],
    schema: ANSWER_SCHEMA,
    temperature: config.LLM.TEMPERATURE_NARRATIVE,
  })]);

  if (result.ok && result.data?.answer) {
    return { ...result.data, provenance: result.source };
  }
  return { ...retrievalAnswer(store, question), provenance: 'case-file retrieval' };
}

// Deterministic fallback: keyword retrieval over claims + verdict facts.
function retrievalAnswer(store, question) {
  const q = norm(question);
  const qTokens = q.split(/\s+/).filter((w) => w.length > 3);
  const v = store.verdict;

  // Verdict-shaped questions
  if (/who (did it|is the (culprit|suspect|killer)|committed)|committed the crime/i.test(question) && v && !v.primeSuspect) {
    return {
      answer: `The engine has not accused anyone yet — the evidence is insufficient (top score ${v.suspects?.[0]?.total ?? 0}/100, gate ${v.gates?.MIN_TOP_SCORE}). ` +
        (v.unresolvedQuestions?.[0] ? `What would resolve it: ${v.unresolvedQuestions[0].wouldBeResolvedBy} (${v.unresolvedQuestions[0].projectedImpact}).` : 'Add more evidence and re-run SOLVE.'),
      citations: [],
      supported: true,
    };
  }
  if (/who (did it|is the (culprit|suspect|killer)|committed)|committed the crime/i.test(question) && v?.primeSuspect) {
    return {
      answer: `The engine names ${v.primeSuspect.name} as ${v.primeSuspect.role.toLowerCase()} at ${Math.round(v.confidence * 100)}% confidence (${v.primeSuspect.total}/100 across means, motive, opportunity and deception)${v.coConspirators.length ? `, with ${v.coConspirators.map((c) => c.name).join(', ')} as ${v.coConspirators[0].role.toLowerCase()}` : ''}.`,
      citations: v.primeSuspect.contributions.slice(0, 3).map((c) => ({ evidenceId: c.evidenceIds[0] || '', quote: c.reason.slice(0, 90) })),
      supported: true,
    };
  }
  if (/why not|rule[d]? out|cleared/i.test(question) && v) {
    const name = v.cleared.find((c) => q.includes(norm(c.name).split(' ').pop()));
    const target = name || v.coConspirators.find((c) => q.includes(norm(c.name).split(' ').pop()));
    if (name) {
      return { answer: `${name.name} was ruled out: ${name.reason}.`, citations: [], supported: true };
    }
    if (target) {
      return {
        answer: `${target.name} is not the prime suspect but scores ${target.total}/100 as ${target.role.toLowerCase()} — placed at the scene, acting under coordination (${(target.links || []).map((l) => l.detail).join('; ')}).`,
        citations: (target.links || []).map((l) => ({ evidenceId: (l.evidenceIds || [])[0] || '', quote: l.detail.slice(0, 90) })),
        supported: true,
      };
    }
  }

  // Generic retrieval: best-matching claims
  const scored = store.claims.map((c) => {
    const text = norm(`${c.sourceQuote} ${c.subjectMention || ''} ${c.speakerMention || ''} ${c.locationMention || ''}`);
    let score = 0;
    for (const t of qTokens) if (text.includes(t)) score++;
    return { c, score };
  }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);

  if (!scored.length) {
    return {
      answer: 'The case file does not contain evidence that answers this question.',
      citations: [],
      supported: false,
      missingEvidence: 'No claims in the current evidence set match the question terms.',
    };
  }
  return {
    answer: 'From the case file: ' + scored.map(({ c }) =>
      `${c.speakerMention || c.subjectMention || 'Record'} — "${c.sourceQuote.slice(0, 100)}" [${c.evidenceId}${c.tISO ? ' · ' + c.tISO.slice(11, 16) : ''}]`).join(' '),
    citations: scored.map(({ c }) => ({ evidenceId: c.evidenceId, quote: c.sourceQuote.slice(0, 110) })),
    supported: true,
  };
}

module.exports = { ask };
