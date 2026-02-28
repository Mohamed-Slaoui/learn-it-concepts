export type ConceptStatus = 'live' | 'soon';

export interface ProcessStep {
  num: number;
  desc: string;
}

export interface ConceptMeta {
  id: string;
  label: string;
  icon: string;
  status: ConceptStatus;
  color: string;
  tagline: string;
  what: string;
  realWorld: string;
  useCases: string[];
  stat: string;
  overview: string;
  howItWorks: string;
  realWorldDetails: string;
  processSteps: ProcessStep[];
}

export type NodeId = 'app' | 'server' | 'cache' | 'db';
export type LogType = 'info' | 'hit' | 'miss' | 'fetch' | 'store' | 'ack' | 'response';
export type OperationType = 'read' | 'write';
export type CacheState = 'hit' | 'miss';

export interface FlowStep {
  id: string;
  from: NodeId;
  to: NodeId;
  label: string;
  dot: string;
  desc: string;
  log: string;
  type: LogType;
  pause?: number;
}

export interface Flow {
  isHit?: boolean;
  steps: FlowStep[];
}

export interface SimStats {
  hits: number;
  misses: number;
  total: number;
  ms: number;
}

export interface LogEntry {
  id: number;
  ts: string;
  msg: string;
  type: LogType;
}
