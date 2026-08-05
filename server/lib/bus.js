// SSE event bus — the live reasoning console.
// Every pipeline stage emits here; the frontend subscribes to GET /api/stream.
const clients = new Set();

function subscribe(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(': connected\n\n');
  clients.add(res);
  res.on('close', () => clients.delete(res));
}

function emit(stage, message, extra = {}) {
  const event = { stage, message, ts: Date.now(), ...extra };
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const res of clients) {
    try { res.write(payload); } catch { clients.delete(res); }
  }
  console.log(`  [${stage}] ${message}`);
  return event;
}

module.exports = { subscribe, emit };
