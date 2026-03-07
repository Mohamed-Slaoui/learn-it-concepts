import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { SimStats } from '../../types';
import type { SimulationMode } from './types';
import MQDiagram from './MQDiagram';
import ChaosDiagram from './ChaosDiagram';
import { StoryBox } from './StoryBox';
import { MQSidebar } from './MQSidebar';
import { useMessageQueueEngine, DEFAULT_MQ_CONFIG } from './useMessageQueueEngine';
import { useChaosEngine } from './useChaosEngine';

interface MQSimulatorProps {
  conceptId: string;
  onStatsUpdate: (stats: SimStats) => void;
  onReset: () => void;
}

const PRIORITY_COLORS: Record<number, string> = {
  1: 'bg-sky-100 border-sky-300 text-sky-700',
  2: 'bg-amber-100 border-amber-300 text-amber-700',
  3: 'bg-rose-100 border-rose-300 text-rose-700',
};
const PRIORITY_LABELS: Record<number, string> = { 1: 'P1', 2: 'P2', 3: 'P3' };

export function MQSimulator({ conceptId, onStatsUpdate, onReset }: MQSimulatorProps) {
  const [mode, setMode] = useState<SimulationMode>('chaos');
  const [storyStep, setStoryStep] = useState(0);

  const queueEngine = useMessageQueueEngine(DEFAULT_MQ_CONFIG);
  const chaosEngine = useChaosEngine(DEFAULT_MQ_CONFIG);

  const isQueue = mode === 'queue';

  // Sync config changes to both engines
  const handleSetConfig = (cfg: typeof DEFAULT_MQ_CONFIG) => {
    queueEngine.setConfig(cfg);
    chaosEngine.setConfig(cfg);
  };

  const activeConfig  = isQueue ? queueEngine.config  : chaosEngine.config;
  const activeRunning = isQueue ? queueEngine.running  : chaosEngine.running;
  const activePaused  = isQueue ? queueEngine.paused   : chaosEngine.paused;
  const activeStart   = isQueue ? queueEngine.start    : chaosEngine.start;
  const activePause   = isQueue ? queueEngine.pause    : chaosEngine.pause;

  // Switch mode: reset both, auto-advance story
  const handleModeChange = (newMode: SimulationMode) => {
    queueEngine.reset();
    chaosEngine.reset();
    setMode(newMode);
    if (newMode === 'queue' && storyStep < 3) setStoryStep(3);
    if (newMode === 'chaos' && storyStep >= 3) setStoryStep(0);
  };

  const handleReset = () => {
    queueEngine.reset();
    chaosEngine.reset();
    onReset();
  };

  // Report stats to topbar
  const queueStats = queueEngine.engineState.stats;
  const chaosStats = chaosEngine.engineState.stats;
  useEffect(() => {
    if (isQueue) {
      onStatsUpdate({ hits: queueStats.completed, misses: queueStats.failed, total: queueStats.total, ms: 0 });
    } else {
      onStatsUpdate({
        hits: chaosStats.completed,
        misses: chaosStats.dropped + chaosStats.failed,
        total: chaosStats.total,
        ms: 0,
      });
    }
  }, [
    queueStats.completed, queueStats.failed, queueStats.total,
    chaosStats.completed, chaosStats.dropped, chaosStats.failed, chaosStats.total,
    isQueue, onStatsUpdate,
  ]);

  const {
    mainQueue, inFlightQueue, delayedQueue,
    workers, stats, logs, queueAtCapacity, redeliveryFlash,
  } = queueEngine.engineState;

  const {
    workers: chaosWorkers,
    stats: cStats,
    logs: chaosLogs,
    dropFlash,
    spikeActive,
    inFlightCount: chaosInFlight,
  } = chaosEngine.engineState;

  return (
    <div className="flex gap-4 h-full w-full select-none">
      {/* ── Main area ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col gap-3 p-4 min-w-0 overflow-hidden">

        {/* Mode toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleModeChange('chaos')}
            className={`flex-1 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${
              mode === 'chaos'
                ? 'bg-red-100 border-red-400 text-red-700 shadow-sm'
                : 'bg-white border-slate-200 text-slate-500 hover:bg-red-50 hover:border-red-200'
            }`}
          >
            ❌ Before Queue <span className="font-normal opacity-70 text-[10px]">(Chaos)</span>
          </button>
          <button
            onClick={() => handleModeChange('queue')}
            className={`flex-1 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${
              mode === 'queue'
                ? 'bg-emerald-100 border-emerald-400 text-emerald-700 shadow-sm'
                : 'bg-white border-slate-200 text-slate-500 hover:bg-emerald-50 hover:border-emerald-200'
            }`}
          >
            ✅ With Message Queue
          </button>
        </div>

        {/* Diagram + story overlay */}
        <div className="relative flex-1 flex justify-center items-center w-full rounded-xl overflow-hidden min-h-0">
          <StoryBox
            step={storyStep}
            mode={mode}
            onPrev={() => setStoryStep((s) => Math.max(0, s - 1))}
            onNext={() => setStoryStep((s) => Math.min(4, s + 1))}
            onModeChange={handleModeChange}
          />

          <AnimatePresence mode="wait">
            {mode === 'chaos' ? (
              <motion.div key="chaos" className="w-full h-full"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}>
                <ChaosDiagram
                  workers={chaosWorkers}
                  droppedCount={cStats.dropped}
                  completedCount={cStats.completed}
                  spikeActive={spikeActive}
                  dropFlash={dropFlash}
                  inFlightCount={chaosInFlight}
                />
              </motion.div>
            ) : (
              <motion.div key="queue" className="w-full h-full"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}>
                <MQDiagram
                  mainQueueLength={mainQueue.length}
                  inFlightCount={inFlightQueue.length}
                  delayedCount={delayedQueue.length}
                  deadLetterCount={stats.deadLetterCount}
                  queueCapacity={activeConfig.queueCapacity}
                  workers={workers}
                  strategy={activeConfig.strategy}
                  queueAtCapacity={queueAtCapacity}
                  redeliveryFlash={redeliveryFlash}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Queue lanes – queue mode only */}
        {isQueue && (
          <div className="flex flex-col gap-2">
            <QueueLane
              label={`Order Queue  (${mainQueue.length} / ${activeConfig.queueCapacity})`}
              accentClass="amber"
              items={mainQueue.slice(0, 12).map((m) => ({
                key: m.id, label: m.id,
                badge: activeConfig.strategy === 'priority' ? PRIORITY_LABELS[m.priority] : undefined,
                badgeClass: PRIORITY_COLORS[m.priority],
              }))}
              overflow={Math.max(0, mainQueue.length - 12)}
              empty="Queue empty"
              glow={queueAtCapacity}
            />
            <QueueLane
              label={`In-Flight  (${inFlightQueue.length})`}
              accentClass="purple"
              items={inFlightQueue.slice(0, 10).map((m) => ({
                key: m.id, label: `${m.workerId ?? '?'} → ${m.id}`,
                badge: undefined, badgeClass: '',
              }))}
              overflow={Math.max(0, inFlightQueue.length - 10)}
              empty="No in-flight orders"
            />
            {(activeConfig.strategy === 'delayed' || delayedQueue.length > 0) && (
              <QueueLane
                label={`Delayed / Retry Backlog  (${delayedQueue.length})`}
                accentClass="slate"
                items={delayedQueue.slice(0, 8).map((m) => ({
                  key: m.id, label: m.id,
                  badge: `r${m.retryCount}`, badgeClass: 'bg-slate-100 border-slate-300 text-slate-600',
                }))}
                overflow={Math.max(0, delayedQueue.length - 8)}
                empty="No delayed orders"
              />
            )}
          </div>
        )}

        {/* Chaos quick-stat bar */}
        {!isQueue && (
          <div className="flex items-center gap-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex-1 flex gap-4 text-[11px] flex-wrap">
              <span className="text-slate-500">Orders: <strong className="text-slate-700">{cStats.total}</strong></span>
              <span className="text-emerald-600">✓ Done: <strong>{cStats.completed}</strong></span>
              <span className="text-red-600">✗ Dropped: <strong>{cStats.dropped}</strong></span>
              <span className="text-slate-500">Utilization: <strong>{cStats.utilization}%</strong></span>
            </div>
            {cStats.total > 0 && (
              <div
                className="shrink-0 text-[11px] font-bold px-2 py-0.5 rounded"
                style={{
                  color: cStats.dropped / cStats.total > 0.3 ? '#dc2626' : '#16a34a',
                  background: cStats.dropped / cStats.total > 0.3 ? '#fee2e2' : '#dcfce7',
                }}
              >
                Drop rate: {Math.round((cStats.dropped / cStats.total) * 100)}%
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <MQSidebar
        conceptId={conceptId}
        config={activeConfig}
        running={activeRunning}
        paused={activePaused}
        setConfig={handleSetConfig}
        onRun={activeStart}
        onPause={activePause}
        onReset={handleReset}
        mode={mode}
        onModeChange={handleModeChange}
        stats={stats}
        logs={logs}
        workers={workers}
        applyPreset={queueEngine.applyPreset}
        chaosStats={cStats}
        chaosWorkers={chaosWorkers}
        chaosLogs={chaosLogs}
        onSpike={chaosEngine.spike}
      />
    </div>
  );
}

// ─── Small reusable queue lane ─────────────────────────────────────────────

interface LaneItem { key: string; label: string; badge?: string; badgeClass: string; }

const ACCENT: Record<string, { header: string; container: string; chip: string; overflow: string }> = {
  amber:  { header: 'text-amber-600',  container: 'from-amber-50 to-amber-100 border-amber-200',   chip: 'bg-white border-amber-300 text-amber-700',   overflow: 'bg-amber-200 border-amber-300 text-amber-700' },
  purple: { header: 'text-purple-600', container: 'from-purple-50 to-purple-100 border-purple-200', chip: 'bg-white border-purple-300 text-purple-700',  overflow: 'bg-purple-200 border-purple-300 text-purple-700' },
  slate:  { header: 'text-slate-600',  container: 'from-slate-50 to-slate-100 border-slate-200',    chip: 'bg-white border-slate-300 text-slate-600',   overflow: 'bg-slate-200 border-slate-300 text-slate-600' },
};

function QueueLane({
  label, accentClass, items, overflow, empty, glow = false,
}: {
  label: string; accentClass: string; items: LaneItem[];
  overflow: number; empty: string; glow?: boolean;
}) {
  const a = ACCENT[accentClass] ?? ACCENT.slate;
  return (
    <motion.div
      className={`h-13 bg-linear-to-b ${a.container} rounded-lg border p-2 overflow-hidden`}
      animate={glow ? { boxShadow: ['0 0 0px #ef4444', '0 0 10px #ef4444', '0 0 0px #ef4444'] } : { boxShadow: 'none' }}
      transition={{ duration: 1, repeat: Infinity }}
    >
      <div className={`text-[9px] font-bold ${a.header} uppercase tracking-[1px] mb-1`}>{label}</div>
      <div className="flex gap-1 overflow-x-auto">
        <AnimatePresence>
          {items.length === 0 ? (
            <span className="text-[10px] text-slate-400 italic">{empty}</span>
          ) : (
            items.map((item) => (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}
                className={`shrink-0 flex items-center gap-1 px-1.5 py-0 rounded border text-[10px] font-mono whitespace-nowrap ${a.chip}`}
              >
                {item.badge && (
                  <span className={`px-1 rounded text-[8px] font-bold border ${item.badgeClass}`}>{item.badge}</span>
                )}
                {item.label}
              </motion.div>
            ))
          )}
        </AnimatePresence>
        {overflow > 0 && (
          <div className={`shrink-0 px-1.5 rounded border text-[10px] font-mono font-bold ${a.overflow}`}>
            +{overflow}
          </div>
        )}
      </div>
    </motion.div>
  );
}

