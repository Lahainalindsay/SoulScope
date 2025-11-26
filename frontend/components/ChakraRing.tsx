"use client";

import { chakraData } from "../lib/chakras";

type ChakraRingProps = {
  scores: number[];
};

const size = 360;
const center = size / 2;
const baseRadius = 70;
const ringGap = 18;

const sacredGeometryLines = [
  "M180 30 L300 330",
  "M180 30 L60 330",
  "M60 120 L300 120",
  "M30 220 L330 220",
  "M110 60 L250 330",
  "M250 60 L110 330",
];

export default function ChakraRing({ scores }: ChakraRingProps) {
  const safeScores = chakraData.map((_, index) => Math.max(0, scores[index] ?? 0));
  const maxValue = Math.max(...safeScores, 1);
  const normalized = safeScores.map((value) => Math.round((value / maxValue) * 100));

  return (
    <div className="relative mx-auto flex h-[26rem] w-[26rem] items-center justify-center">
      <div className="absolute inset-10 rounded-full bg-gradient-to-br from-amber-200/10 via-transparent to-fuchsia-500/10 blur-3xl" />
      <div className="absolute inset-0 rounded-full border border-white/5" />
      <svg viewBox={`0 0 ${size} ${size}`} className="pointer-events-none absolute inset-0 drop-shadow-[0_0_30px_rgba(0,0,0,0.35)]">
        <defs>
          {chakraData.map((chakra, index) => (
            <linearGradient key={chakra.name} id={`chakra-gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={chakra.accent} stopOpacity={0.95} />
              <stop offset="100%" stopColor={chakra.color} stopOpacity={0.5} />
            </linearGradient>
          ))}
        </defs>

        <g className="opacity-40">
          <circle cx={center} cy={center} r={baseRadius - 20} stroke="url(#chakra-gradient-0)" strokeOpacity={0.4} fill="none" />
          <polygon
            points="180,40 305,120 260,290 100,290 55,120"
            fill="none"
            stroke="white"
            strokeOpacity={0.08}
            className="animate-[spin_45s_linear_infinite]"
          />
          {sacredGeometryLines.map((d, index) => (
            <path key={`sacred-${index}`} d={d} stroke="white" strokeOpacity={0.05} fill="none" />
          ))}
        </g>

        {chakraData.map((chakra, index) => {
          const radius = baseRadius + index * ringGap;
          const circumference = 2 * Math.PI * radius;
          const dashOffset = circumference - (normalized[index] / 100) * circumference;
          return (
            <g key={chakra.name} className="transition-all duration-700 ease-out">
              <circle cx={center} cy={center} r={radius} stroke="rgba(255,255,255,0.05)" fill="none" strokeWidth={6} />
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={`url(#chakra-gradient-${index})`}
                strokeWidth={6}
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                className="animate-[pulse_4s_ease-in-out_infinite]"
                style={{ animationDelay: `${index * 120}ms` }}
              />
            </g>
          );
        })}
      </svg>

      <div className="relative flex flex-col items-center text-center">
        <p className="text-xs uppercase tracking-[0.6em] text-amber-100/70">chakra</p>
        <p className="text-3xl font-light text-white">Resonance</p>
        <p className="mt-1 text-[13px] text-gray-300">Live spectral balance</p>
      </div>

      {chakraData.map((chakra, index) => {
        const angle = (index / chakraData.length) * Math.PI * 2 - Math.PI / 2;
        const labelRadius = baseRadius + ringGap * chakraData.length + 24;
        const left = center + Math.cos(angle) * labelRadius;
        const top = center + Math.sin(angle) * labelRadius;
        return (
          <div
            key={`label-${chakra.name}`}
            className="absolute flex flex-col items-center text-center text-[11px]"
            style={{
              left: `${left}px`,
              top: `${top}px`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className="rounded-full border border-white/15 px-2 py-1 text-[10px] uppercase tracking-wide text-white/80 backdrop-blur">
              {chakra.name}
            </div>
            <div
              className="mt-1 text-xs font-semibold"
              style={{
                color: chakra.accent,
                textShadow: "0 0 12px rgba(255,255,255,0.3)",
              }}
            >
              {normalized[index]}%
            </div>
          </div>
        );
      })}
    </div>
  );
}
