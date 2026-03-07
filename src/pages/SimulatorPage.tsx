import { useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { SimulatorLayout } from '../layout/SimulatorLayout';
import { CachingSimulator } from '../concepts/caching/CachingSimulator';
import { LBSimulator } from '../concepts/load-balancer/LBSimulator';
import { MQSimulator } from '../concepts/message-queue/MQSimulator';
import type { SimStats } from '../types';

const DEFAULT_STATS: SimStats = { hits: 0, misses: 0, total: 0, ms: 0 };

export function SimulatorPage() {
  const { conceptId } = useParams<{ conceptId: string }>();
  const navigate = useNavigate();
  const [stats, setStats] = useState<SimStats>(DEFAULT_STATS);
  const [helpOpen, setHelpOpen] = useState(false);

  if (!conceptId) return <Navigate to="/" replace />;

  return (
    <>
      <SimulatorLayout conceptId={conceptId} stats={stats} onBack={() => navigate('/')} onHelp={() => setHelpOpen(true)}>
        {conceptId === 'caching' && (
          <CachingSimulator conceptId={conceptId} onStatsUpdate={setStats} onReset={() => setStats(DEFAULT_STATS)} />
        )}
        {conceptId === 'load-balancer' && (
          <LBSimulator conceptId={conceptId} onStatsUpdate={setStats} onReset={() => setStats(DEFAULT_STATS)} />
        )}
        {conceptId === 'message-queue' && (
          <MQSimulator conceptId={conceptId} onStatsUpdate={setStats} onReset={() => setStats(DEFAULT_STATS)} />
        )}
      </SimulatorLayout>
    </>
  );
}
