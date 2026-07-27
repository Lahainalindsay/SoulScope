import assert from "node:assert/strict";
import test from "node:test";
import { buildVocalStateProfile } from "../lib/vocalStateProfile";
import type { VoiceAnalysisResult, VoiceDynamics } from "../lib/voiceSpectrum";

type DynamicsOverrides = Partial<VoiceDynamics>;

function dynamics(overrides: DynamicsOverrides = {}): VoiceDynamics {
  return {
    analyzedDurationMs: 18000,
    voicedDurationMs: 12600,
    silenceDurationMs: 5400,
    activeFrameRatio: 0.7,
    voicedFrameRatio: 0.7,
    voicedFrameCount: 80,
    pitchFrameCount: 72,
    pauseCount: 3,
    averagePauseMs: 280,
    longestPauseMs: 620,
    medianPitchHz: 148,
    lowPitchHz: 105,
    highPitchHz: 218,
    medianMidi: 50,
    dominantOctave: 3,
    pitchRangeHz: 113,
    pitchRangeSemitones: 8,
    pitchStability: 0.88,
    pitchClarity: 0.9,
    jitterLocalPct: 0.7,
    shimmerLocalPct: 2.4,
    harmonicToNoiseRatioDb: 18,
    harmonicRichness: 0.8,
    spectralFlatness: 0.11,
    zeroCrossingRate: 0.05,
    pauseDensityPerMin: 3,
    speechRateProxyPerMin: 128,
    formantStability: 0.86,
    formantDynamics: 0.58,
    clippingFrameRatio: 0.01,
    captureQuality: "good",
    captureRecommendation: "good",
    primaryNoteSource: "tracked-pitch",
    ...overrides,
  };
}

function scanWithPhases(options?: { hopeRecovers?: boolean; poorHope?: boolean }): VoiceAnalysisResult {
  const baseline = dynamics();
  const challenge = dynamics({
    activeFrameRatio: 0.56,
    voicedFrameRatio: 0.48,
    averagePauseMs: 950,
    pauseDensityPerMin: 13,
    speechRateProxyPerMin: 82,
    pitchRangeSemitones: 4,
    pitchStability: 0.46,
    pitchClarity: 0.5,
    jitterLocalPct: 3.4,
    shimmerLocalPct: 9.2,
    harmonicToNoiseRatioDb: 6,
    harmonicRichness: 0.35,
    spectralFlatness: 0.42,
    zeroCrossingRate: 0.13,
    formantStability: 0.44,
    formantDynamics: 0.3,
  });
  const hope = options?.hopeRecovers === false
    ? dynamics({
        activeFrameRatio: 0.5,
        voicedFrameRatio: 0.42,
        averagePauseMs: 1100,
        pauseDensityPerMin: 15,
        speechRateProxyPerMin: 74,
        pitchRangeSemitones: 3,
        pitchStability: 0.39,
        pitchClarity: 0.43,
        jitterLocalPct: 3.8,
        shimmerLocalPct: 10.1,
        harmonicToNoiseRatioDb: 5,
        harmonicRichness: 0.29,
        spectralFlatness: 0.46,
        zeroCrossingRate: 0.15,
        formantStability: 0.38,
        formantDynamics: 0.25,
        captureQuality: options?.poorHope ? "poor" : "good",
      })
    : dynamics({
        activeFrameRatio: 0.78,
        voicedFrameRatio: 0.74,
        averagePauseMs: 330,
        pauseDensityPerMin: 4,
        speechRateProxyPerMin: 138,
        pitchRangeSemitones: 10,
        pitchStability: 0.83,
        pitchClarity: 0.86,
        jitterLocalPct: 0.9,
        shimmerLocalPct: 3,
        harmonicToNoiseRatioDb: 16,
        harmonicRichness: 0.82,
        spectralFlatness: 0.13,
        zeroCrossingRate: 0.06,
        formantStability: 0.79,
        formantDynamics: 0.76,
        captureQuality: options?.poorHope ? "poor" : "good",
      });

  return {
    summary: "fixture",
    coreFrequencyHz: 148,
    spectralCentroidHz: 1200,
    resonanceScore: 0.7,
    dominantBand: "D",
    dominantBandLabel: "D",
    spectrumBands: [],
    missingBands: [],
    excessBands: [],
    findings: [],
    supportPlan: [],
    methodology: "fixture",
    caution: "fixture",
    voiceDynamics: baseline,
    analysisDebug: {
      promptAnalyses: [
        { index: 0, captureKind: "guided_speech", dominantBandLabel: "D", coreFrequencyHz: 148, spectralCentroidHz: 1200, resonanceScore: 0.82, voiceDynamics: baseline, topNotes: [] },
        { index: 1, captureKind: "guided_speech", dominantBandLabel: "D", coreFrequencyHz: 148, spectralCentroidHz: 1200, resonanceScore: 0.38, voiceDynamics: challenge, topNotes: [] },
        { index: 2, captureKind: "guided_speech", dominantBandLabel: "D", coreFrequencyHz: 148, spectralCentroidHz: 1200, resonanceScore: options?.hopeRecovers === false ? 0.3 : 0.76, voiceDynamics: hope, topNotes: [] },
      ],
    },
  };
}

const score = (profile: ReturnType<typeof buildVocalStateProfile>, id: string) =>
  profile.indicators.find((item) => item.id === id)?.score ?? 0;

test("creates one complete profile from baseline, challenge, and hope measurements", () => {
  const profile = buildVocalStateProfile(scanWithPhases());
  assert.equal(profile.indicators.length, 16);
  assert.equal(profile.phaseComparison.mode, "within-person");
  assert.equal(profile.phaseComparison.baseline.phase, "baseline");
  assert.equal(profile.phaseComparison.challenge.phase, "challenge");
  assert.equal(profile.phaseComparison.hope.phase, "hope");
  assert.equal(profile.dominantIndicators.length, 4);
});

test("challenge is interpreted as change from the personal baseline", () => {
  const profile = buildVocalStateProfile(scanWithPhases());
  assert.ok(profile.phaseComparison.challengeDelta.stress > 0);
  assert.ok(profile.phaseComparison.challengeDelta.hesitation > 0);
  assert.ok(score(profile, "stress") > 0.5);
  assert.ok(score(profile, "mental_effort") > 0.5);
});

test("movement toward baseline raises recovery", () => {
  const recovered = buildVocalStateProfile(scanWithPhases({ hopeRecovers: true }));
  const unresolved = buildVocalStateProfile(scanWithPhases({ hopeRecovers: false }));
  assert.ok(recovered.phaseComparison.recovery > unresolved.phaseComparison.recovery);
  assert.ok(score(recovered, "stress_recovery") > score(unresolved, "stress_recovery"));
});

test("poor phase quality lowers confidence without changing completeness", () => {
  const good = buildVocalStateProfile(scanWithPhases());
  const poor = buildVocalStateProfile(scanWithPhases({ poorHope: true }));
  assert.equal(poor.phaseComparison.mode, "within-person");
  assert.ok(poor.quality.confidence < good.quality.confidence);
});

test("falls back safely when per-prompt measurements are absent", () => {
  const scan = scanWithPhases();
  delete scan.analysisDebug;
  const profile = buildVocalStateProfile(scan);
  assert.equal(profile.phaseComparison.mode, "aggregate-fallback");
  assert.ok(profile.quality.warning);
  assert.equal(profile.indicators.length, 16);
});

test("profile generation is deterministic", () => {
  assert.deepEqual(buildVocalStateProfile(scanWithPhases()), buildVocalStateProfile(scanWithPhases()));
});
