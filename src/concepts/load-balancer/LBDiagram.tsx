import { useRef, useState, useLayoutEffect, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import type { LBFlowStep, ServerMetrics } from './types';
import { ArrowFlow } from '../../components/ArrowFlow';
import { AppIllus, ServerIllus, LBIllus } from '../../components/Node/illustrations';

type LBNodeKey = 'client' | 'lb' | 's1' | 's2' | 's3';

type Edge = [LBNodeKey, LBNodeKey];

const EDGES: Edge[] = [
  ['client', 'lb'],
  ['lb', 's1'],
  ['lb', 's2'],
  ['lb', 's3'],
];

interface NodeConfig {
  label: string;
  sub: string;
  color: string;
  border: string;
  bg: string;
  Illus: React.ComponentType;
}

const NODE_CONFIG: Record<LBNodeKey, NodeConfig> = {
  client: {
    label: 'Client',
    sub: 'User Request',
    color: '#1d4ed8',
    border: '#93c5fd',
    bg: '#eff6ff',
    Illus: AppIllus,
  },
  lb: {
    label: 'Load Balancer',
    sub: 'Traffic Router',
    color: '#d97706',
    border: '#fbbf24',
    bg: '#fffbeb',
    Illus: LBIllus,
  },
  s1: {
    label: 'Server 1',
    sub: 'Backend',
    color: '#065f46',
    border: '#6ee7b7',
    bg: '#ecfdf5',
    Illus: ServerIllus,
  },
  s2: {
    label: 'Server 2',
    sub: 'Backend',
    color: '#065f46',
    border: '#6ee7b7',
    bg: '#ecfdf5',
    Illus: ServerIllus,
  },
  s3: {
    label: 'Server 3',
    sub: 'Backend',
    color: '#065f46',
    border: '#6ee7b7',
    bg: '#ecfdf5',
    Illus: ServerIllus,
  },
};

interface LBDiagramProps {
  activeStep: LBFlowStep | null;
  doneCount: number;
  running: boolean;
  onStepComplete: () => void;
  stepDur: number;
  serverHealth: { s1: boolean; s2: boolean; s3: boolean };
  serverMetrics: Record<'s1' | 's2' | 's3', ServerMetrics>;
}

export default function LBDiagram({
  activeStep,
  onStepComplete,
  stepDur,
  serverHealth,
  serverMetrics,
}: LBDiagramProps) {
  const wRef = useRef<HTMLDivElement>(null);
  const [sz, setSz] = useState({ w: 800, h: 400 });
  const [draggingNode, setDraggingNode] = useState<LBNodeKey | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const defaultPos = useMemo(
    () => ({
      client: { x: sz.w * 0.12, y: sz.h * 0.50 },
      lb:     { x: sz.w * 0.50, y: sz.h * 0.50 },
      s1:     { x: sz.w * 0.88, y: sz.h * 0.20 },
      s2:     { x: sz.w * 0.88, y: sz.h * 0.50 },
      s3:     { x: sz.w * 0.88, y: sz.h * 0.80 },
    }),
    [sz.w, sz.h],
  );

  const [posOverrides, setPosOverrides] = useState<Partial<Record<LBNodeKey, { x: number; y: number }>>>({});

  const pos = useMemo(
    () => ({
      client: posOverrides.client ?? defaultPos.client,
      lb:     posOverrides.lb     ?? defaultPos.lb,
      s1:     posOverrides.s1     ?? defaultPos.s1,
      s2:     posOverrides.s2     ?? defaultPos.s2,
      s3:     posOverrides.s3     ?? defaultPos.s3,
    }),
    [posOverrides, defaultPos],
  );

  useLayoutEffect(() => {
    const el = wRef.current;
    if (!el) return;
    const ob = new ResizeObserver(([e]) =>
      setSz({ w: e.contentRect.width || 800, h: e.contentRect.height || 400 }),
    );
    ob.observe(el);
    setSz({ w: el.offsetWidth || 800, h: el.offsetHeight || 400 });
    return () => ob.disconnect();
  }, []);

  const handleNodeMouseDown = useCallback(
    (nodeId: LBNodeKey, e: React.MouseEvent) => {
      e.preventDefault();
      const nodePos = pos[nodeId];
      setDraggingNode(nodeId);
      setDragOffset({ x: e.clientX - nodePos.x, y: e.clientY - nodePos.y });
    },
    [pos],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!draggingNode) return;
      const rect = wRef.current?.getBoundingClientRect();
      if (!rect) return;
      const padding = 60;
      const newX = Math.max(padding, Math.min(e.clientX - rect.left - dragOffset.x, sz.w - padding));
      const newY = Math.max(padding, Math.min(e.clientY - rect.top  - dragOffset.y, sz.h - padding));
      setPosOverrides((prev) => ({ ...prev, [draggingNode]: { x: newX, y: newY } }));
    },
    [draggingNode, dragOffset, sz.w, sz.h],
  );

  const handleMouseUp = useCallback(() => setDraggingNode(null), []);

  const { w, h } = sz;

  const activeNodes = new Set<string>();
  if (activeStep) {
    activeNodes.add(activeStep.from);
    activeNodes.add(activeStep.to);
  }

  return (
    <div
      ref={wRef}
      className="relative w-full h-full overflow-hidden select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <svg
        className="absolute top-0 left-0 w-full h-full overflow-visible pointer-events-none"
        viewBox={`0 0 ${w} ${h}`}
      >
        {EDGES.map(([f, t]) => {
          const isActive =
            (activeStep?.from === f && activeStep?.to === t) ||
            (activeStep?.from === t && activeStep?.to === f);
          return (
            <ArrowFlow
              key={`${f}${t}`}
              from={isActive ? (activeStep!.from as string) : f}
              to={isActive ? (activeStep!.to as string) : t}
              pos={pos}
              label={isActive ? activeStep!.label : undefined}
              dot={isActive ? activeStep!.dot : undefined}
              animating={isActive}
              dimmed={false}
              onComplete={isActive ? onStepComplete : undefined}
              dur={stepDur}
            />
          );
        })}
      </svg>

      {(Object.entries(pos) as [LBNodeKey, { x: number; y: number }][]).map(([id, p]) => {
        const isDown = (id === 's1' || id === 's2' || id === 's3') && !serverHealth[id];
        const isActive = activeNodes.has(id);
        const c = NODE_CONFIG[id];
        
        return (
          <div
            key={id}
            className="absolute z-10"
            style={{
              left: p.x,
              top: p.y,
              transform: 'translate(-50%, -50%)',
              cursor: draggingNode === id ? 'grabbing' : 'grab',
            }}
            onMouseDown={(e) => handleNodeMouseDown(id, e)}
          >
            <div className="flex flex-col items-center gap-1.75">
              <motion.div
                animate={
                  isActive
                    ? {
                        boxShadow: [
                          `0 0 0 3px ${c.color}26, 0 4px 16px rgba(0,0,0,0.06)`,
                          `0 0 0 5px ${c.color}4d, 0 4px 24px rgba(0,0,0,0.1)`,
                          `0 0 0 3px ${c.color}26, 0 4px 16px rgba(0,0,0,0.06)`,
                        ],
                      }
                    : { boxShadow: '0 0 0 0px transparent' }
                }
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  background: isDown ? '#fef2f2' : c.bg,
                  border: `2.5px solid ${isActive ? activeStep?.dot ?? c.color : isDown ? '#ef4444' : c.border}`,
                  borderRadius: 16,
                  padding: '13px 15px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: 96,
                  transition: 'border-color 0.3s, background 0.3s',
                  filter: draggingNode === id ? 'drop-shadow(0 8px 12px rgba(0,0,0,0.15))' : 'none',
                  opacity: isDown ? 0.5 : 1,
                }}
              >
                <c.Illus />
              </motion.div>
              <div className="text-center">
                <div
                  className="leading-none font-bold heading-3"
                  style={{ color: isDown ? '#ef4444' : c.color }}
                >
                  {c.label}
                </div>
                <div
                  className="mt-0.5 text-code"
                  style={{
                    fontSize: 9,
                    color: isDown ? '#fca5a5' : '#94a3b8',
                    letterSpacing: '0.5px',
                  }}
                >
                  {isDown ? 'OFFLINE' : c.sub}
                </div>
                
                {/* Server metrics for s1, s2, s3 */}
                {(id === 's1' || id === 's2' || id === 's3') && (
                  <div className="mt-2 w-full flex flex-col gap-0.75">
                    {[
                      { label: 'CPU', value: serverMetrics[id].cpu, color: '#ef4444' },
                      { label: 'MEM', value: serverMetrics[id].memory, color: '#f59e0b' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="flex items-center gap-1">
                        <span style={{ fontSize: 7, color: '#94a3b8' }}>{label}</span>
                        <div
                          style={{
                            height: 3,
                            width: 32,
                            background: '#e2e8f0',
                            borderRadius: 1.5,
                            overflow: 'hidden',
                          }}
                        >
                          <motion.div
                            style={{
                              height: '100%',
                              background: color,
                              borderRadius: 1.5,
                            }}
                            animate={{ width: `${Math.min(value, 100)}%` }}
                            transition={{ duration: 0.4 }}
                          />
                        </div>
                        <span style={{ fontSize: 7, color: '#64748b', minWidth: 20, textAlign: 'right' }}>
                          {Math.round(value)}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
