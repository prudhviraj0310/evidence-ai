// AI Provider Interface — abstracts SageMaker / Gemini / mock AI.
// Strict structured-output contract. Malformed output is rejected.
// If AI is unavailable, deterministic processing continues.

/**
 * @interface AIProvider
 * @method extract(text, schema) → { ok, data, source, latencyMs }
 * @method isAvailable() → boolean
 * @method getName() → string
 */
class AIProvider {
  async extract(task, parts, schema, options) { throw new Error('Not implemented'); }
  isAvailable() { return false; }
  getName() { return 'none'; }
}

// Validate AI response against expected schema shape
function validateAIResponse(data, schema) {
  if (!data || typeof data !== 'object') return { valid: false, error: 'Response is not an object' };
  if (!schema || !schema.required) return { valid: true };
  for (const field of schema.required) {
    if (!(field in data)) return { valid: false, error: `Missing required field: ${field}` };
  }
  return { valid: true };
}

// The contract: AI response must match this shape for extraction tasks
const EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    claims: { type: 'array' },
    entities: { type: 'array' },
    locations: { type: 'array' },
    timestamps: { type: 'array' },
    relationships: { type: 'array' },
    summary: { type: 'string' },
    uncertainties: { type: 'array' },
  },
  required: ['claims', 'entities', 'summary'],
};

module.exports = { AIProvider, validateAIResponse, EXTRACTION_SCHEMA };
