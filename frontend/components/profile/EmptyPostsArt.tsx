/**
 * Flat vector empty-state illustration: creator with headphones + mic,
 * paper sheet, orange/purple shapes. Original art, no emoji.
 */
export function EmptyPostsArt() {
  return (
    <svg
      viewBox="0 0 200 140"
      role="img"
      aria-label="Empty posts illustration"
      className="h-36 w-auto"
    >
      <circle cx="164" cy="30" r="22" fill="var(--color-brand-soft)" />
      <circle cx="30" cy="112" r="14" fill="var(--color-brand-soft)" />
      <ellipse cx="150" cy="118" rx="34" ry="10" fill="var(--color-secondary)" />
      {/* paper sheet */}
      <g transform="rotate(-6 100 100)">
        <rect
          x="62"
          y="72"
          width="76"
          height="52"
          rx="6"
          fill="var(--color-card)"
          stroke="var(--color-border)"
          strokeWidth="2"
        />
        <line
          x1="74"
          y1="86"
          x2="126"
          y2="86"
          stroke="var(--color-border)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <line
          x1="74"
          y1="98"
          x2="112"
          y2="98"
          stroke="var(--color-border)"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>
      {/* upside-down buddy */}
      <g transform="rotate(180 152 52)">
        <rect
          x="140"
          y="30"
          width="24"
          height="34"
          rx="12"
          fill="var(--color-brand)"
          opacity="0.85"
        />
        <circle cx="148" cy="46" r="1.6" fill="white" />
        <circle cx="156" cy="46" r="1.6" fill="white" />
      </g>
      {/* person */}
      <circle cx="86" cy="52" r="16" fill="#f2c9a0" />
      <path d="M70 50 a16 16 0 0 1 32 0 l0 -6 a16 12 0 0 0 -32 0 z" fill="#e8822e" />
      {/* headphones */}
      <path
        d="M68 50 a18 18 0 0 1 36 0"
        fill="none"
        stroke="#8a8f98"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <rect x="62" y="44" width="9" height="16" rx="4.5" fill="#8a8f98" />
      <rect x="101" y="44" width="9" height="16" rx="4.5" fill="#8a8f98" />
      {/* body: white shirt, orange sleeves */}
      <path
        d="M64 124 a22 26 0 0 1 44 0 z"
        fill="#ffffff"
        stroke="var(--color-border)"
        strokeWidth="2"
      />
      <rect x="58" y="96" width="12" height="24" rx="6" fill="#e8822e" />
      <rect x="102" y="96" width="12" height="24" rx="6" fill="#e8822e" />
      {/* mic in hand */}
      <rect
        x="112"
        y="70"
        width="7"
        height="26"
        rx="3.5"
        fill="#3a3d44"
        transform="rotate(18 115 83)"
      />
      <circle cx="119" cy="66" r="8" fill="#3a3d44" />
      <circle cx="119" cy="66" r="8" fill="none" stroke="#8a8f98" strokeWidth="2" />
      <circle cx="88" cy="54" r="1.8" fill="#22252b" />
    </svg>
  );
}
