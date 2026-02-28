import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { OperationType, CacheState, SimStats, LogEntry } from '../../types';
import { SimulatorSidebar } from '../../components/SimulatorSidebar';
import { CachingConfigTab } from './tabs/Config';
import { CachingStatsTab } from './tabs/Stats';
import { CachingLogsTab } from './tabs/Logs';

const LS_KEY = 'sysviz_seen_terms';

function getSeenTerms(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(LS_KEY) ?? '[]'));
  } catch {
    return new Set();
  }
}

function markTermSeen(term: string) {
  const seen = getSeenTerms();
  seen.add(term);
  try {
    localStorage.setItem(LS_KEY, JSON.stringify([...seen]));
  } catch { /* ignore */ }
}

export interface CachingSidebarProps {
  conceptId: string;
  op: OperationType;
  rs: string;
  ws: string;
  cs: CacheState;
  spd: number;
  running: boolean;
  setOp: (v: OperationType) => void;
  setRs: (v: string) => void;
  setWs: (v: string) => void;
  setCs: (v: CacheState) => void;
  setSpd: (v: number) => void;
  onRun: () => void;
  onReset: () => void;
  stats: SimStats;
  logs: LogEntry[];
}

export function CachingSidebar({
  conceptId, op, rs, ws, cs, spd, running,
  setOp, setRs, setWs, setCs, setSpd,
  onRun, onReset, stats, logs,
}: CachingSidebarProps) {
  const [firstTimeHint, setFirstTimeHint] = useState<{ term: string; desc: string } | null>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Show a one-time hint toast on first cache hit / miss
  useEffect(() => {
    for (const log of logs) {
      const triggerType = log.type === 'hit' ? 'cache-hit' : log.type === 'miss' ? 'cache-miss' : null;
      if (!triggerType) continue;
      const seen = getSeenTerms();
      if (!seen.has(triggerType)) {
        markTermSeen(triggerType);
        const desc =
          triggerType === 'cache-hit'
            ? "Data was found in cache — no database trip needed. Fast! ⚡"
            : "Data wasn't in cache — system fell back to the database. Slower, but correct.";
        if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
        setFirstTimeHint({
          term: triggerType === 'cache-hit' ? '✅ Cache Hit' : '❌ Cache Miss',
          desc,
        });
        hintTimerRef.current = setTimeout(() => setFirstTimeHint(null), 5000);
        break;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logs.length]);

  const tabs = [
    {
      id: 'controls',
      label: 'Config',
      content: (
        <CachingConfigTab
          op={op} rs={rs} ws={ws} cs={cs} spd={spd} running={running}
          setOp={setOp} setRs={setRs} setWs={setWs} setCs={setCs} setSpd={setSpd}
        />
      ),
    },
    {
      id: 'metrics',
      label: 'Stats',
      content: <CachingStatsTab stats={stats} />,
    },
    {
      id: 'logs',
      label: 'Logs',
      content: <CachingLogsTab logs={logs} running={running} />,
    },
  ];

  const footerContent = firstTimeHint ? (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.25 }}
        className="absolute bottom-4 left-3 right-3 z-50 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 shadow-lg"
      >
        <div className="flex items-start gap-2">
          <span className="text-[15px] shrink-0">👋</span>
          <div>
            <div className="text-[11px] font-bold text-blue-700 mb-0.5">{firstTimeHint.term}</div>
            <p className="text-[11px] text-blue-600 leading-snug text-serif">{firstTimeHint.desc}</p>
          </div>
          <button
            onClick={() => setFirstTimeHint(null)}
            className="ml-auto text-blue-400 hover:text-blue-600 shrink-0 text-base cursor-pointer"
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
      onRun={onRun}
      onReset={onReset}
      tabs={tabs}
      footerContent={footerContent}
    />
  );
}
