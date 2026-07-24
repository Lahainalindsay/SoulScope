import assert from "node:assert/strict";
import test from "node:test";
import { buildVocalStateProfile } from "../lib/vocalStateProfile";
import type { VoiceAnalysisResult } from "../lib/voiceSpectrum";

function fixture(kind: "steady" | "loaded" | "expressive"): VoiceAnalysisResult {
  const selected = {
    steady: {
      resonanceScore: 0.82,
      activeFrameRatio: 0.72,
      voicedFrameRatio: 0.7,
      pauseDensityPerMin: 2,
      averagePauseMs: 260,
      speechRateProxyPerMin: 128,
      pitchRangeSemitones: 8,
      pitchStability: 0.9,
      pitchClarity: 0.92,
      jitterLocalPct: 0.6,
      shimmerLocalPct: 2.2,
      harmonicToNoiseRatioDb: 19,
      harmonicRichness: 0.82,
      spectralFlatness: 0.1,
      zeroCrossingRate: 0.05,
      formantStability: 0.88,
      formantDynamics: 0.58,
    },
    loaded: {
      resonanceScore: 0.38,
      activeFrameRatio: 0.48,
      voicedFrameRatio: 0.38,
      pauseDensityPerMin: 14,
      averagePauseMs: 1050,
      speechRateProxyPerMin: 76,
      pitchRangeSemitones: 4,
      pitchStability: 0.43,
      pitchClarity: 0.48,
      jitterLocalPct: 3.6,
      shimmerLocalPct: 9.8,
      harmonicToNoiseRatioDb: 5,
      harmonicRichness: 0.31,
      spectralFlatness: 0.46,
      zeroCrossingRate: 0.14,
      formantStability: 0.42,
      formantDynamics: 0.28,
    },
    expressive: {
      resonanceScore: 0.7,
      activeFrameRatio: 0.86,
      voicedFrameRatio: 0.76,
      pauseDensityPerMin: 4,
      averagePauseMs: 340,
      speechRateProxyPerMin: 164,
      pitchRangeSemitones: 12,
      pitchStability: 0.68,
      pitchClarity: 0.78,
      jitterLocalPct: 1.4,
      shimmerLocalPct: 4.1,
      harmonicToNoiseRatioDb: 13,
      harmonicRichness: 0.76,
      spectralFlatness: 0.2,
      zeroCrossingRate: 0.08,
      formantStability: 0.64,
      formantDynamics: 0.88,
    },
  }[kind];

  return {
    summary: kind,
    coreFrequencyHz: 148,
    spectralCentroidHz: 1200,
    resonanceScore: selected.resonanceScore,
    dominantBand: "D",
    dominantBandLabel: "D",
    spectrumBands: [],
    missingBands: [],
    excessBands: [],
    findings: [],
    supportPlan: [],
    methodology: "fixture",
    caution: "fixture",
    voiceDynamics: {
      analyzedDurationMs: 18000,
      voicedDurationMs: Math.round(18000 * selected.voicedFrameRatio),
      silenceDurationMs: Math.round(18000 * (1 - selected.voicedFrameRatio)),
      voicedFrameCount: 80,
      pitchFrameCount: 72,
      pauseCount: 3,
      medianPitchHz: 148,
      lowPitchHz: 105,
      highPitchHz: 218,
      medianMidi: 50,
      dominantOctave: 3,
      pitchRangeHz: 113,
      clippingFrameRatio: 0.01,
      captureQuality: "good",
      captureRecommendation: "good",
      primaryNoteSource: "tracked-pitch",
      ...selected,
    },
  };
}

test("builds the complete 16-indicator profile", () => {
  const profile = buildVocalStateProfile(fixture("steady"));
  assert.equal(profile.indicators.length, 16);
  assert.equal(new Set(profile.indicators.map((item) => item.id)).size, 16);
  assert.equal(profile.dominantIndicators.length, 4);
  assert.ok(profile.indicators.every((item) => item.score >= 0 && item.score <= 1));
  assert.ok(profile.indicators.every((item) => item.confidence >= 0 && item.confidence <= 1));
});

test("materially different vocal evidence produces different profiles", () => {
  const steady = buildVocalStateProfile(fixture("steady"));
  const loaded = buildVocalStateProfile(fixture("loaded"));
  const score = (profile: typeof steady, id: string) => profile.indicators.find((item) => item.id === id)?.score ?? 0;
  assert.ok(score(loaded, "stress") > score(steady, "stress"));
  assert.ok(score(loaded, "hesitation") > score(steady, "hesitation"));
  assert.ok(score(steady, "stress_recovery") > score(loaded, "stress_recovery"));
  assert.notEqual(steady.emotionalStyle, loaded.emotionalStyle);
});

test("expressive activation is distinguished from loaded stress", () => {
  const expressive = buildVocalStateProfile(fixture("expressive"));
  const loaded = buildVocalStateProfile(fixture("loaded"));
  const expressiveExcitement = expressive.indicators.find((item) => item.id === "excitement")?.score ?? 0;
  const loadedExcitement = loaded.indicators.find((item) => item.id === "excitement")?.score ?? 0;
  assert.ok(expressiveExcitement > loadedExcitement);
  assert.ok(expressive.axes.energy > loaded.axes.energy);
});

test("profile generation is deterministic", () => {
  assert.deepEqual(buildVocalStateProfile(fixture("expressive")), buildVocalStateProfile(fixture("expressive")));
});
