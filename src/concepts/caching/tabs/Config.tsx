import { useState } from 'react';
import type { CachingConfig, EvictionPolicy, ReadStrategy, WriteStrategy } from '../useCachingEngine';
import { Pill } from '../../../components/ControlPanel/Pill';

const LABEL = 'text-[9px] font-bold text-slate-400 tracking-[2px] uppercase font-mono';

export interface CachingConfigTabProps {
  config: CachingConfig;
  running: boolean;
  onChange: (patch: Partial<CachingConfig>) => void;
  onSpike: () => void;
  onClearCache: () => void;
}

const READ_STRATEGIES: { id: ReadStrategy; label: string; desc: string }[] = [
  {
    id: 'cache-aside',
    label: 'Cache-Aside',
    desc: 'App checks cache manually. On miss, app fetches DB and populates cache. Most common pattern.',
  },
  {
    id: 'read-through',
    label: 'Read-Through',
    desc: 'Cache sits in front of DB. On miss, the cache layer fetches from DB automatically.',
  },
  {
    id: 'refresh-ahead',
    label: 'Refresh-Ahead',
    desc: 'Cache proactively refreshes entries at 75% TTL. Near-zero miss rate, slightly higher background DB load.',
  },
];

const WRITE_STRATEGIES: { id: WriteStrategy; label: string; desc: string }[] = [
  {
    id: 'write-through',
    label: 'Write-Through',
    desc: 'Every DB response updates cache immediately. Cache always consistent. Higher write latency.',
  },
  {
    id: 'write-back',
    label: 'Write-Back',
    desc: 'Cache updated first, DB synced asynchronously. Lower latency, slight risk of data loss.',
  },
  {
    id: 'write-around',
    label: 'Write-Around',
    desc: 'Writes go to DB directly, bypassing cache. Cache not populated on reads — repeated misses.',
  },
];

function SliderRow({
  label, value, min, max, step, unit, onChange, disabled, danger,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className={LABEL}>{label}</span>
        <span
          className="text-[11px] font-bold font-mono"
          style={{ color: danger && value > 70 ? '#ef4444' : '#475569' }}
        >
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
        disabled={disabled}
      />
    </div>
  );
}

export function CachingConfigTab({ config, running: _running, onChange, onSpike, onClearCache }: CachingConfigTabProps) {
  const [stratTab, setStratTab] = useState<'read' | 'write'>('read');
  const selectedRead  = READ_STRATEGIES.find(s => s.id === config.readStrategy)!;
  const selectedWrite = WRITE_STRATEGIES.find(s => s.id === config.writeStrategy)!;

  return (
    <div className="px-4 py-4 flex flex-col gap-5">

      {/* Cache On/Off */}
      <div className="flex flex-col gap-2">
        <span className={`${LABEL} text-slate-800 underline`}>Cache Mode</span>
        <div className="flex gap-2">
          <Pill
            label="Cache ON"
            sel={config.cacheEnabled}
            onClick={() => onChange({ cacheEnabled: true })}
            color="emerald"
          />
          <Pill
            label="Cache OFF"
            sel={!config.cacheEnabled}
            onClick={() => onChange({ cacheEnabled: false })}
            color="red"
          />
        </div>
        <p className="text-[10px] text-slate-400 m-0 text-serif leading-snug">
          {config.cacheEnabled
            ? 'Cache is active — popular products served from memory.'
            : 'No cache — every request hits the database directly.'}
        </p>
      </div>

      {/* Strategies — tab-switched read / write */}
      {config.cacheEnabled && (
        <div className="flex flex-col gap-2">
          <span className={`${LABEL} text-slate-800 underline`}>Cache Strategy</span>
          <div className="flex gap-1 border-b border-slate-100 pb-1.5">
            <button
              onClick={() => setStratTab('read')}
              className="text-[9px] font-bold tracking-[2px] uppercase px-2 py-1 rounded-md transition-colors cursor-pointer"
              style={{
                background: stratTab === 'read' ? '#eff6ff' : 'transparent',
                color: stratTab === 'read' ? '#1d4ed8' : '#94a3b8',
              }}
            >
              Read
            </button>
            <button
              onClick={() => setStratTab('write')}
              className="text-[9px] font-bold tracking-[2px] uppercase px-2 py-1 rounded-md transition-colors cursor-pointer"
              style={{
                background: stratTab === 'write' ? '#f5f3ff' : 'transparent',
                color: stratTab === 'write' ? '#6d28d9' : '#94a3b8',
              }}
            >
              Write
            </button>
          </div>

          {stratTab === 'read' && (
            <>
              <div className="flex gap-2 flex-wrap">
                {READ_STRATEGIES.map((s) => (
                  <Pill
                    key={s.id}
                    label={s.label}
                    sel={config.readStrategy === s.id}
                    onClick={() => onChange({ readStrategy: s.id })}
                    color="blue"
                  />
                ))}
              </div>
              <p className="text-[10px] text-slate-400 m-0 text-serif leading-snug">
                {selectedRead.desc}
              </p>
            </>
          )}

          {stratTab === 'write' && (
            <>
              <div className="flex gap-2 flex-wrap">
                {WRITE_STRATEGIES.map((s) => (
                  <Pill
                    key={s.id}
                    label={s.label}
                    sel={config.writeStrategy === s.id}
                    onClick={() => onChange({ writeStrategy: s.id })}
                    color="violet"
                  />
                ))}
              </div>
              <p className="text-[10px] text-slate-400 m-0 text-serif leading-snug">
                {selectedWrite.desc}
              </p>
            </>
          )}
        </div>
      )}

      {/* Speed */}
      <div className="flex flex-col gap-3">
        <span className={`${LABEL} text-slate-800 underline`}>Simulation</span>
        <SliderRow
          label="Speed"
          value={config.simulationSpeed}
          min={0.25}
          max={4}
          step={0.25}
          unit="x"
          onChange={(v) => onChange({ simulationSpeed: v })}
        />
      </div>

      {/* Traffic */}
      <div className="flex flex-col gap-3">
        <span className={`${LABEL} text-slate-800 underline`}>Traffic</span>
        <SliderRow
          label="Requests / sec"
          value={config.requestsPerSecond}
          min={1} max={20} step={1}
          unit=" req/s"
          onChange={(v) => onChange({ requestsPerSecond: v })}
        />
      </div>

      {/* Response times */}
      <div className="flex flex-col gap-3">
        <span className={LABEL}>Response Times</span>
        <SliderRow
          label="Database latency"
          value={config.dbResponseMs}
          min={50} max={1000} step={50}
          unit="ms"
          onChange={(v) => onChange({ dbResponseMs: v })}
        />
        <SliderRow
          label="Cache latency"
          value={config.cacheResponseMs}
          min={1} max={50} step={1}
          unit="ms"
          onChange={(v) => onChange({ cacheResponseMs: v })}
          disabled={!config.cacheEnabled}
        />
      </div>

      {/* Cache settings */}
      {config.cacheEnabled && (
        <div className="flex flex-col gap-3">
          <span className={`${LABEL} text-slate-800 underline`}>Cache Settings</span>
          <SliderRow
            label="Cache size (slots)"
            value={config.cacheSize}
            min={1} max={20} step={1}
            unit=" slots"
            onChange={(v) => onChange({ cacheSize: v })}
          />
          <SliderRow
            label="TTL (time-to-live)"
            value={config.ttlSeconds}
            min={2} max={60} step={2}
            unit="s"
            onChange={(v) => onChange({ ttlSeconds: v })}
          />
        </div>
      )}

      {/* Eviction policy */}
      {config.cacheEnabled && (
        <div className="flex flex-col gap-2">
          <span className={`${LABEL} text-slate-800 underline`}>Eviction Policy</span>
          <div className="flex gap-2">
            {(['lru', 'fifo'] as EvictionPolicy[]).map((p) => (
              <Pill
                key={p}
                label={p.toUpperCase()}
                sel={config.evictionPolicy === p}
                onClick={() => onChange({ evictionPolicy: p })}
                color="blue"
              />
            ))}
          </div>
          <p className="text-[10px] text-slate-400 m-0 text-serif leading-snug">
            {config.evictionPolicy === 'lru'
              ? 'LRU — evicts the least recently used item when cache is full.'
              : 'FIFO — evicts the oldest cached item (first in, first out).'}
          </p>
        </div>
      )}

      {/* Spike + Clear buttons */}
      {/* <div className="flex flex-col gap-2">
        <span className={`${LABEL} text-slate-800 underline`}>Experiments</span>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={onSpike}
            className="flex-1 py-2 rounded-[10px] border-none cursor-pointer heading-3 text-white transition-all"
            style={{
              fontSize: 12,
              fontWeight: 700,
              background: '#dc2626',
              boxShadow: '0 4px 12px rgba(220,38,38,0.35)',
            }}
          >
            Traffic Spike
          </button>
          {config.cacheEnabled && (
            <button
              onClick={onClearCache}
              className="flex-1 py-2 rounded-[10px] border border-slate-200 bg-white text-slate-600 cursor-pointer heading-3 hover:bg-slate-50 transition-all"
              style={{ fontSize: 12, fontWeight: 700 }}
            >
              Clear Cache
            </button>
          )}
        </div>
        <p className="text-[10px] text-slate-400 m-0 text-serif leading-snug">
          Spike simulates viral traffic (3x load for 5 seconds).
        </p>
      </div> */}

    </div>
  );
}
