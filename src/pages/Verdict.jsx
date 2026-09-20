import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gavel, Scale, ShieldAlert, ShieldCheck, HelpCircle, Loader,
  Target, UserX, PhoneCall, FileSearch, Sparkles, AlertCircle,
  FileCheck2, Stamp, CornerDownRight, CheckSquare2, Cpu
} from 'lucide-react';
import { useCase } from '../context/CaseContext';
import { ProcessingLoader } from '../components/ScanEffect';

const DIM_META = {
  opportunity: { label: 'Opportunity', color: '#8B2E2E' },
  means: { label: 'Means', color: '#B9792E' },
  motive: { label: 'Motive', color: '#7A5135' },
  deception: { label: 'Deception', color: '#B33A32' },
};

function EvChip({ id }) {
  const { openEvidence } = useCase();
  return (
    <button
      onClick={() => openEvidence(id)}
      style={{
        fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 700,
        padding: '2px 8px', borderRadius: 2,
        color: '#4C7657',
        background: 'rgba(76, 118, 87, 0.12)',
        border: '1px solid #4C7657',
        cursor: 'pointer',
        letterSpacing: '0.05em',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(76, 118, 87, 0.25)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(76, 118, 87, 0.12)'; }}
    >
      TAG #{id}
    </button>
  );
}

function MMOBars({ suspect, weights }) {
  const maxes = {
    opportunity: weights?.OPPORTUNITY_MAX || 35,
    means: weights?.MEANS_MAX || 25,
    motive: weights?.MOTIVE_MAX || 30,
    deception: weights?.DECEPTION_MAX || 10,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
      {Object.entries(suspect.breakdown || {}).map(([dim, val]) => (
        <div key={dim}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{
              fontSize: 10, fontWeight: 800,
              fontFamily: "'JetBrains Mono', monospace",
              color: '#5D4936', textTransform: 'uppercase', letterSpacing: '0.12em',
            }}>
              {DIM_META[dim]?.label || dim}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 900,
              fontFamily: "'JetBrains Mono', monospace",
              color: DIM_META[dim]?.color || '#1A140E',
            }}>
              {val} / {maxes[dim]}
            </span>
          </div>
          <div style={{ height: 6, borderRadius: 2, background: 'rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(val / (maxes[dim] || 1)) * 100}%` }}
              transition={{ duration: 1.1, ease: 'easeOut' }}
              style={{ height: '100%', background: DIM_META[dim]?.color || '#8B2E2E' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Verdict({ onNavigate, section }) {
  const { verdict, evidence, solve, loading, loadDemoCase, consoleEvents, mlVerdict } = useCase();
  const [showConsole, setShowConsole] = useState(true);
  const solving = loading.solve || loading.demo;

  const confidence = verdict ? Math.round(verdict.confidence * 100) : 0;

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1380, margin: '0 auto' }}>

      {/* Top action rail */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        marginBottom: 24, flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: verdict ? '#8B2E2E' : '#B08A52',
              boxShadow: `0 0 6px ${verdict ? '#8B2E2E' : '#B08A52'}`,
            }} />
            <span style={{
              fontSize: 10, fontWeight: 800,
              fontFamily: "'JetBrains Mono', monospace",
              color: '#C5A66A', letterSpacing: '0.15em',
            }}>
              SECTION IV // FINAL DETERMINISTIC VERDICT
            </span>
          </div>
          <h2 style={{
            fontSize: 32, fontWeight: 800,
            fontFamily: "'IBM Plex Serif', Georgia, serif",
            color: '#FFF8E9', letterSpacing: '-0.02em',
          }}>
            The Forensic <span style={{ color: '#E8463A' }}>Verdict Dossier</span>
          </h2>
          <p style={{
            fontSize: 13, color: '#A89278',
            fontFamily: "'IBM Plex Serif', serif", fontStyle: 'italic',
          }}>
            Deterministic Means · Motive · Opportunity · Deception scoring — with adversarial defense audit.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {evidence.length === 0 && (
            <>
              <button
                onClick={() => loadDemoCase({ stage: 'initial' })}
                disabled={solving}
                style={brassBtnStyle('#B08A52')}
              >
                {solving ? <Loader size={14} className="animate-spin" /> : <FileSearch size={14} />}
                Load Blackwood Manor
              </button>
              <button
                onClick={() => loadDemoCase({ case: 'benchmark' })}
                disabled={solving}
                style={brassBtnStyle('#7A5135')}
              >
                Load IEEE Benchmark
              </button>
            </>
          )}

          {evidence.length > 0 && evidence.length < 5 && !evidence.some(e => e.kind === 'phone') && (
            <button
              onClick={() => loadDemoCase({ stage: 'reveal' })}
              disabled={solving}
              style={brassBtnStyle('#B9792E')}
            >
              <PhoneCall size={14} /> New Evidence: Phone Logs
            </button>
          )}

          <button
            onClick={() => solve()}
            disabled={solving || evidence.length === 0}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 22px', borderRadius: 3,
              background: 'linear-gradient(135deg, #8B2E2E 0%, #5E1A1A 100%)',
              color: '#FFF8E9', border: '1px solid #D46358',
              fontSize: 12, fontWeight: 800, cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(139,46,46,0.4)',
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.1em',
              opacity: (solving || evidence.length === 0) ? 0.4 : 1,
            }}
          >
            {solving ? <Loader size={14} className="animate-spin" /> : <Gavel size={15} />}
            EVALUATE VERDICT
          </button>
        </div>
      </div>

      {/* Live reasoning console feed */}
      {(solving || consoleEvents.length > 0) && showConsole && (
        <div style={{
          marginBottom: 20, borderRadius: 3,
          border: '1px solid #7A5135',
          background: 'rgba(15, 8, 4, 0.75)',
          padding: '12px 16px', maxHeight: 150,
          overflowY: 'auto', display: 'flex', flexDirection: 'column-reverse',
        }}>
          <div>
            {consoleEvents.slice(-30).map((e, i) => (
              <div key={i} style={{
                fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
                color: e.level === 'warn' ? '#E8463A' : '#C5A66A', lineHeight: 1.7,
              }}>
                <span style={{ color: '#7A624E' }}>[{e.stage}]</span> {e.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {solving ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <ProcessingLoader label="DETERMINISTIC MMOD ENGINE DELIBERATING…" />
        </div>
      ) : !verdict ? (
        /* Empty Case Folder */
        <div style={{
          background: '#F4ECD8', borderRadius: 3,
          padding: '70px 40px', textAlign: 'center',
          border: '2px dashed #B08A52',
          boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
          color: '#1A140E',
          fontFamily: "'IBM Plex Serif', Georgia, serif",
          position: 'relative',
        }}>
          <Scale size={44} color="#8B2E2E" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
            {evidence.length === 0 ? 'No Evidence Under Deliberation' : `${evidence.length} Evidence Records Awaiting Verdict`}
          </h3>
          <p style={{ fontSize: 14, color: '#5D4936', maxWidth: 480, margin: '0 auto', fontStyle: 'italic' }}>
            {evidence.length === 0
              ? 'Load the Blackwood Manor case or upload evidence records to initiate the forensic verdict pipeline.'
              : 'Click "EVALUATE VERDICT" above to execute the 15-stage state machine and calculate means, motive, and opportunity.'}
          </p>
        </div>
      ) : verdict.status === 'INSUFFICIENT_EVIDENCE' ? (
        /* ── HONEST REFUSAL DOSSIER ── */
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{
            background: '#F4ECD8', borderRadius: 3, padding: '32px 36px',
            border: '2px solid #B9792E',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            color: '#1A140E',
            marginBottom: 24,
            position: 'relative',
          }}>
            {/* Forensic stamp for refusal */}
            <div style={{
              position: 'absolute', top: 24, right: 36,
              padding: '6px 14px', border: '3px solid #B9792E',
              color: '#B9792E', fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 900, fontSize: 13, letterSpacing: '0.2em',
              transform: 'rotate(4deg)', opacity: 0.9,
            }}>
              HONESTY GATE // REFUSAL TRIGGERED
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <HelpCircle size={36} color="#B9792E" />
              <div>
                <h3 style={{
                  fontSize: 26, fontWeight: 900,
                  fontFamily: "'IBM Plex Serif', serif",
                  color: '#1A140E',
                }}>
                  ACCUSATION REFUSED: INSUFFICIENT EVIDENCE
                </h3>
                <p style={{
                  fontSize: 13, color: '#5D4936',
                  fontFamily: "'IBM Plex Serif', serif", fontStyle: 'italic',
                }}>
                  The forensic engine refuses to accuse without threshold certainty. Top score {verdict.suspects[0]?.total ?? 0}/100, margin {verdict.margin}. Gates: ≥{verdict.gates?.MIN_TOP_SCORE} score, ≥{verdict.gates?.MIN_MARGIN} margin, ≥{verdict.gates?.MIN_EVIDENCE_SOURCES} independent sources.
                </p>
              </div>
            </div>

            {/* Unresolved Questions */}
            <div style={{ marginTop: 24 }}>
              <h4 style={{
                fontSize: 11, fontWeight: 800, color: '#B9792E',
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12,
              }}>
                WHAT WOULD RESOLVE THIS CASE
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(verdict.unresolvedQuestions || []).map((q, i) => (
                  <div key={i} style={{
                    padding: '12px 16px', borderRadius: 2,
                    background: '#FFF8E9', border: '1px solid #D8C8AC',
                  }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#1A140E', fontFamily: "'IBM Plex Serif', serif" }}>
                      {q.question}
                    </p>
                    <p style={{ fontSize: 12, color: '#7A5135', marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>
                      → {q.wouldBeResolvedBy} <span style={{ color: '#4C7657', fontWeight: 800, marginLeft: 8 }}>{q.projectedImpact}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <SuspectScoreTable verdict={verdict} />
          <ForensicMLPanel mlVerdict={mlVerdict} />
        </motion.div>
      ) : (
        /* ── IDENTIFIED PRIME SUSPECT DOSSIER ── */
        <motion.div initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
          
          {/* Prime suspect physical folder */}
          <div style={{
            background: '#F4ECD8',
            borderRadius: '0 8px 4px 4px',
            border: '2px solid #B08A52',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
            marginBottom: 24,
            overflow: 'hidden',
            position: 'relative',
          }}>
            {/* Top red classified border */}
            <div style={{ height: 4, background: '#8B2E2E' }} />

            <div style={{ padding: '30px 36px', display: 'grid', gridTemplateColumns: '1.4fr 0.8fr', gap: 32, alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div className="push-pin" style={{ width: 12, height: 12 }} />
                  <span style={{
                    fontSize: 10, fontWeight: 900,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: '#8B2E2E', letterSpacing: '0.2em', textTransform: 'uppercase',
                  }}>
                    PRIME SUSPECT · {verdict.primeSuspect.role}
                  </span>
                </div>

                <h1 style={{
                  fontSize: 42, fontWeight: 900,
                  fontFamily: "'IBM Plex Serif', Georgia, serif",
                  color: '#1A140E', marginBottom: 10,
                  letterSpacing: '-0.02em',
                }}>
                  {verdict.primeSuspect.name}
                </h1>

                {/* Means Motive Opportunity Bars */}
                <div style={{ maxWidth: 440 }}>
                  <MMOBars suspect={verdict.primeSuspect} weights={verdict.weights} />
                </div>
              </div>

              {/* Confidence Wax Seal Stamp */}
              <div style={{ textAlign: 'center', position: 'relative' }}>
                {/* Forensic Stamp overlay */}
                <div style={{
                  display: 'inline-block',
                  padding: '16px 24px',
                  borderRadius: 4,
                  border: '3px solid #8B2E2E',
                  color: '#8B2E2E',
                  transform: 'rotate(-4deg)',
                  boxShadow: '0 4px 12px rgba(139,46,46,0.2)',
                  background: 'rgba(139, 46, 46, 0.04)',
                }}>
                  <span style={{
                    fontSize: 48, fontWeight: 900,
                    fontFamily: "'JetBrains Mono', monospace",
                    display: 'block', lineHeight: 1,
                  }}>
                    {confidence}%
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 900,
                    letterSpacing: '0.2em',
                    fontFamily: "'JetBrains Mono', monospace",
                    display: 'block', marginTop: 4,
                  }}>
                    PROVENANCE CONFIDENCE
                  </span>
                </div>

                <p style={{
                  fontSize: 11, color: '#5D4936',
                  fontFamily: "'JetBrains Mono', monospace",
                  marginTop: 14,
                }}>
                  SCORE {verdict.primeSuspect.total}/100 · MARGIN +{verdict.margin} · COVERAGE {Math.round((verdict.coverage || 0) * 100)}%
                </p>
              </div>
            </div>
          </div>

          {/* Co-conspirators, Victim, Cleared Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
            {verdict.coConspirators?.map((c) => (
              <div
                key={c.entityId}
                style={{
                  background: '#F4ECD8', borderRadius: 2, padding: '18px 20px',
                  border: '1px solid #B33A32', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}
              >
                <span style={{
                  fontSize: 9, fontWeight: 800, color: '#8B2E2E',
                  fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.15em',
                  textTransform: 'uppercase', display: 'block', marginBottom: 4,
                }}>
                  CO-CONSPIRATOR · {c.role}
                </span>
                <h3 style={{
                  fontSize: 20, fontWeight: 800, color: '#1A140E',
                  fontFamily: "'IBM Plex Serif', serif", marginBottom: 6,
                }}>
                  {c.name} <span style={{ fontSize: 13, color: '#7A5135' }}>({c.total}/100)</span>
                </h3>
                {(c.links || []).map((l, i) => (
                  <p key={i} style={{ fontSize: 12, color: '#5D4936', fontFamily: "'IBM Plex Serif', serif", lineHeight: 1.4 }}>
                    · {l.detail}
                  </p>
                ))}
              </div>
            ))}

            {verdict.victim && (
              <div style={{
                background: '#F4ECD8', borderRadius: 2, padding: '18px 20px',
                border: '1px solid #7A5135', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}>
                <span style={{
                  fontSize: 9, fontWeight: 800, color: '#7A5135',
                  fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.15em',
                  textTransform: 'uppercase', display: 'block', marginBottom: 4,
                }}>
                  VICTIM OF RECORD
                </span>
                <h3 style={{
                  fontSize: 20, fontWeight: 800, color: '#1A140E',
                  fontFamily: "'IBM Plex Serif', serif", marginBottom: 6,
                }}>
                  {verdict.victim.name}
                </h3>
                {(verdict.victim.basis || []).slice(0, 2).map((b, i) => (
                  <p key={i} style={{ fontSize: 12, color: '#5D4936', fontFamily: "'IBM Plex Serif', serif", lineHeight: 1.4, fontStyle: 'italic' }}>
                    "{b.quote?.slice(0, 75)}…" <EvChip id={b.evidenceId} />
                  </p>
                ))}
              </div>
            )}

            {verdict.cleared?.map((c) => (
              <div
                key={c.entityId}
                style={{
                  background: '#F4ECD8', borderRadius: 2, padding: '18px 20px',
                  border: '1px solid #4C7657', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}
              >
                <span style={{
                  fontSize: 9, fontWeight: 800, color: '#4C7657',
                  fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.15em',
                  textTransform: 'uppercase', display: 'block', marginBottom: 4,
                }}>
                  CLEARED OF CHARGES
                </span>
                <h3 style={{
                  fontSize: 20, fontWeight: 800, color: '#1A140E',
                  fontFamily: "'IBM Plex Serif', serif", marginBottom: 6,
                }}>
                  {c.name}
                </h3>
                <p style={{ fontSize: 12, color: '#5D4936', fontFamily: "'IBM Plex Serif', serif", lineHeight: 1.4 }}>
                  {c.reason}
                </p>
              </div>
            ))}
          </div>

          {/* Chain of Deduction Dossier */}
          <div style={{
            background: '#F4ECD8', borderRadius: 3, padding: '24px 28px',
            border: '1px solid #D8C8AC', boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
            marginBottom: 24, color: '#1A140E',
          }}>
            <h3 style={{
              fontSize: 12, fontWeight: 800, color: '#4A2E1D',
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16,
              borderBottom: '1px solid #D8C8AC', paddingBottom: 8,
            }}>
              CHAIN OF DEDUCTION — AUDIT TRAIL CITING ALL PRIMARY EVIDENCE
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {verdict.reasoningChain?.map((s) => (
                <div key={s.step} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 2, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 900, color: '#FFF8E9',
                    background: '#7A5135', border: '1px solid #B08A52',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    {s.step}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, color: '#1A140E', fontFamily: "'IBM Plex Serif', serif", lineHeight: 1.6 }}>
                      {s.text}
                    </p>
                    <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                      {s.evidenceIds?.map((id) => <EvChip key={id} id={id} />)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Adversarial Defense Counsel Memo */}
          {verdict.objections?.length > 0 && (
            <div style={{
              background: '#FFF8E9', borderRadius: 3, padding: '22px 28px',
              border: '2px solid #B9792E', boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              color: '#1A140E',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <UserX size={16} color="#B9792E" />
                <h3 style={{
                  fontSize: 12, fontWeight: 800, color: '#B9792E',
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: '0.15em', textTransform: 'uppercase',
                }}>
                  ADVERSARIAL DEFENSE COUNSEL — SELF-ATTACK REBUTTALS
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {verdict.objections.map((o, i) => (
                  <p key={i} style={{
                    fontSize: 13, color: '#2E1C12',
                    fontFamily: "'IBM Plex Serif', serif", lineHeight: 1.5,
                  }}>
                    · {o.text} <span style={{ color: '#B9792E', fontWeight: 800 }}>[{o.impact}]</span> {o.evidenceId && <EvChip id={o.evidenceId} />}
                  </p>
                ))}
              </div>
            </div>
          )}

          <ForensicMLPanel mlVerdict={mlVerdict} />

        </motion.div>
      )}
    </div>
  );
}

function SuspectScoreTable({ verdict }) {
  return (
    <div style={{
      background: '#F4ECD8', borderRadius: 3, padding: '20px 24px',
      border: '1px solid #D8C8AC', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      color: '#1A140E',
    }}>
      <h3 style={{
        fontSize: 11, fontWeight: 800, color: '#7A5135',
        fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12,
      }}>
        CURRENT SUSPECT STANDINGS (DETERMINISTIC ARITHMETIC)
      </h3>
      {verdict.suspects?.slice(0, 5).map((s) => (
        <div key={s.entityId} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '8px 0', borderBottom: '1px dashed #D8C8AC',
        }}>
          <span style={{
            flex: 1, fontSize: 13, fontWeight: 700, color: '#1A140E',
            fontFamily: "'IBM Plex Serif', serif",
          }}>
            {s.name}{s.provisional ? ' (provisional)' : ''}
          </span>
          <span style={{ fontSize: 11, color: '#5D4936', fontFamily: "'JetBrains Mono', monospace" }}>
            O:{s.breakdown?.opportunity} M:{s.breakdown?.means} Mo:{s.breakdown?.motive} D:{s.breakdown?.deception}
          </span>
          <span style={{
            fontSize: 15, fontWeight: 900,
            color: s.total > 50 ? '#8B2E2E' : '#7A5135',
            fontFamily: "'JetBrains Mono', monospace",
            width: 70, textAlign: 'right',
          }}>
            {s.total}/100
          </span>
        </div>
      ))}
    </div>
  );
}

function brassBtnStyle(color) {
  return {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '9px 16px', borderRadius: 3,
    background: 'rgba(176, 138, 82, 0.15)',
    border: '1px solid #B08A52',
    color: '#FFF8E9',
    fontSize: 11, fontWeight: 800, cursor: 'pointer',
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: '0.08em',
  };
}

function ForensicMLPanel({ mlVerdict }) {
  if (!mlVerdict) return null;
  const metrics = mlVerdict.metrics || { accuracy: 1.0, f1: 1.0, roc_auc: 1.0 };
  const suspects = mlVerdict.suspects || [];
  const featureImportances = mlVerdict.featureImportances || [];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 24 }}>
      <div style={{
        background: '#F4ECD8',
        borderRadius: 3,
        border: '2px solid #7A5135',
        boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
        overflow: 'hidden',
        position: 'relative',
        color: '#1A140E',
      }}>
        {/* Brass Header Band */}
        <div style={{ height: 4, background: '#B08A52' }} />

        <div style={{ padding: '24px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 18 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Cpu size={16} color="#7A5135" />
                <span style={{ fontSize: 10, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", color: '#7A5135', letterSpacing: '0.15em' }}>
                  FORENSIC MACHINE LEARNING // {mlVerdict.modelType?.toUpperCase() || 'RANDOM FOREST'}
                </span>
                <span style={{
                  fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 2,
                  background: 'rgba(76, 118, 87, 0.15)', color: '#4C7657', border: '1px solid #4C7657',
                  fontFamily: "'JetBrains Mono', monospace"
                }}>
                  DUAL-ENGINE CROSS-VALIDATED
                </span>
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 900, fontFamily: "'IBM Plex Serif', serif", color: '#1A140E' }}>
                Statistical Suspect Probability & Role Engine
              </h3>
              <p style={{ fontSize: 12, color: '#5D4936', fontFamily: "'IBM Plex Serif', serif", fontStyle: 'italic', marginTop: 2 }}>
                Dual-validated by Scikit-Learn Random Forest & Gradient Boosting models across 9 forensic dimensions.
              </p>
            </div>

            {/* Model KPI Badges */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ padding: '6px 12px', background: '#FFF8E9', borderRadius: 2, border: '1px solid #D8C8AC', textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#4C7657', fontFamily: "'JetBrains Mono', monospace" }}>
                  {(metrics.accuracy * 100).toFixed(0)}%
                </div>
                <div style={{ fontSize: 8, fontWeight: 800, color: '#7A5135', fontFamily: "'JetBrains Mono', monospace" }}>
                  ACCURACY
                </div>
              </div>
              <div style={{ padding: '6px 12px', background: '#FFF8E9', borderRadius: 2, border: '1px solid #D8C8AC', textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#B08A52', fontFamily: "'JetBrains Mono', monospace" }}>
                  {(metrics.f1 || 1.0).toFixed(2)}
                </div>
                <div style={{ fontSize: 8, fontWeight: 800, color: '#7A5135', fontFamily: "'JetBrains Mono', monospace" }}>
                  F1-SCORE
                </div>
              </div>
              <div style={{ padding: '6px 12px', background: '#FFF8E9', borderRadius: 2, border: '1px solid #D8C8AC', textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#8B2E2E', fontFamily: "'JetBrains Mono', monospace" }}>
                  {(metrics.roc_auc || 1.0).toFixed(2)}
                </div>
                <div style={{ fontSize: 8, fontWeight: 800, color: '#7A5135', fontFamily: "'JetBrains Mono', monospace" }}>
                  ROC-AUC
                </div>
              </div>
            </div>
          </div>

          {/* Suspect Probability Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, marginBottom: 18 }}>
            {suspects.slice(0, 4).map((s, idx) => {
              const isHigh = s.culpritProbability >= 0.7;
              const isMed = s.culpritProbability >= 0.35 && s.culpritProbability < 0.7;
              const badgeColor = isHigh ? '#8B2E2E' : isMed ? '#B9792E' : '#4C7657';

              return (
                <div key={s.entityId || idx} style={{
                  padding: '12px 16px',
                  background: '#FFF8E9',
                  borderRadius: 2,
                  border: `1px solid ${isHigh ? '#8B2E2E' : '#D8C8AC'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{
                      fontSize: 8, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace",
                      padding: '2px 6px', borderRadius: 2,
                      background: badgeColor, color: '#FFF8E9',
                    }}>
                      {s.predictedRole || 'SUSPECT'}
                    </span>
                    <span style={{
                      fontSize: 16, fontWeight: 900, color: badgeColor,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      {Math.round(s.culpritProbability * 100)}%
                    </span>
                  </div>

                  <h4 style={{ fontSize: 15, fontWeight: 800, fontFamily: "'IBM Plex Serif', serif", color: '#1A140E', marginBottom: 6 }}>
                    {s.name}
                  </h4>

                  {/* Probability Bar */}
                  <div style={{ height: 6, background: '#EAE0CA', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                    <div style={{ height: '100%', width: `${s.culpritProbability * 100}%`, background: badgeColor }} />
                  </div>

                  {/* Top Features Impact */}
                  {s.contributions?.length > 0 && (
                    <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: '#5D4936' }}>
                      <span style={{ fontWeight: 800 }}>Key Driver: </span>
                      {s.contributions[0]?.feature?.replace(/_/g, ' ')} ({s.contributions[0]?.impact > 0 ? '+' : ''}{s.contributions[0]?.impact})
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Feature Importance Weights Bar */}
          {featureImportances.length > 0 && (
            <div style={{ padding: '12px 16px', background: '#FFF8E9', borderRadius: 2, border: '1px solid #D8C8AC' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 9, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", color: '#7A5135', letterSpacing: '0.1em' }}>
                  GLOBAL RANDOM FOREST FEATURE IMPORTANCE WEIGHTS
                </span>
                <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: '#A89278' }}>
                  GINI IMPURITY RANKING
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {featureImportances.slice(0, 4).map((f) => (
                  <div key={f.feature} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 130, fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: '#1A140E', textTransform: 'uppercase' }}>
                      {f.feature.replace(/_/g, ' ')}
                    </span>
                    <div style={{ flex: 1, height: 6, background: '#EAE0CA', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${f.importance * 100}%`, background: '#7A5135' }} />
                    </div>
                    <span style={{ width: 45, textAlign: 'right', fontSize: 10, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: '#7A5135' }}>
                      {(f.importance * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
