import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Send, Loader, Sparkles, Mic, Disc, Tag, ShieldCheck } from 'lucide-react';
import { useCase } from '../context/CaseContext';

const SUGGESTED = [
  'Who committed the crime?',
  'Why not Julianne Reed?',
  'What breaks the alibi?',
  'What evidence is still missing?',
];

export default function Interrogate({ onNavigate }) {
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
    <div style={{ padding: '24px 32px', maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 72px)' }}>
      
      {/* Header with tape recorder HUD */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 18,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div className="cctv-live-dot" />
            <span style={{
              fontSize: 10, fontWeight: 800,
              fontFamily: "'JetBrains Mono', monospace",
              color: '#C5A66A', letterSpacing: '0.15em',
            }}>
              SECTION V // VERBATIM INTERROGATION CHAMBER
            </span>
          </div>
          <h2 style={{
            fontSize: 28, fontWeight: 800,
            fontFamily: "'IBM Plex Serif', Georgia, serif",
            color: '#FFF8E9', letterSpacing: '-0.01em',
          }}>
            Cross-Examine <span style={{ color: '#C5A66A' }}>the Case File</span>
          </h2>
          <p style={{
            fontSize: 12, color: '#A89278',
            fontFamily: "'IBM Plex Serif', serif", fontStyle: 'italic',
          }}>
            Every claim is cross-referenced with primary evidence tags. Unsubstantiated theories are explicitly rejected.
          </p>
        </div>

        {/* Reel to reel tape recorder status */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '6px 14px', borderRadius: 2,
          background: 'rgba(15, 8, 4, 0.6)',
          border: '1px solid #7A5135',
        }}>
          <Disc size={16} color="#B08A52" className={loading.ask ? 'animate-spin' : ''} />
          <span style={{
            fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 800, color: '#FFF8E9', letterSpacing: '0.12em',
          }}>
            TAPE REEL #09 // 192kbps
          </span>
        </div>
      </div>

      {/* Transcript Log Board */}
      <div style={{
        flex: 1, overflowY: 'auto',
        borderRadius: 4, padding: 22,
        background: 'rgba(15, 8, 4, 0.45)',
        border: '1px solid #7A5135',
        boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)',
        marginBottom: 16,
      }}>
        {chat.length === 0 && (
          <div style={{ textAlign: 'center', padding: '70px 0' }}>
            <div style={{
              width: 50, height: 50, borderRadius: 2,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px',
              background: '#2A180E', border: '1px solid #7A5135',
            }}>
              <MessageSquare size={24} color="#C5A66A" />
            </div>
            <h3 style={{
              fontSize: 18, fontWeight: 800,
              fontFamily: "'IBM Plex Serif', serif",
              color: '#FFF8E9', marginBottom: 4,
            }}>
              Interrogation Transcript Ready
            </h3>
            <p style={{
              fontSize: 13, color: '#A89278',
              fontFamily: "'IBM Plex Serif', serif", fontStyle: 'italic',
            }}>
              {evidence.length === 0 ? 'Ingest evidence into the case file first, then question the dossier.' : 'Select a suggested inquiry below or interrogate the engine directly.'}
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {chat.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '82%',
              }}
            >
              <div style={{
                padding: '14px 18px',
                borderRadius: 2,
                background: m.role === 'user'
                  ? 'linear-gradient(135deg, #3A2418 0%, #251710 100%)'
                  : '#F4ECD8',
                border: m.role === 'user'
                  ? '1px solid #B08A52'
                  : '1px solid #D8C8AC',
                color: m.role === 'user' ? '#FFF8E9' : '#1A140E',
                boxShadow: '2px 3px 10px rgba(0,0,0,0.3)',
                position: 'relative',
              }}>
                {/* Speaker Header */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: 6,
                }}>
                  <span style={{
                    fontSize: 9, fontWeight: 800,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: m.role === 'user' ? '#C5A66A' : '#7A5135',
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                  }}>
                    {m.role === 'user' ? 'LEAD INVESTIGATOR' : 'CASE FILE ENGINE (VERBATIM)'}
                  </span>
                </div>

                <p style={{
                  fontSize: 14,
                  fontFamily: "'IBM Plex Serif', serif",
                  lineHeight: 1.6,
                }}>
                  {m.text || m.answer}
                </p>

                {m.role === 'engine' && m.supported === false && (
                  <div style={{
                    marginTop: 8, padding: '6px 10px', borderRadius: 2,
                    background: 'rgba(185, 121, 46, 0.15)', border: '1px solid #B9792E',
                    fontSize: 11, color: '#7A5135',
                    fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
                  }}>
                    ⚠ NOT SUPPORTED BY THE CASE DOSSIER{m.missingEvidence ? ` — Would require: ${m.missingEvidence}` : ''}
                  </div>
                )}

                {/* Citations Tag Buttons */}
                {m.role === 'engine' && m.citations?.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10, paddingTop: 8, borderTop: '1px dashed #D8C8AC' }}>
                    {m.citations.filter((c) => c.evidenceId).map((c, j) => (
                      <button
                        key={j}
                        onClick={() => openEvidence(c.evidenceId, c.quote)}
                        title={c.quote}
                        style={{
                          fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: 800, padding: '2px 6px', borderRadius: 2,
                          color: '#4C7657', background: 'rgba(76, 118, 87, 0.12)',
                          border: '1px solid #4C7657', cursor: 'pointer',
                        }}
                      >
                        TAG #{c.evidenceId}
                      </button>
                    ))}
                  </div>
                )}

                {m.role === 'engine' && m.provenance && (
                  <p style={{
                    fontSize: 8, color: '#7A624E', marginTop: 6,
                    fontFamily: "'JetBrains Mono', monospace",
                    textTransform: 'uppercase', letterSpacing: '0.12em',
                  }}>
                    PROVENANCE: {m.provenance}
                  </p>
                )}
              </div>
            </motion.div>
          ))}

          {loading.ask && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              color: '#C5A66A', fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              <Loader size={13} className="animate-spin" />
              CONSULTING TRANSCRIPTS & CROSS-REFERENCING EVIDENCE TAGS…
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      {/* Suggested Inquiries */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {SUGGESTED.map((q) => (
          <button
            key={q}
            onClick={() => send(q)}
            disabled={loading.ask || evidence.length === 0}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 11, padding: '6px 12px', borderRadius: 2,
              color: '#FFF8E9',
              background: 'rgba(176, 138, 82, 0.15)',
              border: '1px solid #B08A52',
              cursor: 'pointer',
              fontFamily: "'JetBrains Mono', monospace",
              opacity: evidence.length === 0 ? 0.4 : 1,
            }}
          >
            <Sparkles size={10} color="#C5A66A" /> {q}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div style={{ display: 'flex', gap: 10 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder={evidence.length === 0 ? 'Intake evidence into the case first…' : 'Type inquiry to interrogate case file…'}
          disabled={evidence.length === 0}
          style={{
            flex: 1, padding: '12px 16px', borderRadius: 2,
            fontSize: 13, color: '#FFF8E9',
            background: 'rgba(15, 8, 4, 0.7)',
            border: '1px solid #7A5135',
            outline: 'none',
            fontFamily: "'IBM Plex Serif', Georgia, serif",
          }}
          onFocus={(e) => { e.target.style.borderColor = '#C5A66A'; }}
          onBlur={(e) => { e.target.style.borderColor = '#7A5135'; }}
        />
        <button
          onClick={() => send()}
          disabled={loading.ask || !input.trim()}
          style={{
            padding: '0 20px', borderRadius: 2,
            background: 'linear-gradient(135deg, #B08A52 0%, #7A5135 100%)',
            border: '1px solid #C5A66A',
            cursor: 'pointer',
            opacity: (!input.trim() || loading.ask) ? 0.4 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Send size={15} color="#FFF8E9" />
        </button>
      </div>
    </div>
  );
}
