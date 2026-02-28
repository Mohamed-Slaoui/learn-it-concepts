import type { ReactNode } from 'react';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import type { SimStats } from '../types';

interface SimulatorLayoutProps {
  conceptId: string;
  stats: SimStats;
  children: ReactNode;
  onBack: () => void;
}

export function SimulatorLayout({ conceptId, stats, children, onBack }: SimulatorLayoutProps) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      <Topbar showBack onBack={onBack} variant="simulator" conceptId={conceptId} stats={stats} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeConcept={conceptId} />
        <div className="flex-1 overflow-hidden flex flex-col">{children}</div>
      </div>
    </div>
  );
}
