import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface StoryStep {
  title: string;
  text: string;
  highlight?: 'none' | 'db-overload' | 'cache-win';
}

const STORY_STEPS: StoryStep[] = [
  {
    title: 'The Story',
    text: 'Imagine an online store. A new sneaker just dropped and the product page is going viral. Thousands of customers are opening it every second.',
    highlight: 'none',
  },
  {
    title: 'Without Cache',
    text: 'Every customer request hits your server which asks the database for the same product data over and over — even though nothing changed.',
    highlight: 'db-overload',
  },
  {
    title: 'Database Overload',
    text: 'The database gets overwhelmed running the same query thousands of times. Response times skyrocket. The site slows to a crawl.',
    highlight: 'db-overload',
  },
  {
    title: 'Introducing Cache',
    text: 'A cache stores frequently requested data in fast memory. When the server sees the same product request, it checks the cache first.',
    highlight: 'cache-win',
  },
  {
    title: 'Cache Hit',
    text: 'Cache hit! The product data is already in memory. No database trip needed. Response time drops from ~300ms to ~10ms.',
    highlight: 'cache-win',
  },
  {
    title: 'The Result',
    text: 'The database workload drops dramatically. The site stays fast under viral traffic. The cache is trading a small amount of memory for massive speed.',
    highlight: 'cache-win',
  },
];

interface StoryBoxProps {
  cacheEnabled: boolean;
  hitRate: number;
  dbLoad: number;
}

export function StoryBox({ cacheEnabled, hitRate, dbLoad }: StoryBoxProps) {
  const [step, setStep] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  const current = STORY_STEPS[step];

  // Dynamic contextual step based on sim state
  const contextBadge = !cacheEnabled
    ? { label: 'No Cache Mode', color: '#ef4444', bg: '#fef2f2' }
    : hitRate >= 70
    ? { label: `${hitRate}% Hit Rate`, color: '#059669', bg: '#ecfdf5' }
    : hitRate > 0
    ? { label: `Building Up…`, color: '#d97706', bg: '#fffbeb' }
    : null;

  if (collapsed) {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => setCollapsed(false)}
        className="absolute top-4 left-4 z-20 bg-white border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-2 cursor-pointer"
        style={{ boxShadow: '0 4px 14px rgba(0,0,0,0.08)' }}
      >
        <span className="text-[11px] font-bold text-slate-600 heading-3">Story</span>
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute top-4 left-4 z-20 w-[260px] bg-white border border-slate-200 rounded-2xl overflow-hidden"
      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.10)' }}
    >
      {/* Header */}
      <div
        className="px-4 py-2.5 flex items-center justify-between"
        style={{ borderBottom: '1px solid #f1f5f9' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500 tracking-[1px] text-code">
            SCENARIO
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-slate-400 text-code">
            {step + 1}/{STORY_STEPS.length}
          </span>
          <button
            onClick={() => setCollapsed(true)}
            className="text-slate-300 hover:text-slate-500 cursor-pointer text-base leading-none transition-colors"
            style={{ fontSize: 16, lineHeight: 1 }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-3 pb-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-[13px] font-bold text-slate-800 mb-1.5 heading-3">
              {current.title}
            </div>
            <p className="text-[11.5px] text-slate-500 leading-[1.6] m-0 text-serif">
              {current.text}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Live context badge */}
      {contextBadge && (
        <div className="px-4 pb-2">
          <motion.div
            key={contextBadge.label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border"
            style={{
              background: contextBadge.bg,
              borderColor: contextBadge.color + '40',
              color: contextBadge.color,
            }}
          >
            <motion.div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: contextBadge.color }}
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-[10px] font-bold text-code">{contextBadge.label}</span>
          </motion.div>
        </div>
      )}

      {/* DB overload warning */}
      {dbLoad > 70 && !cacheEnabled && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-4 mb-3 px-3 py-2 rounded-xl text-[10.5px] leading-snug"
            style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}
          >
            Database overloaded — {dbLoad}% load. Enable cache to fix this.
          </motion.div>
        </AnimatePresence>
      )}

      {/* Navigation */}
      <div
        className="px-4 py-2.5 flex items-center justify-between"
        style={{ borderTop: '1px solid #f1f5f9' }}
      >
        <button
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
          className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-600 disabled:opacity-30 cursor-pointer disabled:cursor-default transition-colors heading-3"
        >
          ← Prev
        </button>

        {/* Dot progress */}
        <div className="flex gap-1.5">
          {STORY_STEPS.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => setStep(i)}
              animate={{
                width: i === step ? 16 : 6,
                background: i === step ? '#3b82f6' : i < step ? '#93c5fd' : '#e2e8f0',
              }}
              transition={{ duration: 0.2 }}
              className="h-1.5 rounded-full border-none cursor-pointer p-0"
            />
          ))}
        </div>

        <button
          onClick={() => setStep(s => Math.min(STORY_STEPS.length - 1, s + 1))}
          disabled={step === STORY_STEPS.length - 1}
          className="flex items-center gap-1 text-[11px] font-semibold text-blue-500 hover:text-blue-700 disabled:opacity-30 cursor-pointer disabled:cursor-default transition-colors heading-3"
        >
          Next →
        </button>
      </div>
    </motion.div>
  );
}
