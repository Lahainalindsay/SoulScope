"use client";

import React from "react";

const BASE_CHAKRA_COLORS: Record<string, string> = {
  root: "#E53935",
  sacral: "#FF9800",
  solar_plexus: "#FDD835",
  heart: "#43A047",
  throat: "#1E88E5",
  third_eye: "#5E35B1",
  crown: "#8E24AA",
};

const CHAKRA_COLORS: Record<string, string> = {
  ...BASE_CHAKRA_COLORS,
  solar: BASE_CHAKRA_COLORS.solar_plexus,
  thirdEye: BASE_CHAKRA_COLORS.third_eye,
};

export type ChakraVisualData = {
  root: number;
  sacral: number;
  solar: number;
  heart: number;
  throat: number;
  thirdEye: number;
  crown: number;
};

type ChakraVisualProps = {
  data: ChakraVisualData;
};

const chakraMeta: { key: keyof ChakraVisualData; name: string }[] = [
  { key: "crown", name: "Crown" },
  { key: "thirdEye", name: "Third Eye" },
  { key: "throat", name: "Throat" },
  { key: "heart", name: "Heart" },
  { key: "solar", name: "Solar Plexus" },
  { key: "sacral", name: "Sacral" },
  { key: "root", name: "Root" },
];

export default function ChakraVisual({ data }: ChakraVisualProps) {

  return (
    <div className="relative flex flex-col items-center gap-4 py-6">
      <svg className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 opacity-10" width="320" height="420" viewBox="0 0 400 400">
        <path d="M200,200 Q200,100 100,100 Q0,100 0,200 Q0,300 100,300 Q200,300 200,200 Z" fill="none" stroke="#FDD835" strokeWidth="1.2" />
        <path d="M200,200 Q300,200 300,100 Q300,0 200,0 Q100,0 100,100 Q100,200 200,200" fill="none" stroke="#FDD835" strokeWidth="0.8" />
        <path d="M200,200 Q200,300 300,300 Q400,300 400,200 Q400,100 300,100 Q200,100 200,200" fill="none" stroke="#FDD835" strokeWidth="0.6" />
      </svg>

      {chakraMeta.map((chakra, index) => {
        const intensity = data[chakra.key] ?? 0;
        const glowSize = 30 + intensity;
        const color = CHAKRA_COLORS[chakra.key] ?? "#888";
        return (
          <div key={chakra.key} className="relative flex flex-col items-center">
            <div
              className="absolute -z-10 rounded-full blur-3xl transition-all duration-500 ease-out animate-pulse"
              style={{
                width: `${glowSize}px`,
                height: `${glowSize}px`,
                backgroundColor: color,
                opacity: Math.min(0.6, 0.2 + intensity / 160),
                animationDelay: `${index * 120}ms`,
              }}
            />
            <div
              className="flex items-center justify-center rounded-full border border-white/40 shadow-inner transition-transform duration-300"
              style={{
                width: `${24 + intensity / 3}px`,
                height: `${24 + intensity / 3}px`,
                backgroundColor: color,
                opacity: Math.max(0.25, intensity / 100),
                boxShadow: `0 0 ${10 + intensity / 4}px ${color}55`,
              }}
            >
              <span className="text-[10px] font-semibold text-white/80">{Math.round(intensity)}%</span>
            </div>
            <p className="mt-2 text-xs uppercase tracking-wide text-white/80">{chakra.name}</p>
          </div>
        );
      })}
    </div>
  );
}
