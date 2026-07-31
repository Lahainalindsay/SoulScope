import { CENTER, CONSTELLATION_ANCHORS, DIMENSION_VISUAL_REGISTRY, MAX_FIELD_RADIUS, SCALAR_GRID_SIZE } from "./registry";
import { buildGeometrySeed, createSeededPrng, sha256Hex } from "./seed";
import type { NormalizedResonanceSignature, ScalarField, SignatureConstellationId } from "./types";

const CONSTELLATIONS: SignatureConstellationId[] = ["COG", "REG", "CAP", "EXP"];
const TAU = Math.PI * 2;

type ConstellationContext = Readonly<{
  id: SignatureConstellationId;
  anchor: number;
  confidence: number;
  coverage: number;
  coherence: number;
  fieldWeight: number;
  momentum: number;
  phaseOffsets: readonly number[];
}>;

type SampleContext = Readonly<{
  constellations: readonly ConstellationContext[];
  centerPhases: readonly number[];
  noiseSeed: number;
}>;

function clamp01(value: number) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function angleDistance(left: number, right: number) {
  return Math.atan2(Math.sin(left - right), Math.cos(left - right));
}

function gaussian(distance: number, spread: number) {
  return Math.exp(-Math.pow(distance / Math.max(0.00001, spread), 2));
}

function buildSampleContext(input: NormalizedResonanceSignature, seed: string): SampleContext {
  const prng = createSeededPrng(seed);
  const constellations = CONSTELLATIONS.map((id) => {
    const constellation = input.constellations[id];
    const phaseOffsets = constellation.dimensions.map((_, index) => Number((prng() * TAU + index * 0.47).toFixed(6)));
    const momentumValues = constellation.dimensions.map((dimension) => dimension.momentum ?? 0);
    const momentum = momentumValues.length ? momentumValues.reduce((sum, value) => sum + value, 0) / momentumValues.length : 0;
    return Object.freeze({
      id,
      anchor: (CONSTELLATION_ANCHORS[id] * Math.PI) / 180,
      confidence: constellation.confidence,
      coverage: constellation.evidenceCoverage,
      coherence: constellation.coherence,
      fieldWeight: constellation.fieldWeight,
      momentum,
      phaseOffsets,
    });
  });
  const centerPhases = Array.from({ length: 10 }, (_, index) => Number((prng() * TAU + index * 0.29).toFixed(6)));
  return Object.freeze({
    constellations,
    centerPhases,
    noiseSeed: Number.parseInt(seed.slice(0, 8), 16) / 0xffffffff,
  });
}

function sampleField(input: NormalizedResonanceSignature, context: SampleContext, x: number, y: number) {
  const dx = x - CENTER;
  const dy = y - CENTER;
  const radiusPx = Math.hypot(dx, dy);
  const r = radiusPx / MAX_FIELD_RADIUS;
  if (r > 1.08) return 0;
  const theta = Math.atan2(dy, dx);
  const acoustic = input.acousticVisualInputs ?? {};
  const pitchBreadth = 0.22 + (acoustic.pitchRange ?? 0.5) * 0.44;
  const edgeDefinition = 0.6 + (acoustic.hnr ?? 0.55) * 0.52;
  const formantCoherence = 0.68 + (acoustic.formantStability ?? 0.5) * 0.4;
  const jitter = (acoustic.jitter ?? 0.08) * 0.08;
  const minWeight = Math.min(...context.constellations.map((constellation) => constellation.fieldWeight));
  const maxWeight = Math.max(...context.constellations.map((constellation) => constellation.fieldWeight));
  const balance = clamp01(1 - (maxWeight - minWeight));
  const contributions: number[] = [];
  let total = 0;

  for (const constellationContext of context.constellations) {
    const constellation = input.constellations[constellationContext.id];
    const angularSpread = 0.55 + (1 - constellationContext.coverage) * 0.44 + (1 - constellationContext.confidence) * 0.12 + pitchBreadth * 0.12;
    const directionalEnvelope = gaussian(angleDistance(theta, constellationContext.anchor), angularSpread);
    let constellationField = 0;

    for (const [dimensionIndex, dimension] of constellation.dimensions.entries()) {
      if (dimension.unresolved || dimension.normalizedMean === null) continue;
      const registry = DIMENSION_VISUAL_REGISTRY[dimension.dimensionId];
      const harmonic = Math.round(
        registry.harmonicOrderRange[0]
          + (registry.harmonicOrderRange[1] - registry.harmonicOrderRange[0]) * dimension.normalizedMean,
      );
      const radialMid = (registry.radialBand[0] + registry.radialBand[1]) / 2;
      const radialTarget = radialMid * (0.72 + dimension.normalizedMean * 0.42);
      const radialSpread = 0.09 + dimension.uncertainty * 0.26;
      const radialEnvelope = gaussian(r - radialTarget, radialSpread);
      const phase = constellationContext.phaseOffsets[dimensionIndex];
      const continuity = 0.2 + dimension.evidenceCoverage * 0.8;
      const missingMask = Math.sin(theta * (3.2 + dimensionIndex * 1.1) + phase + r * 8) > 1 - dimension.missingArc ? 0.06 : 1;
      const standing = Math.cos((harmonic - 1) * theta - phase * 0.66 + r * (6.2 + dimension.normalizedMean * 5.4));
      const primaryWave = Math.sin(harmonic * theta + registry.angularBias * 1.45 + phase + r * (7.5 + dimension.normalizedMean * 8.6));
      const contradiction = dimension.contradiction > 0
        ? Math.cos((harmonic + 2) * theta - phase + r * 11.8)
          * dimension.contradiction
          * registry.interactionBehavior
          * gaussian(angleDistance(theta, constellationContext.anchor), angularSpread * 0.78)
          * gaussian(r - radialTarget, radialSpread + 0.08)
        : 0;
      const dimSignal = (
        primaryWave * 0.72
        + standing * 0.28
      ) * registry.amplitudeInfluence * dimension.normalizedMean * dimension.confidence * radialEnvelope * continuity * missingMask;
      constellationField += (dimSignal + contradiction) * edgeDefinition * formantCoherence;
    }

    const directionalStanding = Math.sin(angleDistance(theta, constellationContext.anchor) * 3.2 + r * 5.4 + constellationContext.momentum * 4.2)
      * constellationContext.coherence
      * 0.14;
    const anchoredField = (constellationField + directionalStanding) * directionalEnvelope;
    contributions.push(anchoredField);
    total += anchoredField;
  }

  let pairwiseSupport = 0;
  for (let i = 0; i < contributions.length; i += 1) {
    for (let j = i + 1; j < contributions.length; j += 1) {
      const pair = Math.max(0, contributions[i] * contributions[j]);
      pairwiseSupport += pair;
    }
  }

  const supportCount = contributions.filter((value) => Math.abs(value) > 0.028).length;
  const centerEnvelope = gaussian(r, 0.28 + (1 - input.overallCoverage) * 0.12);
  const loops = 4 + Math.round((input.overallCoherence * 0.55 + balance * 0.45) * 6);
  let centerHarmonic = 0;
  for (let loopIndex = 0; loopIndex < loops; loopIndex += 1) {
    const phase = context.centerPhases[loopIndex];
    const loopRadius = 0.06 + loopIndex * 0.026;
    const loopSpread = 0.02 + (1 - input.overallConfidence) * 0.038;
    const radialLoop = gaussian(r - loopRadius, loopSpread);
    const angularWarp = Math.sin(theta * (1.35 + loopIndex * 0.58) + phase + r * (7 + loopIndex));
    centerHarmonic += radialLoop * (0.58 + angularWarp * 0.42);
  }
  const pairwiseGate = clamp01(pairwiseSupport * 2.6) * (supportCount >= 2 ? 1 : 0.22);
  const center = centerHarmonic * centerEnvelope * pairwiseGate * (0.35 + input.overallCoherence * 0.65);
  const centralSeed = centerEnvelope * (0.08 + input.overallConfidence * 0.12) * clamp01((supportCount - 1) / 3);
  const rotationalDrift = Math.sin(theta + r * 9.2) * (0.05 + Math.abs(context.constellations.reduce((sum, item) => sum + item.momentum, 0) / 4) * 0.08);
  const rotationalSuppression = rotationalDrift * 0.08;
  const texture = Math.sin((x * 0.016 + y * 0.018 + context.noiseSeed * 12.7) * TAU) * jitter;
  const outerMask = clamp01(1 - Math.pow(Math.max(0, r - 1), 2) * 12);
  const raw = total * 0.6 + pairwiseSupport * 0.64 + center * 0.74 + centralSeed + texture - rotationalSuppression;
  const gain = 0.72 + input.overallCoverage * 0.46;
  return clamp01((0.52 + raw * 0.58) * gain * outerMask);
}

export function buildScalarField(input: NormalizedResonanceSignature, gridSize = SCALAR_GRID_SIZE): ScalarField {
  const seed = buildGeometrySeed(input);
  const sampleContext = buildSampleContext(input, seed);
  const values: number[] = [];
  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const px = (x / (gridSize - 1)) * 1200;
      const py = (y / (gridSize - 1)) * 1200;
      values.push(Number(sampleField(input, sampleContext, px, py).toFixed(6)));
    }
  }
  return Object.freeze({
    width: gridSize,
    height: gridSize,
    values,
    checksum: sha256Hex(values.map((value) => value.toFixed(6)).join("|")).slice(0, 24),
  });
}
