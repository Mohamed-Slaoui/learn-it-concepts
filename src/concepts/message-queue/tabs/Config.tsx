import { MQ_STRATEGIES } from '../strategies';
import type { MQStrategy, MQConfig, SimulationPreset, SimulationMode } from '../types';
import { Pill } from '../../../components/ControlPanel/Pill';

interface MQConfigTabProps {
  config: MQConfig;
  running: boolean;
  setConfig: (cfg: MQConfig) => void;
  applyPreset: (preset: SimulationPreset) => void;
  mode: SimulationMode;
  onModeChange: (mode: SimulationMode) => void;
  onSpike: () => void;
}

const LABEL = 'text-[9px] font-bold text-slate-400 tracking-[2px] uppercase font-mono';

const PRESETS: { id: SimulationPreset; label: string; description: string; color: string }[] = [
  { id: 'high-traffic',  label: 'High Traffic',   description: '20 msg/s, 1 worker',   color: 'bg-orange-100 border-orange-300 text-orange-700 hover:bg-orange-200' },
  { id: 'stable',        label: 'Stable System',  description: 'Balanced load',         color: 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' },
  { id: 'failure-storm', label: 'Failure Storm',  description: '60% failure rate',      color: 'bg-red-100 border-red-300 text-red-700 hover:bg-red-200' },
  { id: 'crash-demo',    label: 'Crash Demo',     description: '40% crash rate',        color: 'bg-purple-100 border-purple-300 text-purple-700 hover:bg-purple-200' },
];

export default function MQConfigTab({ config, running, setConfig, applyPreset, mode, onModeChange, onSpike }: MQConfigTabProps) {
  const set = (patch: Partial<MQConfig>) => setConfig({ ...config, ...patch });
  const isChaos = mode === 'chaos';

  const rateLabel   = isChaos ? 'Customers / Second' : 'Producer Rate';
  const workerLabel = isChaos ? 'Order Processors'   : 'Worker Count';
  const delayLabel  = isChaos ? 'Processing Time'    : 'Processing Delay';

  return (
    <div className="px-4 py-4 flex flex-col gap-4 max-h-full overflow-y-auto">

      {/* Mode toggle */}
      <div className="flex flex-col gap-1.5">
        <span className={LABEL}>Simulation Mode</span>
        <div className="flex gap-1.5">
          <button
            onClick={() => onModeChange('chaos')}
            className={`flex-1 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${
              isChaos ? 'bg-red-100 border-red-400 text-red-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-red-50'
            }`}
          >
             Chaos
          </button>
          <button
            onClick={() => onModeChange('queue')}
            className={`flex-1 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${
              !isChaos ? 'bg-emerald-100 border-emerald-400 text-emerald-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-emerald-50'
            }`}
          >
             Queue
          </button>
        </div>
      </div>

      {/* Traffic Spike (chaos only) */}
      {isChaos && (
        <div className="flex flex-col gap-1.5">
          <span className={LABEL}>Traffic Spike</span>
          <button
            onClick={onSpike}
            disabled={!running}
            className="w-full py-2 rounded-lg border border-orange-300 bg-orange-100 text-orange-700 text-[11px] font-bold
                       hover:bg-orange-200 active:bg-orange-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
             Trigger Traffic Spike (5 for 3s)
          </button>
          <p className="text-[10px] text-slate-500 italic">Simulates a sudden customer rush. Watch orders drop!</p>
        </div>
      )}

      {/* Scenario Presets (queue only) */}
      {!isChaos && (
        <div className="flex flex-col gap-1.5">
          <span className={LABEL}>Scenario Presets</span>
          <div className="grid grid-cols-2 gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                disabled={running}
                onClick={() => applyPreset(p.id)}
                className={`rounded-lg border text-left px-2 py-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${p.color}`}
              >
                <div className="text-[10px] font-bold">{p.label}</div>
                <div className="text-[8px] opacity-70">{p.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Queue Strategy (queue only) */}
      {!isChaos && (
        <div className="flex flex-col gap-1.5">
          <span className={LABEL}>Queue Strategy</span>
          <div className="flex flex-wrap gap-2">
            {MQ_STRATEGIES.map((s) => (
              <Pill
                key={s.id}
                label={s.label}
                sel={config.strategy === s.id}
                disabled={running}
                onClick={() => set({ strategy: s.id as MQStrategy })}
                color="amber"
              />
            ))}
          </div>
          <p className="text-[11px] text-slate-500 italic">
            {MQ_STRATEGIES.find((s) => s.id === config.strategy)?.description}
          </p>
        </div>
      )}

      {/* Customers / sec */}
      <div className="flex flex-col gap-1.5">
        <span className={LABEL}>{rateLabel}</span>
        <div className="flex items-center gap-2">
          <input type="range" min={1} max={20} step={1} value={config.producerRate} disabled={running}
            onChange={(e) => set({ producerRate: Number(e.target.value) })} className="flex-1" />
          <span className="font-mono text-sm font-bold text-amber-600 min-w-15">{config.producerRate} /s</span>
        </div>
      </div>

      {/* Order Processors */}
      <div className="flex flex-col gap-1.5">
        <span className={LABEL}>{workerLabel}</span>
        <div className="flex items-center gap-2">
          <input type="range" min={1} max={5} step={1} value={config.workerCount} disabled={running}
            onChange={(e) => set({ workerCount: Number(e.target.value) })} className="flex-1" />
          <span className="font-mono text-sm font-bold text-emerald-600 min-w-15">{config.workerCount}</span>
        </div>
      </div>

      {/* Processing Time */}
      <div className="flex flex-col gap-1.5">
        <span className={LABEL}>{delayLabel}</span>
        <div className="flex items-center gap-2">
          <input type="range" min={100} max={2000} step={100} value={config.processingDelay} disabled={running}
            onChange={(e) => set({ processingDelay: Number(e.target.value) })} className="flex-1" />
          <span className="font-mono text-sm font-bold text-blue-600 min-w-15">{config.processingDelay}ms</span>
        </div>
      </div>

      {/* Failure Rate */}
      <div className="flex flex-col gap-1.5">
        <span className={LABEL}>Failure Rate</span>
        <div className="flex items-center gap-2">
          <input type="range" min={0} max={100} step={5} value={config.failureRate} disabled={running}
            onChange={(e) => set({ failureRate: Number(e.target.value) })} className="flex-1" />
          <span className="font-mono text-sm font-bold text-red-600 min-w-15">{config.failureRate}%</span>
        </div>
      </div>

      {/* Queue-specific controls */}
      {!isChaos && (
        <>
          <div className="flex flex-col gap-1.5">
            <span className={LABEL}>Queue Capacity <span className="text-amber-500 normal-case">(backpressure)</span></span>
            <div className="flex items-center gap-2">
              <input type="range" min={5} max={100} step={5} value={config.queueCapacity} disabled={running}
                onChange={(e) => set({ queueCapacity: Number(e.target.value) })} className="flex-1" />
              <span className="font-mono text-sm font-bold text-amber-600 min-w-15">{config.queueCapacity} msgs</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className={LABEL}>Worker Crash Rate</span>
            <div className="flex items-center gap-2">
              <input type="range" min={0} max={80} step={5} value={config.workerCrashRate} disabled={running}
                onChange={(e) => set({ workerCrashRate: Number(e.target.value) })} className="flex-1" />
              <span className="font-mono text-sm font-bold text-rose-600 min-w-15">{config.workerCrashRate}%</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className={LABEL}>Visibility Timeout</span>
            <div className="flex items-center gap-2">
              <input type="range" min={500} max={8000} step={500} value={config.visibilityTimeout} disabled={running}
                onChange={(e) => set({ visibilityTimeout: Number(e.target.value) })} className="flex-1" />
              <span className="font-mono text-sm font-bold text-blue-600 min-w-15">{config.visibilityTimeout}ms</span>
            </div>
            <p className="text-[11px] text-slate-500 italic">Unacked message redelivered after this timeout</p>
          </div>

          {config.strategy === 'delayed' && (
            <div className="flex flex-col gap-1.5">
              <span className={LABEL}>Initial Delay</span>
              <div className="flex items-center gap-2">
                <input type="range" min={500} max={5000} step={500} value={config.delayMs} disabled={running}
                  onChange={(e) => set({ delayMs: Number(e.target.value) })} className="flex-1" />
                <span className="font-mono text-sm font-bold text-slate-600 min-w-15">{config.delayMs}ms</span>
              </div>
            </div>
          )}

          <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className={LABEL}>Retry on Failure</span>
              <button
                disabled={running}
                onClick={() => set({ retryEnabled: !config.retryEnabled })}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${
                  config.retryEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                  config.retryEnabled ? 'translate-x-4' : 'translate-x-1'
                }`} />
              </button>
            </div>
            {config.retryEnabled && (
              <>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-slate-600">Max Retries:</span>
                  <input type="range" min={1} max={5} step={1} value={config.maxRetries} disabled={running}
                    onChange={(e) => set({ maxRetries: Number(e.target.value) })} className="flex-1" />
                  <span className="font-mono text-sm font-bold text-slate-600 min-w-7.5">{config.maxRetries}</span>
                </div>
                <p className="text-[10px] text-slate-500 italic mt-1">
                  Failed messages go to delayed queue with backoff
                </p>
              </>
            )}
          </div>
        </>
      )}

    </div>
  );
}
