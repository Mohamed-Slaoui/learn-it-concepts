import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Tooltip } from '../../../components/Tooltip';
import type { LBLogEntry, LBLogType } from '../types';

interface LBLogsTabProps {
  logs: LBLogEntry[];
  running: boolean;
}

const LB_LOG_COLORS: Record<LBLogType, string> = {
  info:     '#94a3b8',
  route:    '#3b82f6',
  health:   '#10b981',
  error:    '#ef4444',
  response: '#7c3aed',
};

const LB_LOG_TOOLTIPS: Record<LBLogType, string> = {
  info:     'General event — request arriving or informational message.',
  route:    'A routing decision was made — request forwarded to a server.',
  health:   'Server responded successfully and is healthy.',
  error:    'A server was found to be offline or the request failed.',
  response: 'Response delivered back to the client.',
};

const LB_LOG_TAGS: Record<LBLogType, string> = {
  info:     'INFO',
  route:    'ROUTE',
  health:   'HEALTH',
  error:    'ERROR',
  response: 'RESP',
};

function LogMessage({ log }: { log: LBLogEntry }) {
  const color = LB_LOG_COLORS[log.type];
  const tip = LB_LOG_TOOLTIPS[log.type];
  const tag = LB_LOG_TAGS[log.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="rounded-lg border border-slate-100 px-2.5 py-2 bg-slate-50 flex items-start gap-2 text-serif"
    >
      <span className="text-[9px] text-slate-400 shrink-0 mt-0.5 font-mono">{log.ts}</span>
      <Tooltip content={tip} color={color}>
        <span
          className="shrink-0 mt-0.5 font-bold text-[8px] px-1.5 py-0.5 rounded-md uppercase tracking-wide"
          style={{ background: `${color}1a`, color }}
        >
          {tag}
        </span>
      </Tooltip>
      <span className="text-[11px] text-slate-600 wrap-break-word leading-tight">{log.msg}</span>
    </motion.div>
  );
}

export default function LBLogsTab({ logs, running }: LBLogsTabProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, [logs.length]);

  return (
    <div className="px-3 py-2 flex flex-col">
      <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-slate-100">
        <span className="text-[9px] font-bold text-slate-400 tracking-[2px] uppercase text-code">
          Event Log
        </span>
        <motion.div
          className="ml-auto w-1.5 h-1.5 rounded-full"
          animate={{
            backgroundColor: running ? '#10b981' : '#e2e8f0',
            boxShadow: running ? '0 0 7px #10b981' : 'none',
          }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="flex flex-col gap-0.5">
        {logs.length === 0 && (
          <div className="text-[11px] text-slate-400 italic text-center py-6 text-serif">
            No events yet. Press Run to start.
          </div>
        )}
        {logs.map((log) => (
          <LogMessage key={log.id} log={log} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
