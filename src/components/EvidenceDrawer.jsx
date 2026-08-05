import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText } from 'lucide-react';
import { useCase } from '../context/CaseContext';
import { getEvidenceRaw } from '../services/api';

// Slide-in panel showing the literal evidence text a citation points at —
// what makes the reasoning chain auditable.
export default function EvidenceDrawer() {
  const { drawer, closeEvidence } = useCase();
  const [doc, setDoc] = useState(null);

  useEffect(() => {
    if (!drawer) { setDoc(null); return; }
    getEvidenceRaw(drawer.evidenceId).then(setDoc).catch(() => setDoc({ error: true }));
  }, [drawer]);

  const highlight = drawer?.highlight?.slice(0, 60);

  return (
    <AnimatePresence>
      {drawer && (
        <motion.div initial={{ x: 480 }} animate={{ x: 0 }} exit={{ x: 480 }} transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: 460, zIndex: 200,
            background: 'rgba(8,8,16,0.98)', borderLeft: '1px solid rgba(99,102,241,0.25)',
            boxShadow: '-20px 0 60px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column',
          }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FileText size={18} color="#818cf8" />
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>{drawer.evidenceId}</p>
                <p style={{ fontSize: 11, color: '#6b7280' }}>{doc?.fileName || '…'} · {doc?.kind || ''}</p>
              </div>
            </div>
            <button onClick={closeEvidence} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={15} color="#9ca3af" />
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            {doc?.error && <p style={{ color: '#f87171', fontSize: 13 }}>Could not load evidence text.</p>}
            {doc?.text && doc.text.split('\n').map((line, i) => {
              const hit = highlight && line.toLowerCase().includes(highlight.toLowerCase().slice(0, 40));
              return (
                <p key={i} style={{
                  fontSize: 12, fontFamily: 'monospace', lineHeight: 1.8, whiteSpace: 'pre-wrap',
                  color: hit ? '#0a0a0f' : '#c4c9d4',
                  background: hit ? '#fbbf24' : 'transparent',
                  borderRadius: hit ? 4 : 0, padding: hit ? '2px 4px' : 0,
                }}>{line || ' '}</p>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
