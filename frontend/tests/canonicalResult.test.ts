import assert from "node:assert/strict";
import test from "node:test";
import { buildCanonicalSoulScopeResult } from "../lib/canonicalResult";
import type { CanonicalPatternResult } from "../lib/canonicalPattern";
import type { ResonanceNarrative } from "../lib/resonanceNarrativeEngineV3";
import type { VoiceAnalysisResult } from "../lib/voiceSpectrum";

const canonical = {
  canonicalPatternSignature: "family:adaptive",
  canonicalDisplayName: "Adaptive",
  canonicalFamily: "adaptive",
  primaryFamily: "adaptive",
  secondaryFamily: null,
  dimensions: {},
  stateVector: {
    activation: .5, organization: .6, regulation: .6, expression: .5,
    relationalOrientation: .5, direction: .6, capacity: .6,
  },
  confidence: .8,
  confidenceMargin: .2,
  resultType: "single",
  namingMatrixVersion: "matrix-v1",
  engineVersion: "pattern-v1",
  interpretationLimits: [],
  decisionLedger: {
    supportingEvidence: ["capture-1:voice.f0.median:1.0.0"],
    contradictoryEvidence: [],
    missingEvidence: [],
    alternatives: [],
    rejected: [],
  },
} as unknown as CanonicalPatternResult;

const narrative = {
  engineVersion: "narrative-v1",
  introduction: "Supported narrative.",
  beneathTheSurface: "Supported detail.",
  howThisOftenFeels: ["Supported"],
  whatOthersMayNotice: ["Supported"],
  strengthToday: "Supported",
  worthNoticing: "Supported",
  generatedPattern: {
    title: "Adaptive",
    dominantState: "Adaptive",
    supportingQuality: "Capacity",
    ruleId: "rule-1",
  },
  relationships: [],
  pairStates: [],
  higherOrderStates: [],
  meaningGraph: { version: "v1", nodes: [], dominantNodeId: null },
} as unknown as ResonanceNarrative;

function scanWithValue(value: number | null): VoiceAnalysisResult {
  const featureIds = [
    "voice.f0.median",
    "voice.f0.range_semitones",
    "voice.intensity.rms",
    "voice.syllable_nuclei_rate",
    "voice.phonation_time_ratio",
    "voice.pitch_stability",
    "voice.pitch_clarity",
    "voice.pause.duration_mean",
    "voice.spectral_flatness",
    "voice.harmonic_richness",
  ];
  return {
    scanMeta: { completedAt: "2026-07-29T00:00:00.000Z" },
    canonicalAcoustic: {
      schemaVersion: "1",
      authoritative: true,
      captureId: "capture-1",
      captureKind: "guided_speech",
      extractor: "praat",
      extractorVersion: "extractor-v1",
      quality: value === null ? "poor" : "good",
      confidence: value === null ? 0 : .8,
      storagePath: null,
      retentionPolicy: "private",
      vadSegments: [],
      metadata: {},
      measurements: featureIds.map((featureId, index) => ({
        feature_id: featureId,
        feature_version: "1.0.0",
        value: value === null ? null : value + index,
        unit: featureId === "voice.f0.median" ? "Hz" : "unit",
        method: "median",
        source_capture_id: "capture-1",
        capture_kind: "guided_speech",
        segment_start_ms: 0,
        segment_end_ms: 30000,
        quality: value === null ? "poor" : "good",
        confidence: value === null ? 0 : .8,
        rejection_reason: value === null ? "insufficient_signal" : null,
        extractor: "praat",
        extractor_version: "extractor-v1",
        parameters: {},
        device_metadata: {},
        created_at: "2026-07-29T00:00:00.000Z",
      })),
    },
  } as unknown as VoiceAnalysisResult;
}

const signature = {
  data: [{ id: "dimension:activation", value: .5 }],
  seedKey: "seed",
  visualState: { density: .5, coherence: .5, asymmetry: .2, expansion: .5, centerCalm: .5 },
};

test("canonical result preserves measured provenance and is deeply immutable", () => {
  const result = buildCanonicalSoulScopeResult({
    scanId: "scan-1",
    scan: scanWithValue(180),
    canonical,
    narrative,
    resonanceSignature: signature,
  });
  const evidence = result.evidenceLedger.records[0];
  assert.equal(evidence.measuredValue, 180);
  assert.equal(evidence.units, "Hz");
  assert.equal(evidence.uncertainty, .2);
  assert.equal(evidence.extractorVersion, "extractor-v1");
  assert.equal(evidence.provenance.captureId, "capture-1");
  assert.notEqual(result.decisionLedger.record.outcome, "unresolved");
  assert.equal(result.decisionLedger.record.selectedResult, result.meaningObjects.records[0]?.meaning_id);
  assert.notEqual(result.decisionLedger.record.selectedResult, canonical.canonicalPatternSignature);
  assert.ok(result.decisionLedger.record.rejectedAlternatives.some((item) => item.id.startsWith("compatibility:")));
  assert.equal(result.phaseBDimensions.records.length, 16);
  assert.ok(result.phaseBConstellation.geometry.coordinates.x >= 0);
  assert.ok(result.meaningObjects.records.length >= 1);
  assert.ok(result.resonanceSignature.data.every((item) => item.id.startsWith("canonical:")));
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result.evidenceLedger.records));
  assert.ok(Object.isFrozen(result.phaseBDimensions.records));
  assert.ok(Object.isFrozen(evidence.provenance));
});

test("missing acoustic evidence forces Unresolved and bounds the narrative", () => {
  const result = buildCanonicalSoulScopeResult({
    scanId: "scan-2",
    scan: scanWithValue(null),
    canonical,
    narrative,
    resonanceSignature: signature,
  });
  assert.equal(result.pattern.displayName, "Unresolved");
  assert.equal(result.pattern.id, null);
  assert.equal(result.decisionLedger.record.outcome, "unresolved");
  assert.equal(result.decisionLedger.record.winningRule, "abstention-rule");
  assert.match(result.narrative.introduction, /does not support/);
});
