import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Link, Loader, Zap, Inbox } from 'lucide-react';
import { useCase } from '../context/CaseContext';
import { ProcessingLoader } from '../components/ScanEffect';

export default function Contradictions() {
  const { contradictions, evidence, findContradictions, loading } = useCase();
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
    if (showReveal) { const t = setTimeout(() => setShowReveal(false), 6000); return () => clearTimeout(t); }
  }, [showReveal]);

  return (
    <motion.div animate={{ filter: glitch ? 'invert(1) hue-rotate(180deg) blur(3px)' : 'none' }}
      transition={{ duration: glitch ? 0.05 : 0.3 }}
      style={{ padding: 28, position: 'relative' }}>

      {/* CINEMATIC REVEAL */}
      <AnimatePresence>
        {showReveal && contradictions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05, filter: 'blur(12px)' }}
            style={{
              position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'radial-gradient(ellipse at center, rgba(127,29,29,0.95), rgba(10,0,0,0.98))',
            }}>
            <div style={{ textAlign: 'center', padding: 48, maxWidth: 800 }}>
              <div style={{
                width: 100, height: 100, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 40px', background: 'rgba(239,68,68,0.15)', border: '2px solid rgba(239,68,68,0.4)',
                boxShadow: '0 0 60px rgba(239,68,68,0.3)',
              }}>
                <AlertTriangle size={48} color="#ef4444" />
              </div>
              <h1 style={{ fontSize: 56, fontWeight: 900, color: 'white', marginBottom: 8, textShadow: '0 0 40px rgba(239,68,68,0.3)' }}>CONTRADICTION</h1>
              <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #ef4444, transparent)', marginBottom: 20 }} />
              <p style={{ fontSize: 18, color: '#fca5a5', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 40 }}>{contradictions[0].title}</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, textAlign: 'left' }}>
                <div style={{ padding: 24, borderRadius: 16, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <div style={{ height: 3, background: '#6b7280', borderRadius: 4, marginBottom: 16 }} />
                  <p style={{ fontSize: 9, fontWeight: 700, color: '#6b7280', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 10 }}>The Statement</p>
                  <p style={{ fontSize: 16, color: '#e5e7eb', lineHeight: 1.6 }}>"{(contradictions[0].assertionQuote || '').slice(0, 160) || contradictions[0].title}"</p>
                </div>
                <div style={{ padding: 24, borderRadius: 16, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(239,68,68,0.4)' }}>
                  <div style={{ height: 3, background: '#ef4444', borderRadius: 4, marginBottom: 16 }} />
                  <p style={{ fontSize: 9, fontWeight: 700, color: '#6b7280', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 10 }}>The Physical Record</p>
                  <p style={{ fontSize: 15, color: '#e5e7eb', lineHeight: 1.6 }}>{contradictions[0].description.slice(0, 260)}</p>
                  <p style={{ fontSize: 12, color: '#f87171', marginTop: 12, fontFamily: 'monospace', fontWeight: 700 }}>— {(contradictions[0].evidence || []).join(' · ')}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: 'white', marginBottom: 6 }}>
            Detect <span style={{ color: '#ef4444' }}>Contradictions</span>
          </h2>
          <p style={{ fontSize: 14, color: '#6b7280' }}>
            {contradictions.length > 0 ? `${contradictions.length} critical inconsistencies found` : 'Cross-reference all evidence for logical conflicts'}
          </p>
        </div>
        <button onClick={handleDetect} disabled={loading.contradictions || evidence.length < 2}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 999,
            background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', border: 'none',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            opacity: (loading.contradictions || evidence.length < 2) ? 0.4 : 1,
            boxShadow: '0 4px 15px rgba(239,68,68,0.3)',
          }}>
          {loading.contradictions ? <Loader size={15} /> : <Zap size={15} />}
          Detect Contradictions
        </button>
      </div>

      {loading.contradictions ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '120px 0' }}><ProcessingLoader label="Cross-referencing..." /></div>
      ) : contradictions.length === 0 ? (
        <div style={{
          borderRadius: 20, padding: '80px 40px', textAlign: 'center',
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)',
          }}>
            <Inbox size={28} color="#f87171" />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 8 }}>
            {evidence.length < 2 ? 'Need More Evidence' : 'Ready to Analyze'}
          </h3>
          <p style={{ fontSize: 13, color: '#6b7280', maxWidth: 400, margin: '0 auto', lineHeight: 1.6 }}>
            Upload at least 2 evidence items, then click "Detect Contradictions" to cross-reference all data.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {contradictions.map((c, i) => (
            <motion.div key={c.id || i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              style={{
                borderRadius: 18, overflow: 'hidden',
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(239,68,68,0.12)',
                boxShadow: '0 0 30px rgba(239,68,68,0.03)',
              }}>
              <div style={{ display: 'flex' }}>
                {/* Badge */}
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: 24, width: 90, flexShrink: 0,
                  background: 'rgba(239,68,68,0.05)', borderRight: '1px solid rgba(239,68,68,0.1)',
                }}>
                  <AlertTriangle size={24} color="#ef4444" style={{ marginBottom: 8 }} />
                  <span style={{
                    fontSize: 8, fontWeight: 900, letterSpacing: '0.12em', padding: '4px 8px', borderRadius: 999,
                    background: '#ef4444', color: 'white', textTransform: 'uppercase',
                  }}>{c.severity || 'CRITICAL'}</span>
                </div>

                {/* Content */}
                <div style={{ flex: 1, padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ flex: 1, paddingRight: 16 }}>
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: 'white', marginBottom: 4 }}>{c.title}</h3>
                      <p style={{ fontSize: 11, color: 'rgba(248,113,113,0.5)', fontFamily: 'monospace' }}>{c.id}</p>
                    </div>
                    <div style={{ textAlign: 'right', padding: '8px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: '#ef4444' }}>{c.confidence}%</div>
                      <div style={{ fontSize: 8, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Confidence</div>
                    </div>
                  </div>
                  <p style={{
                    fontSize: 14, color: '#d1d5db', lineHeight: 1.7, marginBottom: 16, padding: 16, borderRadius: 12,
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                  }}>{c.description}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <Link size={13} color="#4b5563" />
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Linked:</span>
                    {(c.evidence || []).map(eid => (
                      <span key={eid} style={{ fontSize: 11, fontFamily: 'monospace', padding: '3px 8px', borderRadius: 6, color: '#fca5a5', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>{eid}</span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
