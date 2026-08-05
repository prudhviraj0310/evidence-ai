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
      case 'dashboard': return <Dashboard />;
      case 'upload': return <EvidenceUpload />;
      case 'verdict': return <Verdict />;
      case 'interrogate': return <Interrogate />;
      case 'timeline': return <CrimeTimeline />;
      case 'contradictions': return <Contradictions />;
      case 'network': return <RelationshipGraph />;
      case 'summary': return <CaseSummary />;
      default: return <Dashboard />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#05050A' }}>
      {/* Sidebar - fixed width */}
      <div style={{ width: SIDEBAR_WIDTH, minWidth: SIDEBAR_WIDTH, height: '100vh', position: 'relative', zIndex: 50 }}>
        <Sidebar activePage={activePage} setActivePage={setActivePage} />
      </div>
      
      {/* Main content - takes remaining space */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <TopBar onLogout={onLogout} />
        <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}>
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse at 20% 0%, rgba(99,102,241,0.06), transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(236,72,153,0.04), transparent 50%)'
          }} />
          <div style={{ position: 'relative', zIndex: 10 }}>
            <AnimatePresence mode="wait">
              <motion.div key={activePage} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
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

// Wrapper that provides CaseContext
function MainApp({ onLogout }) {
  return (
    <CaseProvider>
      <MainAppInner onLogout={onLogout} />
    </CaseProvider>
  );
}

export default function App() {
  const [showLanding, setShowLanding] = useState(true);

  return (
    <div style={{ minHeight: '100vh', color: 'white', fontFamily: "'Outfit', system-ui, sans-serif", background: '#05050A' }}>
      <AnimatePresence mode="wait">
        {showLanding ? (
          <LandingPage key="landing" onStart={() => setShowLanding(false)} />
        ) : (
          <MainApp key="main" onLogout={() => setShowLanding(true)} />
        )}
      </AnimatePresence>
    </div>
  );
}
