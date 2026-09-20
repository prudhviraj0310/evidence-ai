import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Lock, ShieldCheck, Tag } from 'lucide-react';
import { useCase } from '../context/CaseContext';
import { getEvidenceRaw } from '../services/api';

// Slide-in panel styled as a physical manila evidence folder pulled from the filing cabinet
export default function EvidenceDrawer() {
  const { drawer, closeEvidence } = useCase();
  const [doc, setDoc] = useState(null);

  useEffect(() => {
    if (!drawer) { setDoc(null); return; }
    getEvidenceRaw(drawer.evidenceId).then(setDoc).catch(() => setDoc({ error: true }));
  }, [drawer]);

  const highlight = drawer?.highlight?.slice(0, 60);

  return (
    <AnimatePresence>
      {drawer && (
        <motion.div
          initial={{ x: 520 }}
          animate={{ x: 0 }}
          exit={{ x: 520 }}
          transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: 500, zIndex: 200,
            background: '#F4ECD8',
            borderLeft: '4px solid #B08A52',
            boxShadow: '-20px 0 60px rgba(0,0,0,0.7)',
            display: 'flex', flexDirection: 'column',
            color: '#1A140E',
            fontFamily: "'IBM Plex Serif', Georgia, serif",
          }}
        >
          {/* Manila folder header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 22px',
            borderBottom: '2px solid #D8C8AC',
            background: 'linear-gradient(180deg, #EAE0CA 0%, #E2D6BE 100%)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 2,
                background: '#3A2418', border: '1px solid #7A5135',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FileText size={18} color="#FFF8E9" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <p style={{
                    fontSize: 14, fontWeight: 900,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: '#8B2E2E', letterSpacing: '0.05em',
                  }}>
                    EVIDENCE TAG #{drawer.evidenceId}
                  </p>
                  <span style={{
                    fontSize: 8, fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 800, padding: '1px 5px', borderRadius: 2,
                    background: 'rgba(76, 118, 87, 0.15)', color: '#4C7657',
                    border: '1px solid #4C7657',
                  }}>
                    CHAIN SEALED
                  </span>
                </div>
                <p style={{
                  fontSize: 11, color: '#5D4936',
                  fontFamily: "'JetBrains Mono', monospace", marginTop: 2,
                }}>
                  {doc?.fileName || '…'} {doc?.kind ? `· ${doc.kind.toUpperCase()}` : ''}
                </p>
              </div>
            </div>

            <button
              onClick={closeEvidence}
              style={{
                width: 28, height: 28, borderRadius: 2,
                border: '1px solid #B08A52', background: 'rgba(176, 138, 82, 0.15)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={15} color="#7A5135" />
            </button>
          </div>

          {/* Subheader banner */}
          <div style={{
            padding: '8px 22px',
            background: '#FFF8E9',
            borderBottom: '1px dashed #D8C8AC',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{
              fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 800, color: '#7A5135', letterSpacing: '0.1em',
            }}>
              VERBATIM TRANSCRIPT & RAW TELEMETRY
            </span>
            <span style={{
              fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
              color: '#5D4936',
            }}>
              PRIMARY SOURCE AUDIT
            </span>
          </div>

          {/* Media Player / Photo Inspector */}
          {doc?.mediaUrl && (
            <div style={{
              background: '#0D0907',
              borderBottom: '2px solid #3A2418',
              padding: 12,
            }}>
              {/* Media banner header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 8, padding: '0 4px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: '#8B2E2E', boxShadow: '0 0 6px #E8463A',
                    animation: 'pulse 1.5s infinite',
                  }} />
                  <span style={{
                    fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 800, color: '#E8463A', letterSpacing: '0.12em',
                  }}>
                    {doc.mediaType?.startsWith('video/') || doc.fileName?.endsWith('.mp4')
                      ? 'SURVEILLANCE CAM-04 // LEVEL B2 [REC]'
                      : 'FORENSIC CRIME SCENE PHOTOGRAPHY'}
                  </span>
                </div>
                <span style={{
                  fontSize: 8, fontFamily: "'JetBrains Mono', monospace",
                  color: '#A89278', background: 'rgba(255,255,255,0.06)',
                  padding: '1px 6px', borderRadius: 2,
                }}>
                  AUTHENTIC STREAM
                </span>
              </div>

              {/* Video Element */}
              {(doc.mediaType?.startsWith('video/') || doc.fileName?.endsWith('.mp4') || doc.kind === 'cctv') ? (
                <div style={{ position: 'relative', borderRadius: 2, overflow: 'hidden', border: '1px solid #3A2418' }}>
                  <video
                    controls
                    autoPlay
                    muted
                    loop
                    playsInline
                    src={doc.mediaUrl}
                    style={{ width: '100%', maxHeight: 240, objectFit: 'cover', display: 'block', background: '#000' }}
                  />
                  <div style={{
                    position: 'absolute', top: 8, left: 10,
                    fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
                    color: 'rgba(255,255,255,0.7)', textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                    pointerEvents: 'none',
                  }}>
                    CAM 04 [UNDERGROUND B2]
                  </div>
                </div>
              ) : (
                /* High-Res Photo Element */
                <div style={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #3A2418' }}>
                  <img
                    src={doc.mediaUrl}
                    alt={doc.fileName}
                    style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }}
                  />
                </div>
              )}

              {/* SHA-256 Chain of Custody Tag */}
              {doc.contentHash && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  marginTop: 8, padding: '4px 8px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 2,
                }}>
                  <ShieldCheck size={11} color="#4C7657" />
                  <span style={{
                    fontSize: 8, fontFamily: "'JetBrains Mono', monospace",
                    color: '#8A7A68', letterSpacing: '0.05em',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    SHA-256: {doc.contentHash}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Document Content with physical yellow highlighter for matches */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '22px 24px',
            background: '#FAF4E8',
          }}>
            {doc?.error && (
              <p style={{ color: '#8B2E2E', fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>
                Could not retrieve literal document content from the evidence vault.
              </p>
            )}

            {doc?.text && doc.text.split('\n').map((line, i) => {
              const hit = highlight && line.toLowerCase().includes(highlight.toLowerCase().slice(0, 40));
              return (
                <p
                  key={i}
                  style={{
                    fontSize: 12,
                    fontFamily: "'JetBrains Mono', monospace",
                    lineHeight: 1.85,
                    whiteSpace: 'pre-wrap',
                    color: hit ? '#1A140E' : '#2A1D13',
                    background: hit ? '#FFE873' : 'transparent',
                    boxShadow: hit ? '0 0 6px rgba(255, 232, 115, 0.6)' : 'none',
                    borderRadius: hit ? 2 : 0,
                    padding: hit ? '2px 6px' : 0,
                    fontWeight: hit ? 800 : 400,
                  }}
                >
                  {line || ' '}
                </p>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
