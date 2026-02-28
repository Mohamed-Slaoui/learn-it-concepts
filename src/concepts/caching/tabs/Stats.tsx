import { motion } from 'motion/react';
import type { SimStats } from '../../../types';

const LABEL = 'text-[9px] font-bold text-slate-400 tracking-[2px] uppercase font-mono';

export interface CachingStatsTabProps {
  stats: SimStats;
}

export function CachingStatsTab({ stats }: CachingStatsTabProps) {
  const totalRequests = stats.hits + stats.misses;
  const hitRate = totalRequests > 0 ? ((stats.hits / totalRequests) * 100).toFixed(1) : '0.0';

  return (
    <div className="px-4 py-4 flex flex-col gap-3">

      {/* Hit rate bar */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className={LABEL}>Cache Hit Rate</span>
          <span className="text-[20px] font-bold font-mono text-slate-800">
            {hitRate}
            <span className="text-[13px] text-slate-400 ml-0.5">%</span>
          </span>
        </div>
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: '#059669' }}
            animate={{ width: `${parseFloat(hitRate)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Hit / Miss / Total grid */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Total', value: totalRequests, color: '#475569' },
          { label: 'Hits', value: stats.hits, color: '#059669' },
          { label: 'Misses', value: stats.misses, color: '#ef4444' },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-center">
            <div className="text-[20px] font-bold font-mono" style={{ color: m.color }}>
              {m.value}
            </div>
            <div className="text-[9px] font-bold text-slate-400 tracking-[1.5px] uppercase font-mono">
              {m.label}
            </div>
          </div>
        ))}
      </div>

      {/* Response time */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
        <span className={LABEL}>Last Response Time</span>
        <div className="text-[24px] font-bold font-mono text-slate-800 mt-1">
          {stats.ms}
          <span className="text-[13px] text-slate-400 ml-1">ms</span>
        </div>
      </div>

      {/* DB Load */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className={LABEL}>DB Load</span>
          <span className="text-[13px] font-mono text-slate-600">
            {((stats.misses / Math.max(totalRequests, 1)) * 100).toFixed(0)}%
          </span>
        </div>
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: '#ef4444' }}
            animate={{ width: `${(stats.misses / Math.max(totalRequests, 1)) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <p className="text-[10px] text-slate-400 mt-1.5 text-serif">
          Requests hitting the database
        </p>
      </div>

    </div>
  );
}
