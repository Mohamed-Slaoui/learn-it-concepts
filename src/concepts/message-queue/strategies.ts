import type { MQStrategy } from './types';

export interface MQStrategyDef {
  id: MQStrategy;
  label: string;
  description: string;
}

export const MQ_STRATEGIES: MQStrategyDef[] = [
  {
    id: 'fifo',
    label: 'FIFO',
    description: 'First-In-First-Out processing order',
  },
  {
    id: 'priority',
    label: 'Priority',
    description: 'Higher priority messages processed first',
  },
  {
    id: 'delayed',
    label: 'Delayed',
    description: 'Messages have configurable visibility delay',
  },
];
