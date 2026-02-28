import { useRef, useState, useLayoutEffect, useMemo, useCallback } from 'react';
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
  const [draggingNode, setDraggingNode] = useState<NodeId | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const defaultPos = useMemo(
    () => ({
      app: { x: sz.w * 0.12, y: sz.h * 0.5 },
      server: { x: sz.w * 0.5, y: sz.h * 0.78 },
      cache: { x: sz.w * 0.5, y: sz.h * 0.15 },
      db: { x: sz.w * 0.88, y: sz.h * 0.5 },
    }),
    [sz.w, sz.h],
  );

  const [posOverrides, setPosOverrides] = useState<Partial<Record<NodeId, { x: number; y: number }>>>({});

  const pos = useMemo(
    () => ({
      app: posOverrides.app ?? defaultPos.app,
      server: posOverrides.server ?? defaultPos.server,
      cache: posOverrides.cache ?? defaultPos.cache,
      db: posOverrides.db ?? defaultPos.db,
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
    (nodeId: NodeId, e: React.MouseEvent) => {
      e.preventDefault();
      const nodePos = pos[nodeId];
      setDraggingNode(nodeId);
      setDragOffset({
        x: e.clientX - nodePos.x,
        y: e.clientY - nodePos.y,
      });
    },
    [pos],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!draggingNode) return;
      const containerRect = wRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      let newX = e.clientX - containerRect.left - dragOffset.x;
      let newY = e.clientY - containerRect.top - dragOffset.y;

      // Add boundaries - clamp to container with some padding
      const padding = 60;
      newX = Math.max(padding, Math.min(newX, sz.w - padding));
      newY = Math.max(padding, Math.min(newY, sz.h - padding));

      setPosOverrides((prev) => ({
        ...prev,
        [draggingNode]: { x: newX, y: newY },
      }));
    },
    [draggingNode, dragOffset, sz.w, sz.h],
  );

  const handleMouseUp = useCallback(() => {
    setDraggingNode(null);
  }, []);

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
        <Node
          key={id}
          id={id}
          x={p.x}
          y={p.y}
          active={activeNodes.has(id)}
          dragging={draggingNode === id}
          onMouseDown={(e) => handleNodeMouseDown(id, e)}
        />
      ))}
    </div>
  );
}
