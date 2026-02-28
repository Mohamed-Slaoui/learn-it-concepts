import { useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { OperationType, CacheState, FlowStep, SimStats, LogEntry } from '../../types';
import { makeFlow } from './flowEngine';
import { Diagram } from '../../components/Diagram';
import { CachingSidebar } from './CachingSidebar';

let logIdSeq = 0;

interface CachingSimulatorProps {
  conceptId: string;
  onStatsUpdate: (stats: SimStats) => void;
  onReset: () => void;
}

export function CachingSimulator({ conceptId, onStatsUpdate, onReset }: CachingSimulatorProps) {
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
  // track cumulative stats locally so we can report total to parent
  const cumulativeRef = useRef<SimStats>({ hits: 0, misses: 0, total: 0, ms: 0 });

  const stepDur = Math.round(900 / spd);

  const addLog = (msg: string, type: string) => {
    const n = new Date();
    const ts = `${String(n.getMinutes()).padStart(2, '0')}:${String(n.getSeconds()).padStart(2, '0')}.${String(n.getMilliseconds()).slice(0, 2).padStart(2, '0')}`;
    setLogs((p) => [...p.slice(-70), { id: logIdSeq++, ts, msg, type: type as LogEntry['type'] }]);
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
    <div className="flex flex-1 h-full overflow-hidden select-none">
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
          running={running}
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

      {/* Right sidebar */}
      <CachingSidebar
        conceptId={conceptId}
        op={op} rs={rs} ws={ws} cs={cs} spd={spd} running={running}
        setOp={setOp} setRs={setRs} setWs={setWs} setCs={setCs} setSpd={setSpd}
        onRun={handleRun}
        onReset={handleReset}
        stats={cumulativeRef.current}
        logs={logs}
      />
    </div>
  );
}
