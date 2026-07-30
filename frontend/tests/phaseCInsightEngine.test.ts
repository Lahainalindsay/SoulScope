import assert from "node:assert/strict";
import test from "node:test";
import { buildCanonicalSoulScopeResult } from "../lib/canonicalResult";
import type { CanonicalPatternResult } from "../lib/canonicalPattern";
import type { ResonanceNarrative } from "../lib/resonanceNarrativeEngineV3";
import { buildLongitudinalAnalysis, type LongitudinalScanSnapshot } from "../lib/longitudinalIntelligence";
import { buildPhaseCIntelligence } from "../lib/phaseCInsightEngine";
import type { VoiceAnalysisResult } from "../lib/voiceSpectrum";

const canonical = {
  canonicalPatternSignature: "family:adaptive",
  canonicalDisplayName: "Adaptive",
  canonicalFamily: "adaptive",
  primaryFamily: "adaptive",
  secondaryFamily: null,
  dimensions: {},
  stateVector: { activation: .5, organization: .6, regulation: .6, expression: .5, relationalOrientation: .5, direction: .6, capacity: .6 },
  confidence: .8,
  confidenceMargin: .2,
  resultType: "single",
  namingMatrixVersion: "matrix-v1",
  engineVersion: "pattern-v1",
  interpretationLimits: [],
  decisionLedger: { supportingEvidence: [], contradictoryEvidence: [], missingEvidence: [], alternatives: [], rejected: [] },
} as unknown as CanonicalPatternResult;

const narrative = {
  engineVersion: "narrative-v1",
  introduction: "Supported narrative.",
  beneathTheSurface: "Supported detail.",
  howThisOftenFeels: [],
  whatOthersMayNotice: [],
  strengthToday: "Supported",
  worthNoticing: "Supported",
  generatedPattern: { title: "Adaptive", dominantState: "Adaptive", supportingQuality: "Capacity", ruleId: "rule-1" },
  relationships: [],
  pairStates: [],
  higherOrderStates: [],
  meaningGraph: { version: "v1", nodes: [], dominantNodeId: null },
} as unknown as ResonanceNarrative;

function scan(): VoiceAnalysisResult {
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
      quality: "good",
      confidence: .84,
      storagePath: null,
      retentionPolicy: "private",
      vadSegments: [],
      metadata: {},
      measurements: featureIds.map((featureId, index) => ({
        feature_id: featureId,
        feature_version: "1.0.0",
        value: 140 + index * 4,
        unit: featureId === "voice.f0.median" ? "Hz" : "unit",
        method: "fixture",
        source_capture_id: "capture-1",
        capture_kind: "guided_speech",
        segment_start_ms: 0,
        segment_end_ms: 30000,
        quality: "good",
        confidence: .84,
        rejection_reason: null,
        extractor: "praat",
        extractor_version: "extractor-v1",
        parameters: {},
        device_metadata: {},
        created_at: "2026-07-29T00:00:00.000Z",
      })),
    },
  } as unknown as VoiceAnalysisResult;
}

function snapshot(index: number, recovery = 55): LongitudinalScanSnapshot {
  return {
    scanId: `scan-${index}`,
    createdAt: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
    status: "completed",
    quality: "good",
    evidence: [{ id: "vocal_stability", direction: "stable", strength: 0.5, confidence: "moderate" }],
    observations: [{ id: "steady_observation", direction: "stable", strength: 0.5, confidence: "moderate" }],
    domains: [
      { id: "recovery_restoration", score: recovery, orientation: "availability", confidence: "moderate" },
      { id: "focus_mental_demand", score: 58, orientation: "demand", confidence: "moderate" },
    ],
    patterns: [{ id: index % 2 ? "a" : "b", confidence: 0.7 }],
    primaryPatternId: index % 2 ? "a" : "b",
    signalDistribution: [0.2, 0.3, 0.5],
    resonanceDistribution: [0.25, 0.25, 0.5],
  };
}

function result() {
  return buildCanonicalSoulScopeResult({
    scanId: "scan-current",
    scan: scan(),
    canonical,
    narrative,
    resonanceSignature: { data: [], seedKey: "seed", visualState: { density: .5, coherence: .5, asymmetry: .2, expansion: .5, centerCalm: .5 } },
  });
}

test("Phase C creates one traceable insight without history", () => {
  const phaseC = buildPhaseCIntelligence(result());
  assert.ok(phaseC.headlineInsight.title.length > 0);
  assert.equal(phaseC.insights.length >= 1, true);
  assert.equal(phaseC.patternEvolution.available, false);
  assert.equal(phaseC.confidenceCalibration.historicalStability, 0);
  assert.ok(phaseC.headlineInsight.trace.evidenceLedgerIds.length > 0);
  assert.equal(phaseC.headlineInsight.trace.decisionId, "scan-current:canonical-decision");
});

test("Phase C prioritizes meaningful longitudinal change over a generic current-state insight", () => {
  const history = Array.from({ length: 10 }, (_, index) => snapshot(index, 50));
  const current = snapshot(20, 88);
  const longitudinal = buildLongitudinalAnalysis(current, history);
  const phaseC = buildPhaseCIntelligence(result(), longitudinal);
  assert.match(phaseC.headlineInsight.title, /Recovery/);
  assert.ok(phaseC.headlineInsight.supportingHistory.some((item) => /Delta/.test(item)));
  assert.ok(phaseC.reflectionMemory.some((item) => /Recovery/.test(item)));
});

test("Phase C keeps confidence calibration dimensions separate", () => {
  const phaseC = buildPhaseCIntelligence(result(), buildLongitudinalAnalysis(snapshot(20), Array.from({ length: 10 }, (_, index) => snapshot(index))));
  assert.ok(phaseC.confidenceCalibration.measurementConfidence > 0);
  assert.ok(phaseC.confidenceCalibration.interpretationConfidence > 0);
  assert.ok(phaseC.confidenceCalibration.historicalStability > 0);
  assert.ok(phaseC.confidenceCalibration.personalFamiliarity > 0);
  assert.notEqual(phaseC.confidenceCalibration.measurementConfidence, phaseC.confidenceCalibration.historicalStability);
});
