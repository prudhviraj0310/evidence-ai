import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MapPin, FileSearch, ChevronDown, Loader, Zap, Inbox } from 'lucide-react';
import { useCase } from '../context/CaseContext';
import { ProcessingLoader } from '../components/ScanEffect';

const typeColors = {
  normal:     { color: '#818cf8', dot: '#6366f1' },
  suspicious: { color: '#fbbf24', dot: '#f59e0b' },
  alert:      { color: '#fb923c', dot: '#f97316' },
  critical:   { color: '#ef4444', dot: '#ef4444' },
};

export default function CrimeTimeline() {
  const { timeline, evidence, buildTimeline, loading } = useCase();
  const [expandedId, setExpandedId] = useState(null);

  return (
    <div style={{ padding: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: 'white', marginBottom: 6 }}>
            Event <span style={{ color: '#818cf8' }}>Timeline</span>
          </h2>
          <p style={{ fontSize: 14, color: '#6b7280' }}>
            {timeline.length > 0 ? `${timeline.length} events reconstructed` : 'AI-powered chronological reconstruction'}
          </p>
        </div>
        <button onClick={() => buildTimeline()} disabled={loading.timeline || evidence.length === 0}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 999,
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', border: 'none',
            fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: (loading.timeline || evidence.length === 0) ? 0.4 : 1,
            boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
          }}>
          {loading.timeline ? <Loader size={15} /> : <Zap size={15} />}
          {timeline.length > 0 ? 'Regenerate' : 'Generate Timeline'}
        </button>
      </div>

      {loading.timeline ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '120px 0' }}><ProcessingLoader label="Reconstructing chronology..." /></div>
      ) : timeline.length === 0 ? (
        <div style={{
          borderRadius: 20, padding: '80px 40px', textAlign: 'center',
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)',
          }}>
            <Inbox size={28} color="#818cf8" />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 8 }}>
            {evidence.length === 0 ? 'Upload Evidence First' : 'Ready to Generate'}
          </h3>
          <p style={{ fontSize: 13, color: '#6b7280', maxWidth: 400, margin: '0 auto', lineHeight: 1.6 }}>
            {evidence.length === 0 ? 'Upload footage or documents first.' : `${evidence.length} evidence items ready. Click "Generate Timeline" to reconstruct events.`}
          </p>
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: 32 }}>
          {/* Vertical Line */}
          <div style={{
            position: 'absolute', left: 15, top: 16, bottom: 0, width: 2, borderRadius: 2,
            background: 'linear-gradient(180deg, rgba(99,102,241,0.5), rgba(236,72,153,0.3), transparent)',
          }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', zIndex: 10, paddingTop: 16 }}>
            {timeline.map((event, i) => {
              const tc = typeColors[event.type] || typeColors.normal;
              const isCrit = event.type === 'critical' || event.type === 'alert';
              const isExpanded = expandedId === event.id;

              return (
                <motion.div key={event.id} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  style={{ display: 'flex', gap: 20, position: 'relative' }}>
                  
                  {/* Dot */}
                  <div style={{ position: 'relative', marginTop: 20, zIndex: 20 }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: '50%', background: tc.dot,
                      border: '3px solid #05050A',
                      boxShadow: isCrit ? `0 0 12px ${tc.dot}80` : 'none',
                      marginLeft: -24,
                    }} />
                  </div>

                  {/* Card */}
                  <div style={{ flex: 1 }}>
                    <div onClick={() => setExpandedId(isExpanded ? null : event.id)}
                      style={{
                        borderRadius: 16, cursor: 'pointer',
                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                        transition: 'all 0.2s',
                      }}>
                      <div style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                              <Clock size={13} color={tc.color} />
                              <span style={{ fontSize: 13, fontWeight: 700, color: tc.color }}>{event.time}</span>
                              <span style={{ color: '#4b5563', fontSize: 13 }}>·</span>
                              <span style={{ fontSize: 13, color: '#6b7280' }}>{event.date}</span>
                            </div>
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>{event.title}</h3>
                          </div>
                          <div style={{
                            width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(255,255,255,0.04)',
                            transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s',
                          }}>
                            <ChevronDown size={14} color="#6b7280" />
                          </div>
                        </div>
                        {event.location && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, color: '#6b7280' }}>
                            <MapPin size={13} />
                            <span style={{ fontSize: 13 }}>{event.location}</span>
                          </div>
                        )}
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                            <div style={{ padding: '8px 20px 20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                              <p style={{ fontSize: 14, color: '#d1d5db', lineHeight: 1.7, marginBottom: 12 }}>{event.description}</p>
                              {event.evidenceIds?.length > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                  <FileSearch size={13} color="#4b5563" />
                                  <span style={{ fontSize: 9, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Linked:</span>
                                  {event.evidenceIds.map(eid => (
                                    <span key={eid} style={{ fontSize: 11, fontFamily: 'monospace', padding: '3px 8px', borderRadius: 6, color: '#a5b4fc', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>{eid}</span>
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
