import { motion, AnimatePresence } from 'motion/react';
import type { ConceptMeta } from '../types';

interface ConceptIntroModalProps {
  concept: ConceptMeta;
  onStart: () => void;
  onBack: () => void;
}

export function ConceptIntroModal({ concept, onStart, onBack }: ConceptIntroModalProps) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onBack}
      >
        <motion.div
          className="bg-white rounded-3xl w-[90%] max-w-[560px] overflow-hidden"
          style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.15)' }}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.94 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Color header stripe */}
          <div className="h-[5px]" style={{ background: concept.color }} />

          <div className="px-8 pt-7 pb-6">
            {/* Title row */}
            <div className="flex items-start gap-[14px] mb-5">
              <div className="text-[40px] leading-none">{concept.icon}</div>
              <div className="flex-1">
                <h2
                  className="leading-none font-bold text-slate-900 m-0 heading-3"
                  style={{ fontSize: 30 }}
                >
                  {concept.label}
                </h2>
                <p
                  className="text-[13px] text-slate-500 italic mt-1 mb-0 text-serif"
                >
                  {concept.tagline}
                </p>
              </div>
              {concept.status === 'live' && (
                <span
                  className="text-[9px] bg-green-100 text-green-700 border border-green-200 px-2 py-[3px] rounded tracking-[1px] shrink-0 mt-[2px] text-code"
                >
                  LIVE
                </span>
              )}
            </div>

            {/* What is it */}
            <div className="mb-4">
              <div className="text-[9px] font-bold text-slate-400 tracking-[2px] uppercase mb-[6px] text-code">
                What is it?
              </div>
              <p className="text-[13px] text-slate-700 leading-[1.7] m-0 text-serif">
                {concept.what}
              </p>
            </div>

            {/* Real world */}
            <div
              className="mb-4 rounded-xl px-[14px] py-3 bg-slate-50"
              style={{ borderLeft: `3px solid ${concept.color}` }}
            >
              <div className="text-[9px] font-bold text-slate-400 tracking-[2px] uppercase mb-[6px] text-code">
                🌍 Real world
              </div>
              <p className="text-[12px] text-slate-600 leading-[1.7] m-0 text-serif">
                {concept.realWorld}
              </p>
            </div>

            {/* Use cases + stat */}
            <div className="flex gap-4 mb-6 items-start">
              <div className="flex-1">
                <div className="text-[9px] font-bold text-slate-400 tracking-[2px] uppercase mb-2 text-code">
                  Use Cases
                </div>
                <div className="flex flex-col gap-1">
                  {concept.useCases.map((u) => (
                    <div key={u} className="flex items-center gap-[7px] text-[12px] text-slate-600 text-serif">
                      <div className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: concept.color }} />
                      {u}
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="rounded-xl px-4 py-3 text-center shrink-0"
                style={{
                  background: `${concept.color}12`,
                  border: `1px solid ${concept.color}30`,
                }}
              >
                <div className="leading-none font-bold heading-3" style={{ fontSize: 22, color: concept.color }}>
                  {concept.stat}
                </div>
                <div className="mt-[3px] tracking-[0.5px] text-code" style={{ fontSize: 9, color: `${concept.color}aa` }}>
                  benchmark
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-[10px] justify-end">
              <button
                onClick={onBack}
                className="px-5 py-[9px] rounded-[10px] bg-white border border-slate-200 text-slate-500 cursor-pointer hover:bg-slate-50 transition-colors heading-3"
                style={{ fontSize: 14, fontWeight: 600 }}
              >
                ← Back
              </button>
              {concept.status === 'live' ? (
                <motion.button
                  onClick={onStart}
                  className="px-6 py-[9px] rounded-[10px] border-none text-white cursor-pointer font-bold heading-3"
                  style={{
                    fontSize: 14,
                    background: concept.color,
                    boxShadow: `0 4px 14px ${concept.color}44`,
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Visualize it →
                </motion.button>
              ) : (
                <button
                  disabled
                  className="px-6 py-[9px] rounded-[10px] border-none bg-slate-100 text-slate-400 cursor-not-allowed font-bold heading-3"
                  style={{ fontSize: 14 }}
                >
                  Coming Soon
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
