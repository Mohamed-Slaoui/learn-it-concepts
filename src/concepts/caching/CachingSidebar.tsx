import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { CachingConfig, CachingEngineState } from './useCachingEngine';
import { SimulatorSidebar } from '../../components/SimulatorSidebar';
import { CachingConfigTab } from './tabs/Config';
import { CachingStatsTab } from './tabs/Stats';
import { CachingLogsTab } from './tabs/Logs';

export interface CachingSidebarProps {
  conceptId: string;
  engineState: CachingEngineState;
  running: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSpike: () => void;
  onClearCache: () => void;
  onConfigChange: (patch: Partial<CachingConfig>) => void;
}

export function CachingSidebar({
  conceptId, engineState, running,
  onStart, onPause, onReset, onSpike, onClearCache, onConfigChange,
}: CachingSidebarProps) {
  const [spikeHint, setSpikeHint] = useState(false);

  const handleSpike = () => {
    onSpike();
    setSpikeHint(true);
    setTimeout(() => setSpikeHint(false), 4000);
  };

  const tabs = [
    {
      id: 'config',
      label: 'Config',
      content: (
        <CachingConfigTab
          config={engineState.config}
          running={running}
          onChange={onConfigChange}
          onSpike={handleSpike}
          onClearCache={onClearCache}
        />
      ),
    },
    {
      id: 'stats',
      label: 'Stats',
      content: (
        <CachingStatsTab
          cacheHits={engineState.cacheHits}
          cacheMisses={engineState.cacheMisses}
          totalRequests={engineState.totalRequests}
          cacheHitRate={engineState.cacheHitRate}
          dbQueries={engineState.dbQueries}
          dbLoad={engineState.dbLoad}
          avgLatencyMs={engineState.avgLatencyMs}
          dbQueueLength={engineState.dbQueueLength}
          cacheEnabled={engineState.config.cacheEnabled}
        />
      ),
    },
    {
      id: 'logs',
      label: 'Logs',
      content: <CachingLogsTab logs={engineState.logs} running={running} />,
    },
  ];

  const footerContent = spikeHint ? (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.25 }}
        className="absolute bottom-4 left-3 right-3 z-50 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 shadow-lg"
      >
        <div className="flex items-start gap-2">
          <div>
            <div className="text-[11px] font-bold text-red-700 mb-0.5">Traffic Spike!</div>
            <p className="text-[11px] text-red-600 leading-snug text-serif">
              3x traffic for 5 seconds. Watch the DB load indicator!
            </p>
          </div>
          <button
            onClick={() => setSpikeHint(false)}
            className="ml-auto text-red-400 hover:text-red-600 shrink-0 text-base cursor-pointer"
          >
            ×
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  ) : null;

  return (
    <SimulatorSidebar
      conceptId={conceptId}
      running={running}
      paused={!running && engineState.totalRequests > 0}
      onRun={onStart}
      onPause={onPause}
      onReset={onReset}
      tabs={tabs}
      footerContent={footerContent}
    />
  );
}
