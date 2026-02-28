import { useRef, useState, useLayoutEffect, useMemo } from 'react';
import type { FlowStep } from '../../types';
import { Node } from '../Node';
import { ArrowFlow } from '../ArrowFlow';
import type { NodeId } from '../../types';

type Edge = [NodeId, NodeId];

const EDGES: Edge[] = [
  ['app', 'server'],
  ['server', 'cache'],
  ['server', 'db'],
  ['cache', 'db'],
];

interface DiagramProps {
  activeStep: FlowStep | null;
  doneCount: number;
  running: boolean;
  onStepComplete: () => void;
  stepDur: number;
}

export function Diagram({ activeStep, doneCount, running, onStepComplete, stepDur }: DiagramProps) {
  const wRef = useRef<HTMLDivElement>(null);
  const [sz, setSz] = useState({ w: 800, h: 400 });

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

  const { w, h } = sz;

  const pos = useMemo(
    () => ({
      app: { x: w * 0.12, y: h * 0.5 },
      server: { x: w * 0.5, y: h * 0.78 },
      cache: { x: w * 0.5, y: h * 0.15 },
      db: { x: w * 0.88, y: h * 0.5 },
    }),
    [w, h],
  );

  const activeNodes = new Set<string>();
  if (activeStep) {
    activeNodes.add(activeStep.from);
    activeNodes.add(activeStep.to);
  }

  return (
    <div ref={wRef} className="relative w-full h-full overflow-hidden">
      <svg
        className="absolute top-0 left-0 w-full h-full overflow-visible"
        viewBox={`0 0 ${w} ${h}`}
      >
        {EDGES.map(([f, t]) => {
          const isActive =
            (activeStep?.from === f && activeStep?.to === t) ||
            (activeStep?.from === t && activeStep?.to === f);
          return (
            <ArrowFlow
              key={`${f}${t}`}
              from={isActive ? (activeStep!.from as NodeId) : f}
              to={isActive ? (activeStep!.to as NodeId) : t}
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

      {(Object.entries(pos) as [NodeId, { x: number; y: number }][]).map(([id, p]) => (
        <Node key={id} id={id} x={p.x} y={p.y} active={activeNodes.has(id)} />
      ))}
    </div>
  );
}
