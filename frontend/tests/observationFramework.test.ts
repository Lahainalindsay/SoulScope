import assert from "node:assert/strict";
import test from "node:test";
import { adaptDimensionsToLegacy, adaptDomainsToLegacy } from "../lib/observationFramework/adaptDomainsToLegacy";
import { buildObservationPipeline } from "../lib/observationFramework/buildObservationPipeline";
import { buildRawFeatures } from "../lib/observationFramework/buildRawFeatures";
import { buildSoulScopeReport } from "../lib/buildSoulScopeReport";
import type { VoiceAnalysisResult } from "../lib/voiceSpectrum";

function scan(overrides: Partial<VoiceAnalysisResult> = {}): VoiceAnalysisResult {
  return {
    summary: "fixture",
    coreFrequencyHz: 145,
    spectralCentroidHz: 920,
    resonanceScore: 0.68,
    dominantBand: "D",
    dominantBandLabel: "D",
    noteEnergies: [
      { note: "C", score: 52, relativeEnergy: 0.08, status: "balanced" },
      { note: "C#", score: 48, relativeEnergy: 0.07, status: "balanced" },
      { note: "D", score: 70, relativeEnergy: 0.14, status: "overactive" },
      { note: "D#", score: 44, relativeEnergy: 0.06, status: "balanced" },
      { note: "E", score: 68, relativeEnergy: 0.13, status: "overactive" },
      { note: "F", score: 45, relativeEnergy: 0.06, status: "balanced" },
      { note: "F#", score: 42, relativeEnergy: 0.05, status: "underactive" },
      { note: "G", score: 58, relativeEnergy: 0.09, status: "balanced" },
      { note: "G#", score: 38, relativeEnergy: 0.04, status: "underactive" },
      { note: "A", score: 55, relativeEnergy: 0.08, status: "balanced" },
      { note: "A#", score: 63, relativeEnergy: 0.11, status: "overactive" },
      { note: "B", score: 57, relativeEnergy: 0.09, status: "balanced" },
    ],
    spectrumBands: [],
    missingBands: [],
    excessBands: [],
    findings: [],
    supportPlan: [],
    methodology: "fixture",
    caution: "not diagnostic",
    voiceDynamics: {
      analyzedDurationMs: 42000,
      voicedDurationMs: 26000,
      silenceDurationMs: 16000,
      activeFrameRatio: 0.62,
      voicedFrameRatio: 0.58,
      voicedFrameCount: 84,
      pitchFrameCount: 72,
      pauseCount: 5,
      averagePauseMs: 620,
      longestPauseMs: 1100,
      medianPitchHz: 145,
      lowPitchHz: 110,
      highPitchHz: 210,
      medianMidi: 50,
      dominantOctave: 3,
      pitchRangeHz: 100,
      pitchRangeSemitones: 7.2,
      pitchStability: 0.72,
      pitchClarity: 0.76,
      jitterLocalPct: 1.4,
      shimmerLocalPct: 4.2,
      harmonicToNoiseRatioDb: 11,
      harmonicRichness: 0.64,
      spectralFlatness: 0.22,
      zeroCrossingRate: 0.08,
      pauseDensityPerMin: 7.1,
      speechRateProxyPerMin: 108,
      formantStability: 0.7,
      formantDynamics: 0.58,
      clippingFrameRatio: 0.01,
      captureQuality: "good",
      captureRecommendation: "good",
      primaryNoteSource: "tracked-pitch",
    },
    ...overrides,
  };
}

test("raw adapter emits only present features with units and versions", () => {
  const features = buildRawFeatures(scan({ spectralCentroidHz: Number.NaN }), { scanId: "scan-1" });
  assert.ok(features.some((feature) => feature.featureId === "voice.f0.median" && feature.unit === "Hz"));
  assert.ok(!features.some((feature) => feature.featureId === "voice.spectral_centroid"));
  assert.ok(features.every((feature) => feature.extractionVersion === "1.0.0"));
});

test("evidence remains signal language and preserves traceability", () => {
  const result = buildObservationPipeline(scan(), { scanId: "scan-1", captureIds: ["capture-1"] });
  assert.ok(result.evidenceSignals.length >= 6);
  assert.ok(result.evidenceSignals.every((signal) => signal.sourceCaptureIds.length > 0));
  const labels = result.evidenceSignals.map((signal) => signal.label.toLowerCase()).join(" ");
  assert.doesNotMatch(labels, /anxiety|depression|trauma|disease|personality|biomarker/);
});

test("poor capture prevents high confidence", () => {
  const poor = scan({ voiceDynamics: { ...scan().voiceDynamics!, captureQuality: "poor" } });
  const result = buildObservationPipeline(poor);
  assert.ok(result.evidenceSignals.every((signal) => signal.captureConfidence === "exploratory"));
  assert.ok(result.observations.every((observation) => observation.interpretationConfidence === "exploratory"));
});

test("observations use cautious wording and alternatives", () => {
  const result = buildObservationPipeline(scan());
  assert.ok(result.observations.length > 0);
  assert.ok(result.observations.every((observation) => observation.alternatives?.length));
  assert.ok(result.observations.every((observation) => !/^you are\b/i.test(observation.summary)));
});

test("domains preserve orientation semantics", () => {
  const result = buildObservationPipeline(scan());
  const mental = result.domains.find((domain) => domain.domainId === "focus_mental_demand");
  const recovery = result.domains.find((domain) => domain.domainId === "recovery_restoration");
  assert.equal(mental?.orientation, "demand");
  assert.equal(recovery?.orientation, "availability");
  assert.doesNotMatch(mental?.userFacingSummary ?? "", /more available/i);
  assert.doesNotMatch(recovery?.userFacingSummary ?? "", /greater load/i);
});

test("compatibility adapter returns legacy domain and dimension shapes", () => {
  const result = buildObservationPipeline(scan());
  const domains = adaptDomainsToLegacy(result.domains);
  const dimensions = adaptDimensionsToLegacy(result.domains);
  assert.ok(domains.length >= 4);
  assert.ok(dimensions.length >= 4);
  assert.ok(domains.every((domain) => typeof domain.functionalState === "string"));
});

test("partial scans retain output with reduced confidence", () => {
  const result = buildObservationPipeline(scan(), {
    captureQuality: "limited",
    recordingCompleteness: { expectedRecordings: 7, validRecordings: 4 },
  });
  assert.ok(result.rawFeatures.length > 0);
  assert.ok(result.domains.length > 0);
  assert.ok(result.warnings.some((warning) => warning.includes("4 of 7")));
  assert.ok(!result.evidenceSignals.some((signal) => signal.evidenceConfidence === "high"));
});

test("canonical report preserves patterns and three summary choices", () => {
  const report = buildSoulScopeReport(scan(), { scanId: "scan-1" });
  assert.ok(report.primaryPattern.name);
  assert.equal(report.storyCandidates.length, 3);
  assert.deepEqual(report.storyCandidates.map((candidate) => candidate.style).sort(), ["Direct", "Insight", "Supportive"]);
  assert.ok(report.observationPipeline?.engineVersion === "1.0.0");
});
