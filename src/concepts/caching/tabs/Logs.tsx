import { useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import type { CachingLogEntry } from '../useCachingEngine';
import { Tooltip } from '../../../components/Tooltip';
import { LOG_TOOLTIPS } from '../../../data/glossary';

const LOG_COLORS: Record<string, string> = {
  info: '#94a3b8',
  hit: '#059669',
  miss: '#f59e0b',
  store: '#d97706',
  evict: '#7c3aed',
  expire: '#dc2626',
  spike: '#ef4444',
  nocache: '#6b7280',
};

export interface CachingLogsTabProps {
  logs: CachingLogEntry[];
  running: boolean;
}

export function CachingLogsTab({ logs, running }: CachingLogsTabProps) {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => logEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
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
          <p className="text-[10px] text-slate-300 text-center mt-6 leading-relaxed px-2 text-serif italic">
            Events will appear here once you start the simulation
          </p>
        )}
        {logs.map((l) => (
          <motion.div
            key={l.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="flex gap-1.5 items-start"
          >
            <span className="text-[9px] text-slate-200 font-mono shrink-0 mt-0.5">{l.ts}</span>
            <span
              className="text-[10px] leading-[1.4] text-serif"
              style={{ color: LOG_COLORS[l.type] || '#64748b' }}
            >
              <LogMessage msg={l.msg} type={l.type} />
            </span>
          </motion.div>
        ))}
        <div ref={logEndRef} />
      </div>

    </div>
  );
}


/** Wrap known keywords in the log message with inline tooltips. */
function LogMessage({ msg, type }: { msg: string; type: string }) {
  const parts: React.ReactNode[] = [];
  const keywords = Object.keys(LOG_TOOLTIPS);

  const sorted = keywords.sort((a, b) => b.length - a.length);
  const foundAt: Array<{ idx: number; word: string }> = [];

  for (const kw of sorted) {
    const idx = msg.indexOf(kw);
    if (idx !== -1 && !foundAt.some((f) => idx >= f.idx && idx < f.idx + f.word.length)) {
      foundAt.push({ idx, word: kw });
    }
  }

  if (foundAt.length === 0) return <span>{msg}</span>;

  foundAt.sort((a, b) => a.idx - b.idx);
  let cursor = 0;
  for (const { idx, word } of foundAt) {
    if (idx > cursor) parts.push(<span key={`t-${cursor}`}>{msg.slice(cursor, idx)}</span>);
    parts.push(
      <Tooltip key={`kw-${idx}`} content={LOG_TOOLTIPS[word]} color={LOG_COLORS[type] || '#64748b'}>
        {word}
      </Tooltip>,
    );
    cursor = idx + word.length;
  }
  if (cursor < msg.length) parts.push(<span key="tail">{msg.slice(cursor)}</span>);

  return <>{parts}</>;
}
