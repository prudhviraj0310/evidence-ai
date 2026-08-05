import { motion } from 'framer-motion';
import { Shield, LayoutDashboard, Upload, Clock, AlertTriangle, FileText, Gavel, MessageSquare, GitBranch } from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
  { id: 'upload', label: 'Upload Evidence', icon: Upload },
  { id: 'verdict', label: 'The Verdict', icon: Gavel, hot: true },
  { id: 'interrogate', label: 'Interrogate', icon: MessageSquare },
  { id: 'timeline', label: 'Event Timeline', icon: Clock },
  { id: 'contradictions', label: 'Contradictions', icon: AlertTriangle },
  { id: 'network', label: 'Network Graph', icon: GitBranch },
  { id: 'summary', label: 'Final Report', icon: FileText },
];

export default function Sidebar({ activePage, setActivePage }) {
  return (
    <div style={{
      width: '100%',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'rgba(8, 8, 16, 0.95)',
      borderRight: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '20px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)',
        height: 72,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          boxShadow: '0 4px 15px rgba(99,102,241,0.4)',
          flexShrink: 0,
        }}>
          <Shield size={20} color="white" />
        </div>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: 'white', letterSpacing: '-0.01em', lineHeight: 1 }}>EVIDENCE</h1>
          <p style={{ fontSize: 9, color: '#6b7280', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 2 }}>Intelligence v2.0</p>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '24px 12px', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
        <p style={{ padding: '0 12px', fontSize: 9, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 8 }}>
          Investigation
        </p>
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 14,
                border: isActive ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
                background: isActive ? 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.06))' : 'transparent',
                color: isActive ? 'white' : '#9ca3af',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontSize: 14, fontWeight: 600,
              }}
              onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#e5e7eb'; }}}
              onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}}
            >
              <Icon size={20} color={isActive ? '#818cf8' : item.hot ? '#ef4444' : '#6b7280'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 8px' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)',
            fontSize: 11, fontWeight: 900, color: '#a5b4fc',
          }}>OP</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>Agent Admin</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px rgba(52,211,153,0.6)' }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: '#6b7280', letterSpacing: '0.15em' }}>ACTIVE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
