// API client — proxied through Vite in dev ('/api' → localhost:3001), so
// the app also works from a phone/tunnel/deployed host.
const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

async function request(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 120000);
  try {
    const response = await fetch(`${API_BASE}${path}`, { ...options, signal: controller.signal });
    let body = null;
    try { body = await response.json(); } catch { /* non-JSON error */ }
    if (!response.ok) {
      throw new Error(body?.error || `Request failed (${response.status})`);
    }
    return body;
  } finally {
    clearTimeout(timer);
  }
}

export async function analyzeEvidence(file, ocrText = '') {
  const formData = new FormData();
  formData.append('file', file);
  if (ocrText) formData.append('ocrText', ocrText);
  formData.append('fileName', file.name);
  formData.append('fileType', file.type);
  return request('/analyze', { method: 'POST', body: formData });
}

export async function analyzeText(text, fileName = 'Text Note') {
  return request('/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ocrText: text, fileName, fileType: 'text/plain' }),
  });
}

export const solveCase = () => request('/solve', { method: 'POST', timeoutMs: 300000 });
export const askCase = (question) => request('/ask', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ question }),
});
export const loadDemo = (opts = {}) => request('/demo', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(opts),
  timeoutMs: 300000,
});
export const getEvidenceRaw = (evidenceId) => request(`/evidence/${evidenceId}/raw`);
export const getHealth = () => request('/health', { timeoutMs: 5000 });

export const generateTimeline = () => request('/timeline', { method: 'POST' });
export const detectContradictions = () => request('/contradictions', { method: 'POST' });
export const generateRelationships = () => request('/relationships', { method: 'POST' });
export const generateSummary = () => request('/summary', { method: 'POST', timeoutMs: 300000 });
export const getCaseState = () => request('/case');
export const resetCase = () => request('/reset', { method: 'POST' });

export function openStream(onEvent) {
  const es = new EventSource(`${API_BASE}/stream`);
  es.onmessage = (e) => {
    try { onEvent(JSON.parse(e.data)); } catch { /* ignore malformed */ }
  };
  return es;
}
