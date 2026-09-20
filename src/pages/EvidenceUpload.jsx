import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, CheckCircle, AlertTriangle, Film, Mic, Image, MessageSquare, Shield, Lock, Tag, RotateCcw, FolderOpen, Play, ExternalLink, Loader } from 'lucide-react';
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

export default function EvidenceUpload({ onNavigate }) {
  const { uploadEvidence, openEvidence, solve, resetAll, evidence, loadDemoCase, loading } = useCase();
  const [files, setFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [solving, setSolving] = useState(false);

  const processFile = useCallback(async (file) => {
    const isVideo = file.type.startsWith('video/') || file.name.toLowerCase().endsWith('.mp4');
    const isImg = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(file.name);
    let previewUrl = null;
    try {
      if (isImg || isVideo) previewUrl = URL.createObjectURL(file);
    } catch { /* ignore */ }

    const fileEntry = {
      id: `up-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file, name: file.name, size: file.size, type: file.type,
      status: 'processing', phase: SCAN_STAGES[0], result: null, error: null,
      preview: previewUrl, isVideo, isImg,
    };
    setFiles(prev => [...prev, fileEntry]);
    try {
      const result = await uploadEvidence(file, (stage, message) => {
        setFiles(prev => prev.map(f => f.id === fileEntry.id ? { ...f, phase: message } : f));
      });
      setFiles(prev => prev.map(f => f.id === fileEntry.id ? { ...f, status: 'complete', result, phase: 'Vault Sealed' } : f));
    } catch (err) {
      setFiles(prev => prev.map(f => f.id === fileEntry.id ? { ...f, status: 'error', error: err.message } : f));
    }
  }, [uploadEvidence]);

  const handleFiles = useCallback(async (newFiles) => {
    for (const f of Array.from(newFiles)) await processFile(f);
  }, [processFile]);

  const collectEntry = (entry) => new Promise((resolve) => {
    if (entry.isFile) {
      entry.file((f) => resolve([f]), () => resolve([]));
    } else if (entry.isDirectory) {
      const reader = entry.createReader();
      const all = [];
      const readBatch = () => reader.readEntries(async (entries) => {
        if (!entries.length) {
          const nested = await Promise.all(all.map(collectEntry));
          resolve(nested.flat());
        } else { all.push(...entries); readBatch(); }
      }, () => resolve([]));
      readBatch();
    } else resolve([]);
  });

  const handleDrop = useCallback(async (e) => {
    e.preventDefault(); setDragOver(false);
    const items = Array.from(e.dataTransfer.items || []);
    const entries = items.map((i) => i.webkitGetAsEntry?.()).filter(Boolean);
    if (entries.length) {
      const nested = await Promise.all(entries.map(collectEntry));
      const files = nested.flat().filter((f) => !f.name.startsWith('.'))
        .sort((a, b) => a.name.localeCompare(b.name));
      if (files.length) return handleFiles(files);
    }
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#4C7657', boxShadow: '0 0 6px #4C7657',
            }} />
            <span style={{
              fontSize: 10, fontWeight: 800,
              fontFamily: "'JetBrains Mono', monospace",
              color: '#C5A66A', letterSpacing: '0.15em',
            }}>
              SECTION I // EVIDENCE INTAKE LOCKER
            </span>
          </div>
          <h2 style={{
            fontSize: 32, fontWeight: 800,
            fontFamily: "'IBM Plex Serif', Georgia, serif",
            color: '#FFF8E9', letterSpacing: '-0.02em',
          }}>
            Evidence <span style={{ color: '#C5A66A' }}>Vault Intake</span>
          </h2>
          <p style={{
            fontSize: 13, color: '#A89278',
            fontFamily: "'IBM Plex Serif', serif", fontStyle: 'italic',
          }}>
            Deposit raw CCTV footage, wiretaps, phone records, forensic PDFs, or witness depositions for automated ingestion and chain of custody hashing.
          </p>
        </div>

        {evidence.length > 0 && (
          <button
            onClick={() => {
              if (confirm('Clear active dossier and start a fresh inquiry?')) {
                resetAll();
                setFiles([]);
              }
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 16px', borderRadius: 3,
              background: 'rgba(179, 58, 50, 0.15)',
              border: '1px solid #B33A32',
              color: '#E8463A',
              fontSize: 11, fontWeight: 800,
              fontFamily: "'JetBrains Mono', monospace",
              cursor: 'pointer',
              letterSpacing: '0.08em',
              whiteSpace: 'nowrap',
            }}
          >
            <RotateCcw size={13} /> CLEAR ACTIVE CASE ({evidence.length} FILES)
          </button>
        )}
      </div>

      {/* Physical Evidence Drop Zone (Manila Envelope Style) */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          position: 'relative',
          borderRadius: 3,
          border: `2px dashed ${dragOver ? '#E8463A' : '#B08A52'}`,
          padding: '60px 36px',
          textAlign: 'center',
          background: dragOver ? 'rgba(176, 138, 82, 0.2)' : '#F4ECD8',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          transition: 'all 0.2s ease',
          cursor: 'pointer',
          marginBottom: 26,
          color: '#1A140E',
        }}
      >
        <input
          type="file" multiple
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
          accept="video/*,audio/*,image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.json"
        />

        {/* Brass clip on top */}
        <div style={{
          position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
          width: 36, height: 16, borderRadius: 3,
          background: '#B08A52', border: '1px solid #C5A66A',
          boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
        }} />

        <div style={{
          width: 56, height: 56, borderRadius: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
          background: '#EAE0CA', border: '1px solid #D4C5A9',
        }}>
          <Upload size={26} color="#7A5135" />
        </div>

        <h3 style={{
          fontSize: 20, fontWeight: 800,
          fontFamily: "'IBM Plex Serif', serif",
          color: '#1A140E', marginBottom: 4,
        }}>
          Drop Evidence Dossiers or Select Files
        </h3>
        <p style={{
          fontSize: 13, color: '#5D4936',
          fontFamily: "'IBM Plex Serif', serif", fontStyle: 'italic',
        }}>
          Accepts Video (CCTV), Audio recordings, High-Res Images, Keycard Logs, Forensic PDFs, and Text Depositions.
        </p>
        <p style={{
          fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
          color: '#7A5135', marginTop: 10, letterSpacing: '0.1em',
        }}>
          AUTOMATIC SHA-256 HASHING · OCR TEXT EXTRACTION · ENTITY CORRELATION
        </p>
      </div>

      {/* Preset Dossiers Bar */}
      <div style={{
        background: 'rgba(244, 236, 216, 0.06)',
        border: '1px solid #B08A52',
        borderRadius: 3,
        padding: '16px 20px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <FolderOpen size={14} color="#C5A66A" />
            <span style={{ fontSize: 11, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", color: '#FFF8E9', letterSpacing: '0.1em' }}>
              PRE-PACKAGED CRIME DOSSIERS
            </span>
          </div>
          <p style={{ fontSize: 11, color: '#A89278', fontFamily: "'IBM Plex Serif', serif", fontStyle: 'italic' }}>
            Load authentic forensic case archives with real video feeds, wiretaps, GPS telemetry, and cell tower logs.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => loadDemoCase({ case: 'case_files' })}
            disabled={loading.demo}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 2,
              background: 'linear-gradient(135deg, rgba(176, 138, 82, 0.3) 0%, rgba(122, 81, 53, 0.3) 100%)',
              border: '1px solid #B08A52',
              color: '#FFF8E9', fontSize: 11, fontWeight: 800,
              fontFamily: "'JetBrains Mono', monospace", cursor: 'pointer',
              letterSpacing: '0.06em',
            }}
          >
            {loading.demo ? <Loader size={12} className="animate-spin" /> : <Play size={12} color="#C5A66A" />}
            Case #01: Elias Vance (7 Files + CCTV Video)
          </button>

          <button
            onClick={() => loadDemoCase({ case: 'benchmark' })}
            disabled={loading.demo}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 2,
              background: 'rgba(122, 81, 53, 0.2)',
              border: '1px solid #7A5135',
              color: '#E7D7BA', fontSize: 11, fontWeight: 800,
              fontFamily: "'JetBrains Mono', monospace", cursor: 'pointer',
              letterSpacing: '0.06em',
            }}
          >
            {loading.demo ? <Loader size={12} className="animate-spin" /> : <Play size={12} color="#C5A66A" />}
            IEEE VAST Benchmark (Kronos)
          </button>

          <button
            onClick={() => loadDemoCase({ stage: 'initial' })}
            disabled={loading.demo}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 2,
              background: 'rgba(176, 138, 82, 0.15)',
              border: '1px solid rgba(176, 138, 82, 0.5)',
              color: '#C5A66A', fontSize: 11, fontWeight: 800,
              fontFamily: "'JetBrains Mono', monospace", cursor: 'pointer',
              letterSpacing: '0.06em',
            }}
          >
            Cold Case (Initial 4 Files)
          </button>

          {evidence.length > 0 && evidence.length < 6 && !evidence.some(e => e.kind === 'phone') && (
            <button
              onClick={() => loadDemoCase({ stage: 'reveal' })}
              disabled={loading.demo}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 2,
                background: '#8B2E2E', border: '1px solid #E8463A',
                color: '#FFF8E9', fontSize: 11, fontWeight: 900,
                fontFamily: "'JetBrains Mono', monospace", cursor: 'pointer',
                letterSpacing: '0.06em',
                boxShadow: '0 0 10px rgba(232, 70, 58, 0.3)',
              }}
            >
              ★ Unseal Phone Subpoena (+1 File)
            </button>
          )}
        </div>
      </div>

      {/* Intake Queue for Freshly Uploaded Files */}
      {files.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{
            fontSize: 11, fontWeight: 800,
            color: '#C5A66A', textTransform: 'uppercase',
            letterSpacing: '0.15em',
            fontFamily: "'JetBrains Mono', monospace",
            marginBottom: 12,
          }}>
            RECENT UPLOAD BATCH ({files.length} ITEMS)
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {files.map((f) => {
              const Icon = getFileIcon(f.type);
              return (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    padding: '12px 18px', borderRadius: 2,
                    background: '#F4ECD8',
                    border: '1px solid #D8C8AC',
                    boxShadow: '2px 3px 8px rgba(0,0,0,0.3)',
                    color: '#1A140E',
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 2,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, overflow: 'hidden',
                    background: '#0D0907', border: '1px solid #D4C5A9',
                  }}>
                    {f.preview ? (
                      f.isVideo ? (
                        <video src={f.preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                      ) : (
                        <img src={f.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )
                    ) : (
                      <Icon size={20} color="#7A5135" />
                    )}
                  </div>

                  <div
                    onClick={() => f.result?.evidenceId && openEvidence(f.result.evidenceId)}
                    style={{ flex: 1, minWidth: 0, cursor: f.result?.evidenceId ? 'pointer' : 'default' }}
                  >
                    <p style={{
                      fontSize: 14, fontWeight: 800,
                      fontFamily: "'IBM Plex Serif', serif",
                      color: '#1A140E',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      {f.name}
                      {f.result?.evidenceId && (
                        <span style={{
                          fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: 800, color: '#8B2E2E', background: 'rgba(139, 46, 46, 0.1)',
                          padding: '1px 5px', borderRadius: 2,
                        }}>
                          #{f.result.evidenceId}
                        </span>
                      )}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                      {f.status === 'processing' && (
                        <>
                          <div style={{ width: 140, height: 4, borderRadius: 2, background: '#D8C8AC', overflow: 'hidden' }}>
                            <motion.div
                              style={{ height: '100%', background: '#B08A52' }}
                              animate={{ width: ['0%', '100%'] }}
                              transition={{ duration: 3, ease: 'linear' }}
                            />
                          </div>
                          <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: '#7A5135' }}>
                            {f.phase}
                          </span>
                        </>
                      )}
                      {f.status === 'complete' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <CheckCircle size={14} color="#4C7657" />
                          <span style={{
                            fontSize: 10, fontWeight: 800, color: '#4C7657',
                            fontFamily: "'JetBrains Mono', monospace",
                          }}>
                            SEALED IN EVIDENCE VAULT
                          </span>
                          <span style={{ fontSize: 9, color: '#7A5135', marginLeft: 6, textDecoration: 'underline' }}>
                            (Click to inspect dossier)
                          </span>
                        </div>
                      )}
                      {f.status === 'error' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <AlertTriangle size={14} color="#8B2E2E" />
                          <span style={{
                            fontSize: 10, fontWeight: 800, color: '#8B2E2E',
                            fontFamily: "'JetBrains Mono', monospace",
                          }}>
                            {f.error}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {f.result && (
                    <div style={{ textAlign: 'right', padding: '0 8px' }}>
                      <div style={{
                        fontSize: 18, fontWeight: 900,
                        fontFamily: "'JetBrains Mono', monospace",
                        color: (f.result.suspicionScore ?? 0) > 60 ? '#8B2E2E' : '#4C7657',
                      }}>
                        {f.result.suspicionScore ?? '—'}%
                      </div>
                      <span style={{
                        fontSize: 8, fontWeight: 800, color: '#7A5135',
                        fontFamily: "'JetBrains Mono', monospace",
                        textTransform: 'uppercase',
                      }}>
                        {f.result.claimCount != null ? `${f.result.claimCount} CLAIMS` : (f.result.threatLevel || '')}
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() => setFiles(prev => prev.filter(x => x.id !== f.id))}
                    style={{
                      width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: 2, border: 'none', background: 'transparent', cursor: 'pointer', flexShrink: 0,
                    }}
                  >
                    <X size={14} color="#7A5135" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Evidence Dossiers in Vault (Persistent View) */}
      {evidence.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{
              fontSize: 11, fontWeight: 800,
              color: '#C5A66A', textTransform: 'uppercase',
              letterSpacing: '0.15em',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              SEALED EVIDENCE DOSSIERS IN VAULT ({evidence.length} RECORDS)
            </h3>
            <span style={{ fontSize: 10, color: '#A89278', fontFamily: "'JetBrains Mono', monospace" }}>
              ALL EVIDENCE DIGITALLY SIGNED & INDEXED
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {evidence.map((ev, i) => {
              const isVideo = ev.mediaType?.startsWith('video/') || ev.fileName?.toLowerCase().endsWith('.mp4');
              const isImg = ev.mediaType?.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(ev.fileName);
              const Icon = isVideo ? Film : isImg ? Image : ev.kind === 'phone' ? Film : ev.kind === 'chat' ? MessageSquare : FileText;

              return (
                <motion.div
                  key={ev.evidenceId || i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => openEvidence(ev.evidenceId)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    padding: '12px 18px', borderRadius: 2,
                    background: '#F4ECD8',
                    border: '1px solid #D8C8AC',
                    boxShadow: '2px 3px 8px rgba(0,0,0,0.3)',
                    color: '#1A140E',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#B08A52'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#D8C8AC'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div style={{
                    width: 46, height: 46, borderRadius: 2,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, overflow: 'hidden',
                    background: '#0D0907', border: '1px solid #D4C5A9',
                    position: 'relative',
                  }}>
                    {ev.mediaUrl && isImg ? (
                      <img src={ev.mediaUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : ev.mediaUrl && isVideo ? (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1A100B' }}>
                        <Film size={20} color="#C5A66A" />
                        <span style={{ position: 'absolute', bottom: 2, fontSize: 7, fontWeight: 900, color: '#E8463A', fontFamily: "'JetBrains Mono', monospace" }}>CCTV</span>
                      </div>
                    ) : (
                      <Icon size={20} color="#7A5135" />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 14, fontWeight: 800,
                      fontFamily: "'IBM Plex Serif', serif",
                      color: '#1A140E',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      {ev.fileName}
                      <span style={{
                        fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 800, color: '#8B2E2E', background: 'rgba(139, 46, 46, 0.1)',
                        padding: '1px 5px', borderRadius: 2,
                      }}>
                        #{ev.evidenceId}
                      </span>
                      <span style={{
                        fontSize: 8, fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 800, color: '#5D4936', background: '#EAE0CA',
                        padding: '1px 5px', borderRadius: 2, textTransform: 'uppercase',
                      }}>
                        {ev.kind || 'RECORD'}
                      </span>
                    </p>
                    <p style={{
                      fontSize: 11, color: '#5D4936',
                      fontFamily: "'IBM Plex Serif', serif", fontStyle: 'italic', marginTop: 2,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {ev.summary || (ev.rawExcerpt ? ev.rawExcerpt.slice(0, 100) + '...' : 'Sealed forensic artifact.')}
                    </p>
                  </div>

                  <div style={{ textAlign: 'right', padding: '0 8px', flexShrink: 0 }}>
                    <div style={{
                      fontSize: 18, fontWeight: 900,
                      fontFamily: "'JetBrains Mono', monospace",
                      color: (ev.suspicionScore ?? 0) > 60 ? '#8B2E2E' : '#4C7657',
                    }}>
                      {ev.suspicionScore ?? '—'}%
                    </div>
                    <span style={{
                      fontSize: 8, fontWeight: 800, color: '#7A5135',
                      fontFamily: "'JetBrains Mono', monospace",
                      textTransform: 'uppercase',
                    }}>
                      {ev.claimCount != null ? `${ev.claimCount} CLAIMS` : (ev.threatLevel || 'SEALED')}
                    </span>
                  </div>

                  <ExternalLink size={14} color="#B08A52" style={{ flexShrink: 0 }} />
                </motion.div>
              );
            })}
          </div>

          {/* Action Bar when files are in the vault */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginTop: 20, padding: '16px 24px',
              background: '#0D0907', border: '2px solid #8B2E2E',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
              flexWrap: 'wrap', gap: 14,
            }}
          >
            <div>
              <p style={{
                fontSize: 12, fontWeight: 800,
                fontFamily: "'JetBrains Mono', monospace",
                color: '#E8463A', letterSpacing: '0.12em',
              }}>
                {evidence.length} MULTI-MODAL PIECES INGESTED & HASHED
              </p>
              <p style={{
                fontSize: 11, color: '#A89278',
                fontFamily: "'IBM Plex Serif', serif", fontStyle: 'italic', marginTop: 2,
              }}>
                Claims machine-parsed and timeline triangulated across video, telephony, and alibis.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button
                onClick={() => onNavigate?.('timeline')}
                style={{
                  padding: '10px 18px', borderRadius: 2,
                  background: 'transparent', border: '1px solid #7A5135',
                  color: '#FFF8E9', cursor: 'pointer',
                  fontSize: 11, fontWeight: 800,
                  fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em',
                }}
              >
                VIEW TIMELINE →
              </button>
              <button
                onClick={() => onNavigate?.('contradictions')}
                style={{
                  padding: '10px 18px', borderRadius: 2,
                  background: 'transparent', border: '1px solid #8B2E2E',
                  color: '#E8463A', cursor: 'pointer',
                  fontSize: 11, fontWeight: 800,
                  fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em',
                }}
              >
                CONTRADICTIONS →
              </button>
              <button
                disabled={solving}
                onClick={async () => {
                  setSolving(true);
                  try {
                    await solve();
                    onNavigate?.('verdict');
                  } finally {
                    setSolving(false);
                  }
                }}
                style={{
                  padding: '10px 22px', borderRadius: 2,
                  background: '#8B2E2E', border: '1px solid #E8463A',
                  color: '#FFF8E9', cursor: 'pointer',
                  fontSize: 11, fontWeight: 900,
                  fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.15em',
                  boxShadow: '0 0 15px rgba(232, 70, 58, 0.4)',
                }}
              >
                {solving ? 'CORRELATING...' : 'SOLVE CASE & COMPUTE VERDICT ★'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
