import test from "node:test";
import assert from "node:assert/strict";
import { buildScanCompleteness, isUsableAnalysis, shouldIncludeInBaseline, type ScanWithCompleteness } from "../lib/partialScan";
import type { VoiceAnalysisResult } from "../lib/voiceSpectrum";

function validAnalysis(overrides: Partial<VoiceAnalysisResult> = {}): VoiceAnalysisResult {
  return {
    summary: "fixture",
    coreFrequencyHz: 140,
    spectralCentroidHz: 190,
    resonanceScore: 0.75,
    dominantBand: "E",
    dominantBandLabel: "E",
    noteEnergies: [
      { note: "E", score: 50, relativeEnergy: 0.34, status: "balanced" },
      { note: "A", score: 40, relativeEnergy: 0.28, status: "balanced" },
      { note: "C", score: 30, relativeEnergy: 0.22, status: "underactive" },
    ],
    spectrumBands: [],
    missingBands: [],
    excessBands: [],
    findings: [],
    supportPlan: [],
    methodology: "fixture",
    caution: "fixture",
    voiceDynamics: {
      analyzedDurationMs: 5000,
      voicedDurationMs: 3500,
      silenceDurationMs: 1500,
      activeFrameRatio: 0.7,
      voicedFrameRatio: 0.7,
      voicedFrameCount: 40,
      pitchFrameCount: 20,
      pauseCount: 2,
      averagePauseMs: 300,
      longestPauseMs: 500,
      medianPitchHz: 140,
      lowPitchHz: 120,
      highPitchHz: 170,
      medianMidi: 49,
      dominantOctave: 3,
      pitchRangeHz: 50,
      pitchRangeSemitones: 4,
      pitchStability: 0.75,
      pitchClarity: 0.8,
      clippingFrameRatio: 0.02,
      captureQuality: "good",
      captureRecommendation: "good",
      primaryNoteSource: "tracked-pitch",
    },
    ...overrides,
  };
}

function analyses(valid: number, expected = 7) {
  return Array.from({ length: expected }, (_, index) => index < valid ? validAnalysis() : null);
}

test("7 valid recordings produce a completed high-completeness result", () => {
  const result = buildScanCompleteness({ expectedRecordings: 7, analyses: analyses(7) });
  assert.equal(result.status, "completed");
  assert.equal(result.qualityLevel, "high");
  assert.equal(result.validRecordings, 7);
});

test("6 valid plus 1 invalid produces a completed result", () => {
  const result = buildScanCompleteness({ expectedRecordings: 7, analyses: analyses(6) });
  assert.equal(result.status, "completed");
  assert.equal(result.qualityLevel, "good");
  assert.equal(result.invalidRecordings, 1);
  assert.match(result.userMessage, /6 of 7/);
});

test("5 and 4 valid recordings produce partial results", () => {
  assert.equal(buildScanCompleteness({ expectedRecordings: 7, analyses: analyses(5) }).status, "partial");
  assert.equal(buildScanCompleteness({ expectedRecordings: 7, analyses: analyses(4) }).status, "partial");
});

test("3 valid recordings produce a limited partial result", () => {
  const result = buildScanCompleteness({ expectedRecordings: 7, analyses: analyses(3) });
  assert.equal(result.status, "partial");
  assert.equal(result.qualityLevel, "limited");
});

test("2 or fewer valid recordings require retry", () => {
  for (const count of [0, 1, 2]) {
    const result = buildScanCompleteness({ expectedRecordings: 7, analyses: analyses(count) });
    assert.equal(result.status, "failed");
    assert.equal(result.retryRecommended, true);
  }
});

test("missing recordings are counted, never duplicated or fabricated", () => {
  const input = analyses(4);
  const result = buildScanCompleteness({ expectedRecordings: 7, analyses: input });
  assert.equal(input.filter(Boolean).length, 4);
  assert.equal(result.validRecordings, 4);
  assert.equal(result.invalidRecordings, 3);
  assert.equal(result.completionRatio, 4 / 7);
});

test("quality checks reject weak recordings", () => {
  assert.equal(isUsableAnalysis(validAnalysis()), true);
  assert.equal(isUsableAnalysis(validAnalysis({ voiceDynamics: { ...validAnalysis().voiceDynamics!, captureQuality: "poor" } })), false);
  assert.equal(isUsableAnalysis(validAnalysis({ voiceDynamics: { ...validAnalysis().voiceDynamics!, voicedFrameCount: 2 } })), false);
  assert.equal(isUsableAnalysis(validAnalysis({ voiceDynamics: { ...validAnalysis().voiceDynamics!, clippingFrameRatio: 0.8 } })), false);
});

test("limited and failed scans are excluded from baseline", () => {
  const completed = { ...validAnalysis(), scanCompleteness: buildScanCompleteness({ expectedRecordings: 7, analyses: analyses(7) }) } as ScanWithCompleteness;
  const goodPartial = { ...validAnalysis(), scanCompleteness: buildScanCompleteness({ expectedRecordings: 7, analyses: analyses(5) }) } as ScanWithCompleteness;
  const limitedPartial = { ...validAnalysis(), scanCompleteness: buildScanCompleteness({ expectedRecordings: 7, analyses: analyses(3) }) } as ScanWithCompleteness;
  const failed = { ...validAnalysis(), scanCompleteness: buildScanCompleteness({ expectedRecordings: 7, analyses: analyses(2) }) } as ScanWithCompleteness;
  assert.equal(shouldIncludeInBaseline(completed), true);
  assert.equal(shouldIncludeInBaseline(goodPartial), true);
  assert.equal(shouldIncludeInBaseline(limitedPartial), false);
  assert.equal(shouldIncludeInBaseline(failed), false);
});
