import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MapPin, FileSearch, ChevronDown, Loader, Zap, Inbox, Tag } from 'lucide-react';
import { useCase } from '../context/CaseContext';
import { ProcessingLoader } from '../components/ScanEffect';

const typeColors = {
  normal:     { color: '#5A9468', dot: '#4C7657', label: 'LOG ENTRY' },
  suspicious: { color: '#B9792E', dot: '#B08A52', label: 'SUSPICIOUS EVENT' },
  alert:      { color: '#B33A32', dot: '#8B2E2E', label: 'ANOMALY DETECTED' },
  critical:   { color: '#E8463A', dot: '#8B2E2E', label: 'CRITICAL EVENT' },
};

export default function CrimeTimeline({ onNavigate }) {
  const { timeline, evidence, buildTimeline, loading, openEvidence } = useCase();
  const [expandedId, setExpandedId] = useState(null);

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        marginBottom: 24, flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#C5A66A', boxShadow: '0 0 6px #C5A66A',
            }} />
            <span style={{
              fontSize: 10, fontWeight: 800,
              fontFamily: "'JetBrains Mono', monospace",
              color: '#C5A66A', letterSpacing: '0.15em',
            }}>
              SECTION II // TEMPORAL RECONSTRUCTION
            </span>
          </div>
          <h2 style={{
            fontSize: 32, fontWeight: 800,
            fontFamily: "'IBM Plex Serif', Georgia, serif",
            color: '#FFF8E9', letterSpacing: '-0.02em',
          }}>
            Incident <span style={{ color: '#C5A66A' }}>Chronology</span>
          </h2>
          <p style={{
            fontSize: 13, color: '#A89278',
            fontFamily: "'IBM Plex Serif', serif", fontStyle: 'italic',
          }}>
            {timeline.length > 0 ? `${timeline.length} verified timestamp events reconstructed from evidence logs` : 'AI-powered chronological police blotter reconstruction'}
          </p>
        </div>

        <button
          onClick={() => buildTimeline()}
          disabled={loading.timeline || evidence.length === 0}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 3,
            background: 'linear-gradient(135deg, #B08A52 0%, #7A5135 100%)',
            color: '#FFF8E9', border: '1px solid #C5A66A',
            fontSize: 12, fontWeight: 800, cursor: 'pointer',
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.08em',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            opacity: (loading.timeline || evidence.length === 0) ? 0.4 : 1,
          }}
        >
          {loading.timeline ? <Loader size={14} className="animate-spin" /> : <Zap size={14} />}
          {timeline.length > 0 ? 'RE-ORDER TIMELINE' : 'RECONSTRUCT EVENTS'}
        </button>
      </div>

      {loading.timeline ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
          <ProcessingLoader label="ALIGNING LOGS & CROSS-CHECKING TIMESTAMPS…" />
        </div>
      ) : timeline.length === 0 ? (
        <div style={{
          background: '#F4ECD8', borderRadius: 3, padding: '70px 40px',
          textAlign: 'center', border: '2px dashed #B08A52',
          boxShadow: '0 6px 20px rgba(0,0,0,0.3)', color: '#1A140E',
          fontFamily: "'IBM Plex Serif', Georgia, serif",
        }}>
          <Clock size={40} color="#7A5135" style={{ margin: '0 auto 14px' }} />
          <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
            {evidence.length === 0 ? 'No Evidence Records Ingested' : 'Ready for Temporal Alignment'}
          </h3>
          <p style={{ fontSize: 13, color: '#5D4936', maxWidth: 440, margin: '0 auto', fontStyle: 'italic' }}>
            {evidence.length === 0
              ? 'Intake CCTV footage, keycard swipes, or witness depositions to construct the event chronology.'
              : `${evidence.length} evidence items ready. Click "Reconstruct Events" to build the chronological timeline.`}
          </p>
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: 36 }}>
          {/* Vertical Red String Spine */}
          <div style={{
            position: 'absolute', left: 16, top: 12, bottom: 0, width: 2,
            background: 'repeating-linear-gradient(180deg, #8B2E2E, #8B2E2E 6px, transparent 6px, transparent 10px)',
          }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', zIndex: 10 }}>
            {timeline.map((event, i) => {
              const tc = typeColors[event.type] || typeColors.normal;
              const isCrit = event.type === 'critical' || event.type === 'alert';
              const isExpanded = expandedId === event.id;

              return (
                <motion.div
                  key={event.id || i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{ display: 'flex', gap: 16, position: 'relative' }}
                >
                  {/* Push pin on the string */}
                  <div style={{ position: 'relative', marginTop: 14 }}>
                    <div style={{
                      width: 14, height: 14, borderRadius: '50%',
                      background: `radial-gradient(circle at 35% 35%, #fff, ${isCrit ? '#E8463A' : '#C5A66A'} 50%, #4A0E0E 100%)`,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                      marginLeft: -23,
                    }} />
                  </div>

                  {/* Physical Index Card */}
                  <div style={{ flex: 1 }}>
                    <div
                      onClick={() => setExpandedId(isExpanded ? null : event.id)}
                      style={{
                        background: '#F4ECD8',
                        borderRadius: 2,
                        border: isCrit ? '1px solid #B33A32' : '1px solid #D4C5A9',
                        boxShadow: '2px 3px 10px rgba(0,0,0,0.3)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <span style={{
                                fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
                                fontWeight: 800, padding: '1px 6px', borderRadius: 2,
                                background: isCrit ? 'rgba(139, 46, 46, 0.15)' : 'rgba(76, 118, 87, 0.15)',
                                color: isCrit ? '#8B2E2E' : '#4C7657',
                                border: `1px solid ${isCrit ? '#B33A32' : '#4C7657'}`,
                                letterSpacing: '0.1em',
                              }}>
                                {tc.label}
                              </span>
                              <span style={{
                                fontSize: 12, fontWeight: 800,
                                fontFamily: "'JetBrains Mono', monospace",
                                color: '#1A140E',
                              }}>
                                {event.time}
                              </span>
                              <span style={{ color: '#8A735E', fontSize: 11 }}>·</span>
                              <span style={{
                                fontSize: 11, color: '#5D4936',
                                fontFamily: "'JetBrains Mono', monospace",
                              }}>
                                {event.date}
                              </span>
                            </div>

                            <h3 style={{
                              fontSize: 16, fontWeight: 800,
                              fontFamily: "'IBM Plex Serif', serif",
                              color: isCrit ? '#8B2E2E' : '#1A140E',
                            }}>
                              {event.title}
                            </h3>
                          </div>

                          <div style={{
                            width: 24, height: 24, borderRadius: 2,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: '#EAE0CA', border: '1px solid #D4C5A9',
                            transform: isExpanded ? 'rotate(180deg)' : 'none',
                            transition: 'transform 0.2s',
                          }}>
                            <ChevronDown size={14} color="#7A5135" />
                          </div>
                        </div>

                        {event.location && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6, color: '#5D4936' }}>
                            <MapPin size={12} color="#8B2E2E" />
                            <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>{event.location}</span>
                          </div>
                        )}
                      </div>

                      {/* Expandable detail card */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            style={{ overflow: 'hidden' }}
                          >
                            <div style={{
                              padding: '12px 18px 16px',
                              borderTop: '1px dashed #D4C5A9',
                              background: '#FFF8E9',
                            }}>
                              <p style={{
                                fontSize: 13, color: '#2E1C12',
                                fontFamily: "'IBM Plex Serif', serif",
                                lineHeight: 1.6, marginBottom: 12,
                              }}>
                                {event.description}
                              </p>

                              {event.evidenceIds?.length > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                  <FileSearch size={13} color="#7A5135" />
                                  <span style={{
                                    fontSize: 9, fontWeight: 800, color: '#7A5135',
                                    fontFamily: "'JetBrains Mono', monospace",
                                    letterSpacing: '0.1em',
                                  }}>
                                    PRIMARY SOURCES:
                                  </span>
                                  {event.evidenceIds.map(eid => (
                                    <button
                                      key={eid}
                                      onClick={(e) => { e.stopPropagation(); openEvidence(eid); }}
                                      style={{
                                        fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
                                        fontWeight: 800, padding: '2px 6px', borderRadius: 2,
                                        color: '#4C7657', background: 'rgba(76, 118, 87, 0.12)',
                                        border: '1px solid #4C7657', cursor: 'pointer',
                                      }}
                                    >
                                      TAG #{eid}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
