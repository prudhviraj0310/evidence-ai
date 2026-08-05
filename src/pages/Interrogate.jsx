import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Send, Loader, Sparkles } from 'lucide-react';
import { useCase } from '../context/CaseContext';

const SUGGESTED = [
  'Who committed the crime?',
  'Why not Julianne Reed?',
  'What breaks the alibi?',
  'What evidence is still missing?',
];

export default function Interrogate() {
  const { chat, askQuestion, loading, evidence, openEvidence } = useCase();
  const [input, setInput] = useState('');
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chat, loading.ask]);

  const send = async (q) => {
    const question = (q || input).trim();
    if (!question || loading.ask) return;
    setInput('');
    try { await askQuestion(question); } catch { /* error already in state */ }
  };

  return (
    <div style={{ padding: 28, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 72px)' }}>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, color: 'white', marginBottom: 6 }}>
          Interrogate <span style={{ color: '#818cf8' }}>the Case</span>
        </h2>
        <p style={{ fontSize: 14, color: '#6b7280' }}>Ask anything — the engine only asserts what it can cite. Click a citation to see the source line.</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', borderRadius: 18, padding: 20, background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 14 }}>
        {chat.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <MessageSquare size={36} color="#374151" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: 13, color: '#6b7280' }}>
              {evidence.length === 0 ? 'Load a case first, then ask away.' : 'Try one of the suggested questions below.'}
            </p>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {chat.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '78%' }}>
              <div style={{
                padding: '12px 16px', borderRadius: 16,
                background: m.role === 'user' ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                border: m.role === 'user' ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.07)',
              }}>
                <p style={{ fontSize: 14, color: '#e5e7eb', lineHeight: 1.65 }}>{m.text || m.answer}</p>
                {m.role === 'engine' && m.supported === false && (
                  <p style={{ fontSize: 12, color: '#fbbf24', marginTop: 8 }}>⚠ Not supported by the case file{m.missingEvidence ? ` — would need: ${m.missingEvidence}` : ''}</p>
                )}
                {m.role === 'engine' && m.citations?.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                    {m.citations.filter((c) => c.evidenceId).map((c, j) => (
                      <button key={j} onClick={() => openEvidence(c.evidenceId, c.quote)}
                        title={c.quote}
                        style={{ fontSize: 10, fontFamily: 'monospace', padding: '3px 8px', borderRadius: 6, color: '#a5b4fc', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', cursor: 'pointer' }}>
                        {c.evidenceId}
                      </button>
                    ))}
                  </div>
                )}
                {m.role === 'engine' && m.provenance && (
                  <p style={{ fontSize: 9, color: '#4b5563', marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.15em' }}>{m.provenance}</p>
                )}
              </div>
            </motion.div>
          ))}
          {loading.ask && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#818cf8', fontSize: 13 }}>
              <Loader size={14} className="animate-spin" /> Consulting the case file…
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {SUGGESTED.map((q) => (
          <button key={q} onClick={() => send(q)} disabled={loading.ask || evidence.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '7px 14px', borderRadius: 999, color: '#c7d2fe', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', cursor: 'pointer', opacity: evidence.length === 0 ? 0.4 : 1 }}>
            <Sparkles size={11} /> {q}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder={evidence.length === 0 ? 'Load a case first…' : 'Ask the case anything…'}
          disabled={evidence.length === 0}
          style={{ flex: 1, padding: '14px 18px', borderRadius: 14, fontSize: 14, color: 'white', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', outline: 'none' }} />
        <button onClick={() => send()} disabled={loading.ask || !input.trim()}
          style={{ padding: '0 22px', borderRadius: 14, background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none', cursor: 'pointer', opacity: (!input.trim() || loading.ask) ? 0.4 : 1 }}>
          <Send size={17} color="white" />
        </button>
      </div>
    </div>
  );
}
