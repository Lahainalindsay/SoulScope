import assert from "node:assert/strict";
import test from "node:test";
import { buildContinuousConstellationGeometry } from "../lib/canonicalConstellationEngine";
import { buildCanonicalDimensions } from "../lib/canonicalDimensionEngine";
import { buildCrossConstellationInteractions } from "../lib/canonicalInteractionEngine";
import { buildMeaningObjects } from "../lib/canonicalMeaningEngine";
import { buildCanonicalResonanceSignature } from "../lib/canonicalResonanceSignature";
import type { CanonicalEvidenceRecord } from "../lib/canonicalResult";

function evidence(featureId: string, value: number | null, confidence = 0.82): CanonicalEvidenceRecord {
  return {
    evidenceId: `capture-1:${featureId}:1.0.0`,
    featureId,
    measuredValue: value,
    units: featureId.includes("ratio") || featureId.includes("stability") || featureId.includes("clarity") ? "ratio" : "unit",
    confidence: value === null ? 0 : confidence,
    uncertainty: value === null ? 1 : Number((1 - confidence).toFixed(3)),
    quality: value === null ? "poor" : "good",
    missingEvidence: value === null,
    rejectionReason: value === null ? "missing_fixture" : null,
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
    timestamp: "2026-07-29T00:00:00.000Z",
  };
}

const completeEvidence = [
  evidence("voice.syllable_nuclei_rate", 142),
  evidence("voice.f0.range_semitones", 8),
  evidence("voice.phonation_time_ratio", 0.7),
  evidence("voice.pitch_stability", 0.74),
  evidence("voice.pitch_clarity", 0.78),
  evidence("voice.pause.duration_mean", 420),
  evidence("voice.spectral_flatness", 0.08),
  evidence("voice.harmonic_richness", 0.74),
];

test("Phase B dimensions are continuous and derived only from Evidence Ledger records", () => {
  const dimensions = buildCanonicalDimensions(completeEvidence);
  assert.equal(dimensions.length, 16);
  assert.deepEqual(
    [...new Set(dimensions.map((dimension) => dimension.constellation))].sort(),
    ["CAP", "COG", "EXP", "REG"],
  );
  for (const dimension of dimensions) {
    assert.match(dimension.dimensionId, /^(COG|REG|CAP|EXP)-P[1-4]$/);
    assert.ok(dimension.value >= 0 && dimension.value <= 1);
    assert.ok(dimension.posterior.interval.low <= dimension.posterior.interval.high);
    assert.ok(dimension.confidence >= 0 && dimension.confidence <= 1);
    assert.ok(dimension.uncertainty >= 0 && dimension.uncertainty <= 1);
    assert.ok(dimension.evidenceCoverage > 0);
    assert.equal(dimension.calculation.registryVersion, "soulscope-constellation-bible-v0.1");
    assert.ok(dimension.supportingEvidence.every((id) => completeEvidence.some((record) => record.evidenceId === id)));
  }
});

test("missing evidence lowers coverage and is preserved instead of fabricated", () => {
  const dimensions = buildCanonicalDimensions([
    evidence("voice.pitch_stability", 0.74),
    evidence("voice.pitch_clarity", null),
  ]);
  const organization = dimensions.find((item) => item.dimensionId === "COG-P1");
  assert.ok(organization);
  assert.ok(organization.evidenceCoverage < 1);
  assert.ok(organization.missingEvidence.length > 0);
});

test("continuous geometry preserves boundary blends and uncertainty", () => {
  const dimensions = buildCanonicalDimensions(completeEvidence);
  const geometry = buildContinuousConstellationGeometry(dimensions);
  assert.ok(geometry.coordinates.x >= 0 && geometry.coordinates.x <= 1);
  assert.ok(geometry.coordinates.y >= 0 && geometry.coordinates.y <= 1);
  assert.ok(geometry.coordinates.z >= 0 && geometry.coordinates.z <= 1);
  assert.deepEqual(Object.keys(geometry.constellations).sort(), ["CAP", "COG", "EXP", "REG"]);
  assert.ok(Object.values(geometry.constellations).every((decision) => decision.points.length === 4));
  assert.ok(geometry.uncertaintyInterval.low <= geometry.uncertaintyInterval.high);
  if (geometry.boundaryBlend) {
    assert.ok(geometry.boundaryBlend.blend > 0);
    assert.ok(geometry.boundaryBlend.uncertainty >= geometry.uncertainty);
  }
});

test("interactions and Meaning Objects remain traceable to existing evidence", () => {
  const dimensions = buildCanonicalDimensions(completeEvidence);
  const geometry = buildContinuousConstellationGeometry(dimensions);
  const interactions = buildCrossConstellationInteractions(dimensions, geometry);
  const meaning = buildMeaningObjects(dimensions, geometry, interactions);
  const evidenceIds = new Set(completeEvidence.map((record) => record.evidenceId));

  assert.ok(interactions.length >= 3);
  assert.ok(meaning.length >= 1);
  assert.ok(interactions.every((item) => /^INT-00[1-8]$/.test(item.interactionId)));
  assert.ok(interactions.every((item) => item.evidenceReferences.every((id) => evidenceIds.has(id))));
  assert.ok(meaning.every((item) => item.evidence_references.every((id) => evidenceIds.has(id))));
});

test("canonical Resonance Signature is reproducible from Phase B result components", () => {
  const dimensions = buildCanonicalDimensions(completeEvidence);
  const geometry = buildContinuousConstellationGeometry(dimensions);
  const interactions = buildCrossConstellationInteractions(dimensions, geometry);
  const meaningObjects = buildMeaningObjects(dimensions, geometry, interactions);
  const first = buildCanonicalResonanceSignature({ dimensions, geometry, interactions, meaningObjects });
  const second = buildCanonicalResonanceSignature({ dimensions, geometry, interactions, meaningObjects });

  assert.deepEqual(first, second);
  assert.ok(first.data.every((item) => item.id.startsWith("canonical:")));
  assert.ok(first.data.some((item) => item.id.startsWith("canonical:COG:point:COG-P")));
  assert.ok(first.data.some((item) => item.id === `canonical:COG:winner:${geometry.constellations.COG.winner}`));
});
