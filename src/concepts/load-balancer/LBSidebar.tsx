import { SimulatorSidebar } from '../../components/SimulatorSidebar';
import type { LBAlgorithm, LBSimStats, LBLogEntry, ChaosConfig } from './types';
import LBConfigTab from './tabs/Config';
import LBStatsTab from './tabs/Stats';
import LBLogsTab from './tabs/Logs';

export interface LBSidebarProps {
  conceptId: string;
  algorithm: LBAlgorithm;
  spd: number;
  serverHealth: { s1: boolean; s2: boolean; s3: boolean };
  chaos: ChaosConfig;
  running: boolean;
  setAlgorithm: (a: LBAlgorithm) => void;
  setSpd: (s: number) => void;
  setServerHealth: (h: { s1: boolean; s2: boolean; s3: boolean }) => void;
  setChaos: (c: ChaosConfig) => void;
  onRun: () => void;
  onReset: () => void;
  stats: LBSimStats;
  logs: LBLogEntry[];
}

export function LBSidebar({
  conceptId,
  algorithm,
  spd,
  serverHealth,
  chaos,
  running,
  setAlgorithm,
  setSpd,
  setServerHealth,
  setChaos,
  onRun,
  onReset,
  stats,
  logs,
}: LBSidebarProps) {
  const tabs = [
    {
      id: 'config',
      label: 'Config',
      content: (
        <LBConfigTab
          algorithm={algorithm}
          spd={spd}
          serverHealth={serverHealth}
          chaos={chaos}
          running={running}
          setAlgorithm={setAlgorithm}
          setSpd={setSpd}
          setServerHealth={setServerHealth}
          setChaos={setChaos}
        />
      ),
    },
    {
      id: 'stats',
      label: 'Stats',
      content: <LBStatsTab stats={stats} />,
    },
    {
      id: 'logs',
      label: 'Logs',
      content: <LBLogsTab logs={logs} running={running} />,
    },
  ];

  return (
    <SimulatorSidebar
      conceptId={conceptId}
      running={running}
      onRun={onRun}
      onReset={onReset}
      tabs={tabs}
    />
  );
}
