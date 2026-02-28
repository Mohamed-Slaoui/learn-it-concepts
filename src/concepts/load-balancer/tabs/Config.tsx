import { LB_STRATEGIES } from '../strategies';
import type { LBAlgorithm, ChaosConfig } from '../types';
import { Pill } from '../../../components/ControlPanel/Pill';

interface LBConfigTabProps {
  algorithm: LBAlgorithm;
  spd: number;
  serverHealth: { s1: boolean; s2: boolean; s3: boolean };
  chaos: ChaosConfig;
  running: boolean;
  setAlgorithm: (a: LBAlgorithm) => void;
  setSpd: (s: number) => void;
  setServerHealth: (h: { s1: boolean; s2: boolean; s3: boolean }) => void;
  setChaos: (c: ChaosConfig) => void;
}

const LABEL = 'text-[9px] font-bold text-slate-400 tracking-[2px] uppercase font-mono';

const SERVER_LABELS: Record<'s1' | 's2' | 's3', string> = {
  s1: 'Server 1',
  s2: 'Server 2',
  s3: 'Server 3',
};

export default function LBConfigTab({
  algorithm,
  spd,
  serverHealth,
  chaos,
  running,
  setAlgorithm,
  setSpd,
  setServerHealth,
  setChaos,
}: LBConfigTabProps) {
  const active = LB_STRATEGIES.find((s) => s.id === algorithm);

  return (
    <div className="px-4 py-4 flex flex-col gap-4 max-h-full overflow-y-auto">
      {/* Algorithm */}
      <div className="flex flex-col gap-1.5">
        <span className={LABEL}>Algorithm</span>
        <div className="flex flex-wrap gap-2">
          {LB_STRATEGIES.map((s) => (
            <Pill
              key={s.id}
              label={s.label}
              sel={algorithm === s.id}
              disabled={running}
              onClick={() => setAlgorithm(s.id as LBAlgorithm)}
              color="blue"
            />
          ))}
        </div>
      </div>

      {/* Server health toggles */}
      <div className="flex flex-col gap-1.5">
        <span className={LABEL}>Server Health</span>
        <div className="flex flex-col gap-2">
          {(['s1', 's2', 's3'] as const).map((s) => (
            <div key={s} className="flex items-center justify-between bg-slate-100/50 rounded-lg px-3 py-2">
              <span className="text-sm text-slate-600">{SERVER_LABELS[s]}</span>
              <button
                disabled={running}
                onClick={() => setServerHealth({ ...serverHealth, [s]: !serverHealth[s] })}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                  serverHealth[s] ? 'bg-emerald-500' : 'bg-red-500'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                    serverHealth[s] ? 'translate-x-4' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-xs w-12 text-right ${serverHealth[s] ? 'text-emerald-400' : 'text-red-400'}`}>
                {serverHealth[s] ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Speed */}
      <div className="flex flex-col gap-1.5">
        <span className={LABEL}>Speed · {spd / 100}x</span>
        <input
          type="range"
          min={300}
          max={1600}
          step={100}
          value={spd}
          disabled={running}
          onChange={(e) => setSpd(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Chaos Engineering */}
      <div className="rounded-xl px-3 py-2.5 border border-orange-200 bg-orange-50 flex flex-col gap-2.5">
        <span className={LABEL}>⚡ Chaos Engineering</span>

        {/* Traffic Surge */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-slate-600">Traffic Surge</span>
            <span className="text-[11px] font-bold text-orange-600">{chaos.surgeMultiplier}x</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            step={0.5}
            value={chaos.surgeMultiplier}
            disabled={running}
            onChange={(e) => setChaos({ ...chaos, surgeMultiplier: parseFloat(e.target.value) })}
            className="w-full h-1.5 accent-orange-500"
          />
        </div>

        {/* Injected Latency */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-slate-600">Latency Injection</span>
            <span className="text-[11px] font-bold text-orange-600">{chaos.latencyInject}ms</span>
          </div>
          <input
            type="range"
            min={0}
            max={500}
            step={50}
            value={chaos.latencyInject}
            disabled={running}
            onChange={(e) => setChaos({ ...chaos, latencyInject: Number(e.target.value) })}
            className="w-full h-1.5 accent-orange-500"
          />
        </div>

        {/* Failure Rate */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-slate-600">Failure Rate</span>
            <span className="text-[11px] font-bold text-red-600">{chaos.failureRate}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={50}
            step={5}
            value={chaos.failureRate}
            disabled={running}
            onChange={(e) => setChaos({ ...chaos, failureRate: Number(e.target.value) })}
            className="w-full h-1.5 accent-red-500"
          />
        </div>

        {/* Slowdown */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-slate-600">Slowdown</span>
            <span className="text-[11px] font-bold text-amber-600">{chaos.slowdownPercent}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={10}
            value={chaos.slowdownPercent}
            disabled={running}
            onChange={(e) => setChaos({ ...chaos, slowdownPercent: Number(e.target.value) })}
            className="w-full h-1.5 accent-amber-500"
          />
        </div>
      </div>

      {/* Strategy hint */}
      {active && (
        <div className="rounded-xl px-3 py-2.5 border border-slate-100 bg-slate-50 flex flex-col gap-2">
          <p className="text-[11px] text-slate-600 leading-normal text-serif">
            💡 {active.tagline}
          </p>
          <div className="flex gap-3 flex-wrap">
            {active.pros.map((p) => (
              <span key={p} className="text-[10px] text-emerald-600 flex items-center gap-0.75">
                ✓ {p}
              </span>
            ))}
          </div>
          <span className="text-[9px] bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full self-start text-code">
            When: {active.when}
          </span>
        </div>
      )}
    </div>
  );
}
