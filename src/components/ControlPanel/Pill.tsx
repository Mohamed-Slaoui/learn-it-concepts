interface PillProps {
  label: string;
  sel: boolean;
  onClick: () => void;
  color: 'blue' | 'violet' | 'emerald' | 'amber' | 'red';
  disabled?: boolean;
}

const COLOR_CLASSES: Record<PillProps['color'], string> = {
  blue: 'bg-blue-50 border-blue-500 text-blue-700',
  violet: 'bg-violet-50 border-violet-600 text-violet-800',
  emerald: 'bg-emerald-50 border-emerald-500 text-emerald-800',
  amber: 'bg-amber-50 border-amber-400 text-amber-800',
  red: 'bg-red-50 border-red-400 text-red-800',
};

export function Pill({ label, sel, onClick, color, disabled = false }: PillProps) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={[
        'px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-150 cursor-pointer select-none heading-3',
        sel ? COLOR_CLASSES[color] : 'border-slate-200 bg-white text-slate-500',
        !sel && !disabled ? 'hover:border-slate-400 hover:text-slate-700' : '',
        disabled ? 'opacity-40 cursor-not-allowed' : '',
      ].join(' ')}
      style={{ fontSize: 13 }}
    >
      {label}
    </button>
  );
}
