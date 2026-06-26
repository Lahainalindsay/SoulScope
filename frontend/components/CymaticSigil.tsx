import { useId } from "react";

type CymaticSigilProps = {
  amplitude: number;
  className?: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export default function CymaticSigil({ amplitude, className = "" }: CymaticSigilProps) {
  const rawId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const a = clamp(amplitude, 0, 1);
  const rings = 8;
  const glow = 0.12 + a * 0.2;
  const outerRadius = 90 + a * 12;
  const midRadius = 60 + a * 8;
  const innerRadius = 26 + a * 6;
  const petalRadius = 42 + a * 8;
  const secondPetalRadius = 72 + a * 7;
  const gradientId = `soulscope-cymatic-line-${rawId}`;
  const radialId = `soulscope-cymatic-rg-${rawId}`;
  const softId = `soulscope-cymatic-soft-${rawId}`;
  const glowId = `soulscope-cymatic-glow-${rawId}`;
  const layerConfigs = [
    { key: "mid", scale: 1, opacity: 0.86, rotate: 0, blur: 0 },
  ];

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

  const outerFlowerPoints = Array.from({ length: 12 }).map((_, index) => {
    const angle = (Math.PI * 2 * index) / 12 - Math.PI / 2;
    return {
      x: 110 + Math.cos(angle) * secondPetalRadius,
      y: 110 + Math.sin(angle) * secondPetalRadius,
    };
  });

  return (
    <div className={`soulscope-cymatic-3d ${className}`} aria-hidden="true">
      <div
        className="soulscope-cymatic-scene"
        style={{
          animationDuration: `${60 - a * 20}s`,
        }}
      >
        <div className="soulscope-cymatic-core-glow" />
        {layerConfigs.map((layer) => (
            <svg
              key={layer.key}
              viewBox="0 0 220 220"
              className={`soulscope-cymatic-layer soulscope-cymatic-layer-${layer.key}`}
              style={{
                opacity: layer.opacity,
                filter: `blur(${layer.blur}px) drop-shadow(0 18px 34px rgba(34, 211, 238, ${0.08 + a * 0.08}))`,
              transform: `translate(-50%, -50%) rotateZ(${layer.rotate}deg) scale(${layer.scale})`,
              }}
            >
            <defs>
              <radialGradient id={radialId} cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor={`rgba(255,255,255,${glow})`} />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </radialGradient>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(125,211,252,0.95)" />
                <stop offset="48%" stopColor="rgba(255,255,255,0.94)" />
                <stop offset="100%" stopColor="rgba(16,185,129,0.86)" />
              </linearGradient>
              <filter id={softId}>
                <feGaussianBlur stdDeviation="0.7" />
              </filter>
              <filter id={glowId}>
                <feGaussianBlur stdDeviation="2.2" />
              </filter>
            </defs>

            <circle cx="110" cy="110" r="110" fill={`url(#${radialId})`} opacity={0.6} />

            <g>
              {Array.from({ length: rings }).map((_, index) => {
                const radius = innerRadius + index * 12;
                return (
                  <circle
                    key={`${layer.key}-ring-${index}`}
                    cx="110"
                    cy="110"
                    r={radius}
                    fill="none"
                    stroke={`url(#${gradientId})`}
                    opacity={0.1 + a / (index + 3)}
                    strokeWidth={0.8 + a * 0.22}
                    filter={`url(#${softId})`}
                  />
                );
              })}

              <polygon
                points={radialPoints.map((point) => `${point.x},${point.y}`).join(" ")}
                fill="rgba(34,211,238,0.025)"
                stroke={`url(#${gradientId})`}
                strokeWidth="1.05"
                opacity={0.42 + a * 0.2}
              />

              <polygon
                points={radialPoints
                  .map((_, index) => `${radialPoints[(index + 1) % 6].x},${radialPoints[(index + 1) % 6].y}`)
                  .join(" ")}
                fill="none"
                stroke="rgba(255,255,255,0.18)"
                strokeWidth="0.8"
                opacity="0.7"
              />

              {radialPoints.map((point, index) => (
                <line
                  key={`${layer.key}-spoke-${index}`}
                  x1="110"
                  y1="110"
                  x2={point.x}
                  y2={point.y}
                  stroke="rgba(255,255,255,0.16)"
                  strokeWidth="0.75"
                />
              ))}

              {flowerPoints.map((point, index) => (
                <circle
                  key={`${layer.key}-flower-${index}`}
                  cx={point.x}
                  cy={point.y}
                  r={midRadius}
                  fill="none"
                  stroke={`url(#${gradientId})`}
                  strokeWidth="0.85"
                  opacity={0.16 + a * 0.13}
                />
              ))}

              {outerFlowerPoints.map((point, index) => (
                <circle
                  key={`${layer.key}-outer-flower-${index}`}
                  cx={point.x}
                  cy={point.y}
                  r={petalRadius}
                  fill="none"
                  stroke="rgba(255,255,255,0.16)"
                  strokeWidth="0.75"
                  opacity={0.2 + a * 0.14}
                />
              ))}

              {outerFlowerPoints.map((point, index) => (
                <line
                  key={`${layer.key}-outer-link-${index}`}
                  x1={point.x}
                  y1={point.y}
                  x2={outerFlowerPoints[(index + 1) % outerFlowerPoints.length].x}
                  y2={outerFlowerPoints[(index + 1) % outerFlowerPoints.length].y}
                  stroke="rgba(125,211,252,0.14)"
                  strokeWidth="0.7"
                />
              ))}

              <circle
                cx="110"
                cy="110"
                r={midRadius}
                fill="none"
                stroke="rgba(255,255,255,0.34)"
                strokeWidth="0.9"
                opacity="0.86"
              />

              <circle
                cx="110"
                cy="110"
                r={petalRadius}
                fill="none"
                stroke="rgba(192,132,252,0.26)"
                strokeWidth="0.9"
                opacity="0.86"
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
              <circle cx="110" cy="110" r={12 + a * 4} fill="none" stroke="rgba(103,232,249,0.45)" strokeWidth="1" filter={`url(#${glowId})`} />
              <circle cx="110" cy="110" r={6 + a * 2.5} fill="rgba(255,255,255,0.9)" />
            </g>

            {Array.from({ length: 12 }).map((_, index) => {
              const angle = (index / 12) * Math.PI * 2;
              const radius = 78 + a * 18 + (index % 2 === 0 ? 8 : -4);
              const x = 110 + Math.cos(angle) * radius;
              const y = 110 + Math.sin(angle) * radius;
              return (
                <circle
                  key={`${layer.key}-dot-${index}`}
                  cx={x}
                  cy={y}
                  r={1.3 + a * 0.6}
                  fill="rgba(255,255,255,0.72)"
                  opacity={0.45 + a * 0.3}
                />
              );
            })}
          </svg>
        ))}
      </div>

      <style jsx>{`
        .soulscope-cymatic-3d {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 180px;
        }

        .soulscope-cymatic-scene {
          position: absolute;
          inset: 0;
          animation: soulscope-cymatic-spin linear infinite;
          transform-origin: 50% 50%;
          will-change: transform;
        }

        .soulscope-cymatic-core-glow {
          position: absolute;
          inset: 13%;
          border-radius: 999px;
          background:
            radial-gradient(circle at 50% 44%, rgba(255, 255, 255, ${0.16 + a * 0.12}), transparent 34%),
            radial-gradient(circle at 50% 50%, rgba(34, 211, 238, 0.24), transparent 58%),
            radial-gradient(circle at 48% 58%, rgba(16, 185, 129, 0.16), transparent 68%);
          box-shadow:
            0 0 42px rgba(34, 211, 238, ${0.18 + a * 0.12}),
            inset 0 0 34px rgba(255, 255, 255, 0.08);
          transform: scale(0.84);
        }

        .soulscope-cymatic-layer {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 100%;
          height: 100%;
          overflow: visible;
          transform-origin: 50% 50%;
        }

        .soulscope-cymatic-layer-back {
          mix-blend-mode: screen;
        }

        .soulscope-cymatic-pulse {
          animation: soulscope-cymatic-pulse ease-in-out infinite;
        }

        @keyframes soulscope-cymatic-spin {
          from {
            transform: rotate(0deg);
          }
          50% {
            transform: rotate(180deg);
          }
          to {
            transform: rotate(360deg);
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
