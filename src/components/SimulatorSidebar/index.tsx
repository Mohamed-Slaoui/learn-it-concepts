import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CONCEPTS } from '../../data/conceptsList';

export interface SidebarTab {
  id: string;
  label: string;
  content: ReactNode;
}

interface SimulatorSidebarProps {
  conceptId: string;
  running: boolean;
  onRun: () => void;
  onReset: () => void;
  tabs: SidebarTab[];
  footerContent?: ReactNode;
}

export function SimulatorSidebar({
  conceptId, running, onRun, onReset, tabs, footerContent,
}: SimulatorSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id ?? '');

  const concept = CONCEPTS.find((c) => c.id === conceptId);
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];

  return (
    <>
      {/* Collapsed toggle button */}
      <AnimatePresence>
        {collapsed && (
          <motion.button
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            onClick={() => setCollapsed(false)}
            className="fixed right-4 top-1/2 -translate-y-1/2 z-50 bg-white border border-slate-200 rounded-full w-10 h-10 flex items-center justify-center cursor-pointer hover:bg-slate-50"
            style={{ boxShadow: '0 4px 14px rgba(0,0,0,0.1)', fontSize: 18, color: '#64748b' }}
          >
            ‹
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main sidebar */}
      <AnimatePresence>
        {!collapsed && (
          <motion.aside
            key="simulator-sidebar"
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-hidden z-30 relative"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <div className="heading-3 text-slate-800" style={{ fontSize: 14 }}>
                  {concept?.label ?? conceptId}
                </div>
                <div className="text-[10px] text-slate-400 text-code tracking-[1px]">
                  System Design Simulator
                </div>
              </div>
              <button
                onClick={() => setCollapsed(true)}
                className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg w-7 h-7 flex items-center justify-center cursor-pointer transition-colors"
                style={{ fontSize: 16 }}
              >
                ›
              </button>
            </div>

            {/* Run / Reset controls */}
            <div className="px-4 py-2.5 border-b border-slate-100 flex gap-2 shrink-0 bg-slate-50/60">
              <button
                onClick={onRun}
                disabled={running}
                className="flex-1 py-1.75 rounded-[10px] border-none cursor-pointer transition-all disabled:cursor-not-allowed heading-3"
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'white',
                  background: running ? '#94a3b8' : '#2563eb',
                  boxShadow: running ? 'none' : '0 4px 14px rgba(37,99,235,0.3)',
                }}
              >
                {running ? '⏳  Running…' : '▶  Run Simulation'}
              </button>
              <button
                onClick={onReset}
                disabled={running}
                className="px-3 py-1.75 rounded-[10px] border border-slate-200 bg-white text-slate-500 cursor-pointer transition-all hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed heading-3"
                style={{ fontSize: 13, fontWeight: 600 }}
                title="Reset"
              >
                ↺
              </button>
            </div>

            {/* Tab bar */}
            <div className="flex border-b border-slate-100 shrink-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`flex-1 py-2 text-[9px] font-bold tracking-[1px] uppercase transition-all cursor-pointer border-b-2 font-mono ${
                    activeTabId === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50/40'
                      : 'border-transparent text-slate-400 hover:text-slate-600 bg-transparent'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Active tab content */}
            <div className="flex-1 overflow-y-auto">
              {activeTab?.content}
            </div>

            {/* Footer slot — e.g. hint toasts */}
            {footerContent}

          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
