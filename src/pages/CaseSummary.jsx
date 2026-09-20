import { motion } from 'framer-motion';
import { FileText, Clock, Users, AlertTriangle, Eye, CheckCircle, Loader, Zap, Inbox, ShieldCheck, Stamp } from 'lucide-react';
import { useCase } from '../context/CaseContext';
import { ProcessingLoader } from '../components/ScanEffect';

export default function CaseSummary({ onNavigate }) {
  const { summary, evidence, timeline, contradictions, buildSummary, loading } = useCase();

  const handleGenerate = async () => {
    try { await buildSummary(); } catch (e) { console.error(e); }
  };

  const score = summary?.overallSuspicionScore || 0;
  const getScoreColor = (s) => s > 55 ? '#8B2E2E' : s > 35 ? '#B9792E' : '#4C7657';

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1280, margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        marginBottom: 24, flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#4C7657', boxShadow: '0 0 6px #4C7657',
            }} />
            <span style={{
              fontSize: 10, fontWeight: 800,
              fontFamily: "'JetBrains Mono', monospace",
              color: '#C5A66A', letterSpacing: '0.15em',
            }}>
              SECTION VI // OFFICIAL INTELLIGENCE DOSSIER
            </span>
          </div>
          <h2 style={{
            fontSize: 32, fontWeight: 800,
            fontFamily: "'IBM Plex Serif', Georgia, serif",
            color: '#FFF8E9', letterSpacing: '-0.02em',
          }}>
            Case Intelligence <span style={{ color: '#C5A66A' }}>Briefing</span>
          </h2>
          <p style={{
            fontSize: 13, color: '#A89278',
            fontFamily: "'IBM Plex Serif', serif", fontStyle: 'italic',
          }}>
            Multi-source forensic intelligence briefing document synthesizing all physical evidence, testimony, and alibi contradictions.
          </p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading.summary || evidence.length === 0}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 3,
            background: 'linear-gradient(135deg, #B08A52 0%, #7A5135 100%)',
            color: '#FFF8E9', border: '1px solid #C5A66A',
            fontSize: 12, fontWeight: 800, cursor: 'pointer',
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.08em',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            opacity: (loading.summary || evidence.length === 0) ? 0.4 : 1,
          }}
        >
          {loading.summary ? <Loader size={14} className="animate-spin" /> : <Zap size={14} />}
          {summary ? 'RE-COMPILE REPORT' : 'COMPILE DOSSIER'}
        </button>
      </div>

      {loading.summary ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
          <ProcessingLoader label="COMPILING OFFICIAL CASE BRIEFING DOSSIER…" />
        </div>
      ) : !summary ? (
        <div style={{
          background: '#F4ECD8', borderRadius: 3, padding: '70px 40px',
          textAlign: 'center', border: '2px dashed #B08A52',
          boxShadow: '0 6px 20px rgba(0,0,0,0.3)', color: '#1A140E',
          fontFamily: "'IBM Plex Serif', Georgia, serif",
        }}>
          <FileText size={40} color="#7A5135" style={{ margin: '0 auto 14px' }} />
          <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
            {evidence.length === 0 ? 'No Evidence Records Loaded' : 'Dossier Ready for Compilation'}
          </h3>
          <p style={{ fontSize: 13, color: '#5D4936', maxWidth: 440, margin: '0 auto', fontStyle: 'italic' }}>
            {evidence.length === 0
              ? 'Upload evidence into the intake vault, then generate the complete intelligence briefing.'
              : 'Click "Compile Dossier" to synthesize all data streams into the official case report.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* Official Dossier Document Card */}
          <div style={{
            background: '#F4ECD8',
            borderRadius: '0 8px 4px 4px',
            border: '2px solid #B08A52',
            boxShadow: '0 8px 26px rgba(0,0,0,0.45)',
            position: 'relative',
            color: '#1A140E',
            overflow: 'hidden',
          }}>
            {/* Red Classified Stamp Watermark */}
            <div style={{
              position: 'absolute', top: 30, right: 36,
              padding: '6px 16px', border: '3px solid #8B2E2E',
              color: '#8B2E2E', fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 900, fontSize: 14, letterSpacing: '0.2em',
              transform: 'rotate(5deg)', opacity: 0.85, pointerEvents: 'none',
            }}>
              CONFIDENTIAL // INVESTIGATION DOSSIER
            </div>

            <div style={{ padding: '32px 36px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{
                  fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 800, color: '#4A2E1D',
                }}>
                  CASE REF #{summary.caseId}
                </span>
                <span style={{ color: '#8A735E' }}>·</span>
                <span style={{
                  fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 800, padding: '2px 8px', borderRadius: 2,
                  background: 'rgba(139, 46, 46, 0.12)', color: '#8B2E2E',
                  border: '1px solid #8B2E2E',
                }}>
                  {summary.threatLevel} THREAT VECTOR
                </span>
              </div>

              <h1 style={{
                fontSize: 28, fontWeight: 900,
                fontFamily: "'IBM Plex Serif', Georgia, serif",
                color: '#1A140E', marginBottom: 16,
              }}>
                {summary.title}
              </h1>

              {/* Narrative Text */}
              <div style={{
                padding: '20px 24px', borderRadius: 2,
                background: '#FFF8E9', border: '1px solid #D8C8AC',
                marginBottom: 20,
              }}>
                <p style={{
                  fontSize: 15, color: '#2E1C12',
                  fontFamily: "'IBM Plex Serif', serif",
                  lineHeight: 1.7,
                }}>
                  {summary.narrative}
                </p>
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', gap: 16,
                fontSize: 11, fontWeight: 700, color: '#5D4936',
                fontFamily: "'JetBrains Mono', monospace",
                borderTop: '1px dashed #D8C8AC', paddingTop: 12,
              }}>
                <span>STATUS: <strong style={{ color: '#4C7657' }}>{summary.status || 'ACTIVE'}</strong></span>
                <span>·</span>
                <span>GENERATED: {new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* 4 Metric Counters */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[
              { label: 'EVIDENCE RECORDS', value: evidence.length, color: '#4C7657' },
              { label: 'SUSPECTS MAPPED', value: summary.suspects?.length || 0, color: '#8B2E2E' },
              { label: 'TIMELINE EVENTS', value: timeline.length, color: '#B9792E' },
              { label: 'CONTRADICTIONS', value: contradictions.length, color: '#8B2E2E' },
            ].map((m, i) => (
              <div
                key={i}
                style={{
                  background: '#F4ECD8', borderRadius: 2, padding: '16px 20px',
                  border: '1px solid #D8C8AC', boxShadow: '2px 3px 8px rgba(0,0,0,0.3)',
                  textAlign: 'center', color: '#1A140E',
                }}
              >
                <div style={{
                  fontSize: 30, fontWeight: 900,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: m.color, marginBottom: 2,
                }}>
                  {m.value}
                </div>
                <div style={{
                  fontSize: 9, fontWeight: 800, color: '#5D4936',
                  fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.12em',
                }}>
                  {m.label}
                </div>
              </div>
            ))}
          </div>

          {/* Key Findings and Recommendation */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 18 }}>
            
            {/* Key Findings */}
            {summary.keyFindings?.length > 0 && (
              <div style={{
                background: '#F4ECD8', borderRadius: 2, padding: '22px 26px',
                border: '1px solid #D8C8AC', boxShadow: '2px 3px 10px rgba(0,0,0,0.3)',
                color: '#1A140E',
              }}>
                <h3 style={{
                  fontSize: 11, fontWeight: 800, color: '#7A5135',
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 14,
                }}>
                  KEY FORENSIC FINDINGS
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {summary.keyFindings.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <CheckCircle size={15} color="#4C7657" style={{ flexShrink: 0, marginTop: 2 }} />
                      <p style={{
                        fontSize: 13, color: '#1A140E',
                        fontFamily: "'IBM Plex Serif', serif", lineHeight: 1.5,
                      }}>
                        {f}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendation Memo */}
            <div style={{
              background: '#FFF8E9', borderRadius: 2, padding: '22px 26px',
              border: '2px solid #B08A52', boxShadow: '2px 3px 10px rgba(0,0,0,0.3)',
              color: '#1A140E',
            }}>
              <h3 style={{
                fontSize: 11, fontWeight: 800, color: '#8B2E2E',
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12,
              }}>
                INVESTIGATIVE RECOMMENDATION
              </h3>
              <p style={{
                fontSize: 14, color: '#2E1C12',
                fontFamily: "'IBM Plex Serif', serif",
                lineHeight: 1.65, fontStyle: 'italic',
              }}>
                "{summary.recommendation}"
              </p>

              <div style={{
                marginTop: 20, paddingTop: 12, borderTop: '1px dashed #D8C8AC',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{
                  fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 800, color: '#7A5135',
                }}>
                  LEAD DETECTIVE SIGN-OFF: [VERIFIED]
                </span>
                <span style={{
                  fontSize: 18, fontWeight: 900,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: getScoreColor(score),
                }}>
                  {score}% RISK
                </span>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
