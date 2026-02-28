import type { SimStats } from '../types';
import { CONCEPTS } from '../data/conceptsList';

interface TopbarProps {
  onBack?: () => void;
  showBack?: boolean;
  variant?: 'landing' | 'simulator';
  conceptId?: string;
  stats?: SimStats;
}

export function Topbar({ onBack, showBack = false, variant = 'simulator', conceptId, stats }: TopbarProps) {
  const concept = conceptId ? CONCEPTS.find((c) => c.id === conceptId) : null;

  return (
    <header
      className="h-12 flex items-center px-4 gap-[10px] shrink-0 z-20 border-b"
      style={{
        background: variant === 'landing' ? 'rgba(255,255,255,0.8)' : 'white',
        backdropFilter: variant === 'landing' ? 'blur(10px)' : undefined,
        borderBottomColor: 'rgba(226,232,240,0.8)',
        boxShadow: variant === 'simulator' ? '0 1px 3px rgba(0,0,0,0.04)' : undefined,
        position: variant === 'landing' ? 'sticky' : 'static',
        top: 0,
      }}
    >
      {/* Back button */}
      {showBack && (
        <>
          <button
            onClick={onBack}
            className="flex items-center gap-[5px] bg-white border border-slate-200 rounded-lg px-3 py-1 text-slate-500 cursor-pointer transition-all hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700 shrink-0 text-code text-sm"
            style={{ fontSize: 14 }}
          >
            <span className='pb-1'>←</span>
            <span>Home</span>
          </button>
          <div className="w-px h-5 bg-slate-200 shrink-0" />
        </>
      )}

      {/* Logo */}
      <div className="w-[26px] h-[26px] bg-blue-600 rounded-[7px] flex items-center justify-center shrink-0">
        <span className="text-white text-[13px] font-extrabold">S</span>
      </div>
      <span className="heading-3 text-slate-900 shrink-0 font-caveat">
        SysViz
      </span>
      <span
        className="text-slate-400 border border-slate-200 px-[7px] py-[2px] rounded text-[9px] tracking-[1px] shrink-0 text-code"
      >
        v0.1 · BETA
      </span>

      {/* Concept identity (simulator mode) */}
      {concept && variant === 'simulator' && (
        <>
          <div className="w-px h-5 bg-slate-200 shrink-0 mx-1" />
          <div className="flex flex-col justify-center leading-none shrink-0">
            <span
              className="heading-3 text-slate-900 leading-none"
            >
              {concept.icon} {concept.label}
            </span>
            <span
              className="text-[8px] tracking-[2px] uppercase text-slate-400 mt-[2px] text-code"
            >
              Interactive Simulator
            </span>
          </div>

          {/* Center subtitle */}
          <span
            className="flex-1 text-center text-[11px] text-slate-400 px-4 hidden md:block truncate text-serif"
            style={{ fontStyle: 'italic' }}
          >
            Configure below and run a simulation
          </span>

          {/* Stats */}
          {stats && (
            <div className="flex items-center gap-5 shrink-0">
              {([
                ['Hits',   stats.hits,                    '#10b981'],
                ['Misses', stats.misses,                  '#ef4444'],
                ['Total',  stats.total,                   '#3b82f6'],
                ['Last',   stats.ms ? `${stats.ms}ms` : '—', '#94a3b8'],
              ] as [string, string | number, string][]).map(([label, val, color]) => (
                <div key={label} className="text-center leading-none">
                  <div className="heading-2" style={{ color, lineHeight: 1 }}>
                    {val}
                  </div>
                  <div className="mt-[2px] uppercase tracking-[1px] text-code text-[8px]" style={{ color: '#94a3b8' }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Landing status dot */}
      {variant === 'landing' && (
        <div className="ml-auto flex items-center gap-[6px] text-[11px] text-slate-400 font-mono">
          <div className="w-[6px] h-[6px] rounded-full bg-emerald-500" style={{ boxShadow: '0 0 6px #10b981' }} />
          1 concept live
        </div>
      )}
    </header>
  );
}
