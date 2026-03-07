/**
 * useChaosEngine
 *
 * Simulates a system WITHOUT a message queue ("Chaos Mode" / "Before Queue").
 * Orders go directly to workers. If all workers are busy → order is DROPPED immediately.
 *
 * Uses the same MQConfig type as useMessageQueueEngine so Config controls are shared.
 *
 * Topology
 * ────────
 *   Website Server
 *     │  (order arrives)
 *     ├─── idle worker found? ──▶  Worker processes for processingDelay ms
 *     └─── all workers busy?  ──▶  ORDER DROPPED ❌
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type {
  MQConfig,
  MQLogEntry,
  MQLogType,
  ChaosEngineState,
  ChaosStats,
  ChaosWorkerState,
} from './types';

// ─── Constants ────────────────────────────────────────────────────────────────

const TICK_MS         = 100;
const THROUGHPUT_WIN  = 5000;  // ms rolling window for throughput
const LOG_BUFFER      = 80;
const PROC_TIME_WIN   = 100;   // rolling window for avg processing time

// ─── Internal worker ref (mutable, never triggers re-render directly) ─────────

interface ChaosWorkerRef {
  id: string;
  status: 'idle' | 'processing';
  orderId: string | null;
  jobStartedAt: number;
  jobDuration: number;
  willFail: boolean;
  processedCount: number;
  failedCount: number;
  processingTimes: number[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeTimestamp(): string {
  const n = new Date();
  return `${String(n.getMinutes()).padStart(2, '0')}:${String(n.getSeconds()).padStart(2, '0')}.${String(n.getMilliseconds()).slice(0, 2).padStart(2, '0')}`;
}

let _logSeq   = 0;
let _orderSeq = 0;
function nextLogId()   { return ++_logSeq; }
function nextOrderId() { return `order-${++_orderSeq}`; }
function resetSeqs()   { _logSeq = 0; _orderSeq = 0; }

function rollingAvg(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// ─── Initial state ────────────────────────────────────────────────────────────

const INITIAL_STATE: ChaosEngineState = {
  workers: [],
  stats: { total: 0, completed: 0, dropped: 0, failed: 0, utilization: 0, throughput: 0, avgProcessingTime: 0 },
  logs: [],
  dropFlash: 0,
  inFlightCount: 0,
  spikeActive: false,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useChaosEngine(initialConfig: MQConfig) {
  const [config, setConfig] = useState<MQConfig>(initialConfig);
  const [engineState, setEngineState] = useState<ChaosEngineState>(INITIAL_STATE);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);

  const configRef  = useRef<MQConfig>(config);
  const pausedRef  = useRef(false);
  const runningRef = useRef(false);

  useEffect(() => { configRef.current = config; }, [config]);

  // Rebuild idle workers on workerCount change while not running (so diagram shows them)
  useEffect(() => {
    if (runningRef.current) return;
    workersRef.current = buildWorkers(config.workerCount);
    flush();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.workerCount]);

  // ── All mutable simulation state ──────────────────────────────────────────
  const workersRef            = useRef<ChaosWorkerRef[]>([]);
  const logsRef               = useRef<MQLogEntry[]>([]);
  const produceAccRef         = useRef(0);
  const lastTickRef           = useRef(0);
  const totalOrdersRef        = useRef(0);
  const totalCompletedRef     = useRef(0);
  const totalDroppedRef       = useRef(0);
  const totalFailedRef        = useRef(0);
  const dropFlashRef          = useRef(0);
  const completedTimestamps   = useRef<number[]>([]);
  const procTimesRef          = useRef<number[]>([]);
  const spikeUntilRef         = useRef(0);
  const tickRef               = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Logging ───────────────────────────────────────────────────────────────
  function log(msg: string, type: MQLogType) {
    const entry: MQLogEntry = { id: nextLogId(), ts: makeTimestamp(), msg, type };
    logsRef.current = [...logsRef.current, entry].slice(-LOG_BUFFER);
  }

  // ── Build workers ─────────────────────────────────────────────────────────
  function buildWorkers(count: number): ChaosWorkerRef[] {
    return Array.from({ length: count }, (_, i) => ({
      id: `Worker${i + 1}`,
      status: 'idle',
      orderId: null,
      jobStartedAt: 0,
      jobDuration: 0,
      willFail: false,
      processedCount: 0,
      failedCount: 0,
      processingTimes: [],
    }));
  }

  // ── Snapshot workers → ChaosWorkerState[] ────────────────────────────────
  function snapshotWorkers(): ChaosWorkerState[] {
    return workersRef.current.map((w) => ({
      id: w.id,
      status: w.status,
      orderId: w.orderId ?? undefined,
      processedCount: w.processedCount,
      failedCount: w.failedCount,
    }));
  }

  // ── Flush mutable state → React state ─────────────────────────────────────
  function flush() {
    const now    = Date.now();
    const cutoff = now - THROUGHPUT_WIN;
    const recent = completedTimestamps.current.filter((t) => t >= cutoff);
    completedTimestamps.current = recent;
    const throughput = recent.length / (THROUGHPUT_WIN / 1000);

    const ws    = workersRef.current;
    const busy  = ws.filter((w) => w.status === 'processing').length;
    const utilization = ws.length > 0 ? Math.round((busy / ws.length) * 100) : 0;

    const stats: ChaosStats = {
      total:              totalOrdersRef.current,
      completed:          totalCompletedRef.current,
      dropped:            totalDroppedRef.current,
      failed:             totalFailedRef.current,
      utilization,
      throughput:         Math.round(throughput * 10) / 10,
      avgProcessingTime:  Math.round(rollingAvg(procTimesRef.current)),
    };

    setEngineState({
      workers:        snapshotWorkers(),
      stats,
      logs:           [...logsRef.current],
      dropFlash:      dropFlashRef.current,
      inFlightCount:  busy,
      spikeActive:    Date.now() < spikeUntilRef.current,
    });
  }

  // ── Simulation tick ───────────────────────────────────────────────────────
  function tick() {
    if (pausedRef.current) return;

    const now = Date.now();
    const cfg = configRef.current;
    const dt  = lastTickRef.current ? now - lastTickRef.current : TICK_MS;
    lastTickRef.current = now;

    // Phase 1 – Complete in-flight orders
    for (const worker of workersRef.current) {
      if (worker.status === 'processing' && now >= worker.jobStartedAt + worker.jobDuration) {
        const elapsed = now - worker.jobStartedAt;
        if (worker.willFail) {
          totalFailedRef.current++;
          worker.failedCount++;
          log(`❌ ${worker.id} failed order ${worker.orderId}`, 'error');
        } else {
          totalCompletedRef.current++;
          completedTimestamps.current.push(now);
          procTimesRef.current = [...procTimesRef.current, elapsed].slice(-PROC_TIME_WIN);
          worker.processedCount++;
          log(`✅ ${worker.id} completed order ${worker.orderId}`, 'complete');
        }
        worker.status    = 'idle';
        worker.orderId   = null;
        worker.jobStartedAt = 0;
      }
    }

    // Phase 2 – Produce new orders
    const spiking       = now < spikeUntilRef.current;
    const effectiveRate = spiking ? cfg.producerRate * 5 : cfg.producerRate;
    produceAccRef.current += effectiveRate * (dt / 1000);
    const toEnqueue = Math.floor(produceAccRef.current);
    produceAccRef.current -= toEnqueue;

    for (let i = 0; i < toEnqueue; i++) {
      const orderId = nextOrderId();
      totalOrdersRef.current++;

      const idleWorker = workersRef.current.find((w) => w.status === 'idle');
      if (idleWorker) {
        const jitter  = Math.random() * cfg.processingDelay * 0.3;
        const willFail = Math.random() < cfg.failureRate / 100;
        idleWorker.status      = 'processing';
        idleWorker.orderId     = orderId;
        idleWorker.jobStartedAt = now;
        idleWorker.jobDuration  = cfg.processingDelay + jitter;
        idleWorker.willFail     = willFail;
        log(`📨 ${orderId} → ${idleWorker.id}`, 'dispatch');
      } else {
        // All workers busy – drop immediately
        totalDroppedRef.current++;
        dropFlashRef.current++;
        log(`🚫 ${orderId} DROPPED – all workers busy`, 'error');
      }
    }

    flush();
  }

  // ── Public API ────────────────────────────────────────────────────────────

  const start = useCallback(() => {
    if (runningRef.current) return;
    resetSeqs();
    const cfg = configRef.current;

    workersRef.current          = buildWorkers(cfg.workerCount);
    logsRef.current             = [];
    produceAccRef.current       = 0;
    totalOrdersRef.current      = 0;
    totalCompletedRef.current   = 0;
    totalDroppedRef.current     = 0;
    totalFailedRef.current      = 0;
    dropFlashRef.current        = 0;
    completedTimestamps.current = [];
    procTimesRef.current        = [];
    spikeUntilRef.current       = 0;

    runningRef.current = true;
    pausedRef.current  = false;
    lastTickRef.current = Date.now();
    setRunning(true);
    setPaused(false);

    log('[START] Direct processing – no message queue', 'info');
    flush();
    tickRef.current = setInterval(tick, TICK_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pause = useCallback(() => {
    if (!runningRef.current) return;
    const nowPaused = !pausedRef.current;
    pausedRef.current = nowPaused;
    setPaused(nowPaused);
  }, []);

  const reset = useCallback(() => {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    runningRef.current = false;
    pausedRef.current  = false;
    setRunning(false);
    setPaused(false);

    workersRef.current          = buildWorkers(configRef.current.workerCount);
    logsRef.current             = [];
    produceAccRef.current       = 0;
    totalOrdersRef.current      = 0;
    totalCompletedRef.current   = 0;
    totalDroppedRef.current     = 0;
    totalFailedRef.current      = 0;
    dropFlashRef.current        = 0;
    completedTimestamps.current = [];
    procTimesRef.current        = [];
    spikeUntilRef.current       = 0;
    resetSeqs();
    flush();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Trigger a 3-second traffic spike (5× customer rate) */
  const spike = useCallback(() => {
    spikeUntilRef.current = Date.now() + 3000;
    log('⚡ TRAFFIC SPIKE – 5× customer rate for 3 seconds!', 'info');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, []);

  return { engineState, config, setConfig, running, paused, start, pause, reset, spike };
}
