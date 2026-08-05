import { motion } from 'framer-motion';
import { Search, Clock, RotateCcw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCase } from '../context/CaseContext';

export default function TopBar() {
  const [time, setTime] = useState(new Date());
  const { summary, health, resetAll } = useCase();

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const threatLevel = summary?.threatLevel || 'STANDBY';
  const isCritical = threatLevel === 'CRITICAL';
  const engineUp = !!health?.ok;
  const engineLabel = !engineUp ? 'ENGINE OFFLINE' : health.geminiConfigured ? 'LIVE AI + DETERMINISTIC' : 'DETERMINISTIC MODE';

  return (
    <header style={{
      height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 32px', position: 'sticky', top: 0, zIndex: 40,
      background: 'rgba(5, 5, 10, 0.85)', backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>
      {/* Search */}
      <div style={{ flex: 1, maxWidth: 480 }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#4b5563' }} />
          <input
            type="text"
            placeholder="Search evidence, suspects, locations..."
            style={{
              width: '100%', paddingLeft: 40, paddingRight: 16, paddingTop: 10, paddingBottom: 10,
              borderRadius: 14, fontSize: 13, color: '#e5e7eb',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              outline: 'none', fontFamily: 'inherit',
            }}
            onFocus={(e) => { e.target.style.borderColor = 'rgba(99,102,241,0.3)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.06)'; e.target.style.background = 'rgba(255,255,255,0.03)'; }}
          />
        </div>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginLeft: 24 }}>
        {/* Engine health — a REAL ping, not a static label */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 14,
          background: engineUp ? 'rgba(52,211,153,0.06)' : 'rgba(239,68,68,0.08)',
          border: engineUp ? '1px solid rgba(52,211,153,0.18)' : '1px solid rgba(239,68,68,0.25)',
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: engineUp ? '#34d399' : '#ef4444', boxShadow: `0 0 8px ${engineUp ? 'rgba(52,211,153,0.7)' : 'rgba(239,68,68,0.8)'}` }} />
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.15em', color: engineUp ? '#34d399' : '#f87171' }}>{engineLabel}</span>
        </div>

        {/* New case (explicit — a refresh never wipes the demo) */}
        <button onClick={() => { if (confirm('Start a new case? This clears all evidence.')) resetAll(); }}
          title="New case"
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: '#9ca3af' }}>
          <RotateCcw size={12} /> NEW CASE
        </button>

        {/* Threat */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 16px', borderRadius: 14,
          background: isCritical ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.03)',
          border: isCritical ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(255,255,255,0.05)',
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: isCritical ? '#ef4444' : '#818cf8',
            boxShadow: isCritical ? '0 0 8px rgba(239,68,68,0.8)' : 'none',
            animation: 'pulse 2s ease-in-out infinite',
          }} />
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: isCritical ? '#f87171' : '#6b7280' }}>
            {threatLevel}
          </span>
        </div>

        <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.05)' }} />

        {/* Clock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={14} color="#4b5563" />
          <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#9ca3af', letterSpacing: '0.15em' }}>
            {time.toLocaleTimeString('en-US', { hour12: false })}
          </span>
        </div>
      </div>
    </header>
  );
}
