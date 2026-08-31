/**
 * Self-hosted, inline-SVG stand-in for the reference design's cinematic hero photography.
 * Avoids hotlinking any external/third-party image while still giving the hero a rich,
 * "premium tech" right-hand visual instead of a mostly-empty panel.
 */
export function HeroBackground() {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 1200 600"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="heroLine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#19d9f2" stopOpacity="0" />
          <stop offset="45%" stopColor="#19d9f2" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#19d9f2" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="heroGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#19d9f2" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#19d9f2" stopOpacity="0" />
        </radialGradient>
        <pattern id="heroHex" width="46" height="80" patternUnits="userSpaceOnUse" patternTransform="translate(600,0)">
          <path
            d="M23 0 L46 13 L46 40 L23 53 L0 40 L0 13 Z"
            fill="none"
            stroke="#19d9f2"
            strokeOpacity="0.08"
            strokeWidth="1"
          />
        </pattern>
        <filter id="heroBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <style>
          {`
            .hero-drift { animation: hero-drift 9s ease-in-out infinite; }
            .hero-drift-slow { animation: hero-drift 14s ease-in-out infinite; }
            .hero-dot { animation: hero-pulse 2.6s ease-in-out infinite; transform-origin: center; }
            .hero-dot-d1 { animation-delay: .4s; }
            .hero-dot-d2 { animation-delay: 1.1s; }
            .hero-dot-d3 { animation-delay: 1.8s; }
            @keyframes hero-drift {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-10px); }
            }
            @keyframes hero-pulse {
              0%, 100% { opacity: .35; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.6); }
            }
          `}
        </style>
      </defs>

      <rect x="560" y="0" width="640" height="600" fill="url(#heroHex)" />
      <circle cx="960" cy="230" r="260" fill="url(#heroGlow)" />

      <g className="hero-drift-slow" opacity="0.9">
        <path
          d="M 640 520 C 760 460, 800 360, 760 260 C 725 175, 820 140, 940 110"
          stroke="url(#heroLine)"
          strokeWidth="2"
          filter="url(#heroBlur)"
        />
        <path d="M 640 520 C 760 460, 800 360, 760 260 C 725 175, 820 140, 940 110" stroke="url(#heroLine)" strokeWidth="1.5" />
      </g>
      <g className="hero-drift" opacity="0.6">
        <path
          d="M 700 560 C 840 520, 880 420, 830 330 C 795 265, 900 230, 1030 200"
          stroke="url(#heroLine)"
          strokeWidth="2"
          filter="url(#heroBlur)"
        />
        <path
          d="M 700 560 C 840 520, 880 420, 830 330 C 795 265, 900 230, 1030 200"
          stroke="url(#heroLine)"
          strokeWidth="1"
        />
      </g>

      <circle className="hero-dot hero-dot-d1" cx="760" cy="260" r="3" fill="#9aefff" />
      <circle className="hero-dot hero-dot-d2" cx="940" cy="110" r="3" fill="#9aefff" />
      <circle className="hero-dot hero-dot-d3" cx="830" cy="330" r="3" fill="#9aefff" />
      <circle className="hero-dot hero-dot-d2" cx="1030" cy="200" r="2.5" fill="#9aefff" />

      {/* Floating status widgets, echoing the reference's dashboard-card motif with our own labels.
          Kept in the rightmost third of the viewBox and given an opaque panel fill so they still
          read clearly under the left-to-right darkening overlay that keeps the headline legible. */}
      <g transform="translate(890,70)">
        <g className="hero-drift">
          <rect width="190" height="76" rx="10" fill="#0c1618" fillOpacity="0.92" stroke="#19d9f2" strokeOpacity="0.45" />
          <text x="16" y="26" fill="#9aefff" fontSize="10" letterSpacing="1.5" fontFamily="ui-sans-serif, system-ui">
            LIVE PROTECTION
          </text>
          <polyline
            points="16,58 36,46 56,54 76,32 96,40 116,22 136,36 156,28 172,34"
            fill="none"
            stroke="#19d9f2"
            strokeWidth="1.5"
            strokeOpacity="1"
          />
        </g>
      </g>
      <g transform="translate(940,290)">
        <g className="hero-drift-slow">
          <rect width="180" height="70" rx="10" fill="#0c1618" fillOpacity="0.92" stroke="#19d9f2" strokeOpacity="0.45" />
          <text x="16" y="25" fill="#9aefff" fontSize="10" letterSpacing="1.5" fontFamily="ui-sans-serif, system-ui">
            THREAT SCAN
          </text>
          <rect x="16" y="36" width="10" height="18" fill="#19d9f2" fillOpacity="0.7" />
          <rect x="32" y="28" width="10" height="26" fill="#19d9f2" fillOpacity="0.85" />
          <rect x="48" y="40" width="10" height="14" fill="#19d9f2" fillOpacity="0.6" />
          <rect x="64" y="22" width="10" height="32" fill="#19d9f2" fillOpacity="1" />
          <rect x="80" y="32" width="10" height="22" fill="#19d9f2" fillOpacity="0.7" />
          <text x="100" y="48" fill="#e5e2e1" fontSize="9" fontFamily="ui-sans-serif, system-ui" opacity="0.85">
            0 threats
          </text>
        </g>
      </g>

      <g stroke="#19d9f2" strokeOpacity="0.12" strokeWidth="1">
        <line x1="600" y1="0" x2="600" y2="600" />
        <line x1="820" y1="0" x2="820" y2="600" />
        <line x1="1040" y1="0" x2="1040" y2="600" />
      </g>
    </svg>
  )
}
