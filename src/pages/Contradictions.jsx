import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Link, Loader, Zap, Inbox, FileSearch, CheckCircle2 } from 'lucide-react';
import { useCase } from '../context/CaseContext';
import { ProcessingLoader } from '../components/ScanEffect';

export default function Contradictions({ onNavigate }) {
  const { contradictions, evidence, findContradictions, loading, openEvidence } = useCase();
  const [showReveal, setShowReveal] = useState(false);
  const [glitch, setGlitch] = useState(false);

  const handleDetect = async () => {
    try {
      await findContradictions();
      setGlitch(true);
      setTimeout(() => { setGlitch(false); setShowReveal(true); }, 300);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (showReveal) { const t = setTimeout(() => setShowReveal(false), 5000); return () => clearTimeout(t); }
  }, [showReveal]);

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1280, margin: '0 auto', position: 'relative' }}>

      {/* Cinematic Contradiction Reveal Banner */}
      <AnimatePresence>
        {showReveal && contradictions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(20, 8, 4, 0.92)', backdropFilter: 'blur(10px)',
            }}
          >
            <div style={{
              background: '#F4ECD8', borderRadius: 4, padding: '40px 48px',
              maxWidth: 780, border: '4px solid #8B2E2E',
              boxShadow: '0 16px 50px rgba(0,0,0,0.8)',
              color: '#1A140E', textAlign: 'center', position: 'relative',
            }}>
              {/* Push pin at top */}
              <div className="push-pin" style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', width: 22, height: 22 }} />

              <div style={{
                display: 'inline-block', padding: '4px 16px', borderRadius: 2,
                border: '2px solid #8B2E2E', color: '#8B2E2E',
                fontFamily: "'JetBrains Mono', monospace", fontWeight: 900,
                fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12,
              }}>
                ANOMALY REVEALED
              </div>

              <h1 style={{
                fontSize: 32, fontWeight: 900,
                fontFamily: "'IBM Plex Serif', Georgia, serif",
                color: '#8B2E2E', marginBottom: 10,
              }}>
                {contradictions[0].title}
              </h1>

              <div style={{ height: 1, background: '#D4C5A9', margin: '16px auto', maxWidth: 400 }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, textAlign: 'left', marginTop: 18 }}>
                <div style={{ padding: '16px 18px', background: '#FFF8E9', borderRadius: 2, border: '1px solid #D8C8AC' }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: '#7A5135', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.15em' }}>
                    THE ASSERTED CLAIM
                  </span>
                  <p style={{ fontSize: 13, color: '#1A140E', fontFamily: "'IBM Plex Serif', serif", marginTop: 6, fontStyle: 'italic', lineHeight: 1.5 }}>
                    "{(contradictions[0].assertionQuote || contradictions[0].title).slice(0, 140)}"
                  </p>
                </div>

                <div style={{ padding: '16px 18px', background: '#FFF8E9', borderRadius: 2, border: '1px solid #B33A32' }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: '#8B2E2E', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.15em' }}>
                    THE PHYSICAL RECORD
                  </span>
                  <p style={{ fontSize: 13, color: '#1A140E', fontFamily: "'IBM Plex Serif', serif", marginTop: 6, lineHeight: 1.5 }}>
                    {contradictions[0].description.slice(0, 200)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowReveal(false)}
                style={{
                  marginTop: 24, padding: '8px 24px', borderRadius: 3,
                  background: '#8B2E2E', color: '#FFF8E9', border: 'none',
                  fontSize: 11, fontWeight: 800, cursor: 'pointer',
                  fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em',
                }}
              >
                DISMISS & INSPECT CASE
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        marginBottom: 24, flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#8B2E2E', boxShadow: '0 0 6px #8B2E2E',
            }} />
            <span style={{
              fontSize: 10, fontWeight: 800,
              fontFamily: "'JetBrains Mono', monospace",
              color: '#C5A66A', letterSpacing: '0.15em',
            }}>
              SECTION III // ADVERSARIAL CROSS-CHECK
            </span>
          </div>
          <h2 style={{
            fontSize: 32, fontWeight: 800,
            fontFamily: "'IBM Plex Serif', Georgia, serif",
            color: '#FFF8E9', letterSpacing: '-0.02em',
          }}>
            Contradiction <span style={{ color: '#E8463A' }}>Analysis</span>
          </h2>
          <p style={{
            fontSize: 13, color: '#A89278',
            fontFamily: "'IBM Plex Serif', serif", fontStyle: 'italic',
          }}>
            {contradictions.length > 0 ? `${contradictions.length} critical inconsistencies flagged across testimonies and physical records` : 'Cross-reference testimony against CCTV, keycard logs, and telemetry'}
          </p>
        </div>

        <button
          onClick={handleDetect}
          disabled={loading.contradictions || evidence.length < 2}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 3,
            background: 'linear-gradient(135deg, #8B2E2E 0%, #5E1A1A 100%)',
            color: '#FFF8E9', border: '1px solid #D46358',
            fontSize: 12, fontWeight: 800, cursor: 'pointer',
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.08em',
            boxShadow: '0 4px 12px rgba(139,46,46,0.4)',
            opacity: (loading.contradictions || evidence.length < 2) ? 0.4 : 1,
          }}
        >
          {loading.contradictions ? <Loader size={14} className="animate-spin" /> : <Zap size={14} />}
          SCAN FOR CONTRADICTIONS
        </button>
      </div>

      {loading.contradictions ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
          <ProcessingLoader label="CROSS-EXAMINING CLAIMS AGAINST FORENSIC TIMELINE…" />
        </div>
      ) : contradictions.length === 0 ? (
        <div style={{
          background: '#F4ECD8', borderRadius: 3, padding: '70px 40px',
          textAlign: 'center', border: '2px dashed #B08A52',
          boxShadow: '0 6px 20px rgba(0,0,0,0.3)', color: '#1A140E',
          fontFamily: "'IBM Plex Serif', Georgia, serif",
        }}>
          <AlertTriangle size={40} color="#8B2E2E" style={{ margin: '0 auto 14px' }} />
          <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
            {evidence.length < 2 ? 'Minimum of 2 Evidence Records Required' : 'Ready for Cross-Examination'}
          </h3>
          <p style={{ fontSize: 13, color: '#5D4936', maxWidth: 440, margin: '0 auto', fontStyle: 'italic' }}>
            {evidence.length < 2
              ? 'Intake at least 2 pieces of conflicting testimony or physical sensor logs to run contradiction detection.'
              : 'Click "Scan for Contradictions" to execute the logic matrix engine.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {contradictions.map((c, i) => (
            <motion.div
              key={c.id || i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              style={{
                background: '#F4ECD8',
                borderRadius: 2,
                border: '2px solid #8B2E2E',
                boxShadow: '3px 4px 14px rgba(0,0,0,0.35)',
                color: '#1A140E',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {/* Push pin */}
              <div className="push-pin" style={{ position: 'absolute', top: 12, left: 16, width: 14, height: 14 }} />

              <div style={{ display: 'flex' }}>
                {/* Stamp & Severity Badge */}
                <div style={{
                  padding: '24px 20px', width: 110, flexShrink: 0,
                  background: 'rgba(139, 46, 46, 0.08)',
                  borderRight: '1px solid #D8C8AC',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}>
                  <AlertTriangle size={26} color="#8B2E2E" style={{ marginBottom: 8 }} />
                  <span style={{
                    fontSize: 9, fontWeight: 900, letterSpacing: '0.14em',
                    padding: '3px 8px', borderRadius: 2,
                    background: '#8B2E2E', color: '#FFF8E9',
                    fontFamily: "'JetBrains Mono', monospace",
                    textTransform: 'uppercase',
                  }}>
                    {c.severity || 'BREACH'}
                  </span>
                </div>

                {/* Content Details */}
                <div style={{ flex: 1, padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div>
                      <h3 style={{
                        fontSize: 18, fontWeight: 800,
                        fontFamily: "'IBM Plex Serif', serif", color: '#1A140E',
                      }}>
                        {c.title}
                      </h3>
                      <p style={{
                        fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
                        color: '#7A5135', marginTop: 2,
                      }}>
                        RECORD REF #{c.id}
                      </p>
                    </div>

                    <div style={{
                      textAlign: 'right', padding: '6px 12px', borderRadius: 2,
                      background: '#FFF8E9', border: '1px solid #D8C8AC',
                    }}>
                      <div style={{
                        fontSize: 20, fontWeight: 900, color: '#8B2E2E',
                        fontFamily: "'JetBrains Mono', monospace", lineHeight: 1,
                      }}>
                        {c.confidence}%
                      </div>
                      <div style={{
                        fontSize: 8, fontWeight: 800, color: '#7A5135',
                        textTransform: 'uppercase', letterSpacing: '0.1em',
                        fontFamily: "'JetBrains Mono', monospace", marginTop: 2,
                      }}>
                        CERTAINTY
                      </div>
                    </div>
                  </div>

                  <p style={{
                    fontSize: 13, color: '#2E1C12',
                    fontFamily: "'IBM Plex Serif', serif", lineHeight: 1.6,
                    background: '#FFF8E9', padding: '12px 16px', borderRadius: 2,
                    border: '1px solid #D8C8AC', marginBottom: 12,
                  }}>
                    {c.description}
                  </p>

                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                    paddingTop: 10, borderTop: '1px dashed #D8C8AC',
                  }}>
                    <span style={{
                      fontSize: 9, fontWeight: 800, color: '#7A5135',
                      fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em',
                    }}>
                      CONFLICTING DOSSIER TAGS:
                    </span>
                    {(c.evidence || []).map(eid => (
                      <button
                        key={eid}
                        onClick={() => openEvidence(eid)}
                        style={{
                          fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: 800, padding: '2px 8px', borderRadius: 2,
                          color: '#8B2E2E', background: 'rgba(139, 46, 46, 0.1)',
                          border: '1px solid #8B2E2E', cursor: 'pointer',
                        }}
                      >
                        TAG #{eid}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
