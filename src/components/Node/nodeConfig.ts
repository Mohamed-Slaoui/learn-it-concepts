import type { NodeId } from '../../types';
import type { ComponentType } from 'react';
import { AppIllus, CacheIllus, DBIllus, ServerIllus } from './illustrations';

export interface NodeConfig {
  label: string;
  sub: string;
  color: string;
  border: string;
  bg: string;
  Illus: ComponentType;
}

export const NODE_CONFIG: Record<NodeId, NodeConfig> = {
  app: {
    label: 'Application',
    sub: 'Client',
    color: '#1d4ed8',
    border: '#93c5fd',
    bg: '#eff6ff',
    Illus: AppIllus,
  },
  server: {
    label: 'Backend Server',
    sub: 'App Layer',
    color: '#92400e',
    border: '#fbbf24',
    bg: '#fffbeb',
    Illus: ServerIllus,
  },
  cache: {
    label: 'Cache',
    sub: 'Redis / Memcached',
    color: '#065f46',
    border: '#6ee7b7',
    bg: '#ecfdf5',
    Illus: CacheIllus,
  },
  db: {
    label: 'Database',
    sub: 'Persistent Store',
    color: '#1e3a5f',
    border: '#93c5fd',
    bg: '#f0f9ff',
    Illus: DBIllus,
  },
};
