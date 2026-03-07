/**
 * useMessageQueueEngine
 *
 * Self-contained simulation engine for the Message Queue simulator.
 * All mutable simulation state lives in refs so the tick loop never reads
 * stale closure values.  React state is derived from refs at the end of each
 * tick so the UI re-renders cleanly without intermediate flicker.
 *
 * Queue topology
 * ──────────────
 *   Producer
 *     │  enqueue  (backpressure guard)
 *     ▼
 *   delayedQueue  ──(visibleAt <= now)──▶  mainQueue  ──(dispatch)──▶  inFlightQueue
 *                                                                            │
 *                                          ◀──(visibility timeout)──────────┤
 *                                                                            │
 *                                          deadLetterQueue  ◀───────────────┘ (final fail)
 *                                          completedMessages ◀───────────────┘ (success ACK)
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type {
  MQConfig,
  MQEngineState,
  MQLogEntry,
  MQLogType,
  MQSimStats,
  Message,
  SimulationPreset,
  WorkerState,
} from './types';

// ─── Constants ────────────────────────────────────────────────────────────────

const TICK_MS = 100;          // simulation tick interval
const THROUGHPUT_WINDOW = 5000; // ms for rolling throughput window
const LOG_BUFFER = 80;         // max retained log entries
const LATENCY_WINDOW = 100;    // rolling window for avg latency / proc-time

// ─── Internal worker ref (mutable, not React state) ──────────────────────────

interface WorkerRef {
  id: string;
  status: 'idle' | 'processing' | 'crashed';
  currentMessage: Message | null;
  jobStartedAt: number;
  jobDuration: number;
  willCrash: boolean;
  willFail: boolean;
  // cumulative metrics
  processedCount: number;
  failedCount: number;
  crashCount: number;
  processingTimes: number[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeTimestamp(): string {
  const n = new Date();
  return `${String(n.getMinutes()).padStart(2, '0')}:${String(n.getSeconds()).padStart(2, '0')}.${String(n.getMilliseconds()).slice(0, 2).padStart(2, '0')}`;
}

let _logSeq = 0;
let _msgSeq = 0;

function nextLogId() { return ++_logSeq; }
function nextMsgId() { return `msg-${++_msgSeq}`; }
function resetSeqs() { _logSeq = 0; _msgSeq = 0; }

function randomPriority(): 1 | 2 | 3 {
  return (Math.floor(Math.random() * 3) + 1) as 1 | 2 | 3;
}

function rollingAvg(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function pushBounded<T>(arr: T[], item: T, limit: number) {
  arr.push(item);
  if (arr.length > limit) arr.shift();
}

// ─── Preset configs ───────────────────────────────────────────────────────────

const PRESETS: Record<SimulationPreset, Partial<MQConfig>> = {
  'high-traffic': {
    producerRate: 20,
    workerCount: 1,
    processingDelay: 600,
    failureRate: 10,
    workerCrashRate: 0,
    queueCapacity: 30,
    retryEnabled: true,
    maxRetries: 2,
  },
  stable: {
    producerRate: 3,
    workerCount: 3,
    processingDelay: 500,
    failureRate: 5,
    workerCrashRate: 0,
    queueCapacity: 50,
    retryEnabled: true,
    maxRetries: 2,
  },
  'failure-storm': {
    producerRate: 8,
    workerCount: 2,
    processingDelay: 400,
    failureRate: 60,
    workerCrashRate: 5,
    queueCapacity: 50,
    retryEnabled: true,
    maxRetries: 3,
  },
  'crash-demo': {
    producerRate: 5,
    workerCount: 2,
    processingDelay: 700,
    failureRate: 10,
    workerCrashRate: 40,
    queueCapacity: 50,
    retryEnabled: true,
    maxRetries: 2,
    visibilityTimeout: 2000,
  },
};

// ─── Default config ───────────────────────────────────────────────────────────

export const DEFAULT_MQ_CONFIG: MQConfig = {
  strategy: 'fifo',
  producerRate: 3,
  workerCount: 2,
  processingDelay: 600,
  failureRate: 10,
  retryEnabled: true,
  maxRetries: 2,
  visibilityTimeout: 2000,
  queueCapacity: 30,
  workerCrashRate: 0,
  delayMs: 1500,
};

// ─── Empty stats factory ──────────────────────────────────────────────────────

function emptyStats(): MQSimStats {
  return {
    total: 0,
    completed: 0,
    failed: 0,
    avgLatency: 0,
    avgProcessingTime: 0,
    throughput: 0,
    mainQueueLength: 0,
    inFlightCount: 0,
    delayedCount: 0,
    deadLetterCount: 0,
    retries: 0,
    rejectedByBackpressure: 0,
  };
}

function emptyEngineState(): MQEngineState {
  return {
    mainQueue: [],
    inFlightQueue: [],
    delayedQueue: [],
    deadLetterQueue: [],
    workers: [],
    stats: emptyStats(),
    logs: [],
    queueAtCapacity: false,
    redeliveryFlash: 0,
  };
}

// ─── Initialise workers ──────────────────────────────────────────────────────
function buildWorkers(count: number): WorkerRef[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `Worker${i + 1}`,
    status: 'idle',
    currentMessage: null,
    jobStartedAt: 0,
    jobDuration: 0,
    willCrash: false,
    willFail: false,
    processedCount: 0,
    failedCount: 0,
    crashCount: 0,
    processingTimes: [],
  }));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMessageQueueEngine(initialConfig: MQConfig = DEFAULT_MQ_CONFIG) {
  const [config, setConfig] = useState<MQConfig>(initialConfig);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [engineState, setEngineState] = useState<MQEngineState>(emptyEngineState());

  // ── Ref mirrors for config/paused (avoid stale closures in tick) ──
  const configRef = useRef<MQConfig>(config);
  const pausedRef = useRef(false);
  const runningRef = useRef(false);
  useEffect(() => { configRef.current = config; }, [config]);

  // ── Rebuild idle workers when workerCount changes while not running ───────
  // Also runs on mount so the diagram always shows workers before start.
  useEffect(() => {
    if (runningRef.current) return;
    workersRef.current = buildWorkers(config.workerCount);
    flush();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.workerCount]);

  // ── All mutable simulation state lives here ──
  const mainQueue = useRef<Message[]>([]);
  const inFlightQueue = useRef<Message[]>([]);
  const delayedQueue = useRef<Message[]>([]);
  const deadLetterQueue = useRef<Message[]>([]);
  const workersRef = useRef<WorkerRef[]>([]);
  const logsRef = useRef<MQLogEntry[]>([]);

  // producer accumulator (fractional message debt)
  const produceAccRef = useRef(0);
  const lastTickRef = useRef(0);

  // stats accumulators
  const totalEnqueued = useRef(0);
  const totalCompleted = useRef(0);
  const totalFailed = useRef(0);
  const totalRetries = useRef(0);
  const totalDLQ = useRef(0);
  const totalRejected = useRef(0);
  const latencies = useRef<number[]>([]);
  const procTimes = useRef<number[]>([]);
  const completedTimestamps = useRef<number[]>([]); // for rolling throughput

  const redeliveryFlashRef = useRef(0);

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Logging ────────────────────────────────────────────────────────────────
  const log = (msg: string, type: MQLogType) => {
    const entry: MQLogEntry = { id: nextLogId(), ts: makeTimestamp(), msg, type };
    const newLogs = [...logsRef.current, entry].slice(-LOG_BUFFER);
    logsRef.current = newLogs;
  };

  // ── Build React-visible worker states from workerRefs ─────────────────────
  function snapshotWorkers(): WorkerState[] {
    return workersRef.current.map((w) => ({
      id: w.id,
      status: w.status,
      currentMessageId: w.currentMessage?.id,
      processedCount: w.processedCount,
      failedCount: w.failedCount,
      crashCount: w.crashCount,
      avgProcessingTime: Math.round(rollingAvg(w.processingTimes)),
    }));
  }

  // ── Flush ref state → React state ─────────────────────────────────────────
  function flush() {
    const now = Date.now();

    // rolling throughput: count completions in last 5s
    const cutoff = now - THROUGHPUT_WINDOW;
    const recentCompleted = completedTimestamps.current.filter((t) => t >= cutoff);
    completedTimestamps.current = recentCompleted;
    const throughput = recentCompleted.length / (THROUGHPUT_WINDOW / 1000);

    const stats: MQSimStats = {
      total: totalEnqueued.current,
      completed: totalCompleted.current,
      failed: totalFailed.current,
      avgLatency: Math.round(rollingAvg(latencies.current)),
      avgProcessingTime: Math.round(rollingAvg(procTimes.current)),
      throughput: Math.round(throughput * 10) / 10,
      mainQueueLength: mainQueue.current.length,
      inFlightCount: inFlightQueue.current.length,
      delayedCount: delayedQueue.current.length,
      deadLetterCount: totalDLQ.current,
      retries: totalRetries.current,
      rejectedByBackpressure: totalRejected.current,
    };

    const cfg = configRef.current;
    const totalBlocking = mainQueue.current.length + inFlightQueue.current.length;
    const queueAtCapacity = totalBlocking >= cfg.queueCapacity;

    setEngineState({
      mainQueue: [...mainQueue.current],
      inFlightQueue: [...inFlightQueue.current],
      delayedQueue: [...delayedQueue.current],
      deadLetterQueue: [...deadLetterQueue.current],
      workers: snapshotWorkers(),
      stats,
      logs: [...logsRef.current],
      queueAtCapacity,
      redeliveryFlash: redeliveryFlashRef.current,
    });
  }

  // ── Dispatch one message to a worker ─────────────────────────────────────
  function dispatch(worker: WorkerRef, msg: Message) {
    const cfg = configRef.current;
    const now = Date.now();

    // Remove from mainQueue
    mainQueue.current = mainQueue.current.filter((m) => m.id !== msg.id);

    // Mutate message into in-flight
    msg.state = 'in-flight';
    msg.workerId = worker.id;
    msg.inFlightSince = now;
    inFlightQueue.current.push(msg);

    // Assign worker job
    const jitter = Math.random() * cfg.processingDelay * 0.3;
    worker.status = 'processing';
    worker.currentMessage = msg;
    worker.jobStartedAt = now;
    worker.jobDuration = cfg.processingDelay + jitter;
    worker.willCrash = Math.random() * 100 < cfg.workerCrashRate;
    worker.willFail = !worker.willCrash && Math.random() * 100 < cfg.failureRate;

    msg.state = 'processing';
    msg.processingStartedAt = now;

    log(`[DISPATCH] ${worker.id} received ${msg.id} (priority=${msg.priority}, retry=${msg.retryCount})`, 'dispatch');
  }

  // ── ACK – message successfully processed ─────────────────────────────────
  function ackMessage(worker: WorkerRef) {
    const msg = worker.currentMessage!;
    const now = Date.now();

    msg.state = 'completed';
    msg.processingEndedAt = now;

    // Remove from inFlight
    inFlightQueue.current = inFlightQueue.current.filter((m) => m.id !== msg.id);

    const latencyMs = now - msg.createdAt;
    const procMs = now - (msg.processingStartedAt ?? now);

    pushBounded(latencies.current, latencyMs, LATENCY_WINDOW);
    pushBounded(procTimes.current, procMs, LATENCY_WINDOW);
    pushBounded(worker.processingTimes, procMs, 20);
    completedTimestamps.current.push(now);

    worker.processedCount++;
    totalCompleted.current++;

    log(`[ACK] ${worker.id} completed ${msg.id} – latency ${latencyMs}ms, proc ${Math.round(procMs)}ms`, 'complete');

    worker.status = 'idle';
    worker.currentMessage = null;
  }

  // ── NACK – worker failed processing ──────────────────────────────────────
  function nackMessage(worker: WorkerRef) {
    const cfg = configRef.current;
    const msg = worker.currentMessage!;
    const now = Date.now();

    // Remove from inFlight
    inFlightQueue.current = inFlightQueue.current.filter((m) => m.id !== msg.id);

    worker.failedCount++;

    if (cfg.retryEnabled && msg.retryCount < msg.maxRetries) {
      msg.retryCount++;
      msg.state = 'delayed';
      msg.visibleAt = now + cfg.visibilityTimeout;
      delayedQueue.current.push(msg);
      totalRetries.current++;
      log(
        `[RETRY] ${worker.id} failed ${msg.id} – retry ${msg.retryCount}/${msg.maxRetries}, visible in ${cfg.visibilityTimeout}ms`,
        'retry',
      );
    } else {
      msg.state = 'dead-letter';
      deadLetterQueue.current.push(msg);
      totalFailed.current++;
      totalDLQ.current++;
      log(`[DLQ] ${msg.id} exhausted retries – moved to Dead Letter Queue`, 'dlq');
    }

    worker.status = 'idle';
    worker.currentMessage = null;
  }

  // ── Worker crash ──────────────────────────────────────────────────────────
  function crashWorker(worker: WorkerRef) {
    const msg = worker.currentMessage!;
    worker.crashCount++;
    worker.status = 'idle';   // worker recovers immediately
    worker.currentMessage = null;

    // Message stays in inFlightQueue – visibility timeout will redeliver it
    // Reset inFlightSince so timeout starts from crash time
    msg.state = 'in-flight';
    msg.inFlightSince = Date.now();

    log(
      `[CRASH] ${worker.id} crashed processing ${msg.id} – will be redelivered after visibility timeout`,
      'crash',
    );
  }

  // ── Main tick ─────────────────────────────────────────────────────────────
  function tick() {
    if (pausedRef.current || !runningRef.current) return;
    const cfg = configRef.current;
    const now = Date.now();
    const dt = now - lastTickRef.current;
    lastTickRef.current = now;

    // ── 1. Producer phase ───────────────────────────────────────────────────
    produceAccRef.current += cfg.producerRate * (dt / 1000);
    const toEnqueue = Math.floor(produceAccRef.current);
    produceAccRef.current -= toEnqueue;

    for (let i = 0; i < toEnqueue; i++) {
      const totalBlocking = mainQueue.current.length + inFlightQueue.current.length;
      if (totalBlocking >= cfg.queueCapacity) {
        totalRejected.current++;
        log(`[BACKPRESSURE] Queue at capacity (${cfg.queueCapacity}) – message rejected`, 'backpressure');
        continue;
      }

      const id = nextMsgId();
      const msg: Message = {
        id,
        createdAt: now,
        state: cfg.strategy === 'delayed' ? 'delayed' : 'pending',
        retryCount: 0,
        maxRetries: cfg.maxRetries,
        priority: randomPriority(),
        visibleAt: cfg.strategy === 'delayed' ? now + cfg.delayMs : now,
        processingStartedAt: undefined,
        processingEndedAt: undefined,
        workerId: undefined,
        inFlightSince: undefined,
      };

      totalEnqueued.current++;

      if (cfg.strategy === 'delayed') {
        delayedQueue.current.push(msg);
        log(`[ENQUEUED] ${id} → delayedQueue (visible in ${cfg.delayMs}ms, priority=${msg.priority})`, 'produce');
      } else {
        mainQueue.current.push(msg);
        log(`[ENQUEUED] ${id} → mainQueue (priority=${msg.priority})`, 'produce');
      }
    }

    // ── 2. Delayed → Main (for delayed strategy initial delay AND retry backoff)
    const readyFromDelay: Message[] = [];
    const stillDelayed: Message[] = [];
    for (const m of delayedQueue.current) {
      if (m.visibleAt <= now) {
        m.state = 'pending';
        readyFromDelay.push(m);
        log(`[VISIBLE] ${m.id} now visible – moving to mainQueue`, 'queue');
      } else {
        stillDelayed.push(m);
      }
    }
    delayedQueue.current = stillDelayed;
    mainQueue.current.push(...readyFromDelay);

    // ── 3. Visibility timeout redeliver ────────────────────────────────────
    const toRedeliver: Message[] = [];
    const stillInFlight: Message[] = [];
    for (const m of inFlightQueue.current) {
      if (m.inFlightSince !== undefined && now - m.inFlightSince >= cfg.visibilityTimeout && m.state === 'in-flight') {
        // Worker holding this message may have already been reset (crash) or the
        // worker is still "logically processing" but timeout has expired.
        // Either way, return the message to mainQueue for redelivery.
        const holdingWorker = workersRef.current.find((w) => w.currentMessage?.id === m.id);
        if (holdingWorker) {
          holdingWorker.status = 'idle';
          holdingWorker.currentMessage = null;
        }
        m.state = 'pending';
        m.workerId = undefined;
        m.inFlightSince = undefined;
        toRedeliver.push(m);
        redeliveryFlashRef.current++;
        log(`[REDELIVER] ${m.id} redelivered after visibility timeout – back in mainQueue`, 'redeliver');
      } else {
        stillInFlight.push(m);
      }
    }
    inFlightQueue.current = stillInFlight;
    mainQueue.current.push(...toRedeliver);

    // ── 4. Sort mainQueue by strategy ──────────────────────────────────────
    if (cfg.strategy === 'priority') {
      mainQueue.current.sort((a, b) => b.priority - a.priority);
    }

    // ── 5. Worker completion check ─────────────────────────────────────────
    for (const worker of workersRef.current) {
      if (worker.status === 'processing' && worker.currentMessage !== null) {
        const elapsed = now - worker.jobStartedAt;
        if (elapsed >= worker.jobDuration) {
          if (worker.willCrash) {
            crashWorker(worker);
          } else if (worker.willFail) {
            nackMessage(worker);
          } else {
            ackMessage(worker);
          }
        }
      }
    }

    // ── 6. Dispatch to idle workers ───────────────────────────────────────
    for (const worker of workersRef.current) {
      if (worker.status === 'idle' && mainQueue.current.length > 0) {
        const msg = mainQueue.current[0]; // already sorted for priority
        dispatch(worker, msg);
      }
    }

    // ── 7. Flush to React state ────────────────────────────────────────────
    flush();
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  const start = useCallback(() => {
    if (runningRef.current) return;
    resetSeqs();
    const cfg = configRef.current;

    mainQueue.current = [];
    inFlightQueue.current = [];
    delayedQueue.current = [];
    deadLetterQueue.current = [];
    workersRef.current = buildWorkers(cfg.workerCount);
    logsRef.current = [];
    produceAccRef.current = 0;
    totalEnqueued.current = 0;
    totalCompleted.current = 0;
    totalFailed.current = 0;
    totalRetries.current = 0;
    totalDLQ.current = 0;
    totalRejected.current = 0;
    latencies.current = [];
    procTimes.current = [];
    completedTimestamps.current = [];
    redeliveryFlashRef.current = 0;
    lastTickRef.current = Date.now();

    runningRef.current = true;
    pausedRef.current = false;

    log(`[START] Simulation started – ${cfg.workerCount} workers, ${cfg.producerRate} msg/s, strategy=${cfg.strategy}`, 'info');
    log(`[CONFIG] capacity=${cfg.queueCapacity}, failureRate=${cfg.failureRate}%, crashRate=${cfg.workerCrashRate}%, retries=${cfg.maxRetries}`, 'info');
    flush();

    setRunning(true);
    setPaused(false);

    tickRef.current = setInterval(tick, TICK_MS);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pause = useCallback(() => {
    const next = !pausedRef.current;
    pausedRef.current = next;
    setPaused(next);
    log(next ? '[PAUSE] Simulation paused' : '[RESUME] Simulation resumed', 'info');
    flush();
  }, []);

  const reset = useCallback(() => {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    runningRef.current = false;
    pausedRef.current = false;

    mainQueue.current = [];
    inFlightQueue.current = [];
    delayedQueue.current = [];
    deadLetterQueue.current = [];
    workersRef.current = buildWorkers(configRef.current.workerCount);
    logsRef.current = [];
    totalEnqueued.current = 0;
    totalCompleted.current = 0;
    totalFailed.current = 0;
    totalRetries.current = 0;
    totalDLQ.current = 0;
    totalRejected.current = 0;
    latencies.current = [];
    procTimes.current = [];
    completedTimestamps.current = [];
    redeliveryFlashRef.current = 0;
    produceAccRef.current = 0;

    setRunning(false);
    setPaused(false);
    flush();
  }, []);

  const applyPreset = useCallback((preset: SimulationPreset) => {
    setConfig((prev) => ({ ...prev, ...PRESETS[preset] }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  return {
    engineState,
    config,
    setConfig,
    running,
    paused,
    start,
    pause,
    reset,
    applyPreset,
  };
}
