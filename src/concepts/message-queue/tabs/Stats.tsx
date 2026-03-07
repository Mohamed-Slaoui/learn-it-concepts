import { motion } from 'motion/react';
import type { MQSimStats, WorkerState, SimulationMode, ChaosStats, ChaosWorkerState } from '../types';

const LABEL = 'text-[9px] font-bold text-slate-400 tracking-[2px] uppercase font-mono';

interface MQStatsTabProps {
  stats: MQSimStats;
  workers: WorkerState[];
  mode: SimulationMode;
  chaosStats: ChaosStats;
  chaosWorkers: ChaosWorkerState[];
}

export default function MQStatsTab({ stats, workers, mode, chaosStats, chaosWorkers }: MQStatsTabProps) {
  if (mode === 'chaos') {
    return <ChaosStatsView stats={chaosStats} workers={chaosWorkers} />;
  }
  return <QueueStatsView stats={stats} workers={workers} />;
}

// â”€â”€â”€ Chaos Mode Stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ChaosStatsView({ stats, workers }: { stats: ChaosStats; workers: ChaosWorkerState[] }) {
  const { total, completed, dropped, failed, utilization, throughput, avgProcessingTime } = stats;
  const dropRate = total === 0 ? 0 : Math.round((dropped / total) * 100);

  return (
    <div className="px-4 py-4 flex flex-col gap-3 max-h-full overflow-y-auto">

      {/* Drop Rate â€“ the key chaos metric */}
      <div className="rounded-xl border border-red-200 bg-red-50 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className={LABEL + ' text-red-400'}>Drop Rate</span>
          <span className="text-[22px] font-black font-mono text-red-600">
            {dropRate}<span className="text-[13px] text-red-400 ml-0.5">%</span>
          </span>
        </div>
        <div className="h-2 bg-red-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-red-500"
            animate={{ width: `${dropRate}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <p className="text-[10px] text-red-500 italic mt-1.5">
          Orders dropped when all workers are busy â€” customers see errors
        </p>
      </div>

      {/* Order counts */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Total Orders', value: total,     color: '#475569' },
          { label: 'Completed',    value: completed, color: '#10b981' },
          { label: 'Dropped âŒ',   value: dropped,   color: '#ef4444' },
          { label: 'Failed',       value: failed,    color: '#f97316' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-center">
            <motion.div
              key={value}
              className="text-[20px] font-bold font-mono"
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              style={{ color }}
            >
              {value}
            </motion.div>
            <div className="text-[8px] font-bold text-slate-400 tracking-[1px] uppercase font-mono">{label}</div>
          </div>
        ))}
      </div>

      {/* Worker utilization */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className={LABEL}>Worker Utilization</span>
          <span
            className="text-[18px] font-bold font-mono"
            style={{ color: utilization >= 90 ? '#ef4444' : utilization >= 70 ? '#f59e0b' : '#10b981' }}
          >
            {utilization}%
          </span>
        </div>
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: utilization >= 90 ? '#ef4444' : utilization >= 70 ? '#f59e0b' : '#10b981' }}
            animate={{ width: `${utilization}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <p className="text-[10px] text-slate-500 italic mt-1">
          {utilization >= 90 ? 'ðŸ”´ Workers at capacity â€“ orders are dropping!' :
           utilization >= 70 ? 'ðŸŸ¡ Workers under pressure' :
           'ðŸŸ¢ Workers have headroom'}
        </p>
      </div>

      {/* Performance */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Throughput (5s)',   value: throughput.toFixed(1), unit: 'orders/s', color: '#3b82f6' },
          { label: 'Avg Proc Time',     value: avgProcessingTime,      unit: 'ms',       color: '#8b5cf6' },
        ].map(({ label, value, unit, color }) => (
          <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
            <div className="text-[8px] font-bold text-slate-400 tracking-[1px] uppercase font-mono mb-1">{label}</div>
            <div className="text-[16px] font-bold font-mono leading-tight" style={{ color }}>
              {value}
              <span className="text-[10px] text-slate-400 ml-1">{unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Per-worker */}
      {workers.length > 0 && (
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
          <span className={LABEL}>Order Processors</span>
          <div className="mt-2 flex flex-col gap-1.5">
            <div className="grid grid-cols-4 gap-1 text-[8px] font-bold text-slate-400 uppercase font-mono">
              <span className="col-span-2">Worker</span>
              <span className="text-right">Done</span>
              <span className="text-right">Failed</span>
            </div>
            {workers.map((w) => (
              <div key={w.id} className="grid grid-cols-4 gap-1 items-center">
                <div className="col-span-2 flex items-center gap-1">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: w.status === 'processing' ? '#f97316' : '#10b981' }}
                  />
                  <span className="text-[10px] font-mono text-slate-600">{w.id}</span>
                </div>
                <span className="text-right text-[11px] font-bold font-mono text-emerald-600">{w.processedCount}</span>
                <span className="text-right text-[11px] font-bold font-mono text-red-500">{w.failedCount}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System health verdict */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
        <span className={LABEL}>System Health</span>
        <div className="mt-2 flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: dropRate > 30 ? '#ef4444' : dropRate > 5 ? '#f59e0b' : '#10b981' }}
          />
          <p className="text-[11px] text-slate-700">
            {dropRate > 30
              ? 'ðŸ”´ System overloaded â€” this is why queues matter'
              : dropRate > 5
              ? 'ðŸŸ¡ Struggling under load â€” try reducing rate or adding workers'
              : 'ðŸŸ¢ Managing, but not scalable â€” one spike could break it'}
          </p>
        </div>
      </div>

      {/* Compared to queue */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-[11px] text-emerald-800">
        ðŸ’¡ With a message queue, those {dropped} dropped orders would be safely held in a buffer instead.
      </div>

    </div>
  );
}

// â”€â”€â”€ Queue Mode Stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function QueueStatsView({ stats, workers }: { stats: MQSimStats; workers: WorkerState[] }) {
  const {
    total, completed, failed, avgLatency, avgProcessingTime, throughput,
    mainQueueLength, inFlightCount, delayedCount, deadLetterCount,
    retries, rejectedByBackpressure,
  } = stats;

  const successRate = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className="px-4 py-4 flex flex-col gap-3 max-h-full overflow-y-auto">

      {/* Success Rate */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className={LABEL}>Success Rate</span>
          <span className="text-[20px] font-bold font-mono text-slate-800">
            {successRate}<span className="text-[13px] text-slate-400 ml-0.5">%</span>
          </span>
        </div>
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: successRate >= 80 ? '#10b981' : successRate >= 50 ? '#f59e0b' : '#ef4444' }}
            animate={{ width: `${successRate}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Order counts */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Total',     value: total,     color: '#475569' },
          { label: 'Completed', value: completed, color: '#10b981' },
          { label: 'Failed',    value: failed,    color: '#ef4444' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-center">
            <div className="text-[20px] font-bold font-mono" style={{ color }}>{value}</div>
            <div className="text-[9px] font-bold text-slate-400 tracking-[1.5px] uppercase font-mono">{label}</div>
          </div>
        ))}
      </div>

      {/* Performance */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Throughput (5s)', value: throughput.toFixed(1),  unit: 'msg/s', color: '#3b82f6' },
          { label: 'Avg Latency',     value: avgLatency,              unit: 'ms',    color: '#8b5cf6' },
          { label: 'Avg Proc Time',   value: avgProcessingTime,       unit: 'ms',    color: '#06b6d4' },
        ].map(({ label, value, unit, color }) => (
          <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
            <div className="text-[8px] font-bold text-slate-400 tracking-[1px] uppercase font-mono mb-1">{label}</div>
            <div className="text-[16px] font-bold font-mono leading-tight" style={{ color }}>
              {value}<span className="text-[10px] text-slate-400 ml-1">{unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Queue Breakdown */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
        <span className={LABEL}>Queue Breakdown</span>
        <div className="mt-2 flex flex-col gap-1.5">
          {[
            { label: 'Order Queue',  value: mainQueueLength, color: '#f59e0b' },
            { label: 'In-Flight',    value: inFlightCount,   color: '#8b5cf6' },
            { label: 'Delayed',      value: delayedCount,    color: '#64748b' },
            { label: 'Dead Letter',  value: deadLetterCount, color: '#ef4444' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-[11px] text-slate-600">{label}</span>
              <span className="font-mono text-[13px] font-bold" style={{ color }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Retry / Backpressure */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
          <div className="text-[8px] font-bold text-slate-400 tracking-[1px] uppercase font-mono mb-1">Retries</div>
          <div className="text-[18px] font-bold font-mono text-orange-500">{retries}</div>
        </div>
        <div className={`rounded-xl border p-2.5 ${rejectedByBackpressure > 0 ? 'border-red-200 bg-red-50' : 'border-slate-100 bg-slate-50'}`}>
          <div className="text-[8px] font-bold text-slate-400 tracking-[1px] uppercase font-mono mb-1">Backpressure</div>
          <div className={`text-[18px] font-bold font-mono ${rejectedByBackpressure > 0 ? 'text-red-600' : 'text-slate-400'}`}>
            {rejectedByBackpressure}
          </div>
        </div>
      </div>

      {/* Per-Worker Metrics */}
      {workers.length > 0 && (
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
          <span className={LABEL}>Worker Metrics</span>
          <div className="mt-2 flex flex-col gap-1.5">
            <div className="grid grid-cols-5 gap-1 text-[8px] font-bold text-slate-400 uppercase font-mono">
              <span className="col-span-2">Worker</span>
              <span className="text-right">Done</span>
              <span className="text-right">Failed</span>
              <span className="text-right">Avg ms</span>
            </div>
            {workers.map((w) => {
              const statusColor =
                w.status === 'processing' ? '#8b5cf6'
                : w.status === 'crashed'  ? '#ef4444'
                : '#10b981';
              return (
                <div key={w.id} className="grid grid-cols-5 gap-1 items-center">
                  <div className="col-span-2 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
                    <span className="text-[10px] font-mono text-slate-600 truncate">{w.id}</span>
                    {w.crashCount > 0 && <span className="text-[8px] text-red-500 font-bold">ðŸ’¥{w.crashCount}</span>}
                  </div>
                  <span className="text-right text-[11px] font-bold font-mono text-emerald-600">{w.processedCount}</span>
                  <span className="text-right text-[11px] font-bold font-mono text-red-500">{w.failedCount}</span>
                  <span className="text-right text-[11px] font-bold font-mono text-blue-500">
                    {w.avgProcessingTime > 0 ? w.avgProcessingTime : 'â€“'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Health */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
        <span className={LABEL}>System Health</span>
        <div className="mt-2 space-y-1 text-[11px] text-slate-700">
          {[
            { label: 'Throughput',   ok: throughput > 5,              fair: throughput > 2 },
            { label: 'Reliability',  ok: successRate >= 80,           fair: successRate >= 50 },
            { label: 'Backpressure', ok: rejectedByBackpressure === 0, fair: rejectedByBackpressure < 5 },
          ].map(({ label, ok, fair }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full"
                style={{ backgroundColor: ok ? '#10b981' : fair ? '#f59e0b' : '#ef4444' }} />
              <span>{label}: {ok ? 'Good' : fair ? 'Fair' : 'Poor'}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}