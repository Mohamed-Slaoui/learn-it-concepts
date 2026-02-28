import { motion } from 'motion/react';
import type { LBSimStats } from '../types';

const LABEL = 'text-[9px] font-bold text-slate-400 tracking-[2px] uppercase font-mono';

interface LBStatsTabProps {
  stats: LBSimStats;
}

const SERVER_COLORS: Record<string, string> = {
  s1: '#3b82f6',
  s2: '#f59e0b',
  s3: '#10b981',
};
const SERVER_LABELS: Record<string, string> = {
  s1: 'Server 1',
  s2: 'Server 2',
  s3: 'Server 3',
};

export default function LBStatsTab({ stats }: LBStatsTabProps) {
  const { total, failed, ms, serverCounts } = stats;
  const routed = total - failed;
  const successRate = total === 0 ? 0 : Math.round((routed / total) * 100);
  const errorRate = total === 0 ? 0 : Math.round((failed / total) * 100);
  const avgLatency = total === 0 ? 0 : Math.round(ms / total);
  const p95Latency = Math.round(avgLatency * 1.45); // rough P95 estimate
  const requestsPerSec = ms === 0 ? 0 : Math.round((total / ms) * 1000);
  const maxCount = Math.max(...Object.values(serverCounts), 1);

  return (
    <div className="px-4 py-4 flex flex-col gap-3 max-h-full overflow-y-auto">
      {/* Success rate bar */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className={LABEL}>Success Rate</span>
          <span className="text-[20px] font-bold font-mono text-slate-800">
            {successRate}
            <span className="text-[13px] text-slate-400 ml-0.5">%</span>
          </span>
        </div>
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: successRate >= 80 ? '#10b981' : successRate >= 50 ? '#f59e0b' : '#ef4444',
            }}
            animate={{ width: `${successRate}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Summary grid */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Total', value: total, color: '#475569' },
          { label: 'Routed', value: routed, color: '#059669' },
          { label: 'Failed', value: failed, color: '#ef4444' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-center">
            <div className="text-[20px] font-bold font-mono" style={{ color }}>
              {value}
            </div>
            <div className="text-[9px] font-bold text-slate-400 tracking-[1.5px] uppercase font-mono">
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Advanced metrics: Requests/sec, P95, Error Rate */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Requests/sec', value: requestsPerSec, unit: 'req/s', color: '#3b82f6' },
          { label: 'P95 Latency', value: p95Latency, unit: 'ms', color: '#8b5cf6' },
          { label: 'Error Rate', value: errorRate, unit: '%', color: '#ef4444' },
        ].map(({ label, value, unit, color }) => (
          <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
            <div className="text-[9px] font-bold text-slate-400 tracking-[1px] uppercase font-mono mb-1">
              {label}
            </div>
            <div className="text-[18px] font-bold font-mono" style={{ color }}>
              {value}
              <span className="text-[10px] text-slate-400 ml-1">{unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Response time */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
        <span className={LABEL}>Avg Response Time</span>
        <div className="text-[24px] font-bold font-mono text-slate-800 mt-1">
          {avgLatency}
          <span className="text-[13px] text-slate-400 ml-1">ms</span>
        </div>
      </div>

      {/* Per-server distribution */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
        <span className={LABEL}>Server Distribution</span>
        {(['s1', 's2', 's3'] as const).map((s) => {
          const count = serverCounts[s];
          const pct = total === 0 ? 0 : Math.round((count / total) * 100);
          const barPct = maxCount === 0 ? 0 : (count / maxCount) * 100;
          return (
            <div key={s} className="mt-2.5">
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-slate-600 font-semibold">{SERVER_LABELS[s]}</span>
                <span className="text-slate-400 font-mono">
                  {count} req · {pct}%
                </span>
              </div>
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: SERVER_COLORS[s] }}
                  animate={{ width: `${barPct}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
