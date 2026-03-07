/**
 * useCachingEngine
 *
 * Continuous simulation engine for the story-driven Caching simulator.
 * Models a product page served by a server that optionally reads from a in-memory
 * cache before falling through to the (slower) database.
 *
 * Architecture:
 *   Customer (browser) → Server → Cache (fast) / DB (slow)
 *
 * All heavy mutable state lives in refs so the tick loop never reads stale closures.
 * React state is only updated once per tick for render efficiency.
 */

import { useState, useRef, useCallback, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type EvictionPolicy = 'lru' | 'fifo';
export type ReadStrategy = 'cache-aside' | 'read-through' | 'refresh-ahead';
export type WriteStrategy = 'write-through' | 'write-back' | 'write-around';

export interface CachingConfig {
  requestsPerSecond: number;   // 1-20
  dbResponseMs: number;        // 100-1000
  cacheResponseMs: number;     // 5-50
  cacheSize: number;           // 1-20 slots
  ttlSeconds: number;          // 1-30
  cacheEnabled: boolean;
  evictionPolicy: EvictionPolicy;
  readStrategy: ReadStrategy;
  writeStrategy: WriteStrategy;
  simulationSpeed: number;     // 0.5 | 1 | 2 | 4
}

export interface CacheSlot {
  key: string;        // e.g. "product-42"
  storedAt: number;   // simulation ms timestamp
  accessOrder: number; // for LRU tracking — higher = more recently used
}

export type RequestStatus = 'pending' | 'hit' | 'miss' | 'no-cache' | 'async';

export interface ActiveRequest {
  id: string;
  key: string;
  status: RequestStatus;
  startedAt: number;   // sim time ms
  resolvedAt?: number; // sim time ms
  phase: 'server' | 'cache' | 'db' | 'cache-db' | 'db-cache' | 'done';
  isAsync?: boolean;   // true for background write-back / refresh-ahead particles
}

export interface CachingLogEntry {
  id: number;
  ts: string;
  msg: string;
  type: 'info' | 'hit' | 'miss' | 'store' | 'evict' | 'expire' | 'spike' | 'nocache';
}

export interface CachingEngineState {
  running: boolean;
  simTimeMs: number;
  config: CachingConfig;

  // cache contents
  cacheSlots: CacheSlot[];

  // request streams  
  activeRequests: ActiveRequest[];
  completedCount: number;

  // metrics
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  dbQueries: number;
  dbLoad: number;           // 0-100 rolling percentage
  avgLatencyMs: number;
  requestsPerSecond: number; // measured
  cacheHitRate: number;      // 0-100
  dbQueueLength: number;

  logs: CachingLogEntry[];
}

export const DEFAULT_CONFIG: CachingConfig = {
  requestsPerSecond: 5,
  dbResponseMs: 300,
  cacheResponseMs: 10,
  cacheSize: 8,
  ttlSeconds: 10,
  cacheEnabled: true,
  evictionPolicy: 'lru',
  readStrategy: 'cache-aside',
  writeStrategy: 'write-through',
  simulationSpeed: 1,
};

// ─── Constants ────────────────────────────────────────────────────────────────

const TICK_MS = 100;
const LOG_LIMIT = 100;
const LATENCY_WINDOW = 50;
const DB_LOAD_WINDOW_MS = 3000;

// Product keys — simulating a store with a few popular items
const PRODUCT_KEYS = [
  'product-viral-sneakers',
  'product-gaming-chair',
  'product-wireless-earbuds',
  'product-mechanical-keyboard',
  'product-standing-desk',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _logSeq = 0;
let _reqSeq = 0;

function ts(simMs: number): string {
  const totalSec = Math.floor(simMs / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  const ms = simMs % 1000;
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(ms).slice(0, 2).padStart(2, '0')}`;
}

function nextLogId() { return ++_logSeq; }
function nextReqId() { return `req-${++_reqSeq}`; }

function pushLog(
  logs: CachingLogEntry[],
  msg: string,
  type: CachingLogEntry['type'],
  simMs: number,
): CachingLogEntry[] {
  const entry: CachingLogEntry = { id: nextLogId(), ts: ts(simMs), msg, type };
  const next = [...logs, entry];
  return next.length > LOG_LIMIT ? next.slice(next.length - LOG_LIMIT) : next;
}

function productLabel(key: string): string {
  return key.replace('product-', '').replace(/-/g, ' ');
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCachingEngine() {
  // ── Refs (mutable sim state) ──
  const runningRef = useRef(false);
  const configRef = useRef<CachingConfig>({ ...DEFAULT_CONFIG });
  const simTimeMsRef = useRef(0);
  const tickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastRequestTickRef = useRef(0);     // real time of last request spawn
  const spikeUntilRef = useRef(0);          // sim time ms until spike ends

  // cache internals
  const cacheSlotsRef = useRef<CacheSlot[]>([]);
  const accessCounterRef = useRef(0);       // monotonic counter for LRU order

  // stats
  const totalRequestsRef = useRef(0);
  const cacheHitsRef = useRef(0);
  const cacheMissesRef = useRef(0);
  const dbQueriesRef = useRef(0);
  const latenciesRef = useRef<number[]>([]);  // rolling window
  const dbQueryTimestampsRef = useRef<number[]>([]); // for db load calc
  const activeRequestsRef = useRef<ActiveRequest[]>([]);
  const completedCountRef = useRef(0);
  const dbQueueRef = useRef(0);

  // React state (rendered)
  const [state, setState] = useState<CachingEngineState>({
    running: false,
    simTimeMs: 0,
    config: { ...DEFAULT_CONFIG },
    cacheSlots: [],
    activeRequests: [],
    completedCount: 0,
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    dbQueries: 0,
    dbLoad: 0,
    avgLatencyMs: 0,
    requestsPerSecond: 0,
    cacheHitRate: 0,
    dbQueueLength: 0,
    logs: [],
  });

  const logsRef = useRef<CachingLogEntry[]>([]);

  // ── Cache helpers ──

  function cacheGet(key: string): { slot: CacheSlot | null; refreshed: boolean } {
    const cfg = configRef.current;
    const slot = cacheSlotsRef.current.find(s => s.key === key);
    if (!slot) return { slot: null, refreshed: false };
    // check TTL
    const ageMs = simTimeMsRef.current - slot.storedAt;
    if (ageMs > cfg.ttlSeconds * 1000) {
      // expired — evict
      cacheSlotsRef.current = cacheSlotsRef.current.filter(s => s.key !== key);
      logsRef.current = pushLog(logsRef.current, `TTL expired — evicted "${productLabel(key)}" from cache`, 'expire', simTimeMsRef.current);
      return { slot: null, refreshed: false };
    }
    // refresh-ahead: if past 75% TTL, extend TTL proactively and signal refresh
    let refreshed = false;
    if (cfg.readStrategy === 'refresh-ahead' && ageMs > cfg.ttlSeconds * 1000 * 0.75) {
      slot.storedAt = simTimeMsRef.current;
      refreshed = true;
      logsRef.current = pushLog(
        logsRef.current,
        `Refresh-ahead — "${productLabel(key)}" TTL extended proactively`,
        'store',
        simTimeMsRef.current,
      );
    }
    // update access order for LRU
    slot.accessOrder = accessCounterRef.current++;
    return { slot, refreshed };
  }

  function cacheSet(key: string) {
    const cfg = configRef.current;
    // already cached? just refresh
    const existing = cacheSlotsRef.current.find(s => s.key === key);
    if (existing) {
      existing.storedAt = simTimeMsRef.current;
      existing.accessOrder = accessCounterRef.current++;
      return;
    }
    // evict if full
    if (cacheSlotsRef.current.length >= cfg.cacheSize) {
      let evicted: CacheSlot;
      if (cfg.evictionPolicy === 'lru') {
        // remove least recently used (lowest accessOrder)
        cacheSlotsRef.current.sort((a, b) => a.accessOrder - b.accessOrder);
        evicted = cacheSlotsRef.current.shift()!;
      } else {
        // fifo — remove oldest stored
        cacheSlotsRef.current.sort((a, b) => a.storedAt - b.storedAt);
        evicted = cacheSlotsRef.current.shift()!;
      }
      logsRef.current = pushLog(
        logsRef.current,
        `Cache full (${cfg.evictionPolicy.toUpperCase()}) → evicted "${productLabel(evicted.key)}"`,
        'evict',
        simTimeMsRef.current,
      );
    }
    cacheSlotsRef.current.push({
      key,
      storedAt: simTimeMsRef.current,
      accessOrder: accessCounterRef.current++,
    });
  }

  // ── Tick ──

  const tick = useCallback(() => {
    if (!runningRef.current) return;
    const cfg = configRef.current;
    simTimeMsRef.current += TICK_MS * configRef.current.simulationSpeed;
    const now = simTimeMsRef.current;

    // Determine effective RPS (spike triples it)
    const isSpike = now <= spikeUntilRef.current;
    const effectiveRps = isSpike ? Math.min(cfg.requestsPerSecond * 3, 20) : cfg.requestsPerSecond;

    // Spawn new requests at the configured rate
    const msPerRequest = 1000 / effectiveRps;
    const elapsed = now - lastRequestTickRef.current;
    const toSpawn = Math.floor(elapsed / msPerRequest);
    if (toSpawn > 0) {
      lastRequestTickRef.current = now;
      for (let i = 0; i < toSpawn; i++) {
        // Pick a product — viral = mostly the same product
        const key = isSpike
          ? PRODUCT_KEYS[0]
          : PRODUCT_KEYS[Math.floor(Math.random() * PRODUCT_KEYS.length)];

        const req: ActiveRequest = {
          id: nextReqId(),
          key,
          status: 'pending',
          startedAt: now,
          phase: 'server',
        };
        activeRequestsRef.current.push(req);
        totalRequestsRef.current++;
      }
    }

    // Resolve requests based on phase progression
    const toRemove: string[] = [];
    const asyncSpawns: ActiveRequest[] = [];
    for (const req of activeRequestsRef.current) {
      if (req.phase === 'server' && now - req.startedAt >= TICK_MS) {
        req.phase = cfg.cacheEnabled ? 'cache' : 'db';
      } else if (req.phase === 'cache') {
        const { slot, refreshed } = cacheGet(req.key);
        if (slot) {
          // Cache hit — resolve after cache response time
          if (now - req.startedAt >= cfg.cacheResponseMs) {
            req.status = 'hit';
            req.phase = 'done';
            req.resolvedAt = now;
            cacheHitsRef.current++;
            const latency = now - req.startedAt;
            latenciesRef.current.push(latency);
            if (latenciesRef.current.length > LATENCY_WINDOW) latenciesRef.current.shift();
            logsRef.current = pushLog(
              logsRef.current,
              `Cache HIT — "${productLabel(req.key)}" served in ${latency}ms`,
              'hit',
              now,
            );
            toRemove.push(req.id);
            completedCountRef.current++;
            // refresh-ahead: spawn async cache→db→cache background particle
            if (refreshed) {
              asyncSpawns.push({
                id: nextReqId(),
                key: req.key,
                status: 'async',
                startedAt: now,
                phase: 'cache-db',
                isAsync: true,
              });
            }
          }
        } else {
          // Cache miss — go to DB
          req.status = 'miss';
          req.phase = 'db';
          dbQueriesRef.current++;
          dbQueueRef.current++;
          dbQueryTimestampsRef.current.push(now);
          const readLabel = cfg.readStrategy === 'read-through'
            ? `Cache MISS — cache layer fetching "${productLabel(req.key)}" from DB`
            : `Cache MISS — "${productLabel(req.key)}" not in cache, querying DB`;
          logsRef.current = pushLog(logsRef.current, readLabel, 'miss', now);
        }
      } else if (req.phase === 'db') {
        // Resolve after db response time
        const dbWait = cfg.dbResponseMs * (1 + dbQueueRef.current * 0.05); // queue back-pressure
        if (now - req.startedAt >= dbWait) {
          req.status = req.status === 'pending' ? 'no-cache' : req.status;
          if (!cfg.cacheEnabled) req.status = 'no-cache';
          req.phase = 'done';
          req.resolvedAt = now;
          const latency = now - req.startedAt;
          latenciesRef.current.push(latency);
          if (latenciesRef.current.length > LATENCY_WINDOW) latenciesRef.current.shift();
          cacheMissesRef.current++;
          if (dbQueueRef.current > 0) dbQueueRef.current--;

          if (cfg.cacheEnabled) {
            if (cfg.writeStrategy === 'write-around') {
              // write-around: reads do NOT populate cache
              logsRef.current = pushLog(
                logsRef.current,
                `DB responded — "${productLabel(req.key)}" (${latency}ms) — write-around, cache not updated`,
                'nocache',
                now,
              );
            } else {
              cacheSet(req.key);
              const storeLabel = cfg.writeStrategy === 'write-back'
                ? `DB responded — "${productLabel(req.key)}" cached (${latency}ms), DB sync queued`
                : `DB responded — "${productLabel(req.key)}" cached for next requests (${latency}ms)`;
              logsRef.current = pushLog(logsRef.current, storeLabel, 'store', now);
              // write-back: spawn async cache→db background flush particle
              if (cfg.writeStrategy === 'write-back' && Math.random() < 0.3) {
                dbQueriesRef.current++;
                dbQueryTimestampsRef.current.push(now);
                asyncSpawns.push({
                  id: nextReqId(),
                  key: req.key,
                  status: 'async',
                  startedAt: now,
                  phase: 'cache-db',
                  isAsync: true,
                });
              }
            }
          } else {
            logsRef.current = pushLog(
              logsRef.current,
              `DB responded — "${productLabel(req.key)}" (${latency}ms) — no cache`,
              'nocache',
              now,
            );
          }
          toRemove.push(req.id);
          completedCountRef.current++;
        }
      } else if (req.phase === 'cache-db') {
        // Async particle: cache → db leg
        if (now - req.startedAt >= cfg.dbResponseMs * 0.6) {
          if (cfg.readStrategy === 'refresh-ahead') {
            // refresh-ahead: continue to db→cache return leg
            req.phase = 'db-cache';
            req.startedAt = now;
          } else {
            // write-back: done after hitting db
            toRemove.push(req.id);
          }
        }
      } else if (req.phase === 'db-cache') {
        // Async particle: db → cache return leg (refresh-ahead only)
        if (now - req.startedAt >= cfg.dbResponseMs * 0.6) {
          toRemove.push(req.id);
        }
      }
    }
    // Add any async particles spawned this tick
    for (const r of asyncSpawns) activeRequestsRef.current.push(r);

    // Clean completed requests (keep last 20 for visual)
    activeRequestsRef.current = activeRequestsRef.current.filter(r => !toRemove.includes(r.id));

    // Trim old DB timestamps for rolling load
    const cutoff = now - DB_LOAD_WINDOW_MS;
    dbQueryTimestampsRef.current = dbQueryTimestampsRef.current.filter(t => t >= cutoff);

    // Compute derived metrics
    const totalDone = cacheHitsRef.current + cacheMissesRef.current;
    const hitRate = totalDone > 0 ? (cacheHitsRef.current / totalDone) * 100 : 0;
    const avgLat = latenciesRef.current.length > 0
      ? latenciesRef.current.reduce((a, b) => a + b, 0) / latenciesRef.current.length
      : 0;
    const dbLoad = Math.min(100, (dbQueryTimestampsRef.current.length / (DB_LOAD_WINDOW_MS / 1000)) / Math.max(1, effectiveRps) * 100);

    setState({
      running: true,
      simTimeMs: now,
      config: { ...cfg },
      cacheSlots: [...cacheSlotsRef.current],
      activeRequests: [...activeRequestsRef.current].slice(-30),
      completedCount: completedCountRef.current,
      totalRequests: totalRequestsRef.current,
      cacheHits: cacheHitsRef.current,
      cacheMisses: cacheMissesRef.current,
      dbQueries: dbQueriesRef.current,
      dbLoad: Math.round(dbLoad),
      avgLatencyMs: Math.round(avgLat),
      requestsPerSecond: effectiveRps,
      cacheHitRate: Math.round(hitRate * 10) / 10,
      dbQueueLength: dbQueueRef.current,
      logs: [...logsRef.current],
    });
  }, []);

  // ── Controls ──

  const start = useCallback(() => {
    if (runningRef.current) return;
    runningRef.current = true;
    lastRequestTickRef.current = simTimeMsRef.current;
    tickTimerRef.current = setInterval(tick, TICK_MS);
    setState(prev => ({ ...prev, running: true }));
  }, [tick]);

  const pause = useCallback(() => {
    runningRef.current = false;
    if (tickTimerRef.current) clearInterval(tickTimerRef.current);
    setState(prev => ({ ...prev, running: false }));
  }, []);

  const reset = useCallback(() => {
    runningRef.current = false;
    if (tickTimerRef.current) clearInterval(tickTimerRef.current);
    simTimeMsRef.current = 0;
    lastRequestTickRef.current = 0;
    spikeUntilRef.current = 0;
    cacheSlotsRef.current = [];
    activeRequestsRef.current = [];
    completedCountRef.current = 0;
    totalRequestsRef.current = 0;
    cacheHitsRef.current = 0;
    cacheMissesRef.current = 0;
    dbQueriesRef.current = 0;
    latenciesRef.current = [];
    dbQueryTimestampsRef.current = [];
    dbQueueRef.current = 0;
    logsRef.current = [];
    _logSeq = 0;
    _reqSeq = 0;

    setState({
      running: false,
      simTimeMs: 0,
      config: { ...configRef.current },
      cacheSlots: [],
      activeRequests: [],
      completedCount: 0,
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      dbQueries: 0,
      dbLoad: 0,
      avgLatencyMs: 0,
      requestsPerSecond: configRef.current.requestsPerSecond,
      cacheHitRate: 0,
      dbQueueLength: 0,
      logs: [],
    });
  }, []);

  const triggerSpike = useCallback(() => {
    spikeUntilRef.current = simTimeMsRef.current + 5000; // 5 second spike
    logsRef.current = pushLog(
      logsRef.current,
      'TRAFFIC SPIKE — product went viral! 3x normal traffic for 5s',
      'spike',
      simTimeMsRef.current,
    );
  }, []);

  const clearCache = useCallback(() => {
    cacheSlotsRef.current = [];
    logsRef.current = pushLog(
      logsRef.current,
      'Cache cleared — all entries removed',
      'info',
      simTimeMsRef.current,
    );
    setState(prev => ({ ...prev, cacheSlots: [], logs: [...logsRef.current] }));
  }, []);

  const updateConfig = useCallback((patch: Partial<CachingConfig>) => {
    configRef.current = { ...configRef.current, ...patch };
    // If cache size shrank, trim cache
    if (patch.cacheSize !== undefined) {
      while (cacheSlotsRef.current.length > patch.cacheSize) {
        cacheSlotsRef.current.shift();
      }
    }
    setState(prev => ({
      ...prev,
      config: { ...configRef.current },
      cacheSlots: [...cacheSlotsRef.current],
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (tickTimerRef.current) clearInterval(tickTimerRef.current);
    };
  }, []);

  return { state, start, pause, reset, triggerSpike, clearCache, updateConfig };
}
