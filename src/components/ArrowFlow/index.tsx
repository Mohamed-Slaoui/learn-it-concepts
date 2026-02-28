import { useEffect, useRef, useMemo } from 'react';
import type { NodeId } from '../../types';

export interface NodePosition {
  x: number;
  y: number;
}

interface ArrowFlowProps {
  from: NodeId;
  to: NodeId;
  pos: Record<string, NodePosition>;
  label?: string;
  dot?: string;
  animating?: boolean;
  dimmed?: boolean;
  onComplete?: () => void;
  dur: number;
}

let dotSeq = 0;

export function ArrowFlow({
  from,
  to,
  pos,
  label,
  dot = '#3b82f6',
  animating = false,
  dimmed = false,
  onComplete,
  dur,
}: ArrowFlowProps) {
  const keyRef = useRef(0);
  const doneRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const A = pos[from];
  const B = pos[to];

  const geo = useMemo(() => {
    if (!A || !B) return null;
    const dx = B.x - A.x;
    const dy = B.y - A.y;
    const ang = Math.atan2(dy, dx);
    const hw = 62;
    const hh = 52;
    const sx = A.x + Math.cos(ang) * hw;
    const sy = A.y + Math.sin(ang) * hh;
    const ex = B.x - Math.cos(ang) * hw;
    const ey = B.y - Math.sin(ang) * hh;
    const d = `M ${sx} ${sy} L ${ex} ${ey}`;
    const pLen = Math.hypot(ex - sx, ey - sy) * 1.12 + 10;
    const t = 0.5;
    const lx = (1 - t) * sx + t * ex;
    const ly = (1 - t) * sy + t * ey - 17;
    return {
      d,
      sx, sy, ex, ey, pLen, lx, ly,
    };
  }, [A, B]);

  useEffect(() => {
    doneRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!animating) return;
    keyRef.current = ++dotSeq;
    timerRef.current = setTimeout(() => {
      if (!doneRef.current) {
        doneRef.current = true;
        onComplete?.();
      }
    }, dur + 80);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animating, from, to]);

  if (!geo) return null;

  const { d, ex, ey, pLen, lx, ly } = geo;
  const lineCol = animating ? dot : '#cbd5e1';
  const op = dimmed ? 0.1 : 1;
  const dotR = 7;
  const aId = `a${keyRef.current}`;
  const labelW = label ? Math.max(label.length * 7.6 + 14, 38) : 0;

  return (
    <g style={{ opacity: op, transition: 'opacity 0.4s' }}>
      {animating && (
        <style>{`
          @keyframes ${aId} {
            0%   { stroke-dashoffset: ${pLen + dotR * 3}; }
            100% { stroke-dashoffset: ${-dotR * 2}; }
          }
          .${aId} {
            stroke-dasharray: ${dotR * 2} ${pLen + dotR * 6};
            stroke-dashoffset: ${pLen + dotR * 3};
            animation: ${aId} ${dur}ms linear forwards;
          }
        `}</style>
      )}

      {/* Path */}
      <path
        d={d}
        fill="none"
        stroke={lineCol}
        strokeWidth={animating ? 2.5 : 1.5}
        strokeDasharray={animating ? undefined : '6 4'}
        style={{ transition: 'stroke 0.3s' }}
      />

      {/* Animated dot */}
      {animating && (
        <path
          key={keyRef.current}
          d={d}
          fill="none"
          stroke={dot}
          strokeWidth={dotR * 2}
          strokeLinecap="round"
          className={aId}
          style={{ filter: `drop-shadow(0 0 6px ${dot}88)` }}
        />
      )}

      {/* Label */}
      {label && animating && (
        <g
          key={`lb${keyRef.current}`}
          style={{
            animation: 'fadeInUp 0.22s ease forwards',
            opacity: 0,
            animationDelay: '0.08s',
          }}
        >
          <style>{`
            @keyframes fadeInUp {
              from { opacity: 0; transform: translateY(6px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          <rect
            x={lx - labelW / 2}
            y={ly - 11}
            width={labelW}
            height={20}
            rx={5}
            fill="white"
            stroke={dot}
            strokeWidth={1.5}
          />
          <text
            x={lx}
            y={ly + 3.5}
            textAnchor="middle"
            fontSize={9}
            fontWeight="700"
            fill={dot}
            fontFamily="'JetBrains Mono', monospace"
          >
            {label}
          </text>
        </g>
      )}
    </g>
  );
}
