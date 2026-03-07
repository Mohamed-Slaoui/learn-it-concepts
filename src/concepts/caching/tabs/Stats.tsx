import { motion } from 'motion/react';

const LABEL = 'text-[9px] font-bold text-slate-400 tracking-[2px] uppercase font-mono';

export interface CachingStatsTabProps {
  cacheHits: number;
  cacheMisses: number;
  totalRequests: number;
  cacheHitRate: number;
  dbQueries: number;
  dbLoad: number;
  avgLatencyMs: number;
  dbQueueLength: number;
  cacheEnabled: boolean;
}

function StatBar({ label, value, max = 100, color, text }: {
  label: string;
  value: number;
  max?: number;
  color: string;
  text: string;
}) {
  const pct = Math.min(100, (value / Math.max(max, 1)) * 100);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className={LABEL}>{label}</span>
        <span className="text-[12px] font-bold font-mono" style={{ color }}>{text}</span>
      </div>
      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}

export function CachingStatsTab({
  cacheHits, cacheMisses, totalRequests, cacheHitRate,
  dbQueries, dbLoad, avgLatencyMs, dbQueueLength, cacheEnabled,
}: CachingStatsTabProps) {
  return (
    <div className="px-4 py-4 flex flex-col gap-3">

      {/* Hit rate hero */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className={LABEL}>Cache Hit Rate</span>
          <span className="text-[22px] font-bold font-mono" style={{ color: cacheHitRate >= 70 ? '#059669' : cacheHitRate > 30 ? '#d97706' : '#ef4444' }}>
            {cacheHitRate.toFixed(1)}<span className="text-[13px] text-slate-400 ml-0.5">%</span>
          </span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: cacheHitRate >= 70 ? '#059669' : cacheHitRate > 30 ? '#d97706' : '#ef4444' }}
            animate={{ width: `${cacheHitRate}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <p className="text-[10px] text-slate-400 mt-1.5 m-0 text-serif">
          {cacheEnabled
            ? cacheHitRate >= 80 ? 'Excellent! Database is barely touched.' : cacheHitRate > 50 ? 'Cache warming up. Hit rate improving.' : 'Cache is new — hit rate will rise with repeat requests.'
            : 'Enable cache to see hit rate improve.'}
        </p>
      </div>

      {/* Hit / Miss / Total */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Total Req', value: totalRequests, color: '#475569' },
          { label: 'Hits', value: cacheHits, color: '#059669' },
          { label: 'Misses', value: cacheMisses, color: '#ef4444' },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-center">
            <motion.div
              key={m.value}
              animate={{ scale: [1.1, 1] }}
              transition={{ duration: 0.2 }}
              className="text-[18px] font-bold font-mono"
              style={{ color: m.color }}
            >
              {m.value}
            </motion.div>
            <div className="text-[9px] font-bold text-slate-400 tracking-[1.5px] uppercase font-mono">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Performance metrics */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 flex flex-col gap-3">
        <StatBar
          label="DB Load"
          value={dbLoad}
          color={dbLoad > 70 ? '#ef4444' : dbLoad > 40 ? '#d97706' : '#10b981'}
          text={`${dbLoad}%`}
        />
        <StatBar
          label="Avg Latency"
          value={avgLatencyMs}
          max={1000}
          color={avgLatencyMs > 200 ? '#ef4444' : avgLatencyMs > 80 ? '#d97706' : '#059669'}
          text={`${avgLatencyMs}ms`}
        />
        {dbQueueLength > 0 && (
          <StatBar
            label="DB Queue"
            value={dbQueueLength}
            max={20}
            color="#ef4444"
            text={`${dbQueueLength} waiting`}
          />
        )}
      </div>

      {/* DB query count */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
        <div className="flex items-center justify-between">
          <div>
            <span className={LABEL}>Total DB Queries</span>
            <p className="text-[10px] text-slate-400 mt-0.5 m-0 text-serif">
              {cacheEnabled ? 'Only misses hit the DB' : 'Every request hits the DB'}
            </p>
          </div>
          <span className="text-[22px] font-bold font-mono" style={{ color: '#7c3aed' }}>
            {dbQueries}
          </span>
        </div>
      </div>

    </div>
  );
}
