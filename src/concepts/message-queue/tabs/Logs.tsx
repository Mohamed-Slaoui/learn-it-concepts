import { useEffect, useRef } from 'react';
import type { MQLogEntry } from '../types';

const LogTypeStyles: Record<string, string> = {
  info:         'text-slate-700 bg-slate-50 border-slate-200',
  produce:      'text-blue-700 bg-blue-50 border-blue-200',
  queue:        'text-amber-700 bg-amber-50 border-amber-200',
  dispatch:     'text-violet-700 bg-violet-50 border-violet-200',
  process:      'text-purple-700 bg-purple-50 border-purple-200',
  complete:     'text-emerald-700 bg-emerald-50 border-emerald-200',
  error:        'text-red-700 bg-red-50 border-red-200',
  retry:        'text-orange-700 bg-orange-50 border-orange-200',
  dlq:          'text-rose-800 bg-rose-50 border-rose-300',
  redeliver:    'text-yellow-700 bg-yellow-50 border-yellow-200',
  backpressure: 'text-red-600 bg-red-50 border-red-300',
  crash:        'text-rose-700 bg-rose-50 border-rose-200',
};

interface MQLogsTabProps {
  logs: MQLogEntry[];
  running: boolean;
}

export default function MQLogsTab({ logs, running }: MQLogsTabProps) {
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="px-3 py-3 flex flex-col gap-1.5 h-full max-h-full overflow-y-auto bg-slate-50">
      {logs.length === 0 && !running && (
        <div className="flex items-center justify-center h-full text-slate-500">
          <p className="text-sm italic">No logs yet. Run simulation to see logs.</p>
        </div>
      )}

      {logs.map((log) => {
        const style = LogTypeStyles[log.type] ?? LogTypeStyles.info;
        return (
          <div
            key={log.id}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono border ${style}`}
          >
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <div className="text-slate-500 text-[9px] mb-0.5">{log.ts}</div>
                <div className="text-[11px] leading-tight">{log.msg}</div>
              </div>
            </div>
          </div>
        );
      })}

      {running && logs.length > 0 && (
        <div className="text-[10px] text-slate-500 text-center italic py-1">Streaming…</div>
      )}
      <div ref={logsEndRef} />
    </div>
  );
}