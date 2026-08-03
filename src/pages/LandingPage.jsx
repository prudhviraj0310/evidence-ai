import { motion } from 'framer-motion';
import { ArrowRight, Shield, Fingerprint, Search, Zap } from 'lucide-react';

export default function LandingPage({ onStart }) {
  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center font-sans overflow-hidden" style={{ background: '#05050A' }}>

      {/* Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 30%, rgba(99,102,241,0.08), transparent 60%), radial-gradient(ellipse at 50% 80%, rgba(236,72,153,0.05), transparent 50%)',
      }} />

      <div className="relative z-10 w-full max-w-4xl px-6 flex flex-col items-center text-center">

        {/* Status Chip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-14"
        >
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            <span className="text-[11px] font-bold text-gray-400 tracking-[0.25em] uppercase">
              Neural Engine Online
            </span>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="text-8xl md:text-[10rem] font-extrabold tracking-[0.08em] mb-6 leading-none"
          style={{
            background: 'linear-gradient(180deg, #ffffff 0%, #64748b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          EVIDENCE
        </motion.h1>

        {/* Subtitle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mb-16 flex items-center justify-center gap-5"
        >
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-indigo-500/40" />
          <span className="text-sm font-bold text-gray-500 tracking-[0.35em] uppercase">
            AI Forensic Intelligence
          </span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-pink-500/40" />
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1 }}
        >
          <button
            onClick={onStart}
            className="group relative px-10 py-4 rounded-full font-bold tracking-[0.15em] uppercase text-sm transition-all flex items-center gap-3 text-white border border-white/10 hover:border-white/30"
            style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1))',
              boxShadow: '0 8px 32px rgba(99,102,241,0.2)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 12px 40px rgba(99,102,241,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(99,102,241,0.2)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <Shield size={18} className="text-indigo-400" />
            <span>Start Investigation</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform text-indigo-300" />
          </button>
        </motion.div>
      </div>

      {/* Bottom Features */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute bottom-12 left-0 w-full px-6 flex justify-center"
      >
        <div className="flex flex-wrap justify-center gap-10 md:gap-16 text-[10px] font-bold text-gray-600 uppercase tracking-[0.25em]">
          <span className="flex items-center gap-2"><Fingerprint size={14} className="text-indigo-500/50" /> Timeline AI</span>
          <span className="flex items-center gap-2"><Search size={14} className="text-pink-500/50" /> Contradiction Engine</span>
          <span className="flex items-center gap-2"><Zap size={14} className="text-indigo-500/50" /> Neural Reconstruction</span>
        </div>
      </motion.div>
    </div>
  );
}
