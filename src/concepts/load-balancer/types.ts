export type LBNodeId = 'client' | 'lb' | 's1' | 's2' | 's3';
export type LBAlgorithm = 'round-robin' | 'least-conn' | 'ip-hash' | 'weighted';
export type LBLogType = 'info' | 'route' | 'health' | 'error' | 'response';

export interface LBFlowStep {
  id: string;
  from: LBNodeId;
  to: LBNodeId;
  label: string;
  dot: string;
  desc: string;
  log: string;
  type: LBLogType;
  pause?: number;
}

export interface LBFlow {
  steps: LBFlowStep[];
  chosenServer: 's1' | 's2' | 's3' | null;
  nextRrIdx: number;
}

export interface LBSimStats {
  total: number;
  failed: number;
  ms: number;
  serverCounts: { s1: number; s2: number; s3: number };
}

export interface LBLogEntry {
  id: number;
  ts: string;
  msg: string;
  type: LBLogType;
}

export interface ServerMetrics {
  id: 's1' | 's2' | 's3';
  cpu: number; // 0-100
  memory: number; // 0-100
  latency: number; // ms
  activeConnections: number;
  requestsPerSec: number;
}

export interface ChaosConfig {
  surgeMultiplier: number; // 1-10x
  latencyInject: number; // ms to add
  failureRate: number; // 0-100%
  slowdownPercent: number; // 0-100%
}
