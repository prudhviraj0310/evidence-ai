const API_BASE = 'http://localhost:3001/api';

export async function analyzeEvidence(file, ocrText = '') {
  const formData = new FormData();
  formData.append('file', file);
  if (ocrText) {
    formData.append('ocrText', ocrText);
  }
  formData.append('fileName', file.name);
  formData.append('fileType', file.type);
  formData.append('timestamp', new Date().toISOString());

  const response = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to analyze evidence');
  }

  return response.json();
}

export async function analyzeText(text, fileName = 'Text Note') {
  const response = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ocrText: text,
      fileName,
      fileType: 'text/plain',
      timestamp: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to analyze text');
  }

  return response.json();
}

export async function generateTimeline() {
  const response = await fetch(`${API_BASE}/timeline`, { method: 'POST' });
  if (!response.ok) throw new Error('Failed to generate timeline');
  return response.json();
}

export async function detectContradictions() {
  const response = await fetch(`${API_BASE}/contradictions`, { method: 'POST' });
  if (!response.ok) throw new Error('Failed to detect contradictions');
  return response.json();
}

export async function generateRelationships() {
  const response = await fetch(`${API_BASE}/relationships`, { method: 'POST' });
  if (!response.ok) throw new Error('Failed to generate relationships');
  return response.json();
}

export async function generateSummary() {
  const response = await fetch(`${API_BASE}/summary`, { method: 'POST' });
  if (!response.ok) throw new Error('Failed to generate summary');
  return response.json();
}

export async function getCaseState() {
  const response = await fetch(`${API_BASE}/case`);
  if (!response.ok) throw new Error('Failed to get case state');
  return response.json();
}

export async function resetCase() {
  const response = await fetch(`${API_BASE}/reset`, { method: 'POST' });
  if (!response.ok) throw new Error('Failed to reset case');
  return response.json();
}
