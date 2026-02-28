import { useState } from 'react';
import type React from 'react';
import { motion } from 'motion/react';
import { CONCEPTS } from '../data/conceptsList';
import type { ConceptMeta } from '../types';
import { Topbar } from '../layout/Topbar';

interface LandingPageProps {
  onSelectConcept: (concept: ConceptMeta) => void;
}

const STATS = [
  { val: '~1ms', label: 'Cache response time', sub: 'vs ~100ms from DB' },
  { val: '6', label: 'Concepts to explore', sub: 'more coming soon' },
  { val: '100%', label: 'Visual, no theory', sub: "see it, don't just read it" },
];

function ConceptCard({ concept, index, onClick }: { concept: ConceptMeta; index: number; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const isLive = concept.status === 'live';

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl bg-white cursor-pointer"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: isLive ? 1 : 0.55, y: 0 }}
      transition={{ delay: 0.05 + index * 0.07, duration: 0.4 }}
      whileHover={isLive ? { y: -3, boxShadow: '0 8px 32px rgba(0,0,0,0.08)' } : {}}
      onClick={isLive ? onClick : undefined}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{ border: `1.5px solid ${hovered && isLive ? concept.color : '#e2e8f0'}`, transition: 'border-color 0.2s' }}
    >
      {/* Top accent bar */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-[3px]"
        animate={{ scaleX: hovered && isLive ? 1 : 0 }}
        initial={{ scaleX: 0 }}
        transition={{ duration: 0.2 }}
        style={{ background: concept.color, originX: 0 } as React.CSSProperties}
      />

      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="text-[28px] leading-none">{concept.icon}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-[3px]">
              <span className="font-bold heading-3 text-slate-900">
                {concept.label}
              </span>
              <span
                className="text-[8px] px-[6px] py-[1px] rounded tracking-[0.5px] text-code"
                style={{
                  background: isLive ? '#dcfce7' : '#f1f5f9',
                  color: isLive ? '#16a34a' : '#94a3b8',
                  border: `1px solid ${isLive ? '#bbf7d0' : '#e2e8f0'}`,
                }}
              >
                {isLive ? 'LIVE' : 'SOON'}
              </span>
            </div>
            <p className="text-[12px] text-slate-500 leading-[1.5] italic m-0 text-serif">
              {concept.tagline}
            </p>
          </div>
        </div>

        <p className="text-[12px] text-slate-600 leading-[1.6] mb-3 text-serif">
          {concept.what.slice(0, 120)}…
        </p>

        <div className="flex justify-between items-center">
          <span
            className="text-[10px] font-semibold px-2 py-[2px] rounded-full text-code"
            style={{
              color: concept.color,
              background: `${concept.color}18`,
              border: `1px solid ${concept.color}25`,
            }}
          >
            {concept.stat}
          </span>
          {isLive && (
            <span
              className="text-[12px] font-semibold transition-colors duration-200 heading-3"
              style={{ color: hovered ? concept.color : '#94a3b8' }}
            >
              {/* Explore → */}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function LandingPage({ onSelectConcept }: LandingPageProps) {
  const cachingConcept = CONCEPTS.find((c) => c.id === 'caching')!;

  return (
    <div
      className="h-full overflow-y-auto pb-16"
      style={{
        background: '#fafafa',
        backgroundImage:
          'radial-gradient(circle at 20% 20%, rgba(59,130,246,0.06) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(16,185,129,0.05) 0%, transparent 50%), radial-gradient(circle, #e2e8f0 1px, transparent 1px)',
        backgroundSize: 'auto, auto, 32px 32px',
      }}
    >
      <Topbar variant="landing" />

      {/* Hero */}
      <div className="max-w-[780px] mx-auto px-10 pt-[72px] pb-14 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0, duration: 0.5 }}
          className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-[14px] py-[5px] mb-7"
        >
          <motion.div
            className="w-[7px] h-[7px] rounded-full bg-blue-500"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ boxShadow: '0 0 6px #3b82f6' }}
          />
          <span className="text-[11px] text-blue-600 tracking-[0.5px] text-code">
            Interactive system design simulator
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-5 leading-none font-caveat tracking-[-1px] text-slate-900 heading-3"
          style={{
            fontWeight: 700,
            fontSize: 'clamp(48px, 7vw, 88px)',
          }}
        >
          Stop reading about
          <br />
          <span className="text-blue-600">distributed systems.</span>
          <br />
          Watch them work.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-[18px] text-slate-500 leading-[1.7] max-w-[520px] mx-auto mb-9 text-serif"
        >
          SysViz turns dense engineering concepts into living diagrams. Pick a concept, set the
          scenario, and watch data flow — step by step, with labels and logs.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex gap-[10px] justify-center flex-wrap"
        >
          <motion.button
            onClick={() => onSelectConcept(cachingConcept)}
            className="px-7 py-3 rounded-xl border-none cursor-pointer text-white heading-3"
            style={{
              fontSize: 16,
              fontWeight: 700,
              background: '#2563eb',
              boxShadow: '0 4px 20px rgba(37,99,235,0.35)',
            }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            Start with Caching ⚡
          </motion.button>

          <a
            href="#concepts"
            className="px-7 py-3 rounded-xl border border-slate-200 bg-white text-slate-600 no-underline inline-block transition-colors hover:border-slate-400 heading-3"
            style={{ fontSize: 16, fontWeight: 700 }}
          >
            Browse concepts ↓
          </a>
        </motion.div>
      </div>

      {/* Stats bar */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="max-w-[680px] mx-auto px-10 mb-16"
      >
        <div className="bg-white border border-slate-200 rounded-2xl px-8 py-5 flex justify-around gap-5 flex-wrap">
          {STATS.map((s) => (
            <div key={s.val} className="text-center">
              <div className="leading-none font-bold text-slate-900 heading-3" style={{ fontSize: 32 }}>
                {s.val}
              </div>
              <div className="text-[12px] text-slate-700 mt-[3px] text-serif">
                {s.label}
              </div>
              <div className="text-[10px] text-slate-400 mt-[1px] text-code">
                {s.sub}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Concept grid */}
      <div id="concepts" className="max-w-[900px] mx-auto px-10">
        <div className="mb-7">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.4 }}
            className="leading-none font-bold text-slate-900 mb-[6px] heading-3"
            style={{ fontSize: 34 }}
          >
            Pick a concept
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="text-[14px] text-slate-500 m-0 text-serif"
          >
            Each one gets a quick real-world intro, then you can jump straight into the simulator.
          </motion.p>
        </div>

        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {CONCEPTS.map((c, i) => (
            <ConceptCard key={c.id} concept={c} index={i} onClick={() => onSelectConcept(c)} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-[900px] mx-auto mt-14 px-10">
        <div className="border-t border-slate-200 pt-6 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="w-[22px] h-[22px] bg-blue-600 rounded-[6px] flex items-center justify-center">
              <span className="text-white text-[11px] font-extrabold">S</span>
            </div>
            <span className="font-bold text-slate-400 heading-3" style={{ fontSize: 16 }}>
              SysViz
            </span>
          </div>
          <p className="text-[11px] text-slate-400 m-0 text-serif">
            Built for engineers who learn by seeing, not just reading.
          </p>
        </div>
      </div>
    </div>
  );
}
