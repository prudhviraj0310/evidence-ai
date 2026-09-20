import { motion } from 'framer-motion';
import { Search, Clock, RotateCcw, ShieldAlert, Radio, FileText, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCase } from '../context/CaseContext';

export default function TopBar({ onLogout, onNavigate, activePage }) {
  const [time, setTime] = useState(new Date());
  const { summary, health, resetAll, evidence } = useCase();

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const threatLevel = summary?.threatLevel || 'STANDBY';
  const isCritical = threatLevel === 'CRITICAL' || threatLevel === 'HIGH';
  const engineUp = !!health?.ok;
  const engineLabel = !engineUp ? 'ENGINE OFFLINE' : health.geminiConfigured ? 'LIVE AI + DETERMINISTIC' : 'DETERMINISTIC MODE';

  const caseId = summary?.caseId || (evidence.length > 0 ? 'CASE-2026-0884A' : 'NO ACTIVE DOSSIER');

  return (
    <header style={{
      height: 70,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 28px',
      position: 'sticky', top: 0, zIndex: 40,
      background: 'linear-gradient(180deg, #2E1C12 0%, #24150D 100%)',
      borderBottom: '2px solid #B08A52',
      boxShadow: '0 4px 18px rgba(0,0,0,0.5)',
      userSelect: 'none',
    }}>
      {/* Left: Case Classification Stamp & Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flex: 1, maxWidth: 640 }}>
        {/* Physical Case Tag */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '5px 12px', borderRadius: 3,
          background: 'rgba(242, 232, 213, 0.08)',
          border: '1px solid #B08A52',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)',
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: evidence.length > 0 ? '#4C7657' : '#B08A52',
            boxShadow: `0 0 6px ${evidence.length > 0 ? '#4C7657' : '#B08A52'}`,
          }} />
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11, fontWeight: 700,
            color: '#FFF8E9', letterSpacing: '0.12em',
          }}>
            {caseId}
          </span>
          <span style={{
            fontSize: 8, fontWeight: 800, padding: '2px 5px', borderRadius: 2,
            background: isCritical ? 'rgba(179, 58, 50, 0.25)' : 'rgba(76, 118, 87, 0.2)',
            border: isCritical ? '1px solid #B33A32' : '1px solid #4C7657',
            color: isCritical ? '#E8463A' : '#5A9468',
            letterSpacing: '0.1em',
          }}>
            {isCritical ? 'CONFIDENTIAL / PRIORITY I' : 'ACTIVE INQUIRY'}
          </span>
        </div>

        {/* Vintage Search Input */}
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#B08A52' }} />
          <input
            type="text"
            placeholder="Search evidence records, suspects, alibis..."
            style={{
              width: '100%', paddingLeft: 34, paddingRight: 14, paddingTop: 7, paddingBottom: 7,
              borderRadius: 3, fontSize: 12, color: '#FFF8E9',
              background: 'rgba(15, 8, 4, 0.4)',
              border: '1px solid rgba(176, 138, 82, 0.4)',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)',
              outline: 'none',
              fontFamily: "'IBM Plex Serif', Georgia, serif",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#C5A66A';
              e.target.style.boxShadow = '0 0 8px rgba(197, 166, 106, 0.2), inset 0 1px 3px rgba(0,0,0,0.5)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(176, 138, 82, 0.4)';
              e.target.style.boxShadow = 'inset 0 1px 3px rgba(0,0,0,0.5)';
            }}
          />
        </div>
      </div>

      {/* Right: Engine Lamp, New Case Action, Threat Meter, Chronometer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Engine Diagnostic Jewel Lamp */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '6px 12px', borderRadius: 3,
          background: engineUp ? 'rgba(76, 118, 87, 0.12)' : 'rgba(179, 58, 50, 0.12)',
          border: engineUp ? '1px solid #4C7657' : '1px solid #B33A32',
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: engineUp ? '#4C7657' : '#B33A32',
            boxShadow: `0 0 8px ${engineUp ? '#4C7657' : '#B33A32'}`,
            animation: 'cctv-pulse 2.5s ease-in-out infinite',
          }} />
          <span style={{
            fontSize: 9, fontWeight: 800, letterSpacing: '0.14em',
            fontFamily: "'JetBrains Mono', monospace",
            color: engineUp ? '#5A9468' : '#E8463A',
          }}>{engineLabel}</span>
        </div>

        {/* Reset / New Case Brass Lever Button */}
        <button
          onClick={() => { if (confirm('Start a new case? This resets all active evidence dossiers.')) resetAll(); }}
          title="Archive current dossier and initialize fresh case desk"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 3,
            background: 'linear-gradient(135deg, rgba(176, 138, 82, 0.18) 0%, rgba(122, 81, 53, 0.18) 100%)',
            border: '1px solid #B08A52',
            cursor: 'pointer',
            fontSize: 10, fontWeight: 800, letterSpacing: '0.12em',
            color: '#E7D7BA',
            fontFamily: "'JetBrains Mono', monospace",
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(176, 138, 82, 0.3)'; e.currentTarget.style.color = '#FFF8E9'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(176, 138, 82, 0.18)'; e.currentTarget.style.color = '#E7D7BA'; }}
        >
          <RotateCcw size={11} color="#C5A66A" /> NEW CASE
        </button>

        {/* Threat Level Wax Seal Badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 12px', borderRadius: 3,
          background: isCritical ? 'rgba(179, 58, 50, 0.18)' : 'rgba(176, 138, 82, 0.12)',
          border: isCritical ? '1px solid #B33A32' : '1px solid #B08A52',
        }}>
          <ShieldAlert size={13} color={isCritical ? '#E8463A' : '#C5A66A'} />
          <span style={{
            fontSize: 9, fontWeight: 900, letterSpacing: '0.18em',
            textTransform: 'uppercase',
            fontFamily: "'JetBrains Mono', monospace",
            color: isCritical ? '#E8463A' : '#C5A66A',
          }}>
            THREAT: {threatLevel}
          </span>
        </div>

        {/* Brass divider */}
        <div style={{ width: 1, height: 22, background: 'rgba(176, 138, 82, 0.3)' }} />

        {/* Nixie / Amber Chronometer */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '5px 10px', borderRadius: 3,
          background: 'rgba(10, 5, 2, 0.6)',
          border: '1px solid rgba(176, 138, 82, 0.3)',
        }}>
          <Clock size={12} color="#C5A66A" />
          <span style={{
            fontSize: 12,
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 800,
            color: '#B08A52',
            letterSpacing: '0.14em',
            textShadow: '0 0 6px rgba(176, 138, 82, 0.5)',
          }}>
            {time.toLocaleTimeString('en-US', { hour12: false })}
          </span>
        </div>
      </div>
    </header>
  );
}
