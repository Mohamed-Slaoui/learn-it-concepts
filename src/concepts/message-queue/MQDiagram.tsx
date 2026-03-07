import { useRef, useState, useLayoutEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { MQStrategy, WorkerState } from './types';

interface MQDiagramProps {
  mainQueueLength: number;
  inFlightCount: number;
  delayedCount: number;
  deadLetterCount: number;
  queueCapacity: number;
  workers: WorkerState[];
  strategy: MQStrategy;
  queueAtCapacity: boolean;
  redeliveryFlash: number;
}

const WORKER_STATUS_COLOR: Record<WorkerState['status'], string> = {
  idle: '#10b981',
  processing: '#8b5cf6',
  crashed: '#ef4444',
};

const WORKER_STATUS_BG: Record<WorkerState['status'], string> = {
  idle: '#ecfdf5',
  processing: '#f5f3ff',
  crashed: '#fef2f2',
};

const WORKER_STATUS_BORDER: Record<WorkerState['status'], string> = {
  idle: '#6ee7b7',
  processing: '#c4b5fd',
  crashed: '#fca5a5',
};

export default function MQDiagram({
  mainQueueLength,
  inFlightCount,
  delayedCount,
  deadLetterCount,
  queueCapacity,
  workers,
  strategy,
  queueAtCapacity,
  redeliveryFlash,
}: MQDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [draggingNode, setDraggingNode] = useState<'producer' | 'queue' | string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [posOverrides, setPosOverrides] = useState<
    Record<string, { x: number; y: number }>
  >({});

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setDims({ w: el.offsetWidth, h: el.offsetHeight });
    const ro = new ResizeObserver(() => setDims({ w: el.offsetWidth, h: el.offsetHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { w, h } = dims;

  // Default positions: queue center, producer left, workers right (initially)
  const defaultPos = useMemo(
    () => ({
      producer: { x: w * 0.12, y: h * 0.5 },
      queue: { x: w * 0.5, y: h * 0.5 },
    }),
    [w, h],
  );

  // Get position for a node (either static nodes or workers)
  const getPos = useCallback(
    (nodeId: string) => {
      if (posOverrides[nodeId]) return posOverrides[nodeId];
      if (nodeId === 'producer') return defaultPos.producer;
      if (nodeId === 'queue') return defaultPos.queue;
      // For workers: default positions spaced around the right side
      const workerIdx = workers.findIndex((w) => w.id === nodeId);
      if (workerIdx >= 0) {
        const numWorkers = Math.min(workers.length, 5);
        return {
          x: w * 0.85,
          y: h * 0.5 + (workerIdx - (numWorkers - 1) / 2) * 68,
        };
      }
      return { x: 0, y: 0 };
    },
    [posOverrides, defaultPos, workers, w, h],
  );

  const handleMouseDown = useCallback(
    (nodeId: string, e: React.MouseEvent) => {
      e.preventDefault();
      const nodePos = getPos(nodeId);
      setDraggingNode(nodeId);
      setDragOffset({
        x: e.clientX - nodePos.x,
        y: e.clientY - nodePos.y,
      });
    },
    [getPos],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!draggingNode) return;
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      let newX = e.clientX - containerRect.left - dragOffset.x;
      let newY = e.clientY - containerRect.top - dragOffset.y;

      const padding = 60;
      newX = Math.max(padding, Math.min(newX, w - padding));
      newY = Math.max(padding, Math.min(newY, h - padding));

      setPosOverrides((prev) => ({
        ...prev,
        [draggingNode]: { x: newX, y: newY },
      }));
    },
    [draggingNode, dragOffset, w, h],
  );

  const handleMouseUp = useCallback(() => {
    setDraggingNode(null);
  }, []);

  // Node centres from getPos
  const producerPos = getPos('producer');
  const queuePos = getPos('queue');
  const producerCx = producerPos.x + 46;
  const queueCx    = queuePos.x;
  const cy = producerPos.y;

  // Arrow endpoints
  const arrowY = cy;
  const producerRight = producerCx + 46;
  const queueLeft     = queueCx - 58;
  const queueRight    = queueCx + 58;

  // Queue fill pct for capacity bar
  const fillPct = queueCapacity > 0 ? Math.min(1, mainQueueLength / queueCapacity) : 0;
  const fillColor = fillPct >= 0.9 ? '#ef4444' : fillPct >= 0.6 ? '#f59e0b' : '#10b981';

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-linear-to-b from-slate-50/50 to-slate-100/50 rounded-xl border border-slate-200 cursor-grab active:cursor-grabbing"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {w > 0 && (
        <>
          {/* ── SVG Arrows ──────────────────────────────────────────────── */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
            <defs>
              <marker id="mq-arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
              </marker>
              <marker id="mq-arrow-blue" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#3b82f6" />
              </marker>
            </defs>
            {/* Producer → Queue */}
            <line
              x1={producerRight} y1={arrowY} x2={queueLeft} y2={arrowY}
              stroke="#94a3b8" strokeWidth={2} markerEnd="url(#mq-arrow)"
            />
            {/* Queue → Workers (one arrow per worker) */}
            {workers.map((w) => {
              const workerPos = getPos(w.id);
              const workersLeft = workerPos.x - 46;
              return (
                <line
                  key={w.id}
                  x1={queueRight} y1={arrowY} x2={workersLeft} y2={workerPos.y}
                  stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 3" markerEnd="url(#mq-arrow-blue)"
                />
              );
            })}
          </svg>

          {/* ── Producer Node ────────────────────────────────────────────── */}
          <div
            onMouseDown={(e) => handleMouseDown('producer', e)}
            className="absolute flex flex-col items-center justify-center rounded-xl border-2 cursor-grab active:cursor-grabbing select-none"
            style={{
              left: producerPos.x - 46, top: producerPos.y - 44,
              width: 92, height: 88,
              borderColor: '#93c5fd', backgroundColor: '#eff6ff',
              zIndex: 10,
            }}
          >
            <div className="text-2xl">🏭</div>
            <div className="mt-1 text-center">
              <div className="font-bold text-[11px] text-slate-700">Producer</div>
              <div className="text-[9px] text-slate-500">Message Source</div>
            </div>
          </div>

          {/* ── Queue Node ───────────────────────────────────────────────── */}
          <motion.div
            onMouseDown={(e) => handleMouseDown('queue', e)}
            className="absolute rounded-xl border-2 flex flex-col cursor-grab active:cursor-grabbing select-none"
            style={{
              left: queuePos.x - 58, top: queuePos.y - 68,
              width: 116, minHeight: 136,
              borderColor: queueAtCapacity ? '#ef4444' : '#fbbf24',
              backgroundColor: queueAtCapacity ? '#fff1f2' : '#fffbeb',
              zIndex: 10,
              padding: '8px',
            }}
            animate={
              queueAtCapacity
                ? { boxShadow: ['0 0 0px #ef4444', '0 0 14px #ef4444', '0 0 0px #ef4444'] }
                : { boxShadow: 'none' }
            }
            transition={{ duration: 1, repeat: Infinity }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-amber-700">Queue</span>
              <span className="text-[8px] text-slate-500 font-mono">{strategy.toUpperCase()}</span>
            </div>

            {/* Capacity bar */}
            <div className="mb-2">
              <div className="flex justify-between text-[8px] text-slate-500 mb-0.5">
                <span>{mainQueueLength} / {queueCapacity}</span>
                {queueAtCapacity && <span className="text-red-600 font-bold">FULL</span>}
              </div>
              <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: fillColor }}
                  animate={{ width: `${fillPct * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Message dots */}
            <div className="flex flex-wrap gap-0.5 mb-2 min-h-3">
              {Array.from({ length: Math.min(mainQueueLength, 15) }).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-sm"
                  style={{ backgroundColor: '#f59e0b', opacity: 0.5 + (i % 5) * 0.1 }}
                  animate={{ y: i === 0 ? [0, -1.5, 0] : 0 }}
                  transition={{ duration: 0.7, delay: i * 0.05, repeat: Infinity }}
                />
              ))}
              {mainQueueLength > 15 && (
                <span className="text-[7px] text-amber-600 font-bold">+{mainQueueLength - 15}</span>
              )}
            </div>

            {/* Sub-queue stats */}
            <div className="flex flex-col gap-0.5">
              <div className="flex justify-between text-[8px]">
                <span className="text-purple-600">In-flight</span>
                <span className="font-mono font-bold text-purple-600">{inFlightCount}</span>
              </div>
              {(strategy === 'delayed' || delayedCount > 0) && (
                <div className="flex justify-between text-[8px]">
                  <span className="text-slate-500">Delayed</span>
                  <span className="font-mono font-bold text-slate-500">{delayedCount}</span>
                </div>
              )}
              {deadLetterCount > 0 && (
                <AnimatePresence>
                  <motion.div
                    key={deadLetterCount}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="flex justify-between text-[8px]"
                  >
                    <span className="text-red-600">DLQ</span>
                    <span className="font-mono font-bold text-red-600">{deadLetterCount}</span>
                  </motion.div>
                </AnimatePresence>
              )}
            </div>

            {/* Redeliver flash */}
            <AnimatePresence>
              {redeliveryFlash > 0 && (
                <motion.div
                  key={redeliveryFlash}
                  className="mt-1 text-[8px] text-amber-600 text-center font-bold"
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 0, y: -6 }}
                  transition={{ duration: 1.5 }}
                >
                  ↺ redelivered
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ── Worker Nodes (individually draggable) ─────────────────────── */}
          {workers.map((w) => {
            const workerPos = getPos(w.id);
            const bg = WORKER_STATUS_BG[w.status];
            const border = WORKER_STATUS_BORDER[w.status];
            const color = WORKER_STATUS_COLOR[w.status];
            return (
              <motion.div
                key={w.id}
                onMouseDown={(e) => handleMouseDown(w.id, e)}
                className="absolute w-23 rounded-lg border-2 px-2 py-1.5 flex flex-col cursor-grab active:cursor-grabbing select-none"
                style={{
                  left: workerPos.x - 46,
                  top: workerPos.y - 32,
                  borderColor: border,
                  backgroundColor: bg,
                  zIndex: 10,
                }}
                animate={
                  w.status === 'processing'
                    ? { boxShadow: ['0 0 0px #8b5cf6', '0 0 8px #8b5cf6', '0 0 0px #8b5cf6'] }
                    : w.status === 'crashed'
                    ? { boxShadow: '0 0 8px #ef4444' }
                    : { boxShadow: 'none' }
                }
                transition={{ duration: 0.8, repeat: w.status === 'processing' ? Infinity : 0 }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-700">{w.id}</span>
                  <span
                    className="text-[8px] font-bold uppercase rounded px-1"
                    style={{ color, backgroundColor: `${color}20` }}
                  >
                    {w.status}
                  </span>
                </div>
                {w.currentMessageId && (
                  <div className="mt-0.5 text-[8px] font-mono text-slate-500 truncate">
                    {w.currentMessageId}
                  </div>
                )}
                <div className="mt-0.5 flex gap-2 text-[7px] text-slate-400">
                  <span>✓{w.processedCount}</span>
                  <span className="text-red-400">✗{w.failedCount}</span>
                  {w.crashCount > 0 && <span className="text-red-500">💥{w.crashCount}</span>}
                </div>
              </motion.div>
            );
          })}

          {workers.length === 0 && (
            <div
              className="absolute text-[9px] text-slate-400 italic w-23 text-center"
              style={{
                left: w * 0.85 - 46,
                top: h * 0.5 - 32,
                zIndex: 10,
              }}
            >
              No workers yet
            </div>
          )}

          {/* ── DLQ indicator (bottom-right) ────────────────────────────── */}
          {deadLetterCount > 0 && (
            <motion.div
              className="absolute bottom-3 right-3 bg-red-50 border border-red-300 rounded-lg px-2 py-1 text-[9px] font-bold text-red-600"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring' }}
            >
              Dead Letter: {deadLetterCount}
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}