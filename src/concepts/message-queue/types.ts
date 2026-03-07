// ─── Node / State / Strategy ─────────────────────────────────────────────────

export type MQNodeId = 'producer' | 'queue' | 'worker';

/** Full message lifecycle state machine */
export type MessageState =
  | 'pending'      // waiting in mainQueue
  | 'in-flight'    // delivered to worker, awaiting ACK
  | 'processing'   // worker actively processing
  | 'completed'    // successfully ACKed
  | 'dead-letter'  // permanently failed
  | 'delayed';     // temporarily invisible (retry backoff or initial delay)

export type MQStrategy = 'fifo' | 'priority' | 'delayed';

export type MQLogType =
  | 'info'
  | 'produce'
  | 'queue'
  | 'dispatch'
  | 'process'
  | 'complete'
  | 'error'
  | 'retry'
  | 'dlq'
  | 'redeliver'
  | 'backpressure'
  | 'crash';

// ─── Message ──────────────────────────────────────────────────────────────────

export interface Message {
  id: string;
  createdAt: number;          // Date.now() when produced
  state: MessageState;
  retryCount: number;
  maxRetries: number;
  priority: 1 | 2 | 3;       // 1=low, 2=medium, 3=high
  visibleAt: number;          // timestamp after which message becomes dispatchable
  processingStartedAt?: number;
  processingEndedAt?: number;
  workerId?: string;
  inFlightSince?: number;     // for visibility-timeout tracking
}

// ─── Worker ───────────────────────────────────────────────────────────────────

export interface WorkerState {
  id: string;
  status: 'idle' | 'processing' | 'crashed';
  currentMessageId?: string;
  processedCount: number;
  failedCount: number;
  crashCount: number;
  avgProcessingTime: number;  // ms
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface MQSimStats {
  total: number;
  completed: number;
  failed: number;
  avgLatency: number;         // ms  createdAt → completedAt
  avgProcessingTime: number;  // ms  processingStart → processingEnd
  throughput: number;         // msg/s – rolling 5-second window
  mainQueueLength: number;
  inFlightCount: number;
  delayedCount: number;
  deadLetterCount: number;
  retries: number;
  rejectedByBackpressure: number;
}

// ─── Logs ─────────────────────────────────────────────────────────────────────

export interface MQLogEntry {
  id: number;
  ts: string;
  msg: string;
  type: MQLogType;
}

// ─── Config ───────────────────────────────────────────────────────────────────

export interface MQConfig {
  strategy: MQStrategy;
  producerRate: number;       // messages/sec  (1–20)
  workerCount: number;        // 1–5
  processingDelay: number;    // ms base processing time
  failureRate: number;        // 0–100 %
  retryEnabled: boolean;
  maxRetries: number;
  visibilityTimeout: number;  // ms – if worker doesn't ACK, redeliver after this
  queueCapacity: number;      // max mainQueue + inFlight size (backpressure)
  workerCrashRate: number;    // 0–100 % chance a worker crashes mid-processing
  delayMs: number;            // initial delay for 'delayed' strategy messages
}

// ─── Engine State (exposed to UI) ─────────────────────────────────────────────

export interface MQEngineState {
  mainQueue: Message[];
  inFlightQueue: Message[];
  delayedQueue: Message[];
  deadLetterQueue: Message[];
  workers: WorkerState[];
  stats: MQSimStats;
  logs: MQLogEntry[];
  queueAtCapacity: boolean;
  redeliveryFlash: number;    // increments on each redeliver – triggers UI animation
}

// ─── Presets ──────────────────────────────────────────────────────────────────

export type SimulationPreset = 'high-traffic' | 'stable' | 'failure-storm' | 'crash-demo';

// ─── Story-driven simulation ──────────────────────────────────────────────────

/** Simulation mode: chaos = no queue, direct dispatch; queue = full MQ engine */
export type SimulationMode = 'chaos' | 'queue';

/** Per-worker snapshot in chaos (no-queue) mode */
export interface ChaosWorkerState {
  id: string;
  status: 'idle' | 'processing';
  orderId?: string;
  processedCount: number;
  failedCount: number;
}

/** Aggregate statistics for chaos mode */
export interface ChaosStats {
  total: number;              // total orders received
  completed: number;          // successfully processed
  dropped: number;            // rejected immediately (no idle worker)
  failed: number;             // worker failed mid-job
  utilization: number;        // % workers busy (0–100)
  throughput: number;         // completed/sec (rolling 5s window)
  avgProcessingTime: number;  // ms
}

/** Full chaos engine snapshot exposed to UI */
export interface ChaosEngineState {
  workers: ChaosWorkerState[];
  stats: ChaosStats;
  logs: MQLogEntry[];
  dropFlash: number;          // increments each time an order is dropped – triggers flash
  inFlightCount: number;
  spikeActive: boolean;
}

