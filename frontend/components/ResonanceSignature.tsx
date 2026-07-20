import { memo, useId, useMemo } from "react";
import styles from "./ResonanceSignature.module.css";

export type ResonanceSignatureDatum = {
  id: string;
  value: number;
  weight?: number;
};

export type ResonanceSignatureVisualState = {
  density: number;
  coherence: number;
  asymmetry: number;
  expansion: number;
  centerCalm: number;
};

export type ResonanceSignatureRegion = {
  id: string;
  label: string;
  description?: string;
};

export type ResonanceSignatureProps = {
  data: ResonanceSignatureDatum[];
  visualState?: ResonanceSignatureVisualState;
  label?: string;
  size?: number;
  progress?: number;
  interactiveRegions?: ResonanceSignatureRegion[];
  onRegionSelect?: (region: ResonanceSignatureRegion) => void;
  className?: string;
};

type Point = { x: number; y: number };

const VIEWBOX = 640;
const CENTER = VIEWBOX / 2;
const TAU = Math.PI * 2;
const DEFAULT_VISUAL_STATE: ResonanceSignatureVisualState = {
  density: 0.5,
  coherence: 0.5,
  asymmetry: 0.25,
  expansion: 0.5,
  centerCalm: 0.5,
};

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function normalizeVisualState(state?: ResonanceSignatureVisualState): ResonanceSignatureVisualState {
  return {
    density: clamp(state?.density ?? DEFAULT_VISUAL_STATE.density),
    coherence: clamp(state?.coherence ?? DEFAULT_VISUAL_STATE.coherence),
    asymmetry: clamp(state?.asymmetry ?? DEFAULT_VISUAL_STATE.asymmetry),
    expansion: clamp(state?.expansion ?? DEFAULT_VISUAL_STATE.expansion),
    centerCalm: clamp(state?.centerCalm ?? DEFAULT_VISUAL_STATE.centerCalm),
  };
}

function hashString(input: string) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededUnit(seed: number, offset: number) {
  let value = (seed + Math.imul(offset + 1, 0x6d2b79f5)) >>> 0;
  value ^= value >>> 15;
  value = Math.imul(value, value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
}

function normalizeData(data: ResonanceSignatureDatum[]) {
  return [...data]
    .filter((datum) => Number.isFinite(datum.value))
    .map((datum) => ({
      ...datum,
      value: clamp(datum.value),
      weight: clamp(datum.weight ?? 1, 0.05, 1),
    }))
    .sort((left, right) => left.id.localeCompare(right.id));
}

function buildSeed(data: ResonanceSignatureDatum[], visualState: ResonanceSignatureVisualState) {
  const canonical = data
    .map((datum) => `${datum.id}:${datum.value.toFixed(5)}:${(datum.weight ?? 1).toFixed(3)}`)
    .join("|");
  const visual = Object.values(visualState).map((value) => value.toFixed(4)).join(":");
  return hashString(`${canonical || "soulscope-resonance-signature"}|${visual}`);
}

function catmullRomPath(points: Point[]) {
  if (points.length < 3) return "";
  const closed = [...points, points[0], points[1], points[2]];
  let path = `M ${closed[1].x.toFixed(2)} ${closed[1].y.toFixed(2)}`;

  for (let index = 1; index <= points.length; index += 1) {
    const p0 = closed[index - 1];
    const p1 = closed[index];
    const p2 = closed[index + 1];
    const p3 = closed[index + 2];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    path += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  return `${path} Z`;
}

function buildContourPaths(
  data: ResonanceSignatureDatum[],
  seed: number,
  visualState: ResonanceSignatureVisualState,
) {
  const values = data.length ? data : [{ id: "baseline", value: 0.5, weight: 1 }];
  const average = values.reduce((sum, datum) => sum + datum.value * (datum.weight ?? 1), 0) /
    values.reduce((sum, datum) => sum + (datum.weight ?? 1), 0);
  const variance = values.reduce((sum, datum) => sum + Math.abs(datum.value - average), 0) / values.length;
  const contourCount = Math.round(15 + visualState.density * 25 + variance * 6);
  const sampleCount = 112;
  const expansionScale = 0.82 + visualState.expansion * 0.28;
  const coherenceDamping = 1.18 - visualState.coherence * 0.55;
  const directionalAngle = seededUnit(seed, 991) * TAU;

  return Array.from({ length: contourCount }, (_, contourIndex) => {
    const normalizedLayer = contourCount === 1 ? 0 : contourIndex / (contourCount - 1);
    const baseRadius = (38 + normalizedLayer * 226) * expansionScale;
    const points: Point[] = [];

    for (let sample = 0; sample < sampleCount; sample += 1) {
      const angle = (sample / sampleCount) * TAU;
      let displacement = 0;

      values.forEach((datum, datumIndex) => {
        const phase = seededUnit(seed, datumIndex * 11 + 1) * TAU;
        const harmonic = 2 + Math.floor(seededUnit(seed, datumIndex * 11 + 2) * 6);
        const secondary = harmonic + 1 + Math.floor(seededUnit(seed, datumIndex * 11 + 3) * 4);
        const amplitude = (3 + datum.value * 12) * (datum.weight ?? 1) * coherenceDamping;
        const layerEnvelope = 0.32 + 0.68 * Math.sin(Math.PI * normalizedLayer);
        displacement += Math.sin(angle * harmonic + phase + contourIndex * 0.09) * amplitude * layerEnvelope;
        displacement += Math.cos(angle * secondary - phase * 0.7 - contourIndex * 0.05) * amplitude * 0.28;
      });

      const interference = Math.sin(angle * (5 + (seed % 4)) + normalizedLayer * TAU * 1.5) *
        (1.5 + variance * 7) * coherenceDamping;
      const directionalPull = Math.cos(angle - directionalAngle) * visualState.asymmetry * 22 *
        (0.35 + normalizedLayer * 0.65);
      const secondaryPull = Math.sin((angle - directionalAngle) * 2) * visualState.asymmetry * 7;
      const radius = baseRadius
        + displacement / Math.max(1, values.length * 0.62)
        + interference
        + directionalPull
        + secondaryPull;
      points.push({
        x: CENTER + Math.cos(angle) * radius,
        y: CENTER + Math.sin(angle) * radius,
      });
    }

    return {
      path: catmullRomPath(points),
      opacity: 0.12 + normalizedLayer * (0.28 + visualState.density * 0.18),
      width: 0.65 + (1 - normalizedLayer) * (0.65 + visualState.coherence * 0.55),
      delay: normalizedLayer * 0.9,
    };
  });
}

function ResonanceSignatureComponent({
  data,
  visualState,
  label = "Your Resonance Signature",
  size = 640,
  progress = 1,
  interactiveRegions = [],
  onRegionSelect,
  className = "",
}: ResonanceSignatureProps) {
  const normalized = useMemo(() => normalizeData(data), [data]);
  const normalizedVisualState = useMemo(() => normalizeVisualState(visualState), [visualState]);
  const seed = useMemo(() => buildSeed(normalized, normalizedVisualState), [normalized, normalizedVisualState]);
  const contours = useMemo(
    () => buildContourPaths(normalized, seed, normalizedVisualState),
    [normalized, seed, normalizedVisualState],
  );
  const id = useId().replace(/:/g, "");
  const reveal = clamp(progress);
  const coreRadius = 5 + normalizedVisualState.centerCalm * 8;
  const haloOpacity = 0.06 + normalizedVisualState.centerCalm * 0.1;

  return (
    <div className={`${styles.shell} ${className}`.trim()} style={{ width: size, maxWidth: "100%" }}>
      <svg
        viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
        className={styles.svg}
        role="img"
        aria-label={label}
        data-signature-seed={seed}
        data-density={normalizedVisualState.density.toFixed(3)}
        data-coherence={normalizedVisualState.coherence.toFixed(3)}
        data-asymmetry={normalizedVisualState.asymmetry.toFixed(3)}
        data-expansion={normalizedVisualState.expansion.toFixed(3)}
        data-center-calm={normalizedVisualState.centerCalm.toFixed(3)}
      >
        <defs>
          <radialGradient id={`${id}-halo`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="currentColor" stopOpacity={haloOpacity} />
            <stop offset="58%" stopColor="currentColor" stopOpacity={haloOpacity * 0.42} />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
          <filter id={`${id}-glow`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={2 + normalizedVisualState.centerCalm * 4} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id={`${id}-reveal`}>
            <circle cx={CENTER} cy={CENTER} r={292 * reveal} />
          </clipPath>
        </defs>

        <circle cx={CENTER} cy={CENTER} r="292" fill={`url(#${id}-halo)`} className={styles.halo} />

        <g clipPath={`url(#${id}-reveal)`} className={styles.breathe}>
          <g className={styles.rotate}>
            {contours.map((contour, index) => (
              <path
                key={`${seed}-${index}`}
                d={contour.path}
                fill="none"
                stroke="currentColor"
                strokeWidth={contour.width}
                strokeOpacity={contour.opacity}
                vectorEffect="non-scaling-stroke"
                className={styles.contour}
                style={{ animationDelay: `${contour.delay}s` }}
              />
            ))}
          </g>
          <circle
            cx={CENTER}
            cy={CENTER}
            r={coreRadius}
            fill="currentColor"
            opacity={0.28 + normalizedVisualState.centerCalm * 0.28}
            filter={`url(#${id}-glow)`}
            className={styles.core}
          />
        </g>

        {interactiveRegions.length > 0 ? (
          <g className={styles.regions} aria-hidden={!onRegionSelect}>
            {interactiveRegions.map((region, index) => {
              const angle = (index / interactiveRegions.length) * TAU - Math.PI / 2;
              const x = CENTER + Math.cos(angle) * 196;
              const y = CENTER + Math.sin(angle) * 196;
              return (
                <circle
                  key={region.id}
                  cx={x}
                  cy={y}
                  r="30"
                  className={styles.region}
                  role={onRegionSelect ? "button" : undefined}
                  tabIndex={onRegionSelect ? 0 : undefined}
                  aria-label={region.label}
                  onClick={onRegionSelect ? () => onRegionSelect(region) : undefined}
                  onKeyDown={onRegionSelect ? (event) => {
                    if (event.key === "Enter" || event.key === " ") onRegionSelect(region);
                  } : undefined}
                />
              );
            })}
          </g>
        ) : null}
      </svg>
    </div>
  );
}

export default memo(ResonanceSignatureComponent);
