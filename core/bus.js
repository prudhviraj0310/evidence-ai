// Core event bus — lightweight pub/sub for pipeline stage events.
// Infrastructure layer (SSE, WebSocket, etc.) subscribes to this;
// the core engine only depends on this interface.
const listeners = new Set();

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit(stage, message, extra = {}) {
  const event = { stage, message, ts: Date.now(), ...extra };
  for (const fn of listeners) {
    try { fn(event); } catch { /* listener errors are non-fatal */ }
  }
  console.log(`  [${stage}] ${message}`);
  return event;
}

// SSE-specific subscriber (for Express responses) — used by the server layer
function subscribeSSE(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(': connected\n\n');
  const handler = (event) => {
    try { res.write(`data: ${JSON.stringify(event)}\n\n`); } catch { listeners.delete(handler); }
  };
  listeners.add(handler);
  res.on('close', () => listeners.delete(handler));
}

module.exports = { subscribe, emit, subscribeSSE };
