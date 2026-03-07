import type { MQFlow, MQFlowStep, MQStrategy, Message } from './types';

let msgSeq = 0;

export function generateMessageId(): string {
  return `msg-${++msgSeq}`;
}

export function makeFlow(
  strategy: MQStrategy,
  workerCount: number,
  processingDelay: number,
  failureRate: number,
  shouldFail: boolean,
  retryEnabled: boolean,
  maxRetries: number,
): MQFlow {
  const msgId = generateMessageId();
  const processingTime = processingDelay + Math.random() * (processingDelay * 0.5);
  const willFail = shouldFail && Math.random() * 100 < failureRate;

  const steps: MQFlowStep[] = [
    {
      id: 's1',
      from: 'producer',
      to: 'queue',
      label: 'Produce Message',
      dot: '#3b82f6',
      desc: 'Producer sends message',
      log: `Producer → Queue: Enqueue ${msgId}`,
      type: 'produce',
      messageId: msgId,
    },
    {
      id: 's2',
      from: 'queue',
      to: 'queue',
      label: 'Message Queued',
      dot: '#f59e0b',
      desc: 'Message waiting in FIFO queue',
      log: `Queue: ${msgId} enqueued (waiting)`,
      type: 'queue',
      messageId: msgId,
      pause: 200,
    },
  ];

  // Add strategy-specific delays
  if (strategy === 'delayed') {
    steps.push({
      id: 's3a',
      from: 'queue',
      to: 'queue',
      label: 'Visibility Timeout',
      dot: '#94a3b8',
      desc: 'Message is invisible (delayed delivery)',
      log: `Queue: ${msgId} in visibility timeout (delayed)`,
      type: 'info',
      messageId: msgId,
      pause: 400,
    });
  }

  // Pick a worker
  const workerNum = (Math.abs(msgId.charCodeAt(0) + msgId.charCodeAt(msgId.length - 1)) % workerCount) + 1;
  const baseStepId = strategy === 'delayed' ? 4 : 3;

  steps.push(
    {
      id: `s${baseStepId}`,
      from: 'queue',
      to: 'worker',
      label: `Dispatch to Worker ${workerNum}`,
      dot: '#8b5cf6',
      desc: `Queue dispatches to Worker ${workerNum}`,
      log: `Queue → Worker${workerNum}: Dispatch ${msgId}`,
      type: 'process',
      messageId: msgId,
    },
    {
      id: `s${baseStepId + 1}`,
      from: 'worker',
      to: 'worker',
      label: `Processing (${Math.round(processingTime)}ms)`,
      dot: '#06b6d4',
      desc: `Worker ${workerNum} processing message`,
      log: `Worker${workerNum}: Processing ${msgId}...`,
      type: 'process',
      messageId: msgId,
      pause: Math.round(processingTime),
    },
  );

  if (willFail) {
    steps.push(
      {
        id: `s${baseStepId + 2}`,
        from: 'worker',
        to: 'queue',
        label: 'Processing Failed',
        dot: '#ef4444',
        desc: `Worker ${workerNum} failed to process`,
        log: `Worker${workerNum}: ERROR processing ${msgId}`,
        type: 'error',
        messageId: msgId,
        pause: 200,
      },
      {
        id: `s${baseStepId + 3}`,
        from: 'queue',
        to: 'queue',
        label: retryEnabled ? 'Message Requeued' : 'Dead Letter Queue',
        dot: retryEnabled ? '#f59e0b' : '#991b1b',
        desc: retryEnabled ? `Message returned to queue for retry` : `Message moved to DLQ (max retries)`,
        log: retryEnabled ? `Queue: ${msgId} requeued (retry attempt)` : `Queue: ${msgId} → Dead Letter Queue (no more retries)`,
        type: retryEnabled ? 'retry' : 'error',
        messageId: msgId,
      },
    );
  } else {
    steps.push({
      id: `s${baseStepId + 2}`,
      from: 'worker',
      to: 'producer',
      label: 'ACK to Producer',
      dot: '#10b981',
      desc: `Worker ${workerNum} completed successfully`,
      log: `Worker${workerNum}: ✓ Completed ${msgId} in ${Math.round(processingTime)}ms`,
      type: 'complete',
      messageId: msgId,
    });
  }

  return {
    steps,
    messageId: msgId,
    success: !willFail,
    processingTime: Math.round(processingTime),
  };
}
