import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gavel, Scale, ShieldAlert, ShieldCheck, HelpCircle, Loader, Target, UserX, PhoneCall, FileSearch } from 'lucide-react';
import { useCase } from '../context/CaseContext';
import { ProcessingLoader } from '../components/ScanEffect';

const DIM_META = {
  opportunity: { label: 'Opportunity', color: '#ef4444' },
  means: { label: 'Means', color: '#f59e0b' },
  motive: { label: 'Motive', color: '#ec4899' },
  deception: { label: 'Deception', color: '#8b5cf6' },
};

function EvChip({ id }) {
  const { openEvidence } = useCase();
  return (
    <button onClick={() => openEvidence(id)}
      style={{ fontSize: 10, fontFamily: 'monospace', padding: '2px 7px', borderRadius: 6, color: '#a5b4fc', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', cursor: 'pointer' }}>
      {id}
    </button>
  );
}

function MMOBars({ suspect, weights }) {
  const maxes = { opportunity: weights?.OPPORTUNITY_MAX || 35, means: weights?.MEANS_MAX || 25, motive: weights?.MOTIVE_MAX || 30, deception: weights?.DECEPTION_MAX || 10 };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Object.entries(suspect.breakdown).map(([dim, val]) => (
        <div key={dim}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{DIM_META[dim].label}</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: DIM_META[dim].color }}>{val}/{maxes[dim]}</span>
          </div>
          <div style={{ height: 6, borderRadius: 6, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${(val / maxes[dim]) * 100}%` }} transition={{ duration: 1.1, ease: 'easeOut' }}
              style={{ height: '100%', borderRadius: 6, background: DIM_META[dim].color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Verdict() {
  const { verdict, evidence, solve, loading, loadDemoCase, consoleEvents } = useCase();
  const [showConsole, setShowConsole] = useState(true);
  const solving = loading.solve || loading.demo;

  const confidence = verdict ? Math.round(verdict.confidence * 100) : 0;

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: 'white', marginBottom: 6 }}>
            The <span style={{ color: '#ef4444' }}>Verdict</span>
          </h2>
          <p style={{ fontSize: 14, color: '#6b7280' }}>
            Deterministic means · motive · opportunity · deception scoring — every point cites evidence
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {evidence.length === 0 && (
            <>
              <button onClick={() => loadDemoCase({ stage: 'initial' })} disabled={solving} style={btnStyle('#6366f1')}>
                {solving ? <Loader size={15} /> : <FileSearch size={15} />} Load Demo Case
              </button>
              <button onClick={() => loadDemoCase({ case: 'benchmark' })} disabled={solving} style={btnStyle('#0ea5e9')}>
                Load IEEE VAST Benchmark
              </button>
            </>
          )}
          {evidence.length > 0 && evidence.length < 5 && !evidence.some(e => e.kind === 'phone') && (
            <button onClick={() => loadDemoCase({ stage: 'reveal' })} disabled={solving} style={btnStyle('#f59e0b')}>
              <PhoneCall size={15} /> New Evidence: Phone Records
            </button>
          )}
          <button onClick={() => solve()} disabled={solving || evidence.length === 0} style={btnStyle('#ef4444')}>
            {solving ? <Loader size={15} className="animate-spin" /> : <Gavel size={15} />} SOLVE CASE
          </button>
        </div>
      </div>

      {/* Live reasoning console */}
      {(solving || consoleEvents.length > 0) && showConsole && (
        <div style={{ marginBottom: 20, borderRadius: 14, border: '1px solid rgba(99,102,241,0.15)', background: 'rgba(0,0,0,0.45)', padding: '12px 16px', maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column-reverse' }}>
          <div>
            {consoleEvents.slice(-40).map((e, i) => (
              <div key={i} style={{ fontSize: 11, fontFamily: 'monospace', color: e.level === 'warn' ? '#fbbf24' : '#8b9cf5', lineHeight: 1.8 }}>
                <span style={{ color: '#4b5563' }}>[{e.stage}]</span> {e.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {solving ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}><ProcessingLoader label="Reasoning over the evidence graph…" /></div>
      ) : !verdict ? (
        <div style={{ borderRadius: 20, padding: '80px 40px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Scale size={40} color="#818cf8" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 8 }}>
            {evidence.length === 0 ? 'No Evidence Loaded' : `${evidence.length} evidence file(s) ready`}
          </h3>
          <p style={{ fontSize: 13, color: '#6b7280' }}>
            {evidence.length === 0 ? 'Load the demo case or upload evidence, then hit SOLVE CASE.' : 'Hit SOLVE CASE to run the full reasoning pipeline.'}
          </p>
        </div>
      ) : verdict.status === 'INSUFFICIENT_EVIDENCE' ? (
        /* ── HONEST REFUSAL ── */
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ borderRadius: 20, padding: 32, background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.25)', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <HelpCircle size={30} color="#f59e0b" />
              <div>
                <h3 style={{ fontSize: 24, fontWeight: 900, color: '#fbbf24' }}>INSUFFICIENT EVIDENCE</h3>
                <p style={{ fontSize: 13, color: '#9ca3af' }}>
                  The engine refuses to accuse: top score {verdict.suspects[0]?.total ?? 0}/100, margin {verdict.margin}. Gates: ≥{verdict.gates?.MIN_TOP_SCORE} score, ≥{verdict.gates?.MIN_MARGIN} margin, ≥{verdict.gates?.MIN_EVIDENCE_SOURCES} independent sources.
                </p>
              </div>
            </div>
            <h4 style={{ fontSize: 11, fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.2em', margin: '18px 0 10px' }}>What would resolve this case</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {verdict.unresolvedQuestions.map((q, i) => (
                <div key={i} style={{ padding: 14, borderRadius: 12, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(245,158,11,0.15)' }}>
                  <p style={{ fontSize: 14, color: '#e5e7eb', marginBottom: 6 }}>{q.question}</p>
                  <p style={{ fontSize: 12, color: '#f59e0b' }}>→ {q.wouldBeResolvedBy} <span style={{ color: '#34d399', fontWeight: 700, marginLeft: 8 }}>{q.projectedImpact}</span></p>
                </div>
              ))}
            </div>
          </div>
          <SuspectTable verdict={verdict} />
        </motion.div>
      ) : (
        /* ── IDENTIFIED ── */
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
          {/* Prime suspect hero */}
          <div style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(239,68,68,0.3)', background: 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(0,0,0,0.2))', marginBottom: 20 }}>
            <div style={{ height: 3, background: 'linear-gradient(90deg, #ef4444, #ec4899)' }} />
            <div style={{ padding: 30, display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 900, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: 10 }}>
                  <Target size={12} style={{ display: 'inline', marginRight: 6 }} />Prime Suspect · {verdict.primeSuspect.role}
                </p>
                <h1 style={{ fontSize: 44, fontWeight: 900, color: 'white', marginBottom: 10, textShadow: '0 0 30px rgba(239,68,68,0.3)' }}>
                  {verdict.primeSuspect.name}
                </h1>
                <div style={{ maxWidth: 420 }}>
                  <MMOBars suspect={verdict.primeSuspect} weights={verdict.weights} />
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring' }}
                  style={{ width: 130, height: 130, borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '3px solid #ef4444', boxShadow: '0 0 40px rgba(239,68,68,0.35)', background: 'rgba(0,0,0,0.4)' }}>
                  <span style={{ fontSize: 38, fontWeight: 900, color: '#ef4444' }}>{confidence}%</span>
                  <span style={{ fontSize: 8, fontWeight: 800, color: '#9ca3af', letterSpacing: '0.2em' }}>CONFIDENCE</span>
                </motion.div>
                <p style={{ fontSize: 10, color: '#6b7280', marginTop: 10 }}>score {verdict.primeSuspect.total}/100 · margin {verdict.margin} · coverage {Math.round((verdict.coverage || 0) * 100)}%</p>
              </div>
            </div>
          </div>

          {/* Co-conspirators + victim */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 20 }}>
            {verdict.coConspirators.map((c) => (
              <div key={c.entityId} style={{ borderRadius: 16, padding: 20, background: 'rgba(236,72,153,0.05)', border: '1px solid rgba(236,72,153,0.2)' }}>
                <p style={{ fontSize: 9, fontWeight: 900, color: '#ec4899', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 6 }}><ShieldAlert size={11} style={{ display: 'inline', marginRight: 5 }} />Co-conspirator · {c.role}</p>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 10 }}>{c.name} <span style={{ fontSize: 13, color: '#9ca3af' }}>{c.total}/100</span></h3>
                {(c.links || []).map((l, i) => <p key={i} style={{ fontSize: 12, color: '#d1d5db', lineHeight: 1.6 }}>· {l.detail}</p>)}
              </div>
            ))}
            {verdict.victim && (
              <div style={{ borderRadius: 16, padding: 20, background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <p style={{ fontSize: 9, fontWeight: 900, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 6 }}>Victim</p>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 10 }}>{verdict.victim.name}</h3>
                {(verdict.victim.basis || []).slice(0, 2).map((b, i) => (
                  <p key={i} style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.6 }}>"{b.quote.slice(0, 80)}…" <EvChip id={b.evidenceId} /></p>
                ))}
              </div>
            )}
            {verdict.cleared.map((c) => (
              <div key={c.entityId} style={{ borderRadius: 16, padding: 20, background: 'rgba(52,211,153,0.04)', border: '1px solid rgba(52,211,153,0.15)' }}>
                <p style={{ fontSize: 9, fontWeight: 900, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 6 }}><ShieldCheck size={11} style={{ display: 'inline', marginRight: 5 }} />Cleared</p>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 8 }}>{c.name}</h3>
                <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.6 }}>{c.reason}</p>
              </div>
            ))}
          </div>

          {/* Chain of deduction */}
          <div style={{ borderRadius: 18, padding: 26, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 20 }}>
            <h3 style={{ fontSize: 11, fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 16 }}>Chain of Deduction — every step cites its evidence</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {verdict.reasoningChain.map((s) => (
                <motion.div key={s.step} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: s.step * 0.06 }}
                  style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#a5b4fc', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)' }}>{s.step}</div>
                  <div>
                    <p style={{ fontSize: 14, color: '#e5e7eb', lineHeight: 1.65 }}>{s.text}</p>
                    <div style={{ display: 'flex', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
                      {s.evidenceIds.map((id) => <EvChip key={id} id={id} />)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Defense counsel */}
          {verdict.objections?.length > 0 && (
            <div style={{ borderRadius: 18, padding: 26, background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.18)' }}>
              <h3 style={{ fontSize: 11, fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 14 }}>
                <UserX size={12} style={{ display: 'inline', marginRight: 6 }} />Defense Counsel — the engine attacked its own accusation
              </h3>
              {verdict.objections.map((o, i) => (
                <p key={i} style={{ fontSize: 13, color: '#d1d5db', lineHeight: 1.7, marginBottom: 8 }}>
                  · {o.text} <span style={{ color: '#a78bfa', fontWeight: 700 }}>{o.impact}</span> {o.evidenceId && <EvChip id={o.evidenceId} />}
                </p>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

function SuspectTable({ verdict }) {
  return (
    <div style={{ borderRadius: 18, padding: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <h3 style={{ fontSize: 11, fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 14 }}>Current standings (transparent arithmetic)</h3>
      {verdict.suspects.slice(0, 5).map((s) => (
        <div key={s.entityId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: '#e5e7eb' }}>{s.name}{s.provisional ? ' (provisional)' : ''}</span>
          <span style={{ fontSize: 11, color: '#6b7280', fontFamily: 'monospace' }}>O:{s.breakdown.opportunity} M:{s.breakdown.means} Mo:{s.breakdown.motive} D:{s.breakdown.deception}</span>
          <span style={{ fontSize: 16, fontWeight: 900, color: s.total > 50 ? '#ef4444' : '#9ca3af', width: 70, textAlign: 'right' }}>{s.total}/100</span>
        </div>
      ))}
    </div>
  );
}

function btnStyle(color) {
  return {
    display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 999,
    background: `linear-gradient(135deg, ${color}, ${color}cc)`, color: 'white', border: 'none',
    fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 15px ${color}44`,
  };
}
