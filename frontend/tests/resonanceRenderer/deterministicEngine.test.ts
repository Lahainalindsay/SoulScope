import assert from "node:assert/strict";
import test from "node:test";
import {
  animateTransition,
  exportJSON,
  exportPNG,
  exportSVG,
  generateSignature,
  generateSignatureFromInput,
  accumulateLongitudinalGeometry,
  type ConstellationId,
} from "../../../packages/resonance-renderer/src";

const CONSTELLATIONS: ConstellationId[] = ["COG", "REG", "EXP", "CAP"];

function evidence(featureId: string, value: number) {
  return {
    evidenceId: `capture-1:${featureId}:1.0.0`,
    featureId,
    measuredValue: value,
    units: null,
    confidence: 0.84,
    uncertainty: 0.16,
    quality: "good",
    missingEvidence: false,
    rejectionReason: null,
    provenance: { captureId: "capture-1", captureKind: "guided_speech", segmentStartMs: 0, segmentEndMs: 30000, method: "fixture", extractor: "fixture" },
    extractorVersion: "fixture-v1",
    featureVersion: "1.0.0",
    timestamp: "2026-08-01T00:00:00.000Z",
  };
}

function dimension(constellation: ConstellationId, index: number, value: number, patch: Record<string, unknown> = {}) {
  const dimensionId = `${constellation}-P${index}`;
  return {
    dimensionId,
    constellation,
    label: dimensionId,
    value,
    posterior: { mean: value, interval: { low: Math.max(0, value - 0.08), high: Math.min(1, value + 0.08) } },
    confidence: 0.82,
    uncertainty: 0.18,
    evidenceCoverage: 0.86,
    resolved: true,
    contradictionStrength: 0.04,
    baselineTrust: "absent",
    supportingEvidence: [`capture-1:${dimensionId}:1.0.0`],
    contradictoryEvidence: [],
    missingEvidence: [],
    confounds: [],
    allowedInferenceTier: "B",
    prohibitedInferences: [],
    calculation: { ruleId: `dimension:${dimensionId}`, ruleVersion: "test", registryVersion: "test", requiredFamilies: ["temporal"], weights: {} },
    ...patch,
  };
}

function result(overrides: {
  scanId?: string;
  missingDimension?: string;
  interactionKind?: string;
  movement?: number;
  shift?: number;
} = {}) {
  const shift = overrides.shift ?? 0;
  const records = CONSTELLATIONS.flatMap((constellation, constellationIndex) =>
    [1, 2, 3, 4].map((index) => {
      const id = `${constellation}-P${index}`;
      const missing = id === overrides.missingDimension;
      return dimension(constellation, index, Math.min(0.92, 0.42 + constellationIndex * 0.08 + index * 0.055 + shift), missing ? {
        resolved: false,
        evidenceCoverage: 0.22,
        confidence: 0.12,
        posterior: { mean: 0.5, interval: { low: 0, high: 1 } },
        supportingEvidence: [],
        missingEvidence: [`${id}:required_family_missing`],
      } : {});
    }),
  );
  const constellations = Object.fromEntries(CONSTELLATIONS.map((constellation) => {
    const dims = records.filter((record) => record.constellation === constellation);
    const confidence = dims.reduce((sum, item) => sum + item.confidence, 0) / dims.length;
    return [constellation, {
      confidence,
      evidenceCoverage: dims.reduce((sum, item) => sum + item.evidenceCoverage, 0) / dims.length,
      descriptors: {
        magnitude: dims.reduce((sum, item) => sum + item.value, 0) / dims.length,
        dominance: 0.18,
        symmetry: 0.72,
        coherence: confidence * 0.92,
        tension: 0.22,
        compensation: 0.14,
        momentum: overrides.movement ?? -0.25,
        distortion: 0.08,
      },
      temporalMovement: { available: true, vector: { dx: overrides.movement ?? -0.25, dy: overrides.movement ?? -0.25 } },
    }];
  }));
  return {
    scanId: overrides.scanId ?? "scan-renderer-1",
    schemaVersion: "soulscope-result-v1",
    versions: { canonicalResult: "test-result-v1" },
    evidenceLedger: {
      immutable: true,
      records: [
        ...records.flatMap((record) => record.supportingEvidence.map((id) => evidence(id.replace(/^capture-1:|:1\.0\.0$/g, ""), record.value))),
        evidence("voice.f0.range_semitones", 9),
        evidence("voice.pitch_stability", 0.74),
        evidence("voice.harmonic_richness", 0.7),
        evidence("voice.spectral_flatness", 0.09),
        evidence("voice.pause.density", 7),
        evidence("voice.pause.duration_mean", 520),
      ],
    },
    phaseBDimensions: { immutable: true, version: "test", registryVersion: "test", records },
    phaseBConstellation: { immutable: true, geometry: { confidence: 0.82, evidenceCoverage: 0.86, constellations } },
    phaseBInteractions: {
      immutable: true,
      records: [{
        interactionId: "INT-test",
        kind: overrides.interactionKind ?? "reinforces",
        subject: "COG",
        object: "REG",
        strength: 0.74,
        confidence: 0.7,
        evidenceReferences: ["capture-1:COG-P1:1.0.0", "capture-1:REG-P1:1.0.0"],
      }],
    },
  };
}

test("identical immutable result objects produce identical SVG, field checksum, and JSON", () => {
  const first = generateSignature(result());
  const second = generateSignature(result());
  assert.equal(first.field.checksum, second.field.checksum);
  assert.equal(first.svg, second.svg);
  assert.deepEqual(exportJSON(first), exportJSON(second));
  assert.equal(exportSVG(first), first.svg);
  assert.equal(exportPNG(first).mimeType, "image/svg+xml");
});

test("renderer builds four independent constellation fields before convergence", () => {
  const signature = generateSignature(result());
  assert.deepEqual(Object.keys(signature.field.constellationFields).sort(), ["CAP", "COG", "EXP", "REG"]);
  for (const field of Object.values(signature.field.constellationFields)) {
    assert.equal(field.length, signature.field.values.length);
    assert.ok(field.some((value) => value > 0));
  }
  assert.ok(signature.contours.some((contour) => contour.constellationId === "CENTER"));
});

test("interaction records create visible bridge field without rendering suppression controls", () => {
  const reinforces = generateSignature(result({ interactionKind: "reinforces" }));
  const suppressed = generateSignature(result({ interactionKind: "suppresses_global_pattern" }));
  assert.notEqual(reinforces.field.checksum, suppressed.field.checksum);
  assert.equal(suppressed.input.interactions.length, 0);
  assert.ok(reinforces.input.interactions.length > 0);
});

test("missing dimensions stay incomplete and create broken low-support strokes", () => {
  const signature = generateSignature(result({ missingDimension: "COG-P2" }));
  const broken = signature.strokes.filter((stroke) => stroke.dashArray && stroke.evidenceReferences.every((id) => id.includes("COG") || id.includes("capture")));
  assert.ok(broken.length > 0);
  assert.ok(signature.input.dimensions.some((dimension) => dimension.dimensionId === "COG-P2" && !dimension.resolved && dimension.mean === null));
});

test("all rendered core strokes remain traceable to result-object evidence", () => {
  const signature = generateSignature(result());
  const evidenceIds = new Set(signature.input.dimensions.flatMap((dimension) => dimension.evidenceReferences));
  const core = signature.strokes.filter((stroke) => stroke.layer === "core");
  assert.ok(core.length > 0);
  assert.ok(core.every((stroke) => stroke.evidenceReferences.some((id) => evidenceIds.has(id))));
});

test("longitudinal mode accumulates geometry instead of overlaying complete images", () => {
  const first = generateSignature(result({ scanId: "scan-a", shift: 0 })).input;
  const second = generateSignature(result({ scanId: "scan-b", shift: 0.04 })).input;
  const accumulated = accumulateLongitudinalGeometry([first, second]);
  const latest = generateSignatureFromInput(second);
  assert.notEqual(accumulated.field.checksum, latest.field.checksum);
  assert.ok(accumulated.strokes.length > 0);
});

test("animation transition is deterministic between signatures", () => {
  const previous = generateSignature(result({ scanId: "scan-a", movement: -0.3 }));
  const next = generateSignature(result({ scanId: "scan-b", movement: 0.3 }));
  const transition = animateTransition(previous, next);
  assert.equal(transition.signatureId, `${previous.signatureId}->${next.signatureId}`);
  assert.ok(transition.transitionKeyframes.length > 0);
});
