// Central configuration — no magic literals anywhere else.
module.exports = {
  PORT: process.env.PORT || 3001,
  MODEL: 'gemini-2.5-flash',

  // live   → always call Gemini (fail → honest degradation, never fabrication)
  // replay → never call Gemini; deterministic parsers + cached real outputs only
  // auto   → try live, degrade to deterministic/cache transparently
  MODE: process.env.EVIDENCE_MODE || 'auto',

  LLM: {
    TEMPERATURE_EXTRACT: 0.15,
    TEMPERATURE_NARRATIVE: 0.4,
    MAX_OUTPUT_TOKENS: 8192,
    TIMEOUT_MS: 60000,
    MAX_RETRIES: 3,
    MIN_INTERVAL_MS: 6500, // ~9 rpm, under the 10 RPM free tier
  },

  // Verdict engine rubric — shown in the UI, defended to judges.
  WEIGHTS: {
    OPPORTUNITY_MAX: 35,
    MEANS_MAX: 25,
    MOTIVE_MAX: 30,
    DECEPTION_MAX: 10,
  },

  // Honesty gates: below these the engine refuses to accuse.
  GATES: {
    MIN_TOP_SCORE: 50,      // /100 — weaker than this = no accusation
    MIN_MARGIN: 12,         // top1 - next-outsider closer than this = too ambiguous
    MIN_EVIDENCE_SOURCES: 2 // an accusation must rest on 2+ independent files
  },
};
