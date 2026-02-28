import { useState } from 'react';
import { SimulatorLayout } from '../layout/SimulatorLayout';
import { CachingSimulator } from '../concepts/caching/CachingSimulator';
import { LBSimulator } from '../concepts/load-balancer/LBSimulator';
import { HelpModal } from '../components/HelpModal';
import type { SimStats } from '../types';

interface SimulatorPageProps {
  conceptId: string;
  onBack: () => void;
}

const DEFAULT_STATS: SimStats = { hits: 0, misses: 0, total: 0, ms: 0 };

export function SimulatorPage({ conceptId, onBack }: SimulatorPageProps) {
  const [stats, setStats] = useState<SimStats>(DEFAULT_STATS);
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <>
      <SimulatorLayout conceptId={conceptId} stats={stats} onBack={onBack} onHelp={() => setHelpOpen(true)}>
        {conceptId === 'caching' && (
          <CachingSimulator conceptId={conceptId} onStatsUpdate={setStats} onReset={() => setStats(DEFAULT_STATS)} />
        )}
        {conceptId === 'load-balancer' && (
          <LBSimulator conceptId={conceptId} onStatsUpdate={setStats} onReset={() => setStats(DEFAULT_STATS)} />
        )}
      </SimulatorLayout>

      {helpOpen && <HelpModal conceptId={conceptId} onClose={() => setHelpOpen(false)} />}
    </>
  );
}
