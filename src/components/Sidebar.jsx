import {
  LayoutDashboard, Upload, GitBranch, AlertTriangle, Gavel,
  Shield, ArrowLeft, Lock, CheckCircle2
} from 'lucide-react';
import { useCase } from '../context/CaseContext';

// 5 CORE PILLARS FOR THE HACKATHON PITCH ("Less is more")
const CORE_NAV_ITEMS = [
  { id: 'dashboard', label: 'CRIME SCENE', icon: LayoutDashboard, desc: 'Overview & State Machine' },
  { id: 'upload', label: 'EVIDENCE VAULT', icon: Upload, desc: 'S3 Ingestion & Hashes' },
  { id: 'network', label: 'EVIDENCE BOARD', icon: GitBranch, desc: 'Pinned Corkboard & Red String' },
  { id: 'contradictions', label: 'CONTRADICTIONS', icon: AlertTriangle, desc: 'The Smoking Gun / Alibi Breached', hot: true },
  { id: 'verdict', label: 'THE VERDICT', icon: Gavel, desc: 'Deterministic Conviction & Citations', hot: true },
];

export default function Sidebar({ activePage, setActivePage, onShowDeck }) {
  const { evidence, contradictions, verdict } = useCase();

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(180deg, #1C0F08 0%, #120A05 100%)',
      borderRight: '2px solid #8B2E2E',
      boxShadow: '4px 0 24px rgba(0,0,0,0.7)',
      position: 'relative',
      userSelect: 'none',
    }}>
      
      {/* ── TOP: PRESENTATION DECK TOGGLE ── */}
      <div style={{
        padding: '16px 14px 12px',
        borderBottom: '1px solid rgba(139, 46, 46, 0.3)',
        background: 'rgba(0,0,0,0.3)',
      }}>
        <button
          onClick={onShowDeck}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '10px 14px', borderRadius: 2,
            background: 'rgba(229, 37, 37, 0.12)',
            border: '1px solid #E52525',
            color: '#FFF',
            fontSize: 11, fontWeight: 900,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#E52525'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(229, 37, 37, 0.12)'; }}
        >
          <ArrowLeft size={13} />
          <span>← PITCH DECK</span>
        </button>
      </div>

      {/* ── LOGO / BUREAU HEADER ── */}
      <div style={{
        padding: '18px 20px',
        borderBottom: '1px solid rgba(139, 46, 46, 0.25)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 2,
          background: '#8B2E2E',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(139,46,46,0.5)',
          flexShrink: 0,
        }}>
          <Shield size={18} color="#FFF" />
        </div>
        <div>
          <h1 style={{
            fontSize: 16, fontWeight: 900,
            fontFamily: "'Inter', sans-serif",
            color: '#FFFFFF', letterSpacing: '0.06em',
            lineHeight: 1,
          }}>
            EVIDENCE
          </h1>
          <p style={{
            fontSize: 8, color: '#E52525', fontWeight: 800,
            letterSpacing: '0.2em', textTransform: 'uppercase',
            fontFamily: "'JetBrains Mono', monospace",
            marginTop: 4,
          }}>
            CASE INVESTIGATION
          </p>
        </div>
      </div>

      {/* ── 5 STREAMLINED CORE PILLARS ── */}
      <nav style={{
        flex: 1, padding: '16px 10px',
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        <div style={{
          padding: '0 10px 6px',
          fontSize: 8, fontWeight: 900,
          color: '#8A735E', letterSpacing: '0.25em',
          textTransform: 'uppercase',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          INVESTIGATION PILLARS
        </div>

        {CORE_NAV_ITEMS.map((item) => {
          const isActive = activePage === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 2,
                border: isActive ? '1px solid #E52525' : '1px solid transparent',
                background: isActive ? 'linear-gradient(90deg, rgba(229, 37, 37, 0.2) 0%, rgba(30, 15, 10, 0.8) 100%)' : 'transparent',
                color: isActive ? '#FFFFFF' : '#CCCCCC',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'left',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.color = '#FFFFFF';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#CCCCCC';
                }
              }}
            >
              <Icon
                size={18}
                color={isActive ? '#E52525' : item.hot ? '#E52525' : '#8A735E'}
                style={{ flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    fontSize: 12, fontWeight: 900,
                    fontFamily: "'Inter', sans-serif",
                    letterSpacing: '0.04em',
                    color: isActive ? '#FFF' : '#E5E5EA',
                  }}>
                    {item.label}
                  </span>
                  {item.id === 'contradictions' && contradictions.length > 0 && (
                    <span style={{
                      fontSize: 8, fontWeight: 900,
                      background: '#E52525', color: '#FFF',
                      padding: '1px 5px', borderRadius: 2,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      {contradictions.length}
                    </span>
                  )}
                  {item.id === 'verdict' && verdict && (
                    <span style={{
                      fontSize: 8, fontWeight: 900,
                      background: '#4C7657', color: '#FFF',
                      padding: '1px 5px', borderRadius: 2,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      PROVEN
                    </span>
                  )}
                </div>
                <p style={{
                  fontSize: 9, color: '#8A735E',
                  fontFamily: "'JetBrains Mono', monospace",
                  marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {item.desc}
                </p>
              </div>
            </button>
          );
        })}
      </nav>

      {/* ── FOOTER STATUS ── */}
      <div style={{
        padding: '14px 16px',
        borderTop: '1px solid rgba(139, 46, 46, 0.25)',
        background: 'rgba(0,0,0,0.4)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{
            fontSize: 8, fontWeight: 900,
            fontFamily: "'JetBrains Mono', monospace",
            color: '#8A735E', letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}>
            CASE STATUS
          </span>
          <span style={{
            fontSize: 9, fontWeight: 800,
            fontFamily: "'JetBrains Mono', monospace",
            color: verdict ? '#4C7657' : evidence.length > 0 ? '#C5A66A' : '#8A735E',
          }}>
            {verdict ? 'CONVICTED (88%)' : evidence.length > 0 ? 'INVESTIGATING' : 'AWAITING INGESTION'}
          </span>
        </div>
        <div style={{
          fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
          color: '#555555', letterSpacing: '0.08em',
        }}>
          CASE-001 · BLACKWOOD ESTATE
        </div>
      </div>

    </div>
  );
}
