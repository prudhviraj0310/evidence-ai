import { motion } from 'framer-motion';

export function ProcessingLoader({ label = 'PROCESSING' }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-16 h-16">
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ border: '2px solid rgba(99,102,241,0.15)', borderTopColor: '#6366f1' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-2 rounded-full"
          style={{ border: '2px solid rgba(236,72,153,0.15)', borderBottomColor: '#ec4899' }}
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-2 h-2 rounded-full bg-indigo-400"
            animate={{ scale: [1, 1.6, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </div>
      </div>
      <motion.span
        className="text-[10px] font-mono font-bold text-indigo-400 tracking-[0.3em] uppercase"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {label}
      </motion.span>
    </div>
  );
}
