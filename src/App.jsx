import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import EvidenceUpload from './pages/EvidenceUpload';
import CrimeTimeline from './pages/CrimeTimeline';
import Contradictions from './pages/Contradictions';
import CaseSummary from './pages/CaseSummary';
import Verdict from './pages/Verdict';
import Interrogate from './pages/Interrogate';
import RelationshipGraph from './pages/RelationshipGraph';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import EvidenceDrawer from './components/EvidenceDrawer';
import { CaseProvider, useCase } from './context/CaseContext';

const SIDEBAR_WIDTH = 260;

function MainAppInner({ onLogout }) {
  const [activePage, setActivePage] = useState('dashboard');

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
      case 'pipeline':
      case 'incidents':
        return <Dashboard onNavigate={setActivePage} initialView={activePage} />;
      case 'upload':
        return <EvidenceUpload onNavigate={setActivePage} />;
      case 'verdict':
      case 'hypotheses':
      case 'defense':
      case 'honesty':
        return <Verdict onNavigate={setActivePage} section={activePage} />;
      case 'interrogate':
        return <Interrogate onNavigate={setActivePage} />;
      case 'timeline':
        return <CrimeTimeline onNavigate={setActivePage} />;
      case 'contradictions':
        return <Contradictions onNavigate={setActivePage} />;
      case 'network':
        return <RelationshipGraph onNavigate={setActivePage} />;
      case 'summary':
      case 'audit':
        return <CaseSummary onNavigate={setActivePage} tab={activePage} />;
      default:
        return <Dashboard onNavigate={setActivePage} />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#2E1C12' }}>
      {/* Sidebar - fixed width with walnut & brass rail */}
      <div style={{ width: SIDEBAR_WIDTH, minWidth: SIDEBAR_WIDTH, height: '100vh', position: 'relative', zIndex: 50 }}>
        <Sidebar activePage={activePage} setActivePage={setActivePage} onShowDeck={onLogout} />
      </div>
      
      {/* Main content - takes remaining space with desk surface texture */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden', position: 'relative' }}>
        <TopBar onLogout={onLogout} onNavigate={setActivePage} activePage={activePage} />
        <main className="desk-surface" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}>
          {/* Subtle desk lamp illumination vignette */}
          <div style={{
            position: 'fixed', top: 0, right: 0, width: 600, height: 600,
            background: 'radial-gradient(circle at 80% 20%, rgba(197, 166, 106, 0.08), transparent 65%)',
            pointerEvents: 'none', zIndex: 5,
          }} />
          <div style={{
            position: 'fixed', inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(20, 10, 5, 0.4) 100%)',
            pointerEvents: 'none', zIndex: 6,
          }} />
          <div style={{ position: 'relative', zIndex: 10 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activePage}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                {renderPage()}
              </motion.div>
            </AnimatePresence>
          </div>
          <EvidenceDrawer />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [showLanding, setShowLanding] = useState(true);

  return (
    <CaseProvider>
      <div style={{ minHeight: '100vh', color: 'white', fontFamily: "'Outfit', system-ui, sans-serif", background: '#05050A' }}>
        <AnimatePresence mode="wait">
          {showLanding ? (
            <LandingPage key="landing" onStart={() => setShowLanding(false)} />
          ) : (
            <MainAppInner key="main" onLogout={() => setShowLanding(true)} />
          )}
        </AnimatePresence>
      </div>
    </CaseProvider>
  );
}
