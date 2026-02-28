import { useState } from 'react';
import { SimulatorLayout } from '../layout/SimulatorLayout';
import { CachingSimulator } from '../concepts/caching/CachingSimulator';
import type { SimStats } from '../types';

interface SimulatorPageProps {
  conceptId: string;
  onBack: () => void;
}

const DEFAULT_STATS: SimStats = { hits: 0, misses: 0, total: 0, ms: 0 };

export function SimulatorPage({ conceptId, onBack }: SimulatorPageProps) {
  const [stats, setStats] = useState<SimStats>(DEFAULT_STATS);

  return (
    <SimulatorLayout conceptId={conceptId} stats={stats} onBack={onBack}>
      {conceptId === 'caching' && (
        <CachingSimulator onStatsUpdate={setStats} onReset={() => setStats(DEFAULT_STATS)} />
      )}
    </SimulatorLayout>
  );
}
