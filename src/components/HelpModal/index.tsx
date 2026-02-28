import { motion, AnimatePresence } from 'motion/react';
import { CONCEPTS } from '../../data/conceptsList';
import { getActiveTerms, STRATEGY_GUIDE } from '../../data/glossary';

const SECTION_LABEL = 'text-[9px] font-bold text-slate-400 tracking-[2px] uppercase mb-2 text-code';

interface HelpModalProps {
  conceptId: string;
  onClose: () => void;
}

export function HelpModal({ conceptId, onClose }: HelpModalProps) {
  const concept = CONCEPTS.find((c) => c.id === conceptId);
  if (!concept) return null;

  const allTerms = getActiveTerms(conceptId, Object.keys(STRATEGY_GUIDE));

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-3xl w-[90%] max-w-[580px] max-h-[88vh] overflow-hidden flex flex-col"
          style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.15)' }}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.94 }}
          transition={{ duration: 0.25 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Color header stripe */}
          <div className="h-[5px] shrink-0" style={{ background: concept.color }} />

          {/* Header */}
          <div className="px-7 pt-6 pb-4 shrink-0 border-b border-slate-100">
            <div className="flex items-start gap-3">
              <div className="text-[36px] leading-none">{concept.icon}</div>
              <div className="flex-1">
                <h2 className="leading-none font-bold text-slate-900 heading-3 m-0" style={{ fontSize: 22 }}>
                  {concept.label} — Simulator Guide
                </h2>
                <p className="text-[12px] text-slate-500 italic mt-1 m-0 text-serif">
                  {concept.tagline}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg w-8 h-8 flex items-center justify-center cursor-pointer transition-colors shrink-0 text-lg"
              >
                ×
              </button>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1 px-7 py-5 flex flex-col gap-5">

            {/* 1 — Overview */}
            <section>
              <h3 className={SECTION_LABEL}>Overview</h3>
              <p className="text-[13px] text-slate-700 leading-relaxed text-serif m-0">
                {concept.overview}
              </p>
            </section>

            {/* <div className="border-t border-slate-100" /> */}

            {/* 2 — Strategies */}
            {/* <section>
              <h3 className={SECTION_LABEL}>Strategies</h3>
              <div className="flex flex-col gap-2.5">
                {Object.entries(STRATEGY_GUIDE).map(([id, g]) => (
                  <div
                    key={id}
                    className="rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2.5 flex flex-col gap-1.5"
                  >
                    <span className="text-[11px] font-bold text-slate-700 heading-3">{g.headline}</span>
                    <div className="text-[10px] font-mono text-blue-700 bg-blue-50 rounded px-2 py-1.5 leading-relaxed border border-blue-100">
                      {g.flow}
                    </div>
                    <p className="text-[11px] text-slate-500 text-serif leading-snug m-0">💡 {g.note}</p>
                  </div>
                ))}
              </div>
            </section> */}

            <div className="border-t border-slate-100" />

            {/* 3 — Key Terms */}
            <section>
              <h3 className={SECTION_LABEL}>Key Terms</h3>
              <div className="grid grid-cols-1 gap-2">
                {allTerms.map((term) => (
                  <div
                    key={term.title}
                    className="rounded-lg border border-slate-100 bg-white px-3 py-2.5"
                    style={{ borderLeftWidth: 3, borderLeftColor: term.color }}
                  >
                    <span className="text-[11px] font-bold font-mono" style={{ color: term.color }}>
                      {term.title}
                    </span>
                    <p className="text-[12px] text-slate-600 leading-snug text-serif m-0 mt-0.5">
                      {term.short}
                    </p>
                    {term.context && (
                      <p className="text-[10px] text-slate-400 mt-0.5 text-serif italic m-0">
                        {term.context}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <div className="border-t border-slate-100" />

            {/* 4 — Visual Legend */}
            <section className="pb-1">
              <h3 className={SECTION_LABEL}>Visual Legend</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { dot: '#3b82f6', label: 'Blue packet', desc: 'A read request traveling through the system.' },
                  { dot: '#d97706', label: 'Amber packet', desc: 'A write request or data being stored.' },
                  { dot: '#059669', label: 'Green glow on node', desc: 'Cache is actively involved in this step.' },
                  { dot: '#ef4444', label: 'Red packet', desc: 'A cache miss — falling back to the database.' },
                  { dot: '#7c3aed', label: 'Purple packet', desc: 'Acknowledgement — operation confirmed.' },
                  { dot: '#cbd5e1', label: 'Dashed line', desc: 'A connection between nodes (idle).' },
                  { dot: '#2563eb', label: 'Solid colored line', desc: 'Active animation path for current step.' },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-2">
                    <span
                      className="shrink-0 w-2.5 h-2.5 rounded-full mt-[3px]"
                      style={{ background: item.dot, boxShadow: `0 0 5px ${item.dot}66` }}
                    />
                    <div>
                      <span className="text-[10px] font-bold text-slate-600 font-mono">{item.label}</span>
                      <p className="text-[10px] text-slate-400 text-serif m-0 leading-snug">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
