import { motion } from 'framer-motion';
import { Search, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCase } from '../context/CaseContext';

export default function TopBar() {
  const [time, setTime] = useState(new Date());
  const { summary } = useCase();

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const threatLevel = summary?.threatLevel || 'STANDBY';
  const isCritical = threatLevel === 'CRITICAL';

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
