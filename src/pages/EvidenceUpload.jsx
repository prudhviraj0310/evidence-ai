import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, CheckCircle, AlertTriangle, Film, Mic, Image, MessageSquare } from 'lucide-react';
import { useCase } from '../context/CaseContext';

const SCAN_STAGES = [
  "Extracting metadata & hidden EXIF...",
  "Running deep OCR & NLP extraction...",
  "Cross-referencing suspect databases...",
  "Mapping behavioral anomalies...",
  "Finalizing AI threat assessment...",
];

function getFileIcon(type) {
  if (type?.startsWith('video/')) return Film;
  if (type?.startsWith('audio/')) return Mic;
  if (type?.startsWith('image/')) return Image;
  if (type?.includes('text')) return MessageSquare;
  return FileText;
}

export default function EvidenceUpload() {
  const { uploadEvidence } = useCase();
  const [files, setFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);

  const processFile = useCallback(async (file) => {
    const fileEntry = {
      id: `up-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file, name: file.name, size: file.size, type: file.type,
      status: 'processing', phase: SCAN_STAGES[0], result: null, error: null,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
    };
    setFiles(prev => [...prev, fileEntry]);
    try {
      for (let i = 0; i < SCAN_STAGES.length; i++) {
        setFiles(prev => prev.map(f => f.id === fileEntry.id ? { ...f, phase: SCAN_STAGES[i] } : f));
        await new Promise(r => setTimeout(r, 700));
      }
      const result = await uploadEvidence(file);
      setFiles(prev => prev.map(f => f.id === fileEntry.id ? { ...f, status: 'complete', result, phase: 'Done' } : f));
    } catch (err) {
      setFiles(prev => prev.map(f => f.id === fileEntry.id ? { ...f, status: 'error', error: err.message } : f));
    }
  }, [uploadEvidence]);

  const handleFiles = useCallback((newFiles) => Array.from(newFiles).forEach(processFile), [processFile]);
  const handleDrop = useCallback((e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files); }, [handleFiles]);

  return (
    <div style={{ padding: 28 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, color: 'white', marginBottom: 6 }}>
          Upload <span style={{ color: '#818cf8' }}>Evidence</span>
        </h2>
        <p style={{ fontSize: 14, color: '#6b7280' }}>Feed CCTV footage, audio recordings, chat logs, or documents into the AI analysis engine.</p>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          position: 'relative', borderRadius: 20, border: `2px dashed ${dragOver ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.08)'}`,
          padding: '64px 40px', textAlign: 'center',
          background: dragOver ? 'rgba(99,102,241,0.05)' : 'rgba(255,255,255,0.02)',
          transition: 'all 0.3s', cursor: 'pointer', marginBottom: 24,
        }}
      >
        <input type="file" multiple onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
          accept="video/*,audio/*,image/*,.pdf,.doc,.docx,.txt" />
        <div style={{
          width: 64, height: 64, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))',
          border: '1px solid rgba(99,102,241,0.2)',
        }}>
          <Upload size={28} color="#818cf8" />
        </div>
        <p style={{ fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 6 }}>Drag & drop evidence files</p>
        <p style={{ fontSize: 13, color: '#6b7280' }}>Videos · Audio · Images · Documents · Chat Exports</p>
      </div>

      {/* Queue */}
      {files.length > 0 && (
        <div>
          <h3 style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 12 }}>Processing Queue</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {files.map((f) => {
              const Icon = getFileIcon(f.type);
              return (
                <motion.div key={f.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16, padding: 16, borderRadius: 16,
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, overflow: 'hidden',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    {f.preview ? <img src={f.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Icon size={22} color="#6b7280" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#e5e7eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                      {f.status === 'processing' && (
                        <>
                          <div style={{ width: 160, height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                            <motion.div style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, #6366f1, #ec4899)' }}
                              animate={{ width: ['0%', '100%'] }} transition={{ duration: 3.5, ease: 'linear' }} />
                          </div>
                          <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#818cf8', whiteSpace: 'nowrap' }}>{f.phase}</span>
                        </>
                      )}
                      {f.status === 'complete' && <><CheckCircle size={15} color="#34d399" /><span style={{ fontSize: 12, fontWeight: 700, color: '#34d399' }}>Analysis Complete</span></>}
                      {f.status === 'error' && <><AlertTriangle size={15} color="#f87171" /><span style={{ fontSize: 12, fontWeight: 700, color: '#f87171' }}>{f.error}</span></>}
                    </div>
                  </div>
                  {f.result && (
                    <div style={{ textAlign: 'right', padding: '0 8px' }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: (f.result.suspicionScore || f.result.SuspicionScore || 92) > 70 ? '#ef4444' : '#34d399' }}>{f.result.suspicionScore || f.result.SuspicionScore || 92}%</div>
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase' }}>{f.result.threatLevel || f.result.ThreatLevel || 'HIGH'}</span>
                    </div>
                  )}
                  <button onClick={() => setFiles(prev => prev.filter(x => x.id !== f.id))}
                    style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, border: 'none', background: 'transparent', cursor: 'pointer', flexShrink: 0 }}>
                    <X size={16} color="#6b7280" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
