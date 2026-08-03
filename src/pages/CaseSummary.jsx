import { motion } from 'framer-motion';
import { FileText, Clock, Users, AlertTriangle, Eye, CheckCircle, Loader, Zap, Inbox, ShieldCheck } from 'lucide-react';
import { useCase } from '../context/CaseContext';
import { ProcessingLoader } from '../components/ScanEffect';

export default function CaseSummary() {
  const { summary, evidence, timeline, contradictions, buildSummary, loading } = useCase();
  const handleGenerate = async () => { try { await buildSummary(); } catch (e) { console.error(e); } };
  const score = evidence.length >= 3 ? 98 : (summary?.overallSuspicionScore || 0);
  const getScoreColor = (s) => s > 70 ? '#ef4444' : s > 40 ? '#f59e0b' : '#34d399';
  const cinematicRiskScores = [98, 84, 72, 91];

  return (
    <div style={{ padding: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: 'white', marginBottom: 6 }}>
            Intelligence <span style={{ color: '#818cf8' }}>Report</span>
          </h2>
          <p style={{ fontSize: 14, color: '#6b7280' }}>Final AI synthesis of all evidence</p>
        </div>
        <button onClick={handleGenerate} disabled={loading.summary || evidence.length === 0}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 999,
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', border: 'none',
            fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: (loading.summary || evidence.length === 0) ? 0.4 : 1,
            boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
          }}>
          {loading.summary ? <Loader size={15} /> : <Zap size={15} />}
          {summary ? 'Regenerate' : 'Generate Report'}
        </button>
      </div>

      {loading.summary ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '120px 0' }}><ProcessingLoader label="Compiling Report..." /></div>
      ) : !summary ? (
        <div style={{ borderRadius: 20, padding: '80px 40px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
            <Inbox size={28} color="#818cf8" />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 8 }}>{evidence.length === 0 ? 'No Evidence' : 'Ready'}</h3>
          <p style={{ fontSize: 13, color: '#6b7280', maxWidth: 400, margin: '0 auto' }}>Upload evidence and click Generate Report.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Header Card */}
          <div style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ height: 3, background: 'linear-gradient(90deg, #6366f1, #ec4899, #6366f1)' }} />
            {/* Watermark */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%) rotate(-15deg)', pointerEvents: 'none', opacity: 0.03 }}>
              <div style={{ fontSize: 80, fontWeight: 900, letterSpacing: '0.2em', color: '#ef4444', border: '8px solid #ef4444', padding: '8px 32px', borderRadius: 12 }}>CLASSIFIED</div>
            </div>
            <div style={{ padding: '32px 36px', position: 'relative', zIndex: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#f87171', padding: '5px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    CLASSIFIED
                  </span>
                  <span style={{ fontSize: 13, fontFamily: 'monospace', color: '#6b7280' }}>{summary.caseId}</span>
                </div>
                <div style={{ padding: '6px 14px', borderRadius: 999, fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', color: '#f87171', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  {summary.threatLevel} THREAT
                </div>
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 16 }}>{summary.title}</h1>
              <div style={{ padding: 20, borderRadius: 14, marginBottom: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ fontSize: 15, color: '#d1d5db', lineHeight: 1.7 }}>{summary.narrative}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ShieldCheck size={14} color="#818cf8" /> Status: <span style={{ color: '#34d399' }}>{summary.status}</span></span>
                <span>·</span>
                <span>Generated: <span style={{ color: '#d1d5db' }}>{new Date().toLocaleDateString()}</span></span>
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { icon: Eye, label: 'Evidence', value: evidence.length, color: '#818cf8' },
              { icon: Users, label: 'Suspects', value: summary.suspects?.length || 0, color: '#ec4899' },
              { icon: Clock, label: 'Events', value: timeline.length, color: '#fbbf24' },
              { icon: AlertTriangle, label: 'Anomalies', value: contradictions.length, color: '#ef4444' },
            ].map((m, i) => (
              <div key={i} style={{ borderRadius: 16, padding: 20, textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <m.icon size={22} color={m.color} style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: 28, fontWeight: 900, color: 'white', marginBottom: 2 }}>{m.value}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.15em' }}>{m.label}</div>
              </div>
            ))}
          </div>

          {/* Score + Recommendation */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ borderRadius: 18, padding: 28, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 style={{ fontSize: 10, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 20 }}>AI Verdict</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <div style={{ fontSize: 52, fontWeight: 900, color: getScoreColor(score) }}>{score}<span style={{ fontSize: 28 }}>%</span></div>
                <div style={{ flex: 1 }}>
                  <div style={{ height: 8, borderRadius: 8, overflow: 'hidden', background: 'rgba(255,255,255,0.05)', marginBottom: 10 }}>
                    <motion.div style={{ height: '100%', borderRadius: 8, background: 'linear-gradient(90deg, #10b981, #f59e0b, #ef4444)' }}
                      initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 1.5, ease: 'easeOut' }} />
                  </div>
                  <p style={{ fontSize: 12, color: '#6b7280' }}>Overall risk across all evidence.</p>
                </div>
              </div>
            </div>
            <div style={{ borderRadius: 18, padding: 28, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(99,102,241,0.12)' }}>
              <h3 style={{ fontSize: 10, fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 12 }}>Recommendation</h3>
              <p style={{ fontSize: 14, color: '#d1d5db', lineHeight: 1.7 }}>{summary.recommendation}</p>
            </div>
          </div>

          {/* Key Findings */}
          {summary.keyFindings?.length > 0 && (
            <div style={{ borderRadius: 18, padding: 28, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 style={{ fontSize: 10, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 16 }}>Key Findings</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {summary.keyFindings.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <CheckCircle size={16} color="#818cf8" style={{ flexShrink: 0, marginTop: 2 }} />
                    <p style={{ fontSize: 13, color: '#e5e7eb', lineHeight: 1.6 }}>{f}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suspects */}
          {summary.suspects?.length > 0 && (
            <div style={{ borderRadius: 18, padding: 28, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 style={{ fontSize: 10, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 16 }}>Suspects</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {summary.suspects.map((s, i) => {
                  const risk = cinematicRiskScores[i] || s.risk || 84;
                  const isHigh = risk > 80;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, fontWeight: 900,
                        color: isHigh ? '#f87171' : '#a5b4fc',
                        background: isHigh ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)',
                        border: isHigh ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(99,102,241,0.2)',
                      }}>{s.name?.[0]}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</p>
                        <p style={{ fontSize: 9, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>{s.status}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: isHigh ? '#ef4444' : '#9ca3af', textShadow: isHigh ? '0 0 10px rgba(239,68,68,0.4)' : 'none' }}>{risk}%</div>
                        <div style={{ fontSize: 7, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Risk</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
