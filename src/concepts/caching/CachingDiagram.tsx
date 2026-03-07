/**
 * CachingDiagram
 *
 * Custom story-driven diagram for the Caching simulator.
 * Shows: Customers → Server → Cache (or) → Database
 * with animated request particles flowing between nodes.
 */

import { useLayoutEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { ActiveRequest, CacheSlot, CachingConfig } from './useCachingEngine';

// ─── Positions ────────────────────────────────────────────────────────────────

interface Pos { x: number; y: number }

function getPositions(w: number, h: number): Record<string, Pos> {
  return {
    customers: { x: w * 0.10, y: h * 0.50 },
    server:    { x: w * 0.42, y: h * 0.50 },
    cache:     { x: w * 0.72, y: h * 0.22 },
    db:        { x: w * 0.72, y: h * 0.78 },
  };
}

// ─── SVG Arrow ────────────────────────────────────────────────────────────────

function Arrow({ from, to, color = '#cbd5e1', dashed = false }: {
  from: Pos; to: Pos; color?: string; dashed?: boolean;
}) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return null;
  const nx = dx / len;
  const ny = dy / len;
  const pad = 70;
  const x1 = from.x + nx * pad;
  const y1 = from.y + ny * pad;
  const x2 = to.x - nx * pad;
  const y2 = to.y - ny * pad;

  return (
    <line
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={color}
      strokeWidth={1.5}
      strokeDasharray={dashed ? '5,4' : undefined}
      markerEnd="url(#arrowhead)"
      opacity={0.5}
    />
  );
}

// ─── Request Particle ─────────────────────────────────────────────────────────

function RequestParticle({ req, pos, speed }: { req: ActiveRequest; pos: Record<string, Pos>; speed: number }) {
  // Determine start/end positions based on phase
  let startPos: Pos;
  let destPos: Pos;

  if (req.phase === 'server') {
    startPos = pos.customers;
    destPos  = pos.server;
  } else if (req.phase === 'cache') {
    startPos = pos.server;
    destPos  = pos.cache;
  } else if (req.phase === 'db') {
    startPos = pos.server;
    destPos  = pos.db;
  } else if (req.phase === 'cache-db') {
    startPos = pos.cache;
    destPos  = pos.db;
  } else if (req.phase === 'db-cache') {
    startPos = pos.db;
    destPos  = pos.cache;
  } else {
    startPos = pos.server;
    destPos  = pos.server;
  }

  // Async particles are small and gray; normal ones use status colour
  const color = req.isAsync
    ? '#94a3b8'
    : req.status === 'hit'      ? '#10b981'
    : req.status === 'miss'     ? '#f59e0b'
    : req.status === 'no-cache' ? '#ef4444'
    : '#3b82f6';

  const radius = req.isAsync ? 3 : 5;
  const baseDuration = req.phase === 'server' ? 0.09 : 0.45;
  const duration = baseDuration / speed;

  return (
    <motion.circle
      key={`${req.id}-${req.phase}`}
      r={radius}
      fill={color}
      opacity={req.isAsync ? 0.7 : 1}
      initial={{ cx: startPos.x, cy: startPos.y }}
      animate={{ cx: destPos.x, cy: destPos.y }}
      transition={{ duration, ease: 'easeInOut' }}
    />
  );
}

// ─── Main Diagram ─────────────────────────────────────────────────────────────

interface CachingDiagramProps {
  activeRequests: ActiveRequest[];
  cacheSlots: CacheSlot[];
  config: CachingConfig;
  cacheHitRate: number;
  dbLoad: number;
  dbQueueLength: number;
  avgLatencyMs: number;
  running: boolean;
}

export function CachingDiagram({
  activeRequests, cacheSlots, config, cacheHitRate, dbLoad, dbQueueLength, avgLatencyMs, running,
}: CachingDiagramProps) {
  const wRef = useRef<HTMLDivElement>(null);
  const [sz, setSz] = useState({ w: 800, h: 460 });

  useLayoutEffect(() => {
    const el = wRef.current;
    if (!el) return;
    const ob = new ResizeObserver(([e]) =>
      setSz({ w: e.contentRect.width || 800, h: e.contentRect.height || 460 }),
    );
    ob.observe(el);
    setSz({ w: el.offsetWidth || 800, h: el.offsetHeight || 460 });
    return () => ob.disconnect();
  }, []);

  const positions = useMemo(() => getPositions(sz.w, sz.h), [sz.w, sz.h]);

  const hasHitRequests = activeRequests.some(r => r.status === 'hit' || r.phase === 'cache');

  return (
    <div ref={wRef} className="relative w-full h-full select-none">
      <svg
        className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
        viewBox={`0 0 ${sz.w} ${sz.h}`}
      >
        <defs>
          {/* Arrow marker */}
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#cbd5e1" />
          </marker>
          <marker id="arrowhead-hit" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#10b981" />
          </marker>
          <marker id="arrowhead-miss" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#f59e0b" />
          </marker>
        </defs>

        {/* Static path: Customers → Server */}
        <Arrow from={positions.customers} to={positions.server} color="#93c5fd" />

        {/* Cache path — highlight green when hits happening */}
        {config.cacheEnabled && (
          <Arrow
            from={positions.server}
            to={positions.cache}
            color={hasHitRequests ? '#10b981' : '#86efac'}
          />
        )}

        {/* DB path — highlight red when load is high */}
        <Arrow
          from={positions.server}
          to={positions.db}
          color={dbLoad > 60 ? '#ef4444' : '#a5b4fc'}
          dashed={config.cacheEnabled}
        />

        {/* Animated request particles */}
        {activeRequests.slice(-20).map((req) => (
          <RequestParticle key={req.id} req={req} pos={positions} speed={config.simulationSpeed} />
        ))}

        {/* Hit rate badge on the cache→server return path */}
        {config.cacheEnabled && cacheHitRate > 0 && (
          <foreignObject
            x={(positions.server.x + positions.cache.x) / 2 - 28}
            y={(positions.server.y + positions.cache.y) / 2 - 14}
            width={56}
            height={28}
          >
            <motion.div
              animate={{ opacity: 1 }}
              style={{
                background: '#ecfdf5',
                border: '1.5px solid #86efac',
                borderRadius: 99,
                fontSize: 10,
                fontWeight: 700,
                color: '#059669',
                textAlign: 'center',
                padding: '3px 8px',
                whiteSpace: 'nowrap',
              }}
              className="text-code"
            >
              {cacheHitRate}% hit
            </motion.div>
          </foreignObject>
        )}

        {/* DB queue warning badge */}
        {dbQueueLength > 2 && (
          <foreignObject
            x={(positions.server.x + positions.db.x) / 2 - 30}
            y={(positions.server.y + positions.db.y) / 2 - 14}
            width={60}
            height={28}
          >
            <motion.div
              animate={{ opacity: [1, 0.6, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              style={{
                background: '#fef2f2',
                border: '1.5px solid #fca5a5',
                borderRadius: 99,
                fontSize: 10,
                fontWeight: 700,
                color: '#dc2626',
                textAlign: 'center',
                padding: '3px 8px',
                whiteSpace: 'nowrap',
              }}
              className="text-code"
            >
              queue: {dbQueueLength}
            </motion.div>
          </foreignObject>
        )}
      </svg>

      {/* ── Node Cards ── */}

      {/* Customers */}
      <div
        className="absolute pointer-events-none"
        style={{ left: positions.customers.x, top: positions.customers.y, transform: 'translate(-50%,-50%)' }}
      >
        <div className="flex flex-col items-center gap-1">
          <div style={{
            background: '#eff6ff', border: '2px solid #93c5fd', borderRadius: 14,
            padding: '8px 14px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8' }} className="heading-3">Clients</div>
            <div style={{ fontSize: 9, color: '#94a3b8', letterSpacing: '0.5px' }} className="text-code">Browsers</div>
            {running && (
              <div style={{ fontSize: 10, color: '#3b82f6', fontWeight: 600, marginTop: 2 }} className="heading-3">
                {config.requestsPerSecond} req/s
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Server */}
      <div
        className="absolute pointer-events-none"
        style={{ left: positions.server.x, top: positions.server.y, transform: 'translate(-50%,-50%)' }}
      >
        <div style={{
          background: '#fffbeb', border: '2px solid #fbbf24', borderRadius: 14,
          padding: '10px 14px', textAlign: 'center', minWidth: 110,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e' }} className="heading-3">App Server</div>
          <div style={{ fontSize: 9, color: '#94a3b8', letterSpacing: '0.5px' }} className="text-code">Backend API</div>
          {avgLatencyMs > 0 && (
            <div style={{ fontSize: 10, color: avgLatencyMs > 200 ? '#ef4444' : '#059669', fontWeight: 600, marginTop: 2 }} className="heading-3">
              ~{Math.round(avgLatencyMs)}ms avg
            </div>
          )}
        </div>
      </div>

      {/* Cache */}
      <div
        className="absolute pointer-events-none"
        style={{ left: positions.cache.x, top: positions.cache.y, transform: 'translate(-50%,-50%)' }}
      >
        <motion.div
          animate={!config.cacheEnabled ? { opacity: 0.35 } : { opacity: 1 }}
          style={{
            background: config.cacheEnabled ? '#ecfdf5' : '#f8fafc',
            border: `2px solid ${config.cacheEnabled ? '#6ee7b7' : '#e2e8f0'}`,
            borderRadius: 14,
            padding: '10px 14px',
            textAlign: 'center',
            minWidth: 110,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: config.cacheEnabled ? '#065f46' : '#94a3b8' }} className="heading-3">
            Cache {!config.cacheEnabled && '(off)'}
          </div>
          <div style={{ fontSize: 9, color: '#94a3b8', letterSpacing: '0.5px' }} className="text-code">Redis / Memory</div>
          {config.cacheEnabled && (
            <div style={{ fontSize: 10, color: '#059669', fontWeight: 600, marginTop: 2 }} className="heading-3">
              {cacheSlots.length}/{config.cacheSize} slots
            </div>
          )}

          {/* Cache slots grid */}
          {config.cacheEnabled && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 6, justifyContent: 'center', maxWidth: 120 }}>
              {Array.from({ length: config.cacheSize }).map((_, i) => {
                const slot = cacheSlots[i];
                return (
                  <AnimatePresence key={i}>
                    <motion.div
                      key={slot ? slot.key : `e-${i}`}
                      initial={slot ? { scale: 0.5 } : { scale: 1 }}
                      animate={{ scale: 1 }}
                      title={slot?.key}
                      style={{
                        width: 14, height: 14, borderRadius: 3,
                        background: slot ? '#dcfce7' : '#f1f5f9',
                        border: `1.5px solid ${slot ? '#86efac' : '#e2e8f0'}`,
                        fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {slot && '●'}
                    </motion.div>
                  </AnimatePresence>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Database */}
      <div
        className="absolute pointer-events-none"
        style={{ left: positions.db.x, top: positions.db.y, transform: 'translate(-50%,-50%)' }}
      >
        <motion.div
          animate={dbLoad > 70 ? {
            boxShadow: ['0 0 0 3px #fca5a580', '0 0 0 8px #fca5a530', '0 0 0 3px #fca5a580'],
          } : {}}
          transition={{ duration: 0.8, repeat: Infinity }}
          style={{
            background: dbLoad > 70 ? '#fff5f5' : '#f0f9ff',
            border: `2px solid ${dbLoad > 70 ? '#fca5a5' : '#93c5fd'}`,
            borderRadius: 14,
            padding: '10px 14px',
            textAlign: 'center',
            minWidth: 110,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: dbLoad > 70 ? '#dc2626' : '#1e3a5f' }} className="heading-3">
            Database
          </div>
          <div style={{ fontSize: 9, color: '#94a3b8', letterSpacing: '0.5px' }} className="text-code">
            {config.dbResponseMs}ms response
          </div>

          {/* DB Load bar */}
          <div style={{ width: '100%', height: 5, background: '#e2e8f0', borderRadius: 3, marginTop: 5, overflow: 'hidden' }}>
            <motion.div
              animate={{ width: `${dbLoad}%` }}
              transition={{ duration: 0.4 }}
              style={{
                height: '100%',
                background: dbLoad > 70 ? '#ef4444' : dbLoad > 40 ? '#f59e0b' : '#10b981',
                borderRadius: 3,
              }}
            />
          </div>
          <div style={{ fontSize: 9, color: dbLoad > 70 ? '#ef4444' : '#94a3b8', marginTop: 2, fontWeight: 600 }} className="text-code">
            {dbLoad}% load
          </div>

          {dbQueueLength > 0 && (
            <motion.div
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
              style={{ fontSize: 9, color: '#dc2626', fontWeight: 700, marginTop: 2 }}
              className="heading-3"
            >
              {dbQueueLength} queued
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Mode banner */}
      <AnimatePresence mode="wait">
        <motion.div
          key={config.cacheEnabled ? 'cache-on' : 'cache-off'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full z-10"
          style={{
            background: config.cacheEnabled ? '#ecfdf5' : '#fef2f2',
            border: `1.5px solid ${config.cacheEnabled ? '#86efac' : '#fca5a5'}`,
            boxShadow: '0 4px 16px rgba(0,0,0,0.07)',
          }}
        >
          <motion.div
            className="w-2 h-2 rounded-full"
            style={{ background: config.cacheEnabled ? '#10b981' : '#ef4444' }}
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
          <span
            className="text-code"
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: config.cacheEnabled ? '#065f46' : '#dc2626',
              letterSpacing: '0.5px',
            }}
          >
            {config.cacheEnabled ? 'CACHE ENABLED — serving from memory' : 'NO CACHE — all requests hit database'}
          </span>
        </motion.div>
      </AnimatePresence>

      {/* Hit/Miss legend */}
      {running && (
        <div className="absolute top-4 right-4 flex flex-col gap-1.5 z-10">
          {[
            { dot: '#10b981', label: 'Cache Hit' },
            { dot: '#f59e0b', label: 'Cache Miss' },
            { dot: '#ef4444', label: 'DB Direct' },
            { dot: '#3b82f6', label: 'In Flight' },
          ].map(({ dot, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: dot }} />
              <span className="text-[10px] text-slate-400 text-code">{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
