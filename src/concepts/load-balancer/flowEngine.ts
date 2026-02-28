import type { LBAlgorithm, LBFlow, LBFlowStep } from './types';

type Server = 's1' | 's2' | 's3';

const SERVER_LABELS: Record<Server, string> = {
  s1: 'Server 1',
  s2: 'Server 2',
  s3: 'Server 3',
};

function pickServer(
  algorithm: LBAlgorithm,
  health: Record<Server, boolean>,
  rrIdx: number,
  counts: Record<Server, number>,
): { server: Server | null; nextRrIdx: number } {
  const healthy = (['s1', 's2', 's3'] as Server[]).filter((s) => health[s]);
  if (healthy.length === 0) return { server: null, nextRrIdx: rrIdx };

  switch (algorithm) {
    case 'round-robin': {
      const server = healthy[rrIdx % healthy.length];
      return { server, nextRrIdx: rrIdx + 1 };
    }
    case 'least-conn': {
      const server = healthy.reduce((a, b) => (counts[a] <= counts[b] ? a : b));
      return { server, nextRrIdx: rrIdx };
    }
    case 'ip-hash': {
      // Simulate hash of client IP — deterministic based on rrIdx mod 3
      const idx = rrIdx % healthy.length;
      return { server: healthy[idx], nextRrIdx: rrIdx + 1 };
    }
    case 'weighted': {
      // s1:50% s2:30% s3:20% — cycle pattern: s1,s1,s3,s2,s1,s1,s3,s2...
      const pattern: Server[] = ['s1', 's1', 's2', 's1', 's1', 's3', 's2', 's1'];
      const candidates = pattern[rrIdx % pattern.length];
      const server = health[candidates] ? candidates : healthy[0];
      return { server, nextRrIdx: rrIdx + 1 };
    }
  }
}

function algoLabel(algorithm: LBAlgorithm): string {
  const map: Record<LBAlgorithm, string> = {
    'round-robin': 'ROUND-ROBIN',
    'least-conn': 'LEAST CONN',
    'ip-hash': 'IP HASH',
    'weighted': 'WEIGHTED',
  };
  return map[algorithm];
}

export function makeLBFlow(
  algorithm: LBAlgorithm,
  health: { s1: boolean; s2: boolean; s3: boolean },
  rrIdx: number,
  counts: { s1: number; s2: number; s3: number },
): LBFlow {
  const { server: chosen, nextRrIdx } = pickServer(algorithm, health, rrIdx, counts);

  // All servers down
  if (!chosen) {
    return {
      chosenServer: null,
      nextRrIdx,
      steps: [
        { id: 's1', from: 'client', to: 'lb', label: 'REQUEST', dot: '#3b82f6', desc: 'Client sends request to Load Balancer', log: 'Client → LB: incoming request', type: 'info' },
        { id: 's2', from: 'lb', to: 's1', label: 'HEALTH CHECK', dot: '#ef4444', desc: 'LB checks Server 1 — DOWN', log: 'LB → S1: health check FAILED ✗', type: 'error' },
        { id: 's3', from: 'lb', to: 's2', label: 'HEALTH CHECK', dot: '#ef4444', desc: 'LB checks Server 2 — DOWN', log: 'LB → S2: health check FAILED ✗', type: 'error' },
        { id: 's4', from: 'lb', to: 's3', label: 'HEALTH CHECK', dot: '#ef4444', desc: 'LB checks Server 3 — DOWN', log: 'LB → S3: health check FAILED ✗', type: 'error' },
        { id: 's5', from: 'lb', to: 'client', label: '503 ERROR', dot: '#ef4444', desc: 'All servers down — returning 503', log: 'LB → Client: 503 Service Unavailable', type: 'error' },
      ],
    };
  }

  // Find which servers were "tried and skipped" (health check failures) before the chosen one
  const attempted = (['s1', 's2', 's3'] as Server[]).filter(
    (s) => !health[s],
  );

  const steps: LBFlowStep[] = [];
  let stepId = 1;

  // 1. Client → LB
  steps.push({
    id: `s${stepId++}`, from: 'client', to: 'lb',
    label: 'REQUEST', dot: '#3b82f6',
    desc: 'Client sends request to Load Balancer',
    log: 'Client → LB: incoming request',
    type: 'info',
  });

  // 2. Health checks on any DOWN servers
  for (const s of attempted) {
    steps.push({
      id: `s${stepId++}`, from: 'lb', to: s,
      label: 'HEALTH CHECK', dot: '#ef4444',
      desc: `LB checks ${SERVER_LABELS[s]} — DOWN, skipping`,
      log: `LB → ${SERVER_LABELS[s]}: health check FAILED — rerouting`,
      type: 'error',
      pause: 200,
    });
  }

  // 3. LB → chosen server
  steps.push({
    id: `s${stepId++}`, from: 'lb', to: chosen,
    label: algoLabel(algorithm), dot: '#f59e0b',
    desc: `LB routes to ${SERVER_LABELS[chosen]} using ${algoLabel(algorithm)}`,
    log: `LB → ${SERVER_LABELS[chosen]}: forwarded [${algoLabel(algorithm)}]`,
    type: 'route',
  });

  // 4. Server processes
  steps.push({
    id: `s${stepId++}`, from: chosen, to: 'lb',
    label: 'PROCESSED', dot: '#10b981',
    desc: `${SERVER_LABELS[chosen]} processes request and responds`,
    log: `${SERVER_LABELS[chosen]} → LB: 200 OK, request processed`,
    type: 'health',
  });

  // 5. LB → client
  steps.push({
    id: `s${stepId++}`, from: 'lb', to: 'client',
    label: 'RESPONSE', dot: '#3b82f6',
    desc: 'Load Balancer returns response to Client',
    log: 'LB → Client: response delivered ✓',
    type: 'response',
  });

  return { steps, chosenServer: chosen, nextRrIdx };
}
