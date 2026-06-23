export default function TrophyArt({ className = '' }) {
  return (
    <svg
      viewBox="0 0 200 220"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="trophyGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F3E4C8" />
          <stop offset="45%" stopColor="#C8A45D" />
          <stop offset="100%" stopColor="#9B6A43" />
        </linearGradient>
        <linearGradient id="trophyShine" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFF8ED" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FFF8ED" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* base */}
      <rect x="70" y="195" width="60" height="10" rx="3" fill="url(#trophyGold)" />
      <rect x="82" y="180" width="36" height="18" rx="3" fill="url(#trophyGold)" />

      {/* stem */}
      <path d="M92 150 L92 182 L108 182 L108 150 Z" fill="url(#trophyGold)" />

      {/* cup body */}
      <path
        d="M60 40
           C60 40 60 95 65 115
           C70 140 88 152 100 152
           C112 152 130 140 135 115
           C140 95 140 40 140 40
           Z"
        fill="url(#trophyGold)"
      />
      <path
        d="M70 45 C70 45 70 90 74 108 C78 128 90 140 98 142"
        stroke="url(#trophyShine)"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />

      {/* handles */}
      <path
        d="M60 55 C35 55 30 85 45 100 C52 107 60 108 65 105"
        stroke="url(#trophyGold)"
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M140 55 C165 55 170 85 155 100 C148 107 140 108 135 105"
        stroke="url(#trophyGold)"
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
      />

      {/* rim */}
      <ellipse cx="100" cy="40" rx="40" ry="9" fill="url(#trophyGold)" />
      <ellipse cx="100" cy="38" rx="34" ry="6" fill="#FFF8ED" opacity="0.35" />
    </svg>
  );
}
