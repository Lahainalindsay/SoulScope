type CymaticSigilProps = {
  amplitude: number;
  className?: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export default function CymaticSigil({ amplitude, className = "" }: CymaticSigilProps) {
  const a = clamp(amplitude, 0, 1);
  const rings = 6;
  const glow = 0.12 + a * 0.2;
  const outerRadius = 88 + a * 10;
  const midRadius = 58 + a * 8;
  const innerRadius = 28 + a * 5;
  const petalRadius = 42 + a * 6;

  const radialPoints = Array.from({ length: 6 }).map((_, index) => {
    const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2;
    return {
      x: 110 + Math.cos(angle) * outerRadius,
      y: 110 + Math.sin(angle) * outerRadius,
    };
  });

  const flowerPoints = Array.from({ length: 6 }).map((_, index) => {
    const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2;
    return {
      x: 110 + Math.cos(angle) * petalRadius,
      y: 110 + Math.sin(angle) * petalRadius,
    };
  });

  return (
    <div className={className}>
      <svg viewBox="0 0 220 220" className="h-full w-full" aria-hidden="true">
        <defs>
          <radialGradient id="soulscope-cymatic-rg" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor={`rgba(255,255,255,${glow})`} />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          <linearGradient id="soulscope-cymatic-line" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(125,211,252,0.9)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.92)" />
            <stop offset="100%" stopColor="rgba(16,185,129,0.82)" />
          </linearGradient>
          <filter id="soulscope-cymatic-soft">
            <feGaussianBlur stdDeviation="0.7" />
          </filter>
          <filter id="soulscope-cymatic-glow">
            <feGaussianBlur stdDeviation="2.2" />
          </filter>
        </defs>

        <circle cx="110" cy="110" r="110" fill="url(#soulscope-cymatic-rg)" />

        <g
          className="soulscope-cymatic-spin"
          style={{
            transformOrigin: "110px 110px",
            animationDuration: `${22 - a * 7}s`,
          }}
        >
          {Array.from({ length: rings }).map((_, index) => {
            const radius = innerRadius + index * 14;
            return (
              <circle
                key={`ring-${index}`}
                cx="110"
                cy="110"
                r={radius}
                fill="none"
                stroke="url(#soulscope-cymatic-line)"
                opacity={0.1 + a / (index + 3)}
                strokeWidth={0.9 + a * 0.2}
                filter="url(#soulscope-cymatic-soft)"
              />
            );
          })}

          <polygon
            points={radialPoints.map((point) => `${point.x},${point.y}`).join(" ")}
            fill="none"
            stroke="url(#soulscope-cymatic-line)"
            strokeWidth="1"
            opacity={0.42 + a * 0.18}
          />

          <polygon
            points={radialPoints.map((point, index) => `${radialPoints[(index + 1) % 6].x},${radialPoints[(index + 1) % 6].y}`).join(" ")}
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="0.8"
            opacity="0.65"
          />

          {radialPoints.map((point, index) => (
            <line
              key={`spoke-${index}`}
              x1="110"
              y1="110"
              x2={point.x}
              y2={point.y}
              stroke="rgba(255,255,255,0.14)"
              strokeWidth="0.75"
            />
          ))}

          {flowerPoints.map((point, index) => (
            <circle
              key={`flower-${index}`}
              cx={point.x}
              cy={point.y}
              r={midRadius}
              fill="none"
              stroke="url(#soulscope-cymatic-line)"
              strokeWidth="0.8"
              opacity={0.16 + a * 0.12}
            />
          ))}

          <circle
            cx="110"
            cy="110"
            r={midRadius}
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="0.9"
            opacity="0.8"
          />
        </g>

        <g
          className="soulscope-cymatic-pulse"
          style={{
            transformOrigin: "110px 110px",
            animationDuration: `${2.8 - a * 1.1}s`,
          }}
        >
          <circle cx="110" cy="110" r={18 + a * 10} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.45)" strokeWidth="0.8" />
          <circle cx="110" cy="110" r={12 + a * 4} fill="none" stroke="rgba(103,232,249,0.45)" strokeWidth="1" filter="url(#soulscope-cymatic-glow)" />
          <circle cx="110" cy="110" r={6 + a * 2.5} fill="rgba(255,255,255,0.9)" />
        </g>

        {Array.from({ length: 12 }).map((_, index) => {
          const angle = (index / 12) * Math.PI * 2;
          const radius = 78 + a * 18 + (index % 2 === 0 ? 8 : -4);
          const x = 110 + Math.cos(angle) * radius;
          const y = 110 + Math.sin(angle) * radius;
          return <circle key={`dot-${index}`} cx={x} cy={y} r={1.3 + a * 0.6} fill="rgba(255,255,255,0.72)" opacity={0.45 + a * 0.3} />;
        })}
      </svg>

      <style jsx>{`
        .soulscope-cymatic-spin {
          animation: soulscope-cymatic-spin linear infinite;
        }

        .soulscope-cymatic-pulse {
          animation: soulscope-cymatic-pulse ease-in-out infinite;
        }

        @keyframes soulscope-cymatic-spin {
          from {
            transform: rotate(0deg) scale(1);
          }
          50% {
            transform: rotate(180deg) scale(1.025);
          }
          to {
            transform: rotate(360deg) scale(1);
          }
        }

        @keyframes soulscope-cymatic-pulse {
          0%,
          100% {
            transform: scale(0.98);
            opacity: 0.86;
          }
          50% {
            transform: scale(1.05);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
