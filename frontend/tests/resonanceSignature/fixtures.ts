import type { ResonanceSignatureInputV1, SignatureConstellationId } from "../../lib/resonanceSignature";

export const CONSTELLATIONS: SignatureConstellationId[] = ["COG", "REG", "CAP", "EXP"];

export function fixtureInput(overrides: Partial<ResonanceSignatureInputV1> = {}): ResonanceSignatureInputV1 {
  const constellations = Object.fromEntries(CONSTELLATIONS.map((constellationId, constellationIndex) => {
    const dimensions = [0, 1, 2, 3].map((index) => ({
      dimensionId: `${constellationId}-P${index + 1}`,
      mean: 0.54 + constellationIndex * 0.04 + index * 0.035,
      lowerBound: 0.46 + constellationIndex * 0.04 + index * 0.035,
      upperBound: 0.62 + constellationIndex * 0.04 + index * 0.035,
      confidence: 0.82,
      evidenceCoverage: 0.86,
      contradiction: 0.04,
      coherence: 0.78,
      unresolved: false,
      momentum: 0,
    }));
    return [constellationId, {
      constellationId,
      dimensions,
      confidence: 0.82,
      evidenceCoverage: 0.86,
      contradiction: 0.04,
      coherence: 0.78,
    }];
  })) as unknown as ResonanceSignatureInputV1["constellations"];

  return {
    contractVersion: "soulscope.resonance-signature.v1",
    scanId: "fixture-scan",
    resultVersion: "fixture-result-v1",
    rendererVersion: "soulscope-signature-renderer-v1.0.0",
    overallConfidence: 0.82,
    overallCoverage: 0.86,
    overallCoherence: 0.78,
    baselineTrust: 0,
    constellations,
    acousticVisualInputs: {
      pitchRange: 0.64,
      pitchStability: 0.72,
      harmonicRichness: 0.68,
      spectralFlatness: 0.24,
      hnr: 0.74,
      jitter: 0.08,
      shimmer: 0.11,
      pauseDensity: 0.28,
      phonationRatio: 0.7,
      formantStability: 0.76,
    },
    ...overrides,
  };
}

export function withDimension(input: ResonanceSignatureInputV1, dimensionId: string, patch: Record<string, unknown>): ResonanceSignatureInputV1 {
  const constellationId = dimensionId.slice(0, 3) as SignatureConstellationId;
  const constellation = input.constellations[constellationId];
  return {
    ...input,
    constellations: {
      ...input.constellations,
      [constellationId]: {
        ...constellation,
        dimensions: constellation.dimensions.map((dimension) =>
          dimension.dimensionId === dimensionId ? { ...dimension, ...patch } : dimension,
        ),
      },
    },
  };
}
