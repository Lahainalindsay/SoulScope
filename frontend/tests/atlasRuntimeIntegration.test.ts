import assert from "node:assert/strict";
import test from "node:test";
import { buildAtlasRuntime } from "../lib/atlasRuntime";
import { buildAtlasSignatureModel } from "../lib/atlasSignature";
import type { BaselineComparison } from "../lib/patternPersonalization";
import type { UserResultDomain } from "../lib/systemDimensions";
import type { VoiceAnalysisResult, VoiceDynamics } from "../lib/voiceSpectrum";

const noBaseline: BaselineComparison = { available: false, scansUsed: 0, changes: [] };

function dynamics(overrides: Partial<VoiceDynamics> = {}): VoiceDynamics {
  return {
    analyzedDurationMs: 18000,
    voicedDurationMs: 12000,
    silenceDurationMs: 6000,
    activeFrameRatio: 0.66,
    voicedFrameRatio: 0.58,
    voicedFrameCount: 120,
    pitchFrameCount: 100,
    pauseCount: 3,
    averagePauseMs: 420,
    longestPauseMs: 900,
    medianPitchHz: 180,
    lowPitchHz: 130,
    highPitchHz: 260,
    medianMidi: 54,
    dominantOctave: 3,
    pitchRangeHz: 130,
    pitchRangeSemitones: 7,
    pitchStability: 0.76,
    pitchClarity: 0.78,
    harmonicToNoiseRatioDb: 18,
    harmonicRichness: 0.65,
    spectralFlatness: 0.2,
    zeroCrossingRate: 0.12,
    pauseDensityPerMin: 7,
    speechRateProxyPerMin: 118,
    formantStability: 0.72,
    formantDynamics: 0.55,
    clippingFrameRatio: 0,
    captureQuality: "good",
    captureRecommendation: "Capture quality is suitable for interpretation.",
    primaryNoteSource: "tracked-pitch",
    ...overrides,
  };
}

function scan(voiceDynamics: VoiceDynamics): VoiceAnalysisResult {
  return {
    summary: "test",
    coreFrequencyHz: 180,
    spectralCentroidHz: 1100,
    resonanceScore: 70,
    dominantBand: "mid",
    dominantBandLabel: "Mid",
    spectrumBands: [],
    missingBands: [],
    excessBands: [],
    findings: [],
    supportPlan: [],
    methodology: "test",
    caution: "test",
    voiceDynamics,
  };
}

const titles: UserResultDomain["title"][] = [
  "Energy & Vitality",
  "Recovery & Restoration",
  "Communication & Clarity",
  "Emotional Expression",
  "Connection & Support",
  "Focus & Mental Load",
  "Direction & Adaptability",
  "Regulation",
];

function domains(values: Partial<Record<UserResultDomain["title"], { score: number; functionalState: UserResultDomain["functionalState"] }>>): UserResultDomain[] {
  return titles.map((title) => ({
    title,
    score: values[title]?.score ?? 70,
    activityLevel: "Moderate",
    functionalState: values[title]?.functionalState ?? "Readily Available",
    currentPattern: "Test pattern",
    thisCouldExpressAs: ["Test expression"],
    itCanAlsoShowUpAs: ["Alternate test expression"],
    supportiveReframe: "Test reframe",
    signalSources: ["Test signal"],
  }));
}

test("atlas separates overextended and grounded states", () => {
  const overextended = buildAtlasRuntime(
    scan(dynamics({ voicedFrameRatio: 0.3, pauseDensityPerMin: 15, averagePauseMs: 1100, pitchStability: 0.42 })),
    domains({
      "Energy & Vitality": { score: 48, functionalState: "Working Hard" },
      "Recovery & Restoration": { score: 24, functionalState: "Asking for Support" },
      "Focus & Mental Load": { score: 35, functionalState: "Under Pressure" },
      "Direction & Adaptability": { score: 68, functionalState: "Working Hard" },
      Regulation: { score: 52, functionalState: "Working Hard" },
    }),
    noBaseline,
  );
  const grounded = buildAtlasRuntime(
    scan(dynamics({ voicedFrameRatio: 0.68, pauseDensityPerMin: 4, averagePauseMs: 260, pitchStability: 0.88 })),
    domains({}),
    noBaseline,
  );

  assert.notEqual(overextended.result.profile.id, grounded.result.profile.id);
  assert.ok(overextended.input["reduced-recovery"]! > grounded.input["reduced-recovery"]!);
  assert.ok(grounded.input["grounded-presence"]! > overextended.input["grounded-presence"]!);
});

test("protective and expressive states resolve differently", () => {
  const protective = buildAtlasRuntime(
    scan(dynamics({ pitchRangeSemitones: 2, formantDynamics: 0.18 })),
    domains({
      "Emotional Expression": { score: 35, functionalState: "Under Pressure" },
      "Connection & Support": { score: 42, functionalState: "Working Hard" },
      "Communication & Clarity": { score: 58, functionalState: "Working Hard" },
    }),
    noBaseline,
  );
  const expressive = buildAtlasRuntime(
    scan(dynamics({ pitchRangeSemitones: 11, formantDynamics: 0.82, harmonicRichness: 0.86 })),
    domains({
      "Emotional Expression": { score: 86, functionalState: "Highly Engaged" },
      "Connection & Support": { score: 84, functionalState: "Readily Available" },
      "Communication & Clarity": { score: 88, functionalState: "Highly Engaged" },
    }),
    noBaseline,
  );

  assert.notEqual(protective.result.profile.id, expressive.result.profile.id);
  assert.ok(protective.input["protective-restraint"]! > expressive.input["protective-restraint"]!);
  assert.ok(expressive.input["expressive-flexibility"]! > protective.input["expressive-flexibility"]!);
});

test("the same atlas result deterministically configures signature geometry", () => {
  const runtime = buildAtlasRuntime(scan(dynamics()), domains({}), noBaseline);
  const first = buildAtlasSignatureModel(runtime.input, runtime.result);
  const second = buildAtlasSignatureModel(runtime.input, runtime.result);

  assert.deepEqual(first, second);
  assert.ok(first.data.some((datum) => datum.id.startsWith("atlas:profile:")));
  assert.ok(first.data.some((datum) => datum.id.startsWith("atlas:evidence:")));
  for (const value of Object.values(first.visualState)) {
    assert.ok(value >= 0 && value <= 1);
  }
});
