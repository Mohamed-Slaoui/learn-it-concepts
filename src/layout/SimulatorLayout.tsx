import type { ReactNode } from 'react';
import { Topbar } from './Topbar';
import type { SimStats } from '../types';

interface SimulatorLayoutProps {
  conceptId: string;
  stats: SimStats;
  children: ReactNode;
  onBack: () => void;
  onHelp?: () => void;
}

export function SimulatorLayout({ conceptId, stats, children, onBack, onHelp }: SimulatorLayoutProps) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      <Topbar showBack onBack={onBack} variant="simulator" conceptId={conceptId} stats={stats} onHelp={onHelp} />
      <div className="flex-1 overflow-hidden flex">
        {children}
      </div>
    </div>
  );
}
