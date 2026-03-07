import { SimulatorSidebar } from '../../components/SimulatorSidebar';
import type {
  MQConfig, MQSimStats, MQLogEntry, WorkerState, SimulationPreset,
  SimulationMode, ChaosStats, ChaosWorkerState,
} from './types';
import MQConfigTab from './tabs/Config';
import MQStatsTab from './tabs/Stats';
import MQLogsTab from './tabs/Logs';

export interface MQSidebarProps {
  conceptId: string;
  config: MQConfig;
  running: boolean;
  paused: boolean;
  setConfig: (cfg: MQConfig) => void;
  onRun: () => void;
  onPause: () => void;
  onReset: () => void;
  mode: SimulationMode;
  onModeChange: (mode: SimulationMode) => void;
  // Queue mode
  stats: MQSimStats;
  logs: MQLogEntry[];
  workers: WorkerState[];
  applyPreset: (preset: SimulationPreset) => void;
  // Chaos mode
  chaosStats: ChaosStats;
  chaosWorkers: ChaosWorkerState[];
  chaosLogs: MQLogEntry[];
  onSpike: () => void;
}

export function MQSidebar({
  conceptId, config, running, paused, setConfig,
  onRun, onPause, onReset,
  mode, onModeChange,
  stats, logs, workers, applyPreset,
  chaosStats, chaosWorkers, chaosLogs, onSpike,
}: MQSidebarProps) {
  const isChaos = mode === 'chaos';

  const tabs = [
    {
      id: 'config',
      label: 'Config',
      content: (
        <MQConfigTab
          config={config}
          running={running}
          setConfig={setConfig}
          applyPreset={applyPreset}
          mode={mode}
          onModeChange={onModeChange}
          onSpike={onSpike}
        />
      ),
    },
    {
      id: 'stats',
      label: 'Stats',
      content: (
        <MQStatsTab
          stats={stats}
          workers={workers}
          mode={mode}
          chaosStats={chaosStats}
          chaosWorkers={chaosWorkers}
        />
      ),
    },
    {
      id: 'logs',
      label: 'Logs',
      content: <MQLogsTab logs={isChaos ? chaosLogs : logs} running={running} />,
    },
  ];

  return (
    <SimulatorSidebar
      conceptId={conceptId}
      running={running}
      paused={paused}
      onRun={onRun}
      onPause={onPause}
      onReset={onReset}
      tabs={tabs}
    />
  );
}
