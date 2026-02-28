import type { OperationType, CacheState } from '../../../types';
import { READ_STRATS, WRITE_STRATS } from '../strategies';
import { Pill } from '../../../components/ControlPanel/Pill';

const LABEL = 'text-[9px] font-bold text-slate-400 tracking-[2px] uppercase font-mono';

export interface CachingConfigTabProps {
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
}

export function CachingConfigTab({
  op, rs, ws, cs, spd, running,
  setOp, setRs, setWs, setCs, setSpd,
}: CachingConfigTabProps) {
  const strats = op === 'read' ? READ_STRATS : WRITE_STRATS;
  const cur = strats.find((s) => s.id === (op === 'read' ? rs : ws));

  return (
    <div className="px-4 py-4 flex flex-col gap-4">

      {/* Operation */}
      <div className="flex flex-col gap-1.5">
        <span className={LABEL}>Operation</span>
        <div className="flex gap-2">
          <Pill label="READ" sel={op === 'read'} onClick={() => setOp('read')} color="blue" disabled={running} />
          <Pill label="WRITE" sel={op === 'write'} onClick={() => setOp('write')} color="violet" disabled={running} />
        </div>
      </div>

      {/* Strategy */}
      <div className="flex flex-col gap-1.5">
        <span className={LABEL}>{op === 'read' ? 'Read Strategy' : 'Write Strategy'}</span>
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
          <span className={LABEL}>Cache State</span>
          <div className="flex gap-2">
            <Pill label="HIT" sel={cs === 'hit'} onClick={() => setCs('hit')} color="emerald" disabled={running} />
            <Pill label="MISS" sel={cs === 'miss'} onClick={() => setCs('miss')} color="red" disabled={running} />
          </div>
        </div>
      )}

      {/* Speed */}
      <div className="flex flex-col gap-1.5">
        <span className={LABEL}>Speed · {spd}x</span>
        <input
          type="range"
          min={0.5}
          max={3}
          step={0.5}
          value={spd}
          onChange={(e) => setSpd(parseFloat(e.target.value))}
          className="w-full"
          disabled={running}
        />
      </div>

      {/* Strategy hint */}
      {cur && (
        <div className="rounded-xl px-3 py-2.5 border border-slate-100 bg-slate-50 flex flex-col gap-2">
          <p className="text-[11px] text-slate-600 leading-normal text-serif">
            💡 {cur.tagline}
          </p>
          <div className="flex gap-3 flex-wrap">
            {cur.pros.map((p) => (
              <span key={p} className="text-[10px] text-emerald-600 flex items-center gap-0.75">
                ✓ {p}
              </span>
            ))}
          </div>
          <span className="text-[9px] bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full self-start text-code">
            When: {cur.when}
          </span>
        </div>
      )}

    </div>
  );
}
