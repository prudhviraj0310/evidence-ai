import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, Users, FileSearch, AlertTriangle, Eye, Inbox,
  ChevronRight, ShieldAlert, Cpu, Gavel, Play, CheckCircle2,
  Clock, ShieldCheck, Film, CornerDownRight, Sparkles, FolderOpen
} from 'lucide-react';
import { useCase } from '../context/CaseContext';

// 10 Key pipeline stages matching Step Functions state machine
const PIPELINE_STAGES = [
  { id: 'INGEST', name: 'Evidence Ingestion', phase: 'intake' },
  { id: 'VALIDATE', name: 'Schema & Cryptographic Hash', phase: 'intake' },
  { id: 'PARSE', name: 'OCR & Signal Decomposition', phase: 'intake' },
  { id: 'EXTRACT', name: 'AI Claim Extraction', phase: 'analysis' },
  { id: 'RESOLVE_ENTITIES', name: 'Entity Resolution', phase: 'analysis' },
  { id: 'BUILD_TIMELINE', name: 'Chronological Reconstruction', phase: 'analysis' },
  { id: 'CORRELATE', name: 'Cross-Evidence Correlation', phase: 'reasoning' },
  { id: 'SCORE_HYPOTHESES', name: 'Means · Motive · Opportunity', phase: 'reasoning' },
  { id: 'DEFENSE_COUNSEL', name: 'Defense Counsel Objection Test', phase: 'reasoning' },
  { id: 'HONESTY_GATE', name: 'Honesty Gate (Refusal Check)', phase: 'verdict' },
  { id: 'VERDICT', name: 'Final Deterministic Verdict', phase: 'verdict' },
];

function StatPaperCard({ index, label, value, sub, isAlert, badge, onClick }) {
  return (
    <motion.div
      whileHover={{ y: -2, rotate: index % 2 === 0 ? 0.5 : -0.5 }}
      onClick={onClick}
      style={{
        background: '#F4ECD8',
        color: '#1A140E',
        borderRadius: 2,
        padding: '16px 18px',
        position: 'relative',
        boxShadow: '3px 4px 12px rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.2)',
        border: '1px solid #D8C8AC',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        fontFamily: "'IBM Plex Serif', Georgia, serif",
      }}
    >
      {/* Brass paperclip accent in top-left */}
      <div style={{
        position: 'absolute', top: -7, left: 16,
        width: 10, height: 20, borderRadius: 5,
        border: '2px solid #B08A52',
        background: 'transparent',
        boxShadow: '1px 1px 2px rgba(0,0,0,0.3)',
        zIndex: 5,
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingTop: 4 }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9, fontWeight: 800,
          color: isAlert ? '#8B2E2E' : '#7A5135',
          letterSpacing: '0.15em',
        }}>
          [{index}] {label}
        </span>
        {badge && (
          <span style={{
            fontSize: 8, fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 800, padding: '1px 5px', borderRadius: 2,
            background: isAlert ? '#8B2E2E' : '#4C7657',
            color: '#FFF8E9', letterSpacing: '0.1em',
          }}>
            {badge}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <h3 style={{
          fontSize: 32, fontWeight: 900,
          color: isAlert ? '#8B2E2E' : '#1A140E',
          lineHeight: 1, letterSpacing: '-0.02em',
        }}>
          {value}
        </h3>
      </div>

      {sub && (
        <p style={{
          fontSize: 11, marginTop: 8,
          color: '#5D4936',
          fontStyle: 'italic',
          lineHeight: 1.3,
          borderTop: '1px dashed #D8C8AC',
          paddingTop: 6,
        }}>
          {sub}
        </p>
      )}
    </motion.div>
  );
}

export default function Dashboard({ onNavigate }) {
  const { evidence, contradictions, summary, verdict, timeline, loading, solve, loadDemoCase, openEvidence } = useCase();
  const [pipelineExpanded, setPipelineExpanded] = useState(true);

  const avgSuspicion = evidence.length > 0
    ? Math.round(evidence.reduce((a, e) => a + (e.suspicionScore || 0), 0) / evidence.length)
    : 0;
  const suspects = summary?.suspects || (verdict?.suspects ? verdict.suspects.map(s => ({ name: s.name, risk: s.total, status: s.role || 'SUSPECT' })) : []);

  const isSolved = !!verdict;
  const isSolving = loading.solve || loading.demo;

  // Pipeline execution state
  const isStageComplete = (stageId) => {
    if (evidence.length === 0) return false;
    if (stageId === 'INGEST' || stageId === 'VALIDATE' || stageId === 'PARSE') return true;
    if (stageId === 'EXTRACT' || stageId === 'RESOLVE_ENTITIES') return evidence.length > 0;
    if (stageId === 'BUILD_TIMELINE') return timeline.length > 0;
    if (stageId === 'CORRELATE') return evidence.length > 1;
    if (stageId === 'SCORE_HYPOTHESES' || stageId === 'DEFENSE_COUNSEL' || stageId === 'HONESTY_GATE' || stageId === 'VERDICT') {
      return isSolved;
    }
    return false;
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1440, margin: '0 auto' }}>

      {/* ── MANILA CASE FILE HEADER ── */}
      <div style={{
        background: 'linear-gradient(135deg, #C5A66A 0%, #B08A52 20%, #BFA064 40%, #B08A52 100%)',
        borderRadius: '0 8px 4px 4px',
        padding: '22px 28px',
        color: '#1A140E',
        position: 'relative',
        boxShadow: '0 6px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.4)',
        border: '1px solid #99743D',
        marginBottom: 24,
      }}>
        {/* Manila folder tab at top-left */}
        <div style={{
          position: 'absolute', top: -18, left: 0,
          width: 220, height: 19,
          background: 'linear-gradient(135deg, #C5A66A 0%, #B08A52 100%)',
          borderRadius: '6px 6px 0 0',
          borderTop: '1px solid #D4B978',
          borderLeft: '1px solid #99743D',
          borderRight: '1px solid #99743D',
          display: 'flex', alignItems: 'center', padding: '0 14px',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
        }}>
          <span style={{
            fontSize: 9, fontWeight: 900, letterSpacing: '0.18em',
            fontFamily: "'JetBrains Mono', monospace",
            color: '#1A140E', textTransform: 'uppercase',
          }}>
            CASE DOSSIER // OFFICIAL
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12, fontWeight: 800, color: '#4A2E1D',
                letterSpacing: '0.1em',
              }}>
                {summary?.caseId || (evidence.length > 0 ? 'CASE-2026-0884A' : 'DOSSIER #UNASSIGNED')}
              </span>
              <span style={{
                padding: '2px 8px', borderRadius: 2,
                border: '1px solid #8B2E2E',
                color: '#8B2E2E',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9, fontWeight: 800, letterSpacing: '0.15em',
                background: 'rgba(139, 46, 46, 0.1)',
                textTransform: 'uppercase',
              }}>
                CONFIDENTIAL // LAW ENFORCEMENT ONLY
              </span>
            </div>

            <h1 style={{
              fontSize: 28, fontWeight: 800,
              fontFamily: "'IBM Plex Serif', Georgia, serif",
              color: '#17110B',
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              textShadow: '0 1px 0 rgba(255,255,255,0.4)',
            }}>
              {summary?.title || 'Blackwood Manor Estate // Suspected Homicide & Arson'}
            </h1>

            <p style={{
              fontSize: 13, color: '#4A3622',
              fontFamily: "'IBM Plex Serif', Georgia, serif",
              marginTop: 6, maxWidth: 680, fontStyle: 'italic',
            }}>
              Multi-source intelligence correlation with deterministic means-motive-opportunity arithmetic and adversarial defense verification.
            </p>
          </div>

          {/* Action buttons styled as stamped brass badges */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {evidence.length === 0 ? (
              <button
                onClick={() => loadDemoCase({ stage: 'initial' })}
                disabled={isSolving}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 18px', borderRadius: 3,
                  background: 'linear-gradient(135deg, #3A2418 0%, #20120A 100%)',
                  color: '#FFF8E9', border: '1px solid #C5A66A',
                  fontSize: 12, fontWeight: 800, cursor: 'pointer',
                  boxShadow: '0 3px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: '0.08em',
                }}
              >
                <Sparkles size={14} color="#C5A66A" />
                LOAD BLACKWOOD CASE
              </button>
            ) : (
              <>
                <button
                  onClick={() => onNavigate?.('upload')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '10px 16px', borderRadius: 3,
                    background: 'rgba(58, 36, 24, 0.15)',
                    color: '#2A180E', border: '1px solid #7A5135',
                    fontSize: 11, fontWeight: 800, cursor: 'pointer',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  <FolderOpen size={14} /> INTAKE MORE EVIDENCE
                </button>
                <button
                  onClick={() => { solve(); onNavigate?.('verdict'); }}
                  disabled={isSolving}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 20px', borderRadius: 3,
                    background: 'linear-gradient(135deg, #8B2E2E 0%, #5E1A1A 100%)',
                    color: '#FFF8E9', border: '1px solid #D46358',
                    fontSize: 12, fontWeight: 800, cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(139,46,46,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: '0.1em',
                  }}
                >
                  <Gavel size={15} color="#FFF8E9" />
                  {isSolved ? 'RE-EVALUATE VERDICT' : 'RUN SOLVE PIPELINE'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── 4 PHYSICAL STAT CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, marginBottom: 26 }}>
        <StatPaperCard
          index="01"
          label="EVIDENCE DOSSIERS"
          value={evidence.length}
          sub={evidence.length > 0 ? `${evidence.length} physical logs, calls & CCTV clips verified` : 'Awaiting initial evidence intake'}
          badge={evidence.length > 0 ? 'INGESTED' : 'STANDBY'}
          onClick={() => onNavigate?.('upload')}
        />
        <StatPaperCard
          index="02"
          label="PERSONS OF INTEREST"
          value={suspects.length}
          sub={suspects.length > 0 ? `${suspects.length} entities mapped in relationship graph` : 'Identities mapped upon intake'}
          badge={suspects.length > 0 ? 'PROFILED' : '—'}
          onClick={() => onNavigate?.('network')}
        />
        <StatPaperCard
          index="03"
          label="CONTRADICTIONS"
          value={contradictions.length}
          sub={contradictions.length > 0 ? `${contradictions.length} logical breaches in testimony detected` : 'No conflicting claims detected'}
          isAlert={contradictions.length > 0}
          badge={contradictions.length > 0 ? 'CRITICAL' : 'CLEAR'}
          onClick={() => onNavigate?.('contradictions')}
        />
        <StatPaperCard
          index="04"
          label="THREAT VECTOR"
          value={evidence.length > 0 ? `${avgSuspicion}%` : '—'}
          sub={avgSuspicion > 50 ? 'High probability of deliberate conspiracy' : 'Standard baseline surveillance'}
          isAlert={avgSuspicion > 50}
          badge={avgSuspicion > 50 ? 'ELEVATED' : 'BASELINE'}
          onClick={() => onNavigate?.('verdict')}
        />
      </div>

      {/* ── CASE PROCESSING PIPELINE (AWS STEP FUNCTIONS STATE MACHINE) ── */}
      <div style={{
        background: '#24160E',
        borderRadius: 4,
        border: '1px solid #7A5135',
        boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
        marginBottom: 26,
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '14px 20px',
          background: 'linear-gradient(180deg, #331F14 0%, #28180F 100%)',
          borderBottom: '1px solid #5A3924',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Activity size={16} color="#C5A66A" />
            <div>
              <h3 style={{
                fontSize: 13, fontWeight: 800,
                fontFamily: "'JetBrains Mono', monospace",
                color: '#FFF8E9', letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}>
                AWS STEP FUNCTIONS // EVIDENCE_CASE_PIPELINE
              </h3>
              <p style={{ fontSize: 10, color: '#A89278', fontFamily: "'JetBrains Mono', monospace" }}>
                STATE MACHINE EXECUTION TRACE · DETERMINISTIC AUDIT CHAIN
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700, color: isSolved ? '#5A9468' : evidence.length > 0 ? '#C5A66A' : '#7A5135',
              padding: '3px 8px', borderRadius: 2,
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid #5A3924',
            }}>
              {isSolved ? 'EXECUTION STATUS: SUCCEEDED' : evidence.length > 0 ? 'EXECUTION STATUS: RUNNING' : 'EXECUTION STATUS: READY'}
            </span>
            <button
              onClick={() => setPipelineExpanded(!pipelineExpanded)}
              style={{ background: 'none', border: 'none', color: '#C5A66A', cursor: 'pointer', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
            >
              {pipelineExpanded ? '[COLLAPSE]' : '[EXPAND]'}
            </button>
          </div>
        </div>

        {pipelineExpanded && (
          <div style={{ padding: '18px 20px', background: 'rgba(15, 8, 4, 0.4)' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 10,
            }}>
              {PIPELINE_STAGES.map((st, idx) => {
                const done = isStageComplete(st.id);
                return (
                  <div
                    key={st.id}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 3,
                      background: done
                        ? 'linear-gradient(135deg, rgba(76, 118, 87, 0.15) 0%, rgba(40, 24, 15, 0.6) 100%)'
                        : 'rgba(0,0,0,0.3)',
                      border: done ? '1px solid #4C7657' : '1px solid rgba(122, 81, 53, 0.25)',
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}
                  >
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: done ? '#4C7657' : 'rgba(0,0,0,0.4)',
                      border: done ? '1px solid #5A9468' : '1px solid #7A5135',
                      color: done ? '#FFF8E9' : '#7A5135',
                      fontSize: 10, fontWeight: 900,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      {done ? '✓' : idx + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: 11, fontWeight: 700,
                        color: done ? '#FFF8E9' : '#9E8568',
                        fontFamily: "'JetBrains Mono', monospace",
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {st.id}
                      </p>
                      <p style={{ fontSize: 9, color: '#7A624E', fontFamily: "'Inter', sans-serif" }}>
                        {st.name}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── TWO COLUMN LOWER DECK: LIVE SURVEILLANCE & SUSPECT GALLERY ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.2fr', gap: 24 }}>

        {/* CCTV & Evidence Feed */}
        <div style={{
          background: '#24160E',
          borderRadius: 4,
          border: '1px solid #7A5135',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* CRT CCTV Header */}
          <div style={{
            padding: '12px 18px',
            background: 'linear-gradient(180deg, #331F14 0%, #28180F 100%)',
            borderBottom: '1px solid #5A3924',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="cctv-live-dot" />
              <h3 style={{
                fontSize: 12, fontWeight: 800,
                fontFamily: "'JetBrains Mono', monospace",
                color: '#FFF8E9', letterSpacing: '0.1em',
              }}>
                LIVE INTEL FEED // FORENSIC INGESTION LOG
              </h3>
            </div>
            <span style={{
              fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
              color: '#C5A66A', letterSpacing: '0.1em',
            }}>
              CAM-04 · BLACKWOOD EAST
            </span>
          </div>

          {/* Evidence items list */}
          <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {evidence.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                <Film size={36} color="#7A5135" style={{ margin: '0 auto 12px' }} />
                <p style={{
                  fontFamily: "'IBM Plex Serif', serif",
                  fontSize: 14, color: '#A89278', fontStyle: 'italic',
                }}>
                  No evidence reels currently loaded into the intake vault.
                </p>
                <button
                  onClick={() => loadDemoCase({ stage: 'initial' })}
                  style={{
                    marginTop: 14, padding: '8px 16px', borderRadius: 3,
                    background: 'rgba(176, 138, 82, 0.15)', border: '1px solid #B08A52',
                    color: '#FFF8E9', fontSize: 11, cursor: 'pointer',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  LOAD BENCHMARK EVIDENCE
                </button>
              </div>
            ) : (
              evidence.slice(0, 5).map((ev, i) => (
                <div
                  key={ev.evidenceId || i}
                  onClick={() => openEvidence(ev.evidenceId)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', borderRadius: 2,
                    background: 'rgba(15, 8, 4, 0.5)',
                    border: '1px solid rgba(122, 81, 53, 0.3)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(176, 138, 82, 0.12)';
                    e.currentTarget.style.borderColor = '#B08A52';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(15, 8, 4, 0.5)';
                    e.currentTarget.style.borderColor = 'rgba(122, 81, 53, 0.3)';
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 2,
                    background: '#1A0E08', border: '1px solid #5A3924',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Film size={14} color="#C5A66A" />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 13, fontWeight: 700, color: '#FFF8E9',
                      fontFamily: "'IBM Plex Serif', serif",
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {ev.summary || ev.fileName}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                      <span style={{
                        fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
                        color: '#C5A66A', fontWeight: 700,
                      }}>
                        {ev.evidenceId}
                      </span>
                      <span style={{ fontSize: 9, color: '#7A624E', textTransform: 'uppercase' }}>
                        {ev.metadata?.contentType || ev.fileType || 'RECORD'}
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', padding: '0 8px' }}>
                    <p style={{
                      fontSize: 16, fontWeight: 900,
                      fontFamily: "'JetBrains Mono', monospace",
                      color: ev.suspicionScore > 75 ? '#E8463A' : '#C5A66A',
                    }}>
                      {ev.suspicionScore || 0}%
                    </p>
                    <p style={{ fontSize: 8, color: '#7A624E', textTransform: 'uppercase', letterSpacing: '0.1em' }}>RISK</p>
                  </div>

                  <ChevronRight size={14} color="#7A5135" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pinned Suspects Wall (Polaroid style) */}
        <div style={{
          background: '#24160E',
          borderRadius: 4,
          border: '1px solid #7A5135',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            padding: '12px 18px',
            background: 'linear-gradient(180deg, #331F14 0%, #28180F 100%)',
            borderBottom: '1px solid #5A3924',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="push-pin" style={{ width: 10, height: 10 }} />
              <h3 style={{
                fontSize: 12, fontWeight: 800,
                fontFamily: "'JetBrains Mono', monospace",
                color: '#FFF8E9', letterSpacing: '0.1em',
              }}>
                TARGET GALLERY // PERSONS OF INTEREST
              </h3>
            </div>
            <span style={{
              fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
              color: '#C5A66A', letterSpacing: '0.1em',
            }}>
              {suspects.length} PROFILED
            </span>
          </div>

          <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {suspects.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                <Users size={36} color="#7A5135" style={{ margin: '0 auto 12px' }} />
                <p style={{
                  fontFamily: "'IBM Plex Serif', serif",
                  fontSize: 14, color: '#A89278', fontStyle: 'italic',
                }}>
                  Suspect dossiers will populate as evidence is processed.
                </p>
              </div>
            ) : (
              suspects.slice(0, 4).map((s, idx) => {
                const risk = s.risk ?? 0;
                const isPrime = risk >= 70;
                return (
                  <div
                    key={s.name || idx}
                    style={{
                      padding: '12px 14px', borderRadius: 2,
                      background: isPrime
                        ? 'linear-gradient(135deg, rgba(139, 46, 46, 0.15) 0%, rgba(30, 16, 10, 0.6) 100%)'
                        : 'rgba(15, 8, 4, 0.5)',
                      border: isPrime ? '1px solid #8B2E2E' : '1px solid rgba(122, 81, 53, 0.3)',
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 2,
                          background: isPrime ? '#8B2E2E' : '#4A2E1D',
                          border: isPrime ? '1px solid #D46358' : '1px solid #7A5135',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#FFF8E9', fontWeight: 900,
                          fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
                        }}>
                          {s.name?.[0] || '?'}
                        </div>
                        <div>
                          <p style={{
                            fontSize: 13, fontWeight: 800,
                            fontFamily: "'IBM Plex Serif', serif",
                            color: '#FFF8E9',
                          }}>
                            {s.name}
                          </p>
                          <p style={{
                            fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
                            color: isPrime ? '#D46358' : '#A89278',
                            letterSpacing: '0.1em', textTransform: 'uppercase',
                          }}>
                            {s.status || (isPrime ? 'PRIME SUSPECT' : 'ALIBI UNCONFIRMED')}
                          </p>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{
                          fontSize: 17, fontWeight: 900,
                          fontFamily: "'JetBrains Mono', monospace",
                          color: isPrime ? '#E8463A' : '#C5A66A',
                        }}>
                          {risk}%
                        </span>
                        <p style={{ fontSize: 8, color: '#7A624E', textTransform: 'uppercase' }}>INDEX</p>
                      </div>
                    </div>

                    {/* Threat probability bar */}
                    <div style={{ height: 4, background: 'rgba(0,0,0,0.4)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${risk}%`,
                        background: isPrime
                          ? 'linear-gradient(90deg, #8B2E2E, #E8463A)'
                          : 'linear-gradient(90deg, #7A5135, #B08A52)',
                        boxShadow: isPrime ? '0 0 6px rgba(232, 70, 58, 0.6)' : 'none',
                      }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
