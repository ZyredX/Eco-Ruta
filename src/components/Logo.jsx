import React from 'react';

export function Logo({ className = "w-10 h-10" }) {
  return (
    <div className={className}>
      <svg viewBox="0 0 520 520" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-2xl">
        <defs>
          <clipPath id="leafClip">
            <path transform="translate(260,260) rotate(40) scale(1.25)"
                  d="M 0 -190 C 55 -150, 90 -80, 90 0 C 90 80, 55 150, 0 190 C -55 150, -90 80, -90 0 C -90 -80, -55 -150, 0 -190 Z" />
          </clipPath>
        </defs>

        <g clipPath="url(#leafClip)">
          <rect x="0" y="0" width="520" height="520" fill="#0d1b2a" />
          <g transform="translate(260,260) rotate(40) scale(1.25)">
            <rect x="-88" y="-185" width="40" height="45" fill="#152535" rx="2"/>
            <rect x="-38" y="-188" width="42" height="48" fill="#152535" rx="2"/>
            <rect x="12"  y="-185" width="38" height="45" fill="#152535" rx="2"/>
            <rect x="55"  y="-183" width="35" height="43" fill="#152535" rx="2"/>
            <rect x="-88" y="-128" width="40" height="42" fill="#152535" rx="2"/>
            <rect x="-38" y="-130" width="42" height="44" fill="#152535" rx="2"/>
            <rect x="12"  y="-128" width="40" height="42" fill="#152535" rx="2"/>
            <rect x="56"  y="-127" width="36" height="40" fill="#152535" rx="2"/>
            <rect x="-88" y="-74"  width="40" height="44" fill="#152535" rx="2"/>
            <rect x="-38" y="-76"  width="42" height="46" fill="#152535" rx="2"/>
            <rect x="12"  y="-74"  width="40" height="44" fill="#152535" rx="2"/>
            <rect x="56"  y="-73"  width="35" height="42" fill="#152535" rx="2"/>
            <rect x="-88" y="-18"  width="40" height="44" fill="#152535" rx="2"/>
            <rect x="-38" y="-20"  width="42" height="46" fill="#152535" rx="2"/>
            <rect x="12"  y="-18"  width="40" height="44" fill="#152535" rx="2"/>
            <rect x="56"  y="-17"  width="35" height="42" fill="#152535" rx="2"/>
            <rect x="-88" y="38"   width="40" height="42" fill="#152535" rx="2"/>
            <rect x="-38" y="36"   width="42" height="44" fill="#152535" rx="2"/>
            <rect x="12"  y="38"   width="40" height="42" fill="#152535" rx="2"/>
            <rect x="56"  y="39"   width="35" height="40" fill="#152535" rx="2"/>
            <rect x="-88" y="92"   width="40" height="42" fill="#152535" rx="2"/>
            <rect x="-38" y="90"   width="42" height="44" fill="#152535" rx="2"/>
            <rect x="12"  y="92"   width="40" height="42" fill="#152535" rx="2"/>
            <rect x="56"  y="93"   width="35" height="40" fill="#152535" rx="2"/>
            <rect x="-85" y="146"  width="38" height="38" fill="#152535" rx="2"/>
            <rect x="-36" y="144"  width="40" height="40" fill="#152535" rx="2"/>
            <rect x="13"  y="146"  width="38" height="38" fill="#152535" rx="2"/>
            <rect x="54"  y="147"  width="34" height="36" fill="#152535" rx="2"/>

            <line x1="-90" y1="-140" x2="90" y2="-140" stroke="#2a4a6b" strokeWidth="3"  />
            <line x1="-90" y1="-84"  x2="90" y2="-84"  stroke="#2a4a6b" strokeWidth="2.5"/>
            <line x1="-90" y1="-28"  x2="90" y2="-28"  stroke="#2a4a6b" strokeWidth="3"  />
            <line x1="-90" y1="28"   x2="90" y2="28"   stroke="#2a4a6b" strokeWidth="2.5"/>
            <line x1="-90" y1="84"   x2="90" y2="84"   stroke="#2a4a6b" strokeWidth="3"  />
            <line x1="-90" y1="140"  x2="90" y2="140"  stroke="#2a4a6b" strokeWidth="2"  />
            <line x1="-90" y1="-190" x2="-90" y2="190" stroke="#2a4a6b" strokeWidth="2.5"/>
            <line x1="-36" y1="-190" x2="-36" y2="190" stroke="#2a4a6b" strokeWidth="2"  />
            <line x1="16"  y1="-190" x2="16"  y2="190" stroke="#2a4a6b" strokeWidth="3"  />
            <line x1="56"  y1="-190" x2="56"  y2="190" stroke="#2a4a6b" strokeWidth="2"  />
            <line x1="90"  y1="-190" x2="90"  y2="190" stroke="#2a4a6b" strokeWidth="2.5"/>
            <line x1="-90" y1="-112" x2="90" y2="-112" stroke="#1a3350" strokeWidth="1"/>
            <line x1="-90" y1="-56"  x2="90" y2="-56"  stroke="#1a3350" strokeWidth="1"/>
            <line x1="-90" y1="0"    x2="90" y2="0"    stroke="#1a3350" strokeWidth="1"/>
            <line x1="-90" y1="56"   x2="90" y2="56"   stroke="#1a3350" strokeWidth="1"/>
            <line x1="-90" y1="112"  x2="90" y2="112"  stroke="#1a3350" strokeWidth="1"/>
            <line x1="-63" y1="-190" x2="-63" y2="190" stroke="#1a3350" strokeWidth="1"/>
            <line x1="-10" y1="-190" x2="-10" y2="190" stroke="#1a3350" strokeWidth="1"/>
            <line x1="36"  y1="-190" x2="36"  y2="190" stroke="#1a3350" strokeWidth="1"/>
            <line x1="76"  y1="-190" x2="76"  y2="190" stroke="#1a3350" strokeWidth="1"/>
            <line x1="-90" y1="-190" x2="90" y2="190" stroke="#2a4a6b" strokeWidth="2" opacity="0.7"/>

            <circle cx="-55" cy="-120" r="14" fill="#dc2626" opacity="0.95"/>
            <circle cx="-38" cy="-108" r="9"  fill="#ef4444" opacity="0.80"/>
            <circle cx="-68" cy="-105" r="6"  fill="#fca5a5" opacity="0.60"/>
            <circle cx="60"  cy="-28"  r="13" fill="#ea580c" opacity="0.90"/>
            <circle cx="44"  cy="-14"  r="8"  fill="#fb923c" opacity="0.75"/>
            <circle cx="74"  cy="-12"  r="5"  fill="#fb923c" opacity="0.60"/>
            <circle cx="-20" cy="56"   r="10" fill="#ea580c" opacity="0.80"/>
            <circle cx="36"  cy="112"  r="12" fill="#ea580c" opacity="0.85"/>
            <circle cx="52"  cy="100"  r="6"  fill="#fb923c" opacity="0.65"/>
            <circle cx="-66" cy="28"   r="9"  fill="#3b82f6" opacity="0.75"/>
            <circle cx="-52" cy="40"   r="5"  fill="#60a5fa" opacity="0.55"/>
            <circle cx="-82" cy="84"   r="4"  fill="#3b82f6" opacity="0.50"/>

            <line x1="0" y1="-188" x2="0" y2="188" stroke="#22c55e" strokeWidth="2" opacity="0.75"/>
            <path d="M 0 -130 Q -28 -84 -60 -56" stroke="#22c55e" strokeWidth="1.3" fill="none" opacity="0.60"/>
            <path d="M 0 -28  Q -40 28 -80 56"   stroke="#22c55e" strokeWidth="1.3" fill="none" opacity="0.60"/>
            <path d="M 0 84   Q -35 112 -68 135" stroke="#22c55e" strokeWidth="1.1" fill="none" opacity="0.50"/>
            <path d="M 0 -130 Q 28 -84 60 -56"  stroke="#22c55e" strokeWidth="1.3" fill="none" opacity="0.60"/>
            <path d="M 0 -28  Q 40 28 80 56"    stroke="#22c55e" strokeWidth="1.3" fill="none" opacity="0.60"/>
            <path d="M 0 84   Q 35 112 68 135"  stroke="#22c55e" strokeWidth="1.1" fill="none" opacity="0.50"/>
          </g>
        </g>

        <path transform="translate(260,260) rotate(40) scale(1.25)"
              d="M 0 -190 C 55 -150, 90 -80, 90 0 C 90 80, 55 150, 0 190 C -55 150, -90 80, -90 0 C -90 -80, -55 -150, 0 -190 Z"
              fill="none" stroke="#22c55e" strokeWidth="3.5" />
        <path transform="translate(260,260) rotate(40) scale(1.25)"
              d="M 0 -190 C 55 -150, 90 -80, 90 0 C 90 80, 55 150, 0 190 C -55 150, -90 80, -90 0 C -90 -80, -55 -150, 0 -190 Z"
              fill="none" stroke="#4ade80" strokeWidth="1" opacity="0.35" />
      </svg>
    </div>
  );
}
