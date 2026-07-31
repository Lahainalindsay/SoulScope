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
    rendererVersion: "soulscope-signature-renderer-v1.1.0",
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

function tuneConstellation(input: ResonanceSignatureInputV1, constellationId: SignatureConstellationId, patch: {
  confidence?: number;
  evidenceCoverage?: number;
  contradiction?: number;
  coherence?: number;
  meanDelta?: number;
  unresolvedDimensionIndex?: number;
}): ResonanceSignatureInputV1 {
  const constellation = input.constellations[constellationId];
  return {
    ...input,
    constellations: {
      ...input.constellations,
      [constellationId]: {
        ...constellation,
        confidence: patch.confidence ?? constellation.confidence,
        evidenceCoverage: patch.evidenceCoverage ?? constellation.evidenceCoverage,
        contradiction: patch.contradiction ?? constellation.contradiction,
        coherence: patch.coherence ?? constellation.coherence,
        dimensions: constellation.dimensions.map((dimension, index) => {
          if (patch.unresolvedDimensionIndex === index) {
            return {
              ...dimension,
              mean: null,
              lowerBound: null,
              upperBound: null,
              confidence: 0.1,
              evidenceCoverage: 0.2,
              unresolved: true,
            };
          }
          const mean = Math.max(0, Math.min(1, (dimension.mean ?? 0.5) + (patch.meanDelta ?? 0)));
          return {
            ...dimension,
            mean,
            lowerBound: Math.max(0, mean - 0.08),
            upperBound: Math.min(1, mean + 0.08),
            confidence: patch.confidence ?? dimension.confidence,
            evidenceCoverage: patch.evidenceCoverage ?? dimension.evidenceCoverage,
            contradiction: patch.contradiction ?? dimension.contradiction,
            coherence: patch.coherence ?? dimension.coherence,
          };
        }),
      },
    },
  };
}

export function buildVisualFixtures() {
  const balanced = fixtureInput({ scanId: "fixture-balanced", overallConfidence: 0.9, overallCoverage: 0.9, overallCoherence: 0.88, baselineTrust: 0.74 });
  const dominant = (id: SignatureConstellationId) => tuneConstellation(fixtureInput({ scanId: `fixture-${id.toLowerCase()}-dominant` }), id, {
    confidence: 0.96,
    evidenceCoverage: 0.93,
    coherence: 0.9,
    meanDelta: 0.22,
  });
  const lowConfidence = fixtureInput({
    scanId: "fixture-low-confidence",
    overallConfidence: 0.32,
    constellations: Object.fromEntries(CONSTELLATIONS.map((id) => [id, {
      ...fixtureInput().constellations[id],
      confidence: 0.3,
      dimensions: fixtureInput().constellations[id].dimensions.map((dimension) => ({ ...dimension, confidence: 0.28 })),
    }])) as unknown as ResonanceSignatureInputV1["constellations"],
  });
  const sparseEvidence = fixtureInput({
    scanId: "fixture-sparse-evidence",
    overallCoverage: 0.28,
    constellations: Object.fromEntries(CONSTELLATIONS.map((id) => [id, {
      ...fixtureInput().constellations[id],
      evidenceCoverage: 0.24,
      dimensions: fixtureInput().constellations[id].dimensions.map((dimension) => ({ ...dimension, evidenceCoverage: 0.2 })),
    }])) as unknown as ResonanceSignatureInputV1["constellations"],
  });
  return {
    balancedHighConfidence: balanced,
    cogDominant: dominant("COG"),
    regDominant: dominant("REG"),
    capDominant: dominant("CAP"),
    expDominant: dominant("EXP"),
    highlyAsymmetric: {
      ...fixtureInput({ scanId: "fixture-highly-asymmetric", overallCoherence: 0.62 }),
      constellations: {
        ...fixtureInput().constellations,
        COG: {
          ...fixtureInput().constellations.COG,
          dimensions: fixtureInput().constellations.COG.dimensions.map((dimension) => ({ ...dimension, momentum: -0.88 })),
        },
        CAP: {
          ...fixtureInput().constellations.CAP,
          dimensions: fixtureInput().constellations.CAP.dimensions.map((dimension) => ({ ...dimension, momentum: 0.86 })),
        },
      },
    },
    highContradiction: tuneConstellation(fixtureInput({ scanId: "fixture-high-contradiction" }), "EXP", {
      contradiction: 0.9,
      coherence: 0.24,
    }),
    lowConfidence,
    unresolvedDimension: tuneConstellation(fixtureInput({ scanId: "fixture-unresolved-dimension" }), "CAP", {
      unresolvedDimensionIndex: 2,
    }),
    sparseEvidence,
    highCoherence: fixtureInput({
      scanId: "fixture-high-coherence",
      overallCoherence: 0.96,
      constellations: Object.fromEntries(CONSTELLATIONS.map((id) => [id, {
        ...fixtureInput().constellations[id],
        coherence: 0.95,
        dimensions: fixtureInput().constellations[id].dimensions.map((dimension) => ({ ...dimension, coherence: 0.95 })),
      }])) as unknown as ResonanceSignatureInputV1["constellations"],
    }),
    realSuppliedScan: fixtureInput({ scanId: "fixture-real-supplied-scan", resultVersion: "fixture-real-scan-v1" }),
  } as const;
}
