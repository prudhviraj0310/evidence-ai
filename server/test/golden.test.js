// Golden-case regression: the full pipeline over the bundled demo evidence
// MUST name Marcus Thorne as orchestrator, Julianne Reed as executor and
// Elias Vance as victim — and MUST refuse to accuse before the phone
// records arrive. Run: npm run test:golden  (works fully offline)
process.env.EVIDENCE_MODE = 'replay'; // never touch the network in tests

const fs = require('fs');
const path = require('path');

// Isolate the test from any real case on disk
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB = path.join(DATA_DIR, 'case.json');
const BACKUP = path.join(DATA_DIR, 'case.backup.json');
if (fs.existsSync(DB)) fs.renameSync(DB, BACKUP);

const store = require('../lib/store');
const { ingestText, solveCase } = require('../index');

const DEMO = path.join(__dirname, '..', '..', 'demo_evidence');
let failures = 0;
function assert(cond, label) {
  if (cond) console.log(`  ✅ ${label}`);
  else { console.error(`  ❌ ${label}`); failures++; }
}

(async () => {
  try {
    store.reset();
    console.log('\n━━ Stage 1: four original files — must be honest about insufficiency ━━');
    for (const f of ['EV-001_CHATLOG.txt', 'EV-002_CCTV.txt', 'EV-003_INTERVIEW.txt', 'EV-004_GPS.txt']) {
      await ingestText(f, fs.readFileSync(path.join(DEMO, f), 'utf8'));
    }
    let cs = await solveCase();
    assert(cs.verdict.status === 'INSUFFICIENT_EVIDENCE', `Stage 1 verdict is INSUFFICIENT_EVIDENCE (got ${cs.verdict.status})`);
    assert(cs.verdict.unresolvedQuestions.length > 0, `Stage 1 names what would resolve the case (${cs.verdict.unresolvedQuestions.length} question(s))`);
    assert(cs.verdict.unresolvedQuestions.some((q) => /reed|phone|cellular|tower/i.test(q.question + q.wouldBeResolvedBy)),
      'Stage 1 specifically asks for Reed\'s phone records');
    assert(cs.contradictions.length >= 1, `Stage 1 already detects contradictions (${cs.contradictions.length})`);

    console.log('\n━━ Stage 2: EV-005 phone records arrive — the verdict must flip ━━');
    await ingestText('EV-005_PHONE_RECORDS.txt', fs.readFileSync(path.join(DEMO, 'EV-005_PHONE_RECORDS.txt'), 'utf8'));
    cs = await solveCase();
    const v = cs.verdict;

    assert(v.status === 'IDENTIFIED', `Verdict status IDENTIFIED (got ${v.status})`);
    assert(v.primeSuspect?.name === 'Marcus Thorne', `Prime suspect is Marcus Thorne (got ${v.primeSuspect?.name})`);
    assert(v.primeSuspect?.role === 'ORCHESTRATOR', `Thorne's role is ORCHESTRATOR (got ${v.primeSuspect?.role})`);
    assert(v.coConspirators.some((c) => c.name === 'Julianne Reed'), `Julianne Reed is a co-conspirator (got ${v.coConspirators.map((c) => c.name).join(', ') || 'none'})`);
    assert(v.coConspirators.find((c) => c.name === 'Julianne Reed')?.role === 'EXECUTOR', 'Reed\'s role is EXECUTOR');
    assert(v.victim?.name === 'Elias Vance', `Victim is Elias Vance (got ${v.victim?.name})`);
    assert(v.confidence >= 0.8, `Confidence ≥ 80% (got ${Math.round(v.confidence * 100)}%)`);
    assert(v.cleared.some((c) => c.name === 'Sarah Lin'), `Sarah Lin is cleared (cleared: ${v.cleared.map((c) => c.name).join(', ') || 'none'})`);
    assert(cs.contradictions.some((c) => c.kind === 'alibi_broken' && c.severity === 'critical'), 'A critical broken alibi is detected');
    assert(cs.contradictions.some((c) => c.kind === 'motive_reframe'), 'The ledger-vs-blueprints motive reframe is detected');
    assert(v.reasoningChain.length >= 5, `Reasoning chain has ≥5 steps (${v.reasoningChain.length})`);
    assert(v.reasoningChain.every((s) => s.evidenceIds.length > 0 || s.kind === 'conclusion'), 'Every reasoning step carries evidence citations');
    assert(cs.relationships.nodes.length >= 5 && cs.relationships.edges.length >= 4, `Graph is populated (${cs.relationships.nodes.length} nodes, ${cs.relationships.edges.length} edges)`);
    assert(cs.timeline.length >= 15, `Timeline reconstructed (${cs.timeline.length} events)`);
    const order = cs.timeline.map((t) => new Date(t.tISO).getTime());
    assert(order.every((t, i) => i === 0 || t >= order[i - 1]), 'Timeline is strictly chronological (01:12 sorts AFTER 22:06)');

    // ── Stage 3: IEEE VAST benchmark — the engine must flag the documented
    // anomaly and stay honest about attribution ──
    const BENCH = path.join(__dirname, '..', '..', 'benchmark_case');
    if (fs.existsSync(BENCH)) {
      console.log('\n━━ Stage 3: IEEE VAST Challenge benchmark (Kronos Incident) ━━');
      store.reset();
      for (const f of fs.readdirSync(BENCH).filter((x) => x.endsWith('.txt')).sort()) {
        await ingestText(f, fs.readFileSync(path.join(BENCH, f), 'utf8'));
      }
      const bc = await solveCase();
      assert(bc.entities.some((e) => e.canonical === 'Loreto Bodrogi'), 'Security-clique member Loreto Bodrogi resolved from real VAST emails');
      assert(bc.claims.some((c) => /ANOMALOUS/.test(c.sourceQuote) && /Frydos/.test(c.sourceQuote)), 'The documented 10,000 Frydos Autosupply anomaly is flagged');
      assert(bc.verdict.status === 'INSUFFICIENT_EVIDENCE', `Benchmark verdict is honestly INSUFFICIENT (got ${bc.verdict.status})`);
      assert(bc.verdict.unresolvedQuestions.some((q) => /card/i.test(q.question + q.wouldBeResolvedBy)), 'Engine asks for card-to-employee attribution — the published MC2 question');
      assert(bc.timeline.length >= 50, `Benchmark timeline reconstructed (${bc.timeline.length} events)`);
    }

    console.log(failures === 0 ? '\n🏆 GOLDEN CASE PASSES — the engine solves it, honestly, offline.\n' : `\n💥 ${failures} assertion(s) failed\n`);
  } catch (e) {
    console.error('Test crashed:', e);
    failures++;
  } finally {
    store.reset();
    if (fs.existsSync(BACKUP)) { if (fs.existsSync(DB)) fs.unlinkSync(DB); fs.renameSync(BACKUP, DB); }
    process.exit(failures === 0 ? 0 : 1);
  }
})();
