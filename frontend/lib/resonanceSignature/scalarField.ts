import { CENTER, DIMENSION_VISUAL_REGISTRY, MAX_FIELD_RADIUS, SCALAR_GRID_SIZE } from "./registry";
import { buildGeometrySeed, createSeededPrng, sha256Hex } from "./seed";
import type { NormalizedResonanceSignature, ScalarField, SignatureConstellationId } from "./types";

const CONSTELLATIONS: SignatureConstellationId[] = ["COG", "REG", "CAP", "EXP"];
const TAU = Math.PI * 2;

function clamp01(value: number) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function angleDistance(left: number, right: number) {
  return Math.atan2(Math.sin(left - right), Math.cos(left - right));
}

function sampleField(input: NormalizedResonanceSignature, x: number, y: number, seed: string) {
  const dx = x - CENTER;
  const dy = y - CENTER;
  const radiusPx = Math.hypot(dx, dy);
  const r = radiusPx / MAX_FIELD_RADIUS;
  if (r > 1.08) return 0;
  const theta = Math.atan2(dy, dx);
  const prng = createSeededPrng(seed);
  const acoustic = input.acousticVisualInputs ?? {};
  const pitchBreadth = 0.04 + (acoustic.pitchRange ?? 0.5) * 0.16;
  const edgeDefinition = 0.72 + (acoustic.hnr ?? 0.55) * 0.44;
  const formantCoherence = 0.72 + (acoustic.formantStability ?? 0.5) * 0.32;
  const core = Math.exp(-Math.pow(r / (0.14 + input.overallConfidence * 0.08), 2)) * (0.22 + input.overallCoherence * 0.24);
  let total = core;

  for (const constellationId of CONSTELLATIONS) {
    const constellation = input.constellations[constellationId];
    const anchor = (constellation.anchorAngle * Math.PI) / 180;
    const angularEnvelope = Math.exp(-Math.pow(angleDistance(theta, anchor) / (0.78 + pitchBreadth), 2));
    for (const [dimensionIndex, dimension] of constellation.dimensions.entries()) {
      if (dimension.unresolved || dimension.normalizedMean === null) continue;
      const registry = DIMENSION_VISUAL_REGISTRY[dimension.dimensionId];
      const phase = prng() * TAU + registry.phaseBehavior * dimensionIndex;
      const harmonic = Math.round(registry.harmonicOrderRange[0] + (registry.harmonicOrderRange[1] - registry.harmonicOrderRange[0]) * dimension.normalizedMean);
      const bandMid = (registry.radialBand[0] + registry.radialBand[1]) / 2;
      const bandWidth = registry.radialBand[1] - registry.radialBand[0] + dimension.uncertainty * 0.16;
      const radialEnvelope = Math.exp(-Math.pow((r - bandMid * (0.82 + dimension.normalizedMean * 0.28)) / Math.max(0.08, bandWidth), 2));
      const continuity = Math.max(0.12, dimension.evidenceCoverage);
      const gap = Math.sin(theta * (5 + dimensionIndex) + phase) > 1 - dimension.missingArc ? 0.18 : 1;
      const wave = Math.sin(harmonic * theta + registry.angularBias + phase + r * (8 + dimension.normalizedMean * 10));
      const counter = dimension.contradiction > 0
        ? Math.cos((harmonic + 2) * theta - phase + r * 12) * dimension.contradiction * registry.interactionBehavior * angularEnvelope
        : 0;
      total += (
        wave * registry.amplitudeInfluence * dimension.normalizedMean * dimension.confidence * radialEnvelope * angularEnvelope * continuity * gap
        + counter * radialEnvelope
      ) * edgeDefinition * formantCoherence;
    }
  }

  const interaction = Math.sin(theta * 4 + r * 18) * input.overallCoherence * Math.exp(-Math.pow((r - 0.48) / 0.38, 2)) * 0.18;
  const texture = Math.sin(x * 0.037 + y * 0.021 + Number.parseInt(seed.slice(0, 4), 16)) * (acoustic.jitter ?? 0.08) * 0.08;
  return clamp01(Math.abs(total + interaction + texture) * (0.72 + input.overallCoverage * 0.42));
}

export function buildScalarField(input: NormalizedResonanceSignature, gridSize = SCALAR_GRID_SIZE): ScalarField {
  const seed = buildGeometrySeed(input);
  const values: number[] = [];
  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const px = (x / (gridSize - 1)) * 1200;
      const py = (y / (gridSize - 1)) * 1200;
      values.push(Number(sampleField(input, px, py, seed).toFixed(6)));
    }
  }
  return Object.freeze({
    width: gridSize,
    height: gridSize,
    values,
    checksum: sha256Hex(values.map((value) => value.toFixed(6)).join("|")).slice(0, 24),
  });
}
