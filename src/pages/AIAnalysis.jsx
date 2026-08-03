import { motion } from 'framer-motion';
import { Brain, Eye, FileText, ShieldAlert, Fingerprint, Inbox } from 'lucide-react';
import { useCase } from '../context/CaseContext';

export default function AIAnalysis() {
  const { evidence } = useCase();

  const getScoreColor = (score) => {
    if (score > 70) return 'text-red-500';
    if (score > 40) return 'text-amber-500';
    return 'text-emerald-500';
  };

  const getBadgeClass = (score) => {
    if (score > 70) return 'bg-red-500/10 text-red-500 border border-red-500/20';
    if (score > 40) return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
    return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Brain size={28} className="text-blue-500" /> AI Analysis Results
          </h2>
          <p className="text-sm text-gray-400 mt-1.5 font-medium">Gemini AI has processed {evidence.length} evidence items</p>
        </div>
        {evidence.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-semibold text-emerald-500">Analysis Complete</span>
          </div>
        )}
      </div>

      {evidence.length === 0 ? (
        <div className="glass rounded-3xl p-20 text-center border border-white/5 shadow-sm mt-8">
          <Inbox size={56} className="text-gray-600 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-200 mb-2">No Evidence Analyzed</h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto">Upload evidence first to see AI analysis results, entities, and threat scores here.</p>
        </div>
      ) : (
        <>
          {/* Summary bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Eye, label: 'Persons Found', value: evidence.reduce((a, e) => a + (e.extractedEntities?.persons?.length || 0), 0), colorClass: 'text-blue-500', bgClass: 'bg-blue-500/10 border-blue-500/20' },
              { icon: FileText, label: 'Locations', value: evidence.reduce((a, e) => a + (e.extractedEntities?.locations?.length || 0), 0), colorClass: 'text-emerald-500', bgClass: 'bg-emerald-500/10 border-emerald-500/20' },
              { icon: ShieldAlert, label: 'Keywords Flagged', value: evidence.reduce((a, e) => a + (e.extractedEntities?.keywords?.length || 0), 0), colorClass: 'text-red-500', bgClass: 'bg-red-500/10 border-red-500/20' },
              { icon: Fingerprint, label: 'Phone Numbers', value: evidence.reduce((a, e) => a + (e.extractedEntities?.phoneNumbers?.length || 0), 0), colorClass: 'text-amber-500', bgClass: 'bg-amber-500/10 border-amber-500/20' },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
                className="glass rounded-2xl p-5 border border-white/5 flex items-center gap-5 shadow-sm">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${s.bgClass}`}>
                  <s.icon size={24} className={s.colorClass} />
                </div>
                <div>
                  <p className="text-3xl font-bold text-white mb-0.5">{s.value}</p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{s.label}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Analysis cards */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {evidence.map((item, i) => {
              const badgeClass = getBadgeClass(item.suspicionScore);
              const scoreColor = getScoreColor(item.suspicionScore);
              
              return (
                <motion.div key={item.evidenceId || i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className="glass rounded-2xl border border-gray-800 bg-gray-900/40 overflow-hidden hover:border-gray-700 transition-all shadow-sm">
                  
                  {/* Top Bar */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-800">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-lg font-semibold text-white truncate">{item.fileName || item.originalFile}</p>
                      <p className="text-sm text-gray-500 mt-1 font-mono">{item.evidenceId} • {item.metadata?.contentType || 'unknown type'}</p>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <div className="flex items-baseline gap-1">
                        <span className={`text-2xl font-bold ${scoreColor}`}>{item.suspicionScore}</span>
                        <span className="text-sm font-semibold text-gray-500">%</span>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1.5 ${badgeClass}`}>
                        {item.threatLevel} THREAT
                      </span>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Summary */}
                    <p className="text-[15px] text-gray-300 leading-relaxed bg-gray-800/30 p-4 rounded-xl border border-gray-800/50">
                      {item.summary}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Findings */}
                      {item.findings?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">AI Findings</p>
                          <div className="space-y-2">
                            {item.findings.map((f, fi) => (
                              <div key={fi} className="flex items-start gap-2.5">
                                <span className="text-blue-500 text-sm mt-0.5">•</span>
                                <span className="text-sm text-gray-300">{f}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Entities */}
                      {item.extractedEntities && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Extracted Entities</p>
                          <div className="space-y-2.5">
                            {Object.entries(item.extractedEntities).map(([key, vals]) =>
                              vals?.length > 0 && (
                                <div key={key} className="flex flex-wrap items-baseline gap-2">
                                  <span className="text-xs font-semibold text-gray-500 uppercase">{key}:</span>
                                  {vals.map((v, vi) => (
                                    <span key={`${key}-${vi}`} className="text-xs font-medium px-2 py-1 rounded bg-gray-800 text-gray-300 border border-gray-700">
                                      {v}
                                    </span>
                                  ))}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer / OCR / Metadata */}
                    <div className="pt-4 border-t border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {item.ocrText && (
                        <div className="col-span-full mb-2">
                          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">OCR Extracted Text</p>
                          <p className="text-sm text-gray-400 font-mono bg-[#09090b] p-3 rounded-lg border border-gray-800 line-clamp-3">
                            {item.ocrText}
                          </p>
                        </div>
                      )}
                      
                      {item.metadata?.authenticity && (
                        <div className="text-sm text-gray-400 flex items-center gap-2">
                          <span className="font-semibold text-gray-500 uppercase tracking-wider text-xs">Authenticity:</span>
                          <span className={`font-medium ${item.metadata.authenticity === 'appears_genuine' ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {item.metadata.authenticity.replace('_', ' ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </motion.div>
  );
}
