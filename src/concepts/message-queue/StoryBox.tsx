/**
 * StoryBox – floating narrative panel for "Black Friday Store" scenario.
 * Sits in the top-left corner of the simulation area and guides users
 * through 5 story steps explaining the problem → solution.
 */

import { motion, AnimatePresence } from 'motion/react';
import type { SimulationMode } from './types';

interface StoryStep {
  title: string;
  text: string;
  hint?: string;
  suggestSwitch?: SimulationMode; // if set, show a "switch mode" CTA
}

const STORY_STEPS: StoryStep[] = [
  {
    title: '🛒 Black Friday Morning',
    text: "It's 9 AM. Thousands of customers are rushing to checkout. Every order needs to reach a worker — instantly.",
  },
  {
    title: '🔥 Direct Processing',
    text: 'Each order goes straight to a worker. If all workers are busy, the order is rejected immediately. No waiting room.',
    hint: 'Hit Start to see what happens under load.',
  },
  {
    title: '😱 System Under Pressure',
    text: 'As traffic grows, workers are overwhelmed. Orders are DROPPED — customers get errors.',
    hint: 'Try the Traffic Spike button to see the system collapse.',
    suggestSwitch: 'queue',
  },
  {
    title: '💡 Enter the Message Queue',
    text: "What if orders had a safe waiting room? Orders are stored in the queue and workers pull at their own pace — nothing is lost.",
    hint: 'Notice: spikes cause delays, not drops.',
    suggestSwitch: 'chaos',
  },
  {
    title: '✅ Stable Under Any Load',
    text: 'Queue absorbs traffic spikes. System stays healthy. Workers can scale independently. No dropped orders.',
  },
];

interface StoryBoxProps {
  step: number;
  mode: SimulationMode;
  onPrev: () => void;
  onNext: () => void;
  onModeChange: (mode: SimulationMode) => void;
}

export function StoryBox({ step, mode, onPrev, onNext, onModeChange }: StoryBoxProps) {
  const current  = STORY_STEPS[step];
  const total    = STORY_STEPS.length;
  const canPrev  = step > 0;
  const canNext  = step < total - 1;

  return (
    <div className="absolute top-3 left-3 z-50 w-60 bg-white/96 backdrop-blur-sm rounded-xl border border-slate-200 shadow-lg overflow-hidden pointer-events-auto">
      {/* Colour strip indicates current mode */}
      <div
        className="h-1 transition-colors duration-500"
        style={{ background: mode === 'chaos' ? '#f87171' : '#34d399' }}
      />

      <div className="p-3">
        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            <div className="text-[11px] font-bold text-slate-700 mb-1 leading-tight">
              {current.title}
            </div>
            <div className="text-[11px] text-slate-600 leading-relaxed">
              {current.text}
            </div>
            {current.hint && (
              <div className="mt-1.5 text-[10px] text-blue-600 italic">
                💡 {current.hint}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Prev / Next navigation */}
        <div className="flex items-center gap-2 mt-2.5">
          <button
            onClick={onPrev}
            disabled={!canPrev}
            className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold
                       disabled:opacity-30 hover:bg-slate-200 active:bg-slate-300 transition-colors"
          >
            ← Prev
          </button>
          <span className="text-[9px] text-slate-400 flex-1 text-center tabular-nums">
            {step + 1} / {total}
          </span>
          <button
            onClick={onNext}
            disabled={!canNext}
            className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold
                       disabled:opacity-30 hover:bg-slate-200 active:bg-slate-300 transition-colors"
          >
            Next →
          </button>
        </div>

        {/* Mode-switch CTA when story suggests it */}
        {current.suggestSwitch && (
          <button
            onClick={() => onModeChange(current.suggestSwitch!)}
            className={`mt-2 w-full py-1 rounded text-[10px] font-bold border transition-colors ${
              current.suggestSwitch === 'queue'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                : 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100'
            }`}
          >
            {current.suggestSwitch === 'queue' ? '✅ See Queue Mode →' : '❌ See Chaos Mode →'}
          </button>
        )}
      </div>
    </div>
  );
}
