import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { OperationType, CacheState, SimStats, LogEntry } from '../../types';
import { CONCEPTS } from '../../data/conceptsList';
import { READ_STRATS, WRITE_STRATS } from '../../concepts/caching/strategies';
import { Pill } from '../ControlPanel/Pill';

const LOG_COLORS: Record<string, string> = {
  info: '#94a3b8',
  hit: '#059669',
  miss: '#ef4444',
  fetch: '#3b82f6',
  store: '#d97706',
  ack: '#7c3aed',
  response: '#1d4ed8',
};

const LABEL = 'text-[9px] font-bold text-slate-400 tracking-[2px] uppercase font-mono';
const SECTION_LABEL = 'text-[10px] font-bold tracking-[2px] uppercase mb-1.5';

type Tab = 'info' | 'controls' | 'metrics' | 'logs';

const TABS: { id: Tab; label: string }[] = [
  { id: 'info', label: 'Info' },
  { id: 'controls', label: 'Controls' },
  { id: 'metrics', label: 'Metrics' },
  { id: 'logs', label: 'Logs' },
];

interface SimulatorSidebarProps {
  conceptId: string;
  op: OperationType;
  rs: string;
  ws: string;
  cs: CacheState;
  spd: number;
  running: boolean;
  setOp: (v: OperationType) => void;
  setRs: (v: string) => void;
  setWs: (v: string) => void;
  setCs: (v: CacheState) => void;
  setSpd: (v: number) => void;
  onRun: () => void;
  onReset: () => void;
  stats: SimStats;
  logs: LogEntry[];
}

export function SimulatorSidebar({
  conceptId, op, rs, ws, cs, spd, running,
  setOp, setRs, setWs, setCs, setSpd,
  onRun, onReset, stats, logs,
}: SimulatorSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const logEndRef = useRef<HTMLDivElement>(null);

  const concept = CONCEPTS.find((c) => c.id === conceptId);
  const strats = op === 'read' ? READ_STRATS : WRITE_STRATS;
  const cur = strats.find((s) => s.id === (op === 'read' ? rs : ws));

  const totalRequests = stats.hits + stats.misses;
  const hitRate = totalRequests > 0 ? ((stats.hits / totalRequests) * 100).toFixed(1) : '0.0';

  useEffect(() => {
    if (activeTab === 'logs') {
      setTimeout(() => logEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }, [logs, activeTab]);

  return (
    <>
      {/* Collapsed toggle button */}
      <AnimatePresence>
        {collapsed && (
          <motion.button
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            onClick={() => setCollapsed(false)}
            className="fixed right-4 top-1/2 -translate-y-1/2 z-50 bg-white border border-slate-200 rounded-full w-10 h-10 flex items-center justify-center cursor-pointer hover:bg-slate-50"
            style={{ boxShadow: '0 4px 14px rgba(0,0,0,0.1)', fontSize: 18, color: '#64748b' }}
          >
            ‹
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main sidebar */}
      <AnimatePresence>
        {!collapsed && (
          <motion.aside
            key="simulator-sidebar"
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-hidden z-30"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <div className="heading-3 text-slate-800" style={{ fontSize: 14 }}>
                  {concept?.label ?? conceptId}
                </div>
                <div className="text-[10px] text-slate-400 text-code tracking-[1px]">
                  System Design Simulator
                </div>
              </div>
              <button
                onClick={() => setCollapsed(true)}
                className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg w-7 h-7 flex items-center justify-center cursor-pointer transition-colors"
                style={{ fontSize: 16 }}
              >
                ›
              </button>
            </div>

            {/* Run / Reset controls */}
            <div className="px-4 py-2.5 border-b border-slate-100 flex gap-2 shrink-0 bg-slate-50/60">
              <button
                onClick={onRun}
                disabled={running}
                className="flex-1 py-1.75 rounded-[10px] border-none cursor-pointer transition-all disabled:cursor-not-allowed heading-3"
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'white',
                  background: running ? '#94a3b8' : '#2563eb',
                  boxShadow: running ? 'none' : '0 4px 14px rgba(37,99,235,0.3)',
                }}
              >
                {running ? '⏳  Running…' : '▶  Run Simulation'}
              </button>
              <button
                onClick={onReset}
                disabled={running}
                className="px-3 py-1.75 rounded-[10px] border border-slate-200 bg-white text-slate-500 cursor-pointer transition-all hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed heading-3"
                style={{ fontSize: 13, fontWeight: 600 }}
                title="Reset"
              >
                ↺
              </button>
            </div>

            {/* Tab bar */}
            <div className="flex border-b border-slate-100 shrink-0">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2 text-[10px] font-bold tracking-[1.5px] uppercase transition-all cursor-pointer border-b-2 font-mono ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50/40'
                      : 'border-transparent text-slate-400 hover:text-slate-600 bg-transparent'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto">

              {/* ── INFO ── */}
              {activeTab === 'info' && concept && (
                <div className="flex flex-col gap-4 py-3">
                  <section className="px-3">
                    <h3 className={`${SECTION_LABEL} text-code`} style={{ color: '#64748b' }}>
                      Overview
                    </h3>
                    <p className="text-[12px] text-slate-700 leading-relaxed text-serif">
                      {concept.overview}
                    </p>
                  </section>

                  <div className="border-t border-slate-100 mx-3" />

                  <section className="px-3">
                    <h3 className={`${SECTION_LABEL} text-code`} style={{ color: '#64748b' }}>
                      How It Works
                    </h3>
                    <p className="text-[12px] text-slate-700 leading-relaxed text-serif">
                      {concept.howItWorks}
                    </p>
                  </section>

                  <div className="border-t border-slate-100 mx-3" />

                  <section className="px-3">
                    <h3 className={`${SECTION_LABEL} text-code`} style={{ color: '#64748b' }}>
                      Real-World Example
                    </h3>
                    <div
                      className="rounded-lg p-2.5 text-[12px] leading-relaxed text-serif"
                      style={{
                        background: '#f8fafc',
                        borderLeft: `3px solid ${concept.color}`,
                        color: '#475569',
                      }}
                    >
                      {concept.realWorldDetails}
                    </div>
                  </section>

                  <div className="border-t border-slate-100 mx-3" />

                  <section className="px-3">
                    <h3 className={`${SECTION_LABEL} text-code`} style={{ color: '#64748b' }}>
                      Use Case
                    </h3>
                    <p className="text-[12px] text-slate-700 leading-relaxed text-serif">
                      {concept.useCases[0]} — {concept.what}
                    </p>
                  </section>

                  {concept.processSteps?.length > 0 && (
                    <>
                      <div className="border-t border-slate-100 mx-3" />
                      <section className="px-3 pb-3">
                        <h3 className={`${SECTION_LABEL} text-code`} style={{ color: '#64748b' }}>
                          Process Steps
                        </h3>
                        <div className="flex flex-col gap-2">
                          {concept.processSteps.map((step) => (
                            <div key={step.num} className="flex items-start gap-2">
                              <span
                                className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white mt-px text-code"
                                style={{ background: concept.color }}
                              >
                                {step.num}
                              </span>
                              <p className="text-[12px] text-slate-600 leading-snug text-serif">
                                {step.desc}
                              </p>
                            </div>
                          ))}
                        </div>
                      </section>
                    </>
                  )}
                </div>
              )}

              {/* ── CONTROLS ── */}
              {activeTab === 'controls' && (
                <div className="px-4 py-4 flex flex-col gap-4">
                  {/* Operation */}
                  <div className="flex flex-col gap-1.5">
                    <span className={LABEL}>Operation</span>
                    <div className="flex gap-2">
                      <Pill label="📖  READ" sel={op === 'read'} onClick={() => setOp('read')} color="blue" disabled={running} />
                      <Pill label="✏️  WRITE" sel={op === 'write'} onClick={() => setOp('write')} color="violet" disabled={running} />
                    </div>
                  </div>

                  {/* Strategy */}
                  <div className="flex flex-col gap-1.5">
                    <span className={LABEL}>{op === 'read' ? 'Read Strategy' : 'Write Strategy'}</span>
                    <div className="flex gap-2 flex-wrap">
                      {strats.map((s) => (
                        <Pill
                          key={s.id}
                          label={s.label}
                          sel={op === 'read' ? rs === s.id : ws === s.id}
                          onClick={() => (op === 'read' ? setRs(s.id) : setWs(s.id))}
                          color={op === 'read' ? 'emerald' : 'amber'}
                          disabled={running}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Cache State (read only, not refresh-ahead) */}
                  {op === 'read' && rs !== 'refresh-ahead' && (
                    <div className="flex flex-col gap-1.5">
                      <span className={LABEL}>Cache State</span>
                      <div className="flex gap-2">
                        <Pill label="✅  HIT" sel={cs === 'hit'} onClick={() => setCs('hit')} color="emerald" disabled={running} />
                        <Pill label="❌  MISS" sel={cs === 'miss'} onClick={() => setCs('miss')} color="red" disabled={running} />
                      </div>
                    </div>
                  )}

                  {/* Speed */}
                  <div className="flex flex-col gap-1.5">
                    <span className={LABEL}>Speed · {spd}x</span>
                    <input
                      type="range"
                      min={0.5}
                      max={3}
                      step={0.5}
                      value={spd}
                      onChange={(e) => setSpd(parseFloat(e.target.value))}
                      className="w-full"
                      disabled={running}
                    />
                  </div>

                  {/* Strategy hint */}
                  {cur && (
                    <div className="rounded-xl px-3 py-2.5 border border-slate-100 bg-slate-50 flex flex-col gap-2">
                      <p className="text-[11px] text-slate-600 leading-normal text-serif">
                        💡 {cur.tagline}
                      </p>
                      <div className="flex gap-3 flex-wrap">
                        {cur.pros.map((p) => (
                          <span key={p} className="text-[10px] text-emerald-600 flex items-center gap-0.75">
                            ✓ {p}
                          </span>
                        ))}
                      </div>
                      <span className="text-[9px] bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full self-start text-code">
                        When: {cur.when}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* ── METRICS ── */}
              {activeTab === 'metrics' && (
                <div className="px-4 py-4 flex flex-col gap-3">
                  {/* Hit rate bar */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className={LABEL}>Cache Hit Rate</span>
                      <span className="text-[20px] font-bold font-mono text-slate-800">
                        {hitRate}
                        <span className="text-[13px] text-slate-400 ml-0.5">%</span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: '#059669' }}
                        animate={{ width: `${parseFloat(hitRate)}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>

                  {/* Hit / Miss / Total grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Total', value: totalRequests, color: '#475569' },
                      { label: 'Hits', value: stats.hits, color: '#059669' },
                      { label: 'Misses', value: stats.misses, color: '#ef4444' },
                    ].map((m) => (
                      <div key={m.label} className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-center">
                        <div className="text-[20px] font-bold font-mono" style={{ color: m.color }}>
                          {m.value}
                        </div>
                        <div className="text-[9px] font-bold text-slate-400 tracking-[1.5px] uppercase font-mono">
                          {m.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Response time */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <span className={LABEL}>Last Response Time</span>
                    <div className="text-[24px] font-bold font-mono text-slate-800 mt-1">
                      {stats.ms}
                      <span className="text-[13px] text-slate-400 ml-1">ms</span>
                    </div>
                  </div>

                  {/* DB Load */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className={LABEL}>DB Load</span>
                      <span className="text-[13px] font-mono text-slate-600">
                        {((stats.misses / Math.max(totalRequests, 1)) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: '#ef4444' }}
                        animate={{ width: `${(stats.misses / Math.max(totalRequests, 1)) * 100}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5 text-serif">
                      Requests hitting the database
                    </p>
                  </div>
                </div>
              )}

              {/* ── LOGS ── */}
              {activeTab === 'logs' && (
                <div className="px-3 py-2 flex flex-col">
                  <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-slate-100">
                    <span className="text-[9px] font-bold text-slate-400 tracking-[2px] uppercase text-code">
                      Event Log
                    </span>
                    <motion.div
                      className="ml-auto w-1.75 h-1.75 rounded-full"
                      animate={{
                        backgroundColor: running ? '#10b981' : '#e2e8f0',
                        boxShadow: running ? '0 0 7px #10b981' : 'none',
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {logs.length === 0 && (
                      <p className="text-[10px] text-slate-300 text-center mt-6 leading-relaxed px-2 text-serif italic">
                        Events will appear here once you run a simulation
                      </p>
                    )}
                    {logs.map((l) => (
                      <motion.div
                        key={l.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className="flex gap-1.25 items-start"
                      >
                        <span className="text-[9px] text-slate-200 font-mono shrink-0 mt-0.5">{l.ts}</span>
                        <span
                          className="text-[10px] leading-[1.4] text-serif"
                          style={{ color: LOG_COLORS[l.type] || '#64748b' }}
                        >
                          {l.msg}
                        </span>
                      </motion.div>
                    ))}
                    <div ref={logEndRef} />
                  </div>
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
