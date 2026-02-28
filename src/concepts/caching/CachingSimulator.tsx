import { useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { OperationType, CacheState, FlowStep, SimStats, LogEntry } from '../../types';
import { makeFlow } from './flowEngine';
import { Diagram } from '../../components/Diagram';
import { ControlPanel } from '../../components/ControlPanel';

const LOG_COLORS: Record<string, string> = {
  info: '#94a3b8',
  hit: '#059669',
  miss: '#ef4444',
  fetch: '#3b82f6',
  store: '#d97706',
  ack: '#7c3aed',
  response: '#1d4ed8',
};

let logIdSeq = 0;

interface CachingSimulatorProps {
  onStatsUpdate: (stats: SimStats) => void;
  onReset: () => void;
}

export function CachingSimulator({ onStatsUpdate, onReset }: CachingSimulatorProps) {
  const [op, setOp] = useState<OperationType>('read');
  const [rs, setRs] = useState('cache-aside');
  const [ws, setWs] = useState('write-through');
  const [cs, setCs] = useState<CacheState>('hit');
  const [spd, setSpd] = useState(1.5);
  const [running, setRunning] = useState(false);
  const [si, setSi] = useState(-1);
  const [doneCount, setDoneCount] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [desc, setDesc] = useState('');

  const flowRef = useRef<FlowStep[]>([]);
  const metaRef = useRef<{ isHit?: boolean }>({});
  const t0 = useRef(0);
  const logEndRef = useRef<HTMLDivElement>(null);
  // track cumulative stats locally so we can report total to parent
  const cumulativeRef = useRef<SimStats>({ hits: 0, misses: 0, total: 0, ms: 0 });

  const stepDur = Math.round(900 / spd);

  const addLog = (msg: string, type: string) => {
    const n = new Date();
    const ts = `${String(n.getMinutes()).padStart(2, '0')}:${String(n.getSeconds()).padStart(2, '0')}.${String(n.getMilliseconds()).slice(0, 2).padStart(2, '0')}`;
    setLogs((p) => [...p.slice(-70), { id: logIdSeq++, ts, msg, type: type as LogEntry['type'] }]);
    setTimeout(() => logEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const advance = useCallback((idx: number, steps: FlowStep[]) => {
    if (idx >= steps.length) {
      const el = Date.now() - t0.current;
      const isHit = metaRef.current.isHit;
      const next: SimStats = {
        hits: cumulativeRef.current.hits + (isHit === true ? 1 : 0),
        misses: cumulativeRef.current.misses + (isHit === false ? 1 : 0),
        total: cumulativeRef.current.total + 1,
        ms: el,
      };
      cumulativeRef.current = next;
      onStatsUpdate(next);
      addLog(`── Complete in ${el}ms ──`, 'info');
      setDesc('Simulation complete ✓');
      setSi(-1);
      setRunning(false);
      return;
    }
    const s = steps[idx];
    setSi(idx);
    setDesc(s.desc);
    addLog(s.log, s.type);
  }, [onStatsUpdate]);

  const handleRun = () => {
    if (running) return;
    const flow = makeFlow(op, rs as any, ws as any, cs);
    flowRef.current = flow.steps;
    metaRef.current = { isHit: flow.isHit };
    setRunning(true);
    setDoneCount(0);
    setSi(-1);
    setDesc('Starting…');
    t0.current = Date.now();
    addLog('── Simulation start ──', 'info');
    addLog(`${op.toUpperCase()} · ${op === 'read' ? rs : ws}${op === 'read' && rs !== 'refresh-ahead' ? ' · ' + cs.toUpperCase() : ''}`, 'info');
    setTimeout(() => advance(0, flow.steps), 300);
  };

  const onStepComplete = useCallback(() => {
    const idx = si;
    const steps = flowRef.current;
    if (idx < 0 || idx >= steps.length) return;
    setDoneCount((c) => c + 1);
    const pause = steps[idx].pause ? Math.round(steps[idx].pause! / spd) : 160;
    setTimeout(() => advance(idx + 1, steps), pause);
  }, [si, spd, advance]);

  const handleReset = () => {
    setRunning(false);
    setSi(-1);
    setDoneCount(0);
    setDesc('');
    setLogs([]);
    cumulativeRef.current = { hits: 0, misses: 0, total: 0, ms: 0 };
    onReset();
  };

  const activeStep = si >= 0 ? flowRef.current[si] : null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Main area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Diagram canvas */}
        <div
          className="flex-1 relative overflow-hidden"
          style={{
            background: '#fafbfc',
            backgroundImage: 'radial-gradient(circle, #dde2ea 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        >
          <Diagram
            activeStep={activeStep}
            doneCount={doneCount}
            onStepComplete={onStepComplete}
            stepDur={stepDur}
          />

          {/* Step description pill */}
          <AnimatePresence mode="wait">
            {desc && (
              <motion.div
                key={desc}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-full px-5 py-1.5 text-slate-600 z-20 whitespace-nowrap text-serif"
                style={{ fontSize: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}
              >
                {desc}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Event log */}
        <div className="w-52 bg-white border-l border-slate-200 flex flex-col shrink-0">
          <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-1.5">
            <span
              className="text-[9px] font-bold text-slate-400 tracking-[2px] uppercase text-code"
            >
              Event Log
            </span>
            <motion.div
              className="ml-auto w-[7px] h-[7px] rounded-full"
              animate={{
                backgroundColor: running ? '#10b981' : '#e2e8f0',
                boxShadow: running ? '0 0 7px #10b981' : 'none',
              }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="flex-1 overflow-y-auto px-2.5 py-1.5 flex flex-col gap-0.5">
            {logs.length === 0 && (
              <p
                className="text-[10px] text-slate-300 text-center mt-6 leading-relaxed px-2 text-serif italic"
              >
                Events will appear here once you run a simulation
              </p>
            )}
            {logs.map((l) => (
              <motion.div
                key={l.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="flex gap-[5px] items-start"
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
      </div>

      <ControlPanel
        op={op} rs={rs} ws={ws} cs={cs} spd={spd} running={running}
        setOp={setOp} setRs={setRs} setWs={setWs} setCs={setCs} setSpd={setSpd}
        onRun={handleRun} onReset={handleReset}
      />
    </div>
  );
}
