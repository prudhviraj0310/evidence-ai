# EVIDENCE — AI Crime Intelligence · The Verdict Engine

> Every AI evidence tool summarizes files. **EVIDENCE solves the case** — it names the prime
> suspect with a clickable, citation-backed chain of deduction… **or refuses to accuse anyone**
> and tells you exactly what evidence would resolve the case.

Built for a hackathon. React 19 + Vite frontend, Express + Google Gemini backend, and a
**deterministic reasoning core** that works with zero network access.

## The core inversion

**The LLM extracts and enriches; deterministic JavaScript does the accusing.**

An LLM that free-associates a suspect's name is a demo. A scoring engine whose every point can
be clicked through to the exact evidence line is a forensic tool. Same evidence in, same verdict
out — every time, even with the Wi-Fi off.

## What it does

| Stage | How |
|---|---|
| **Ingest** | Grammar parsers machine-read chat logs, CCTV transcripts, GPS telemetry, cellular records, financial records and interviews into typed, timestamped *claims* (observation / assertion / telemetry / communication). Parsers cannot hallucinate and work offline. Gemini enriches summaries in the background. |
| **Resolve** | Entity resolution merges "Thorne", "Marcus Thorne" and "the CEO" into one canonical person. Unnamed actors ("SUV driver") become provisional identities; merges are displayed as inferences with confidence, never silent joins. |
| **Correlate** | Pure JS over the claim ledger: chronological timeline (real date math), cross-source co-location triangulation, alibi windows tested against physical records, claim-vs-record diffs (catches a suspect calling stolen *financial records* "stolen blueprints"). |
| **Verdict** | Means / Motive / Opportunity / Deception scoring over the entity graph. Conspiracy detection (orchestrator + executor). Calibrated confidence. **Hard honesty gates**: weak score, thin margin, or single-source accusations → `INSUFFICIENT_EVIDENCE`, with the specific missing artifact and its projected confidence impact. A "Defense Counsel" pass attacks the engine's own accusation and calibrates confidence *down*. |
| **Interrogate** | Ask the case anything. Answers cite `EV-xxx` chips that deep-link to the highlighted source line. Falls back to deterministic retrieval over the claim ledger when offline. |

## Quickstart

```bash
# 1. Backend  (optional: put GEMINI_API_KEY=... in server/.env for live AI enrichment)
cd server && npm install && node index.js     # → http://localhost:3001

# 2. Frontend
npm install && npx vite                       # → http://localhost:5173
```

No API key? Everything still works — the deterministic engine is the product; the LLM is garnish.

## The 90-second demo

Demo evidence lives in `demo_evidence/` (a corporate-espionage disappearance case):

1. Upload `EV-001` … `EV-004` (chat log, CCTV, interview, GPS) → **SOLVE CASE**
2. The engine **refuses to accuse**: `INSUFFICIENT EVIDENCE` — *"Julianne Reed's phone records
   would resolve this (+22% confidence)"*
3. Upload `EV-005_PHONE_RECORDS.txt` → **SOLVE CASE**
4. **MARCUS THORNE — ORCHESTRATOR — 83%**, with Reed as executor, the victim established,
   a witness cleared, and an 18-step reasoning chain where every claim is one click from
   the source line that proved it
5. Kill the server, restart, refresh — the case survives (`server/data/case.json`)

## Validated on a published benchmark

`benchmark_case/` contains artifacts distilled from the **IEEE VAST Challenge 2021
"Kronos Incident"** ([official data](https://github.com/vast-challenge/2021-sample-data)):
1,176 real corporate email records and 1,491 credit-card transactions. The engine flags the
documented anomaly (a 10,000 charge at Frydos Autosupply, ~380× the median transaction),
honestly reports the case as unresolved, and asks for card-to-employee attribution — the same
question the published challenge asks. Regenerate with `node server/tools/convert-vast.js`.

## Regression-tested honesty

```bash
cd server && node test/golden.test.js
```

24 assertions, fully offline: stage 1 must refuse to accuse and name the missing evidence;
stage 2 must identify Thorne/Reed/Vance with ≥80% confidence and a fully-cited chain;
stage 3 must flag the VAST benchmark anomaly. *"Sometimes it can't find the culprit" is not
a vibe here — it's a CI failure.*

## Architecture

```
server/
  config.js            # model, scoring weights, honesty gates — no magic literals
  lib/
    llm.js             # ONE Gemini entry point: task-typed, schema-enforced JSON,
                       #   rate-limit queue, retry w/ retryDelay, content-hash cache,
                       #   honest {ok:false} degradation — never fabricates
    parsers.js         # deterministic grammars: chat/cctv/gps/phone/financial/interview
    entities.js        # canonical registry, alias + provisional-identity resolution
    correlate.js       # timeline, co-location, alibi testing, contradiction detection
    verdict.js         # MMO+D scoring, conspiracy detection, calibrated confidence,
                       #   INSUFFICIENT_EVIDENCE gates, defense-counsel objections
    chat.js            # cited Q&A w/ deterministic retrieval fallback
    store.js           # disk persistence — survives a crash mid-demo
    bus.js             # SSE bus → live reasoning console in the UI
  test/golden.test.js  # the honesty regression
  tools/convert-vast.js
src/
  pages/Verdict.jsx    # the hero: suspect card, MMO bars, citation chain, honest-refusal state
  pages/Interrogate.jsx
  components/EvidenceDrawer.jsx   # citation chips → highlighted source line
  ...                  # dashboard, upload (folder-drop aware), timeline, contradictions, graph
```

## Honesty guarantees

- No fabricated fallbacks: if the AI is unavailable the response says so — it never invents people
- Every artifact carries provenance (`live` / `cache` / `deterministic`)
- Confidence is calibrated **down** by the engine's own objections
- Scoring weights and gates are config, shown in the UI, defensible to a judge
