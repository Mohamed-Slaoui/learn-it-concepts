import type { OperationType, CacheState } from '../../types';
import { READ_STRATS, WRITE_STRATS } from '../../concepts/caching/strategies';
import { Pill } from './Pill';

interface ControlsProps {
  op: OperationType;
  rs: string;
  ws: string;
  cs: CacheState;
  spd: number;
  running: boolean;
  setOp: (v: OperationType) => void;
  setRs: (v: string) => void;
  setWs: (v: string) => void;
  setCs: (v: CacheState) => void;
  setSpd: (v: number) => void;
  onRun: () => void;
  onReset: () => void;
}

const LABEL_CLASS = 'text-[9px] font-bold text-slate-400 tracking-[2px] uppercase font-mono';

export function ControlPanel({
  op, rs, ws, cs, spd, running,
  setOp, setRs, setWs, setCs, setSpd,
  onRun, onReset,
}: ControlsProps) {
  const strats = op === 'read' ? READ_STRATS : WRITE_STRATS;
  const cur = strats.find((s) => s.id === (op === 'read' ? rs : ws));

  return (
    <div className="bg-white border-t border-slate-200 px-5 py-[11px] shrink-0">
      <div className="flex items-start gap-5 flex-wrap">
        {/* Operation */}
        <div className="flex flex-col gap-1.5">
          <span className={LABEL_CLASS}>Operation</span>
          <div className="flex gap-2">
            <Pill label="📖  READ" sel={op === 'read'} onClick={() => setOp('read')} color="blue" disabled={running} />
            <Pill label="✏️  WRITE" sel={op === 'write'} onClick={() => setOp('write')} color="violet" disabled={running} />
          </div>
        </div>

        {/* Strategy */}
        <div className="flex flex-col gap-1.5">
          <span className={LABEL_CLASS}>{op === 'read' ? 'Read Strategy' : 'Write Strategy'}</span>
          <div className="flex gap-2 flex-wrap">
            {strats.map((s) => (
              <Pill
                key={s.id}
                label={s.label}
                sel={op === 'read' ? rs === s.id : ws === s.id}
                onClick={() => (op === 'read' ? setRs(s.id) : setWs(s.id))}
                color={op === 'read' ? 'emerald' : 'amber'}
                disabled={running}
              />
            ))}
          </div>
        </div>

        {/* Cache State (read only, not refresh-ahead) */}
        {op === 'read' && rs !== 'refresh-ahead' && (
          <div className="flex flex-col gap-1.5">
            <span className={LABEL_CLASS}>Cache State</span>
            <div className="flex gap-2">
              <Pill label="✅  HIT" sel={cs === 'hit'} onClick={() => setCs('hit')} color="emerald" disabled={running} />
              <Pill label="❌  MISS" sel={cs === 'miss'} onClick={() => setCs('miss')} color="red" disabled={running} />
            </div>
          </div>
        )}

        {/* Speed */}
        <div className="flex flex-col gap-1.5">
          <span className={LABEL_CLASS}>Speed · {spd}x</span>
          <input
            type="range"
            min={0.5}
            max={3}
            step={0.5}
            value={spd}
            onChange={(e) => setSpd(parseFloat(e.target.value))}
            className="w-24"
            disabled={running}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 ml-auto items-end pb-[2px]">
          <button
            onClick={onReset}
            disabled={running}
            className="px-4 py-[7px] rounded-[10px] border border-slate-200 bg-white text-slate-500 cursor-pointer transition-all hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed heading-3"
            style={{ fontSize: 13, fontWeight: 600 }}
          >
            Reset
          </button>
          <button
            onClick={onRun}
            disabled={running}
            className="px-[22px] py-[7px] rounded-[10px] border-none cursor-pointer transition-all disabled:cursor-not-allowed heading-3"
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: 'white',
              background: running ? '#94a3b8' : '#2563eb',
              boxShadow: running ? 'none' : '0 4px 14px rgba(37,99,235,0.3)',
            }}
          >
            {running ? 'Running…' : '▶  Run Simulation'}
          </button>
        </div>
      </div>

      {/* Strategy hint bar */}
      {cur && (
        <div
          key={cur.id}
          className="flex items-center gap-4 flex-wrap mt-[9px] bg-slate-50 rounded-xl px-[14px] py-2 border border-slate-100"
        >
          <p className="text-[11px] text-slate-600 flex-1 leading-[1.5] text-serif">
            💡 {cur.tagline}
          </p>
          <div className="flex gap-4 flex-wrap">
            {cur.pros.map((p) => (
              <span key={p} className="text-[10px] text-emerald-600 flex items-center gap-[3px]">
                ✓ {p}
              </span>
            ))}
          </div>
          <span
            className="text-[9px] bg-blue-50 text-blue-600 border border-blue-200 px-2 py-[2px] rounded-full shrink-0 text-code"
            style={{ whiteSpace: 'nowrap' }}
          >
            When: {cur.when}
          </span>
        </div>
      )}
    </div>
  );
}
