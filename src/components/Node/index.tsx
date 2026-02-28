import { motion } from 'motion/react';
import type { NodeId } from '../../types';
import { NODE_CONFIG } from './nodeConfig';

interface NodeProps {
  id: NodeId;
  x: number;
  y: number;
  active: boolean;
}

export function Node({ id, x, y, active }: NodeProps) {
  const c = NODE_CONFIG[id];
  return (
    <div
      className="absolute z-10"
      style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
    >
      <div className="flex flex-col items-center gap-[7px]">
        <motion.div
          animate={
            active
              ? {
                  boxShadow: [
                    '0 0 0 3px rgba(59,130,246,0.15), 0 4px 16px rgba(0,0,0,0.06)',
                    '0 0 0 5px rgba(59,130,246,0.3), 0 4px 24px rgba(0,0,0,0.1)',
                    '0 0 0 3px rgba(59,130,246,0.15), 0 4px 16px rgba(0,0,0,0.06)',
                  ],
                }
              : { boxShadow: '0 0 0 0px transparent' }
          }
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            background: c.bg,
            border: `2.5px solid ${active ? c.color : c.border}`,
            borderRadius: 16,
            padding: '13px 15px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minWidth: 96,
            transition: 'border-color 0.3s',
          }}
        >
          <c.Illus />
        </motion.div>
        <div className="text-center">
          <div
            className="leading-none font-bold heading-3"
            style={{ color: c.color }}
          >
            {c.label}
          </div>
          <div
            className="mt-[2px] text-code"
            style={{
              fontSize: 9,
              color: '#94a3b8',
              letterSpacing: '0.5px',
            }}
          >
            {c.sub}
          </div>
        </div>
      </div>
    </div>
  );
}
