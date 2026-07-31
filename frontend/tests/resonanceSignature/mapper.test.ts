import assert from "node:assert/strict";
import test from "node:test";
import { ACOUSTIC_VISUAL_REGISTRY_V1, mapCanonicalResultToSignatureInput } from "../../lib/resonanceSignature";
import type { CanonicalDimensionRecord, ConstellationId } from "../../lib/canonicalDimensionEngine";
import type { CanonicalSoulScopeResult } from "../../lib/canonicalResult";

const CONSTELLATIONS: ConstellationId[] = ["COG", "REG", "CAP", "EXP"];

function dimension(constellation: ConstellationId, index: number, patch: Partial<CanonicalDimensionRecord> = {}): CanonicalDimensionRecord {
  const dimensionId = `${constellation}-P${index}` as CanonicalDimensionRecord["dimensionId"];
  return {
    dimensionId,
    constellation,
    label: dimensionId,
    value: 0.62,
    posterior: { mean: 0.62, interval: { low: 0.54, high: 0.7 } },
    confidence: 0.82,
    uncertainty: 0.18,
    evidenceCoverage: 0.78,
    resolved: true,
    contradictionStrength: 0.04,
    baselineTrust: "absent",
    supportingEvidence: [`capture-1:${dimensionId}`],
    contradictoryEvidence: [],
    missingEvidence: [],
    confounds: [],
    allowedInferenceTier: "B",
    prohibitedInferences: [],
    calculation: {
      ruleId: `dimension:${dimensionId}`,
      ruleVersion: "test",
      registryVersion: "test",
      requiredFamilies: ["temporal"],
      weights: {},
    },
    ...patch,
  };
}

function evidence(featureId: string, measuredValue: number) {
  return {
    evidenceId: `capture-1:${featureId}:1.0.0`,
    featureId,
    measuredValue,
    units: null,
    confidence: 0.9,
    uncertainty: 0.1,
    quality: "good",
    missingEvidence: false,
    rejectionReason: null,
    provenance: {
      captureId: "capture-1",
      captureKind: "guided_speech",
      segmentStartMs: 0,
      segmentEndMs: 30000,
      method: "fixture",
      extractor: "fixture",
    },
    extractorVersion: "fixture-v1",
    featureVersion: "1.0.0",
    timestamp: "2026-07-31T00:00:00.000Z",
  };
}

function resultWith(patch: {
  dimensions?: CanonicalDimensionRecord[];
  movement?: Record<ConstellationId, Record<string, number>>;
  evidence?: ReturnType<typeof evidence>[];
} = {}): CanonicalSoulScopeResult {
  const dimensions = patch.dimensions ?? CONSTELLATIONS.flatMap((constellation) => [1, 2, 3, 4].map((index) => dimension(constellation, index)));
  const constellations = Object.fromEntries(CONSTELLATIONS.map((constellation) => [constellation, {
    confidence: 0.82,
    evidenceCoverage: 0.78,
    descriptors: { coherence: 0.8 },
    temporalMovement: {
      available: Boolean(patch.movement?.[constellation]),
      vector: patch.movement?.[constellation] ?? {},
    },
  }]));
  return {
    scanId: "scan-1",
    versions: { canonicalResult: "test-result-v1" },
    evidenceLedger: { immutable: true, records: patch.evidence ?? [] },
    phaseBDimensions: { immutable: true, version: "test", registryVersion: "test", records: dimensions },
    phaseBConstellation: {
      immutable: true,
      geometry: {
        confidence: 0.82,
        evidenceCoverage: 0.78,
        constellations,
      },
    },
  } as unknown as CanonicalSoulScopeResult;
}

test("mapper preserves signed temporal momentum", () => {
  const input = mapCanonicalResultToSignatureInput(resultWith({
    movement: { COG: { dx: -0.6, dy: -0.2 }, REG: {}, CAP: {}, EXP: {} },
  }));
  assert.equal(input.constellations.COG.dimensions[0].momentum, -0.4);
});

test("mapper separates pause density from mean pause duration", () => {
  const input = mapCanonicalResultToSignatureInput(resultWith({
    evidence: [
      evidence("voice.pause.density", 9.5),
      evidence("voice.pause.duration_mean", 790),
    ],
  }));
  assert.equal(input.acousticVisualInputs?.pauseDensity, 0.5);
  assert.equal(input.acousticVisualInputs?.pauseDurationMean, 0.5);
  assert.equal(ACOUSTIC_VISUAL_REGISTRY_V1.pauseDensity.visualPropertyControlled, "interrupted arc frequency");
  assert.equal(ACOUSTIC_VISUAL_REGISTRY_V1.pauseDurationMean.visualPropertyControlled, "interrupted arc gap width");
});

test("mapper consumes engine resolved status instead of missing evidence count", () => {
  const target = dimension("COG", 1, { missingEvidence: ["COG-P1:optional_feature_missing"], resolved: true });
  const input = mapCanonicalResultToSignatureInput(resultWith({
    dimensions: [target, ...CONSTELLATIONS.flatMap((constellation) => [1, 2, 3, 4]
      .filter((index) => !(constellation === "COG" && index === 1))
      .map((index) => dimension(constellation, index)))],
  }));
  assert.equal(input.constellations.COG.dimensions[0].unresolved, false);
  assert.equal(input.constellations.COG.dimensions[0].mean, 0.62);
});

test("mapper consumes calibrated engine contradiction strength", () => {
  const target = dimension("EXP", 4, {
    contradictionStrength: 0.12,
    contradictoryEvidence: ["a", "b", "c"],
  });
  const input = mapCanonicalResultToSignatureInput(resultWith({
    dimensions: [...CONSTELLATIONS.flatMap((constellation) => [1, 2, 3, 4]
      .filter((index) => !(constellation === "EXP" && index === 4))
      .map((index) => dimension(constellation, index))), target],
  }));
  assert.equal(input.constellations.EXP.dimensions[3].contradiction, 0.12);
});

test("mapping does not mutate canonical result payload", () => {
  const result = resultWith();
  const before = JSON.stringify(result);
  mapCanonicalResultToSignatureInput(result);
  assert.equal(JSON.stringify(result), before);
});
