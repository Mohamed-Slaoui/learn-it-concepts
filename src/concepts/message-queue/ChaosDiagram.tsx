/**
 * ChaosDiagram – visual topology for "Before Queue" (chaos) mode.
 *
 * Shows:  Website Server → direct arrows to Workers
 *         Orders that have nowhere to go → DROPPED counter (trash bin)
 *         Spike banner when traffic spike is active
 */

import { useRef, useState, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { ChaosWorkerState } from './types';

interface ChaosDiagramProps {
  workers: ChaosWorkerState[];
  droppedCount: number;
  completedCount: number;
  spikeActive: boolean;
  dropFlash: number;
  inFlightCount: number;
}

export default function ChaosDiagram({
  workers,
  droppedCount,
  completedCount,
  spikeActive,
  dropFlash,
  inFlightCount,
}: ChaosDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setDims({ w: el.offsetWidth, h: el.offsetHeight });
    const ro = new ResizeObserver(() => setDims({ w: el.offsetWidth, h: el.offsetHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { w, h } = dims;

  // Node centres
  const serverCx  = w * 0.22;
  const workersCx = w * 0.72;
  const cy        = h * 0.46;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-linear-to-b from-red-50/30 to-slate-100/50 rounded-xl border border-red-200"
    >
      {/* Traffic spike banner */}
      <AnimatePresence>
        {spikeActive && (
          <motion.div
            key="spike"
            className="absolute top-2 left-1/2 -translate-x-1/2 z-20 bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            ⚡ TRAFFIC SPIKE — 5× customers for 3s
          </motion.div>
        )}
      </AnimatePresence>

      {/* NO QUEUE watermark */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        style={{ zIndex: 1 }}
      >
        <div
          className="text-red-200 font-black tracking-widest"
          style={{ fontSize: 40, transform: 'rotate(-18deg)', opacity: 0.35 }}
        >
          NO QUEUE
        </div>
      </div>

      {w > 0 && (
        <>
          {/* SVG layer – arrows */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 2 }}>
            <defs>
              <marker id="ch-arrow-grey" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
              </marker>
              <marker id="ch-arrow-orange" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#f97316" />
              </marker>
              <marker id="ch-arrow-red" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#ef4444" />
              </marker>
            </defs>

            {/* Server → each worker */}
            {workers.map((worker, i) => {
              const workerCy = cy - ((workers.length - 1) / 2) * 52 + i * 52;
              const busy     = worker.status === 'processing';
              return (
                <line
                  key={worker.id}
                  x1={serverCx + 48} y1={cy}
                  x2={workersCx - 48} y2={workerCy}
                  stroke={busy ? '#f97316' : '#94a3b8'}
                  strokeWidth={busy ? 2.5 : 1.2}
                  strokeDasharray={busy ? '5 3' : '3 4'}
                  markerEnd={busy ? 'url(#ch-arrow-orange)' : 'url(#ch-arrow-grey)'}
                  opacity={busy ? 1 : 0.4}
                />
              );
            })}

            {/* Dropped: diagonal X line from server downward */}
            {droppedCount > 0 && (
              <line
                x1={serverCx + 20} y1={cy + 52}
                x2={serverCx + 50} y2={cy + 90}
                stroke="#ef4444" strokeWidth={2}
                strokeDasharray="4 3"
                markerEnd="url(#ch-arrow-red)"
                opacity={0.7}
              />
            )}
          </svg>

          {/* Website Server node */}
          <motion.div
            className="absolute flex flex-col items-center justify-center rounded-xl border-2"
            style={{
              left: serverCx - 48, top: cy - 44,
              width: 96, height: 88,
              borderColor: spikeActive ? '#f97316' : '#93c5fd',
              backgroundColor: spikeActive ? '#fff7ed' : '#eff6ff',
              zIndex: 10,
            }}
            animate={
              spikeActive
                ? { boxShadow: ['0 0 0px #f97316', '0 0 16px #f97316', '0 0 0px #f97316'] }
                : { boxShadow: 'none' }
            }
            transition={{ duration: 0.6, repeat: Infinity }}
          >
            <div className="text-2xl">🖥️</div>
            <div className="mt-1 text-center">
              <div className="font-bold text-[11px] text-slate-700">Website</div>
              <div className="text-[9px] text-slate-500">Server</div>
            </div>
          </motion.div>

          {/* Worker nodes */}
          {workers.length > 0 && (
            <div
              className="absolute flex flex-col gap-2 items-center"
              style={{
                left: workersCx - 48,
                top: cy - ((workers.length - 1) / 2) * 52 - 36,
                zIndex: 10,
              }}
            >
              {workers.map((w) => {
                const busy = w.status === 'processing';
                return (
                  <motion.div
                    key={w.id}
                    className="w-24 rounded-lg border-2 px-2 py-1.5 flex flex-col"
                    style={{
                      borderColor: busy ? '#f97316' : '#6ee7b7',
                      backgroundColor: busy ? '#fff7ed' : '#ecfdf5',
                    }}
                    animate={
                      busy
                        ? { boxShadow: ['0 0 0px #f97316', '0 0 8px #f97316', '0 0 0px #f97316'] }
                        : { boxShadow: 'none' }
                    }
                    transition={{ duration: 0.8, repeat: busy ? Infinity : 0 }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-700">{w.id}</span>
                      <span
                        className="text-[8px] font-bold uppercase rounded px-1"
                        style={{
                          color: busy ? '#f97316' : '#10b981',
                          backgroundColor: busy ? '#fff7ed' : '#ecfdf5',
                        }}
                      >
                        {busy ? 'busy' : 'idle'}
                      </span>
                    </div>
                    {w.orderId && (
                      <div className="mt-0.5 text-[8px] font-mono text-slate-500 truncate">
                        {w.orderId}
                      </div>
                    )}
                    <div className="mt-0.5 flex gap-2 text-[7px] text-slate-400">
                      <span className="text-emerald-500">✓{w.processedCount}</span>
                      <span className="text-red-400">✗{w.failedCount}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {workers.length === 0 && (
            <div
              className="absolute text-[9px] text-slate-400 italic text-center"
              style={{ left: workersCx - 44, top: cy - 12, width: 88, zIndex: 10 }}
            >
              No workers
            </div>
          )}

          {/* Dropped orders indicator */}
          <AnimatePresence>
            {droppedCount > 0 && (
              <motion.div
                key="dropped"
                className="absolute flex flex-col items-center rounded-lg border px-3 py-1.5"
                style={{
                  left: serverCx - 36,
                  top: cy + 100,
                  zIndex: 10,
                  borderColor: '#fca5a5',
                  backgroundColor: '#fff1f2',
                }}
                animate={
                  dropFlash > 0
                    ? { boxShadow: ['0 0 0px #ef4444', '0 0 12px #ef4444', '0 0 0px #ef4444'] }
                    : { boxShadow: 'none' }
                }
                transition={{ duration: 0.4 }}
              >
                <div className="text-base">🗑️</div>
                <div className="text-[9px] font-bold text-red-500 mt-0.5">Dropped</div>
                <motion.div
                  key={droppedCount}
                  className="text-[15px] font-black text-red-600"
                  initial={{ scale: 1.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 350 }}
                >
                  {droppedCount}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Completed indicator (bottom-right) */}
          {completedCount > 0 && (
            <div
              className="absolute flex flex-col items-center rounded-lg border px-3 py-1.5"
              style={{
                right: 20, bottom: 16, zIndex: 10,
                borderColor: '#6ee7b7',
                backgroundColor: '#ecfdf5',
              }}
            >
              <div className="text-base">✅</div>
              <div className="text-[9px] font-bold text-emerald-600 mt-0.5">Completed</div>
              <div className="text-[15px] font-black text-emerald-600">{completedCount}</div>
            </div>
          )}

          {/* In-flight badge */}
          {inFlightCount > 0 && (
            <div
              className="absolute top-3 right-3 bg-orange-100 border border-orange-300 rounded-full px-2 py-0.5 text-[9px] font-bold text-orange-700"
              style={{ zIndex: 10 }}
            >
              {inFlightCount} processing
            </div>
          )}
        </>
      )}
    </div>
  );
}
