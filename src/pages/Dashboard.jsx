import { Activity, Users, FileSearch, AlertTriangle, Eye, Inbox, ChevronRight, ShieldAlert, Cpu } from 'lucide-react';
import { useCase } from '../context/CaseContext';

function StatCard({ icon: Icon, label, value, sub, isAlert }) {
  return (
    <div style={{
      padding: 20, borderRadius: 16, position: 'relative', overflow: 'hidden',
      background: isAlert ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.03)',
      border: isAlert ? '1px solid rgba(239,68,68,0.15)' : '1px solid rgba(255,255,255,0.06)',
    }}>
      {isAlert && <div style={{ position: 'absolute', top: -30, right: -30, width: 80, height: 80, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', filter: 'blur(25px)', pointerEvents: 'none' }} />}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, position: 'relative', zIndex: 1 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isAlert ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)',
          border: isAlert ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(99,102,241,0.15)',
        }}>
          <Icon size={18} color={isAlert ? '#f87171' : '#818cf8'} />
        </div>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.15em' }}>{label}</p>
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h3 style={{ fontSize: 28, fontWeight: 800, color: isAlert ? '#ef4444' : 'white', marginBottom: 2 }}>{value}</h3>
        {sub && <p style={{ fontSize: 10, marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: isAlert ? 'rgba(248,113,113,0.5)' : '#4b5563' }}>{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { evidence, contradictions, summary } = useCase();

  const avgSuspicion = evidence.length > 0
    ? Math.round(evidence.reduce((a, e) => a + (e.suspicionScore || 0), 0) / evidence.length)
    : 0;
  const suspects = summary?.suspects || [];

  return (
    <div style={{ padding: 28 }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Cpu size={15} color="#818cf8" />
          <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.25em', color: '#818cf8' }}>System Active</span>
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: 'white', letterSpacing: '-0.02em', marginBottom: 4 }}>Intelligence Command</h1>
        <p style={{ fontSize: 14, color: '#6b7280', fontWeight: 500 }}>
          {summary?.caseId || 'SYS_AWAITING_INPUT'} · {evidence.length} Data Streams
        </p>
      </div>

      {/* Stats Grid - 4 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard icon={FileSearch} label="Analyzed" value={evidence.length} sub={evidence.length > 0 ? 'Sync Complete' : 'Awaiting Data'} />
        <StatCard icon={Users} label="Targets" value={suspects.length} sub={suspects.length > 0 ? 'Matched' : '—'} />
        <StatCard icon={ShieldAlert} label="Anomalies" value={contradictions.length} sub={contradictions.length > 0 ? 'Action Required' : 'Normal'} />
        <StatCard icon={Activity} label="Threat" value={evidence.length ? `${avgSuspicion}%` : '—'} sub="Risk Vector" isAlert={true} />
      </div>

      {evidence.length === 0 ? (
        /* Empty State */
        <div style={{
          borderRadius: 20, padding: '80px 40px', textAlign: 'center',
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)',
          }}>
            <Inbox size={32} color="#818cf8" />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 8 }}>Awaiting Data Ingestion</h3>
          <p style={{ fontSize: 14, color: '#6b7280', maxWidth: 400, margin: '0 auto', lineHeight: 1.6 }}>
            Upload CCTV footage, audio, chat logs, or documents to begin AI analysis.
          </p>
        </div>
      ) : (
        /* Evidence Feed + Suspects */
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>

          {/* Evidence Feed */}
          <div style={{ borderRadius: 18, padding: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399' }} />
                Live Intel Stream
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {evidence.slice(0, 5).map((ev, i) => (
                <div key={ev.evidenceId || i} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: 14, borderRadius: 12,
                  background: 'rgba(255,255,255,0.01)', border: '1px solid transparent', cursor: 'pointer', transition: 'all 0.2s',
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.01)'; e.currentTarget.style.borderColor = 'transparent'; }}
                >
                  <div style={{ width: 42, height: 42, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <Eye size={18} color="#6b7280" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#e5e7eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.summary || ev.fileName}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#4b5563', padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.04)' }}>{ev.evidenceId}</span>
                      <span style={{ fontSize: 10, color: '#4b5563', textTransform: 'uppercase', fontWeight: 600 }}>{ev.metadata?.contentType || ev.fileType}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', padding: '0 8px' }}>
                    <p style={{ fontSize: 20, fontWeight: 900, color: ev.suspicionScore > 80 ? '#ef4444' : '#9ca3af' }}>{ev.suspicionScore}</p>
                    <p style={{ fontSize: 8, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Risk</p>
                  </div>
                  <ChevronRight size={16} color="#374151" />
                </div>
              ))}
            </div>
          </div>

          {/* Suspects */}
          <div style={{ borderRadius: 18, padding: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'white', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              Target Profiles
            </h3>
            {suspects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <Users size={32} color="#374151" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Awaiting Report</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {suspects.map((s, i) => {
                  const risk = s.risk ?? 0;
                  const isHigh = risk > 50;
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, fontWeight: 900,
                            color: isHigh ? '#f87171' : '#a5b4fc',
                            background: isHigh ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)',
                            border: isHigh ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(99,102,241,0.2)',
                          }}>{s.name?.[0]}</div>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb' }}>{s.name}</p>
                            <p style={{ fontSize: 9, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{s.status}</p>
                          </div>
                        </div>
                        <span style={{ fontSize: 17, fontWeight: 900, color: isHigh ? '#ef4444' : '#9ca3af' }}>{risk}%</span>
                      </div>
                      <div style={{ height: 4, borderRadius: 4, overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
                        <div style={{
                          height: '100%', borderRadius: 4, width: `${risk}%`,
                          background: isHigh ? '#ef4444' : '#6366f1',
                          boxShadow: isHigh ? '0 0 8px rgba(239,68,68,0.5)' : 'none',
                          transition: 'width 1s ease',
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
