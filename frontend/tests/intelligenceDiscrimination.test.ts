import assert from "node:assert/strict";
import test from "node:test";
import { buildSoulScopeReport } from "../lib/buildSoulScopeReport";
import { buildObservationPipeline } from "../lib/observationFramework/buildObservationPipeline";
import type { VoiceAnalysisResult } from "../lib/voiceSpectrum";

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function noteProfile(overactive: string[] = [], underactive: string[] = []) {
  const weights = NOTES.map((note) => overactive.includes(note) ? 0.14 : underactive.includes(note) ? 0.035 : 0.075);
  const total = weights.reduce((sum, value) => sum + value, 0);
  return NOTES.map((note, index) => ({
    note,
    score: overactive.includes(note) ? 76 : underactive.includes(note) ? 28 : 52,
    relativeEnergy: weights[index] / total,
    status: overactive.includes(note) ? "overactive" as const : underactive.includes(note) ? "underactive" as const : "balanced" as const,
  }));
}

function fixture(kind: "balanced" | "processing" | "output" | "contained" | "distributed"): VoiceAnalysisResult {
  const profiles = {
    balanced: {
      noteEnergies: noteProfile(), spectralCentroidHz: 1180, resonanceScore: 0.76,
      dynamics: { activeFrameRatio: 0.74, voicedFrameRatio: 0.7, pauseCount: 1, averagePauseMs: 260, longestPauseMs: 480, pauseDensityPerMin: 1.8, speechRateProxyPerMin: 132, pitchRangeHz: 150, pitchRangeSemitones: 9.5, pitchStability: 0.88, pitchClarity: 0.91, jitterLocalPct: 0.7, shimmerLocalPct: 2.4, harmonicToNoiseRatioDb: 18, harmonicRichness: 0.82, spectralFlatness: 0.11, zeroCrossingRate: 0.05, formantStability: 0.86, formantDynamics: 0.66 },
    },
    processing: {
      noteEnergies: noteProfile(["A#", "B"], ["C", "G#"]), spectralCentroidHz: 850, resonanceScore: 0.46,
      dynamics: { activeFrameRatio: 0.48, voicedFrameRatio: 0.34, pauseCount: 9, averagePauseMs: 1080, longestPauseMs: 2300, pauseDensityPerMin: 16, speechRateProxyPerMin: 72, pitchRangeHz: 58, pitchRangeSemitones: 4.1, pitchStability: 0.48, pitchClarity: 0.52, jitterLocalPct: 3.2, shimmerLocalPct: 9.4, harmonicToNoiseRatioDb: 5, harmonicRichness: 0.34, spectralFlatness: 0.48, zeroCrossingRate: 0.14, formantStability: 0.43, formantDynamics: 0.3 },
    },
    output: {
      noteEnergies: noteProfile(["D", "A", "B"], ["C", "G#"]), spectralCentroidHz: 1750, resonanceScore: 0.67,
      dynamics: { activeFrameRatio: 0.82, voicedFrameRatio: 0.64, pauseCount: 4, averagePauseMs: 520, longestPauseMs: 980, pauseDensityPerMin: 6.5, speechRateProxyPerMin: 158, pitchRangeHz: 185, pitchRangeSemitones: 11.2, pitchStability: 0.62, pitchClarity: 0.7, jitterLocalPct: 1.8, shimmerLocalPct: 5.2, harmonicToNoiseRatioDb: 10, harmonicRichness: 0.58, spectralFlatness: 0.25, zeroCrossingRate: 0.09, formantStability: 0.6, formantDynamics: 0.74 },
    },
    contained: {
      noteEnergies: noteProfile(["F#", "C#"], ["G"]), spectralCentroidHz: 1050, resonanceScore: 0.5,
      dynamics: { activeFrameRatio: 0.58, voicedFrameRatio: 0.52, pauseCount: 3, averagePauseMs: 560, longestPauseMs: 950, pauseDensityPerMin: 5.2, speechRateProxyPerMin: 96, pitchRangeHz: 38, pitchRangeSemitones: 2.8, pitchStability: 0.8, pitchClarity: 0.72, jitterLocalPct: 1.5, shimmerLocalPct: 4.8, harmonicToNoiseRatioDb: 9, harmonicRichness: 0.5, spectralFlatness: 0.28, zeroCrossingRate: 0.08, formantStability: 0.78, formantDynamics: 0.2 },
    },
    distributed: {
      noteEnergies: noteProfile(["C", "G#"], []), spectralCentroidHz: 1300, resonanceScore: 0.72,
      dynamics: { activeFrameRatio: 0.68, voicedFrameRatio: 0.62, pauseCount: 2, averagePauseMs: 380, longestPauseMs: 700, pauseDensityPerMin: 3.2, speechRateProxyPerMin: 120, pitchRangeHz: 135, pitchRangeSemitones: 8.4, pitchStability: 0.78, pitchClarity: 0.83, jitterLocalPct: 1.0, shimmerLocalPct: 3.3, harmonicToNoiseRatioDb: 15, harmonicRichness: 0.73, spectralFlatness: 0.16, zeroCrossingRate: 0.06, formantStability: 0.75, formantDynamics: 0.6 },
    },
  } as const;
  const selected = profiles[kind];
  const dynamics = selected.dynamics;
  return {
    summary: kind,
    coreFrequencyHz: kind === "processing" ? 122 : kind === "output" ? 176 : 148,
    spectralCentroidHz: selected.spectralCentroidHz,
    resonanceScore: selected.resonanceScore,
    dominantBand: "D",
    dominantBandLabel: "D",
    noteEnergies: selected.noteEnergies,
    spectrumBands: [], missingBands: [], excessBands: [], findings: [], supportPlan: [], methodology: "fixture", caution: "not diagnostic",
    voiceDynamics: {
      analyzedDurationMs: 42000, voicedDurationMs: Math.round(42000 * dynamics.voicedFrameRatio), silenceDurationMs: Math.round(42000 * (1 - dynamics.voicedFrameRatio)),
      voicedFrameCount: Math.round(120 * dynamics.voicedFrameRatio), pitchFrameCount: 80, medianPitchHz: kind === "processing" ? 122 : kind === "output" ? 176 : 148,
      lowPitchHz: 100, highPitchHz: 220, medianMidi: 50, dominantOctave: 3, clippingFrameRatio: 0.01, captureQuality: "good", captureRecommendation: "good", primaryNoteSource: "tracked-pitch",
      ...dynamics,
    },
  };
}

function signature(values: Array<{ evidenceId?: string; observationId?: string; domainId?: string; direction?: string; score?: number }>) {
  return values.map((item) => `${item.evidenceId ?? item.observationId ?? item.domainId}:${item.direction ?? item.score}`).sort();
}

test("materially different scans produce different evidence, observations, domains, patterns, and reflections", () => {
  const balancedPipeline = buildObservationPipeline(fixture("balanced"));
  const processingPipeline = buildObservationPipeline(fixture("processing"));
  const balancedReport = buildSoulScopeReport(fixture("balanced"));
  const processingReport = buildSoulScopeReport(fixture("processing"));
  assert.notDeepEqual(signature(balancedPipeline.evidenceSignals), signature(processingPipeline.evidenceSignals));
  assert.notDeepEqual(signature(balancedPipeline.observations), signature(processingPipeline.observations));
  assert.notDeepEqual(signature(balancedPipeline.domains), signature(processingPipeline.domains));
  assert.notEqual(balancedReport.primaryPattern.id, processingReport.primaryPattern.id);
  assert.notEqual(balancedReport.storyCandidates[0]?.summary, processingReport.storyCandidates[0]?.summary);
});

test("similar broad load can still produce different pattern ordering", () => {
  const processing = buildSoulScopeReport(fixture("processing"));
  const output = buildSoulScopeReport(fixture("output"));
  assert.notEqual(processing.primaryPattern.id, output.primaryPattern.id);
  assert.notDeepEqual(processing.observationPipeline?.evidenceSignals.map((item) => [item.evidenceId, item.direction]), output.observationPipeline?.evidenceSignals.map((item) => [item.evidenceId, item.direction]));
});

test("engine remains deterministic", () => {
  const first = buildSoulScopeReport(fixture("contained"), { scanId: "deterministic" });
  const second = buildSoulScopeReport(fixture("contained"), { scanId: "deterministic" });
  assert.equal(first.primaryPattern.id, second.primaryPattern.id);
  assert.deepEqual(first.observationPipeline?.evidenceSignals, second.observationPipeline?.evidenceSignals);
  assert.deepEqual(first.storyCandidates, second.storyCandidates);
});

test("partial scans retain variants and reduce confidence", () => {
  const scan = fixture("output") as VoiceAnalysisResult & { scanCompleteness?: unknown };
  (scan as any).scanCompleteness = { status: "partial", expectedRecordings: 7, validRecordings: 4, invalidRecordings: 3, qualityLevel: "limited", userMessage: "limited", retryRecommended: true };
  const report = buildSoulScopeReport(scan);
  assert.equal(report.storyCandidates.length, 3);
  assert.ok(report.observationPipeline?.evidenceSignals.every((item) => item.evidenceConfidence !== "high"));
  assert.equal(report.patternExpression.id, "signals-still-resolving");
});

test("fixture distribution does not collapse into one primary pattern", () => {
  const kinds = ["balanced", "processing", "output", "contained", "distributed"] as const;
  const patterns = kinds.map((kind) => buildSoulScopeReport(fixture(kind)).primaryPattern.id);
  const counts = patterns.reduce<Record<string, number>>((result, pattern) => ({ ...result, [pattern]: (result[pattern] ?? 0) + 1 }), {});
  assert.ok(Object.keys(counts).length >= 3, `Expected at least three primary patterns, received ${JSON.stringify(counts)}`);
  assert.ok(Math.max(...Object.values(counts)) <= 3, `One pattern is selected too frequently: ${JSON.stringify(counts)}`);
});