import { CONSTELLATION_ANCHORS, MAX_FIELD_RADIUS } from "./registry";
import type {
  NormalizedResonanceSignature,
  NormalizedSignatureConstellation,
  NormalizedSignatureDimension,
  ResonanceSignatureInputV1,
  SignatureConstellationId,
} from "./types";

const CONSTELLATIONS: SignatureConstellationId[] = ["COG", "REG", "CAP", "EXP"];

export function clamp01(value: number) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

export function lerp(min: number, max: number, value: number) {
  return min + (max - min) * clamp01(value);
}

function round(value: number, places = 6) {
  return Number(value.toFixed(places));
}

function normalizeDimension(dimension: ResonanceSignatureInputV1["constellations"][SignatureConstellationId]["dimensions"][number]): NormalizedSignatureDimension {
  const unresolved = dimension.unresolved || dimension.mean === null;
  const uncertainty = dimension.upperBound !== null && dimension.lowerBound !== null
    ? clamp01(dimension.upperBound - dimension.lowerBound)
    : 1;
  const mean = unresolved ? null : clamp01(dimension.mean ?? 0);
  const coverage = clamp01(dimension.evidenceCoverage);
  return {
    ...dimension,
    unresolved,
    normalizedMean: mean,
    uncertainty: round(uncertainty),
    radialExtent: round(lerp(0.32 * MAX_FIELD_RADIUS, 0.94 * MAX_FIELD_RADIUS, mean ?? 0.5)),
    opacity: round(0.18 + 0.82 * clamp01(dimension.confidence)),
    contourCount: Math.round(8 + coverage * 28),
    lineSpread: round(1.5 + uncertainty * 18),
    missingArc: unresolved ? round(0.18 + (1 - coverage) * 0.36) : round((1 - coverage) * 0.22),
  };
}

export function normalizeSignatureInput(input: ResonanceSignatureInputV1): NormalizedResonanceSignature {
  const constellations = Object.fromEntries(CONSTELLATIONS.map((constellationId) => {
    const source = input.constellations[constellationId];
    const dimensions = source.dimensions.map(normalizeDimension);
    const normalized: NormalizedSignatureConstellation = {
      ...source,
      confidence: clamp01(source.confidence),
      evidenceCoverage: clamp01(source.evidenceCoverage),
      contradiction: clamp01(source.contradiction),
      coherence: clamp01(source.coherence),
      dimensions,
      anchorAngle: CONSTELLATION_ANCHORS[constellationId],
      fieldWeight: round(clamp01(source.confidence) * (0.45 + clamp01(source.evidenceCoverage) * 0.55)),
    };
    return [constellationId, normalized];
  })) as NormalizedResonanceSignature["constellations"];

  return Object.freeze({
    ...input,
    overallConfidence: clamp01(input.overallConfidence),
    overallCoverage: clamp01(input.overallCoverage),
    overallCoherence: clamp01(input.overallCoherence),
    baselineTrust: clamp01(input.baselineTrust),
    constellations,
  });
}
