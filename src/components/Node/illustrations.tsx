export function AppIllus() {
  return (
    <svg width="64" height="60" viewBox="0 0 64 60" fill="none">
      <defs>
        <linearGradient id="appBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eff6ff" />
          <stop offset="100%" stopColor="#dbeafe" />
        </linearGradient>
        <linearGradient id="screenBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#bfdbfe" />
          <stop offset="100%" stopColor="#93c5fd" />
        </linearGradient>
      </defs>

      {/* Monitor */}
      <rect x="4" y="5" width="42" height="28" rx="6" fill="url(#appBg)" stroke="#3b82f6" strokeWidth="2.2" />
      <rect x="9" y="10" width="32" height="18" rx="3" fill="url(#screenBg)" opacity="0.9" />

      {/* Globe / Client Indicator */}
      <circle cx="25" cy="19" r="6.5" fill="#f8fafc" stroke="#3b82f6" strokeWidth="1.8" />
      <ellipse cx="25" cy="19" rx="3" ry="6.5" fill="none" stroke="#60a5fa" strokeWidth="1.2" />
      <line x1="18.5" y1="19" x2="31.5" y2="19" stroke="#60a5fa" strokeWidth="1.2" />

      {/* Stand */}
      <rect x="21" y="33" width="6" height="6" rx="1.5" fill="#93c5fd" />
      <rect x="15" y="39" width="18" height="4" rx="2" fill="#3b82f6" />

      {/* Mobile device (multi-client hint) */}
      <rect x="44" y="18" width="16" height="24" rx="4" fill="url(#appBg)" stroke="#3b82f6" strokeWidth="2" />
      <rect x="47" y="22" width="10" height="14" rx="2" fill="#bfdbfe" opacity="0.8" />
      <circle cx="52" cy="39" r="1.8" fill="#2563eb" />
    </svg>
  );
}

export function ServerIllus() {
  return (
    <svg width="90" height="60" viewBox="0 0 90 60" fill="none">
      <defs>
        <linearGradient id="serverBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="100%" stopColor="#fef3c7" />
        </linearGradient>
      </defs>

      {/* Server chassis */}
      <rect x="6" y="6" width="78" height="48" rx="8" fill="url(#serverBg)" stroke="#f59e0b" strokeWidth="2.5" />

      {/* Header panel */}
      <rect x="14" y="13" width="62" height="16" rx="4" fill="#fde68a" stroke="#fbbf24" strokeWidth="1.5" />

      {/* Clean technical label (no cursive) */}
      <text
        x="45"
        y="23"
        textAnchor="middle"
        fontSize="10"
        fontWeight="600"
        fill="#92400e"
        fontFamily="Inter, system-ui, sans-serif"
      >
      </text>

      {/* Processing bars */}
      <rect x="14" y="34" width="50" height="6" rx="3" fill="#fef9c3" stroke="#fcd34d" />
      <rect x="14" y="43" width="50" height="6" rx="3" fill="#fef9c3" stroke="#fcd34d" />

      {/* Status LEDs */}
      <circle cx="74" cy="36" r="3" fill="#10b981" />
      <circle cx="67" cy="36" r="3" fill="#10b981" />
      <circle cx="74" cy="45" r="3" fill="#f59e0b" />
      <circle cx="67" cy="45" r="3" fill="#10b981" />
    </svg>
  );
}

export function CacheIllus() {
  return (
    <svg width="68" height="68" viewBox="0 0 68 68" fill="none">
      <defs>
        <linearGradient id="cacheTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d1fae5" />
          <stop offset="100%" stopColor="#a7f3d0" />
        </linearGradient>
        <linearGradient id="cacheBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a7f3d0" />
          <stop offset="100%" stopColor="#6ee7b7" />
        </linearGradient>
      </defs>

      {/* Bottom layer */}
      <ellipse cx="34" cy="52" rx="23" ry="8" fill="#6ee7b7" stroke="#10b981" strokeWidth="2.2" />
      <rect x="11" y="40" width="46" height="12" fill="url(#cacheBody)" />
      <ellipse cx="34" cy="40" rx="23" ry="8" fill="url(#cacheBody)" stroke="#10b981" strokeWidth="2.2" />

      {/* Middle layer */}
      <rect x="11" y="28" width="46" height="12" fill="#a7f3d0" />
      <ellipse cx="34" cy="28" rx="23" ry="8" fill="url(#cacheTop)" stroke="#10b981" strokeWidth="2.2" />

      {/* Lightning icon (performance hint) */}
      <text
        x="34"
        y="33"
        textAnchor="middle"
        fontSize="16"
        fontWeight="700"
        fill="#047857"
      >
        ⚡
      </text>
    </svg>
  );
}

export function DBIllus() {
  return (
    <svg width="66" height="72" viewBox="0 0 66 72" fill="none">
      <defs>
        <linearGradient id="dbFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eff6ff" />
          <stop offset="100%" stopColor="#dbeafe" />
        </linearGradient>
      </defs>

      {/* Top */}
      <ellipse cx="33" cy="14" rx="22" ry="8" fill="#bfdbfe" stroke="#3b82f6" strokeWidth="2.2" />

      {/* Body */}
      <rect x="11" y="14" width="44" height="42" fill="url(#dbFill)" />
      <line x1="11" y1="14" x2="11" y2="56" stroke="#3b82f6" strokeWidth="2.2" />
      <line x1="55" y1="14" x2="55" y2="56" stroke="#3b82f6" strokeWidth="2.2" />

      {/* Internal data layers (dashed = storage depth) */}
      <ellipse
        cx="33"
        cy="29"
        rx="22"
        ry="6"
        fill="none"
        stroke="#60a5fa"
        strokeWidth="1.6"
        strokeDasharray="4 3"
      />
      <ellipse
        cx="33"
        cy="43"
        rx="22"
        ry="6"
        fill="none"
        stroke="#60a5fa"
        strokeWidth="1.6"
        strokeDasharray="4 3"
      />

      {/* Bottom */}
      <ellipse cx="33" cy="56" rx="22" ry="8" fill="#bfdbfe" stroke="#3b82f6" strokeWidth="2.2" />

      {/* Subtle highlight */}
      <ellipse cx="25" cy="14" rx="6" ry="2.5" fill="white" opacity="0.35" />
    </svg>
  );
}