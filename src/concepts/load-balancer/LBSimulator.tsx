import { useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { SimStats } from '../../types';
import type { LBAlgorithm, LBFlowStep, LBSimStats, LBLogEntry, ChaosConfig, ServerMetrics } from './types';
import { makeLBFlow } from './flowEngine';
import LBDiagram from './LBDiagram';
import { LBSidebar } from './LBSidebar';

let logIdSeq = 0;

interface LBSimulatorProps {
  conceptId: string;
  onStatsUpdate: (stats: SimStats) => void;
  onReset: () => void;
}

const DEFAULT_LB_STATS: LBSimStats = {
  total: 0,
  failed: 0,
  ms: 0,
  serverCounts: { s1: 0, s2: 0, s3: 0 },
};

export function LBSimulator({ conceptId, onStatsUpdate, onReset }: LBSimulatorProps) {
  const [algorithm, setAlgorithm] = useState<LBAlgorithm>('round-robin');
  const [spd, setSpd] = useState(800);
  const [serverHealth, setServerHealth] = useState({ s1: true, s2: true, s3: true });
  const [chaos, setChaos] = useState<ChaosConfig>({
    surgeMultiplier: 1,
    latencyInject: 0,
    failureRate: 0,
    slowdownPercent: 0,
  });
  const [running, setRunning] = useState(false);
  const [si, setSi] = useState(-1);
  const [doneCount, setDoneCount] = useState(0);
  const [logs, setLogs] = useState<LBLogEntry[]>([]);
  const [desc, setDesc] = useState('');
  const [lbStats, setLbStats] = useState<LBSimStats>(DEFAULT_LB_STATS);
  const [serverMetrics, setServerMetrics] = useState<Record<'s1' | 's2' | 's3', ServerMetrics>>({
    s1: { id: 's1', cpu: 0, memory: 0, latency: 0, activeConnections: 0, requestsPerSec: 0 },
    s2: { id: 's2', cpu: 0, memory: 0, latency: 0, activeConnections: 0, requestsPerSec: 0 },
    s3: { id: 's3', cpu: 0, memory: 0, latency: 0, activeConnections: 0, requestsPerSec: 0 },
  });

  const flowRef = useRef<LBFlowStep[]>([]);
  const metaRef = useRef<{ chosen: 's1' | 's2' | 's3' | null }>({ chosen: null });
  const t0 = useRef(0);
  const rrIdxRef = useRef(0);
  const cumulativeRef = useRef<LBSimStats>(DEFAULT_LB_STATS);

  const stepDur = spd;

  function addLog(msg: string, type: LBLogEntry['type']) {
    const n = new Date();
    const ts = `${String(n.getMinutes()).padStart(2, '0')}:${String(n.getSeconds()).padStart(2, '0')}.${String(n.getMilliseconds()).slice(0, 2).padStart(2, '0')}`;
    setLogs((p) => [...p.slice(-70), { id: logIdSeq++, ts, msg, type }]);
  }

  const advance = useCallback(
    (idx: number, steps: LBFlowStep[]) => {
      if (idx >= steps.length) {
        const el = Date.now() - t0.current;
        const chosen = metaRef.current.chosen;
        const isFailed = chosen === null;
        const prev = cumulativeRef.current;
        const next: LBSimStats = {
          total: prev.total + 1,
          failed: prev.failed + (isFailed ? 1 : 0),
          ms: el,
          serverCounts: {
            s1: prev.serverCounts.s1 + (chosen === 's1' ? 1 : 0),
            s2: prev.serverCounts.s2 + (chosen === 's2' ? 1 : 0),
            s3: prev.serverCounts.s3 + (chosen === 's3' ? 1 : 0),
          },
        };
        cumulativeRef.current = next;
        setLbStats(next);

        // Update server metrics based on traffic
        const totalReq = next.total - next.failed;
        const s1Load = totalReq > 0 ? (next.serverCounts.s1 / totalReq) * 100 : 0;
        const s2Load = totalReq > 0 ? (next.serverCounts.s2 / totalReq) * 100 : 0;
        const s3Load = totalReq > 0 ? (next.serverCounts.s3 / totalReq) * 100 : 0;
        setServerMetrics({
          s1: { id: 's1', cpu: s1Load, memory: Math.min(s1Load + 10, 100), latency: Math.round(30 + s1Load * 0.5), activeConnections: next.serverCounts.s1, requestsPerSec: 0 },
          s2: { id: 's2', cpu: s2Load, memory: Math.min(s2Load + 10, 100), latency: Math.round(30 + s2Load * 0.5), activeConnections: next.serverCounts.s2, requestsPerSec: 0 },
          s3: { id: 's3', cpu: s3Load, memory: Math.min(s3Load + 10, 100), latency: Math.round(30 + s3Load * 0.5), activeConnections: next.serverCounts.s3, requestsPerSec: 0 },
        });

        // report to topbar — hits = routed, misses = failed
        onStatsUpdate({
          hits: next.total - next.failed,
          misses: next.failed,
          total: next.total,
          ms: el,
        });

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
    },
    [onStatsUpdate],
  );

  const handleRun = () => {
    if (running) return;
    const result = makeLBFlow(
      algorithm,
      serverHealth,
      rrIdxRef.current,
      cumulativeRef.current.serverCounts,
    );
    flowRef.current = result.steps;
    metaRef.current = { chosen: result.chosenServer };
    rrIdxRef.current = result.nextRrIdx;

    setRunning(true);
    setDoneCount(0);
    setSi(-1);
    setDesc('Starting…');
    t0.current = Date.now();
    addLog('── Simulation start ──', 'info');
    addLog(`Algorithm: ${algorithm.toUpperCase()}`, 'info');
    setTimeout(() => advance(0, result.steps), 300);
  };

  const onStepComplete = useCallback(() => {
    const idx = si;
    const steps = flowRef.current;
    if (idx < 0 || idx >= steps.length) return;
    setDoneCount((c) => c + 1);
    const pause = steps[idx].pause ? steps[idx].pause! : 160;
    setTimeout(() => advance(idx + 1, steps), pause);
  }, [si, advance]);

  const handleReset = () => {
    setRunning(false);
    setSi(-1);
    setDoneCount(0);
    setDesc('');
    setLogs([]);
    setLbStats(DEFAULT_LB_STATS);
    setServerMetrics({
      s1: { id: 's1', cpu: 0, memory: 0, latency: 0, activeConnections: 0, requestsPerSec: 0 },
      s2: { id: 's2', cpu: 0, memory: 0, latency: 0, activeConnections: 0, requestsPerSec: 0 },
      s3: { id: 's3', cpu: 0, memory: 0, latency: 0, activeConnections: 0, requestsPerSec: 0 },
    });
    cumulativeRef.current = DEFAULT_LB_STATS;
    rrIdxRef.current = 0;
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
        <LBDiagram
          activeStep={activeStep}
          doneCount={doneCount}
          running={running}
          onStepComplete={onStepComplete}
          stepDur={stepDur}
          serverHealth={serverHealth}
          serverMetrics={serverMetrics}
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

      {/* Sidebar */}
      <LBSidebar
        conceptId={conceptId}
        algorithm={algorithm}
        spd={spd}
        serverHealth={serverHealth}
        chaos={chaos}
        running={running}
        setAlgorithm={setAlgorithm}
        setSpd={setSpd}
        setServerHealth={setServerHealth}
        setChaos={setChaos}
        onRun={handleRun}
        onReset={handleReset}
        stats={lbStats}
        logs={logs}
      />
    </div>
  );
}
