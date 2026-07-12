import test from "node:test";
import assert from "node:assert/strict";
import {
  buildBaselineComparison,
  buildPatternExpression,
  buildPatternModifiers,
  computeNarrativePreference,
  orderStoryCandidates,
} from "../lib/patternPersonalization";
import type { UserResultDomain, UserResultStoryCandidate } from "../lib/systemDimensions";
import type { VoiceAnalysisResult } from "../lib/voiceSpectrum";

const domains = (overrides: Partial<Record<UserResultDomain["title"], number>> = {}): UserResultDomain[] => {
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
  return titles.map((title) => {
    const score = overrides[title] ?? 55;
    return {
      title,
      score,
      activityLevel: score >= 65 ? "High" : score < 40 ? "Low" : "Moderate",
      functionalState: score >= 65 ? "Highly Engaged" : score < 30 ? "Asking for Support" : score < 40 ? "Recovering" : "Readily Available",
      currentPattern: "Test pattern",
      thisCouldExpressAs: [],
      itCanAlsoShowUpAs: [],
      supportiveReframe: "Test",
      signalSources: [],
    };
  });
};

const scan = (values: Partial<VoiceAnalysisResult> = {}): VoiceAnalysisResult => ({
  summary: "fixture",
  coreFrequencyHz: 140,
  spectralCentroidHz: 190,
  resonanceScore: 0.75,
  dominantBand: "E",
  dominantBandLabel: "E",
  noteEnergies: [
    { note: "E", score: 70, relativeEnergy: 0.35, status: "overactive" },
    { note: "A#", score: 52, relativeEnergy: 0.22, status: "overactive" },
    { note: "C", score: 30, relativeEnergy: 0.12, status: "underactive" },
    { note: "G#", score: 28, relativeEnergy: 0.1, status: "underactive" },
  ],
  spectrumBands: [],
  missingBands: [],
  excessBands: [],
  findings: [],
  supportPlan: [],
  methodology: "fixture",
  caution: "fixture",
  voiceDynamics: {
    analyzedDurationMs: 10000,
    voicedDurationMs: 8000,
    silenceDurationMs: 2000,
    activeFrameRatio: 0.8,
    voicedFrameRatio: 0.8,
    voicedFrameCount: 80,
    pitchFrameCount: 60,
    pauseCount: 4,
    averagePauseMs: 450,
    longestPauseMs: 900,
    medianPitchHz: 140,
    lowPitchHz: 110,
    highPitchHz: 180,
    medianMidi: 49,
    dominantOctave: 3,
    pitchRangeHz: 70,
    pitchRangeSemitones: 7,
    pitchStability: 0.55,
    pitchClarity: 0.7,
    jitterLocalPct: 5,
    shimmerLocalPct: 18,
    harmonicToNoiseRatioDb: 7,
    harmonicRichness: 0.65,
    spectralFlatness: 0.3,
    zeroCrossingRate: 100,
    pauseDensityPerMin: 24,
    speechRateProxyPerMin: 90,
    formantStability: 0.5,
    formantDynamics: 0.6,
    clippingFrameRatio: 0,
    captureQuality: "good",
    captureRecommendation: "good",
    primaryNoteSource: "tracked-pitch",
  },
  ...values,
});

test("materially different scans produce different expressions and modifiers", () => {
  const strained = buildPatternExpression("quietly-overloaded", scan(), domains({
    "Recovery & Restoration": 20,
    Regulation: 25,
    "Focus & Mental Load": 70,
  }));
  const steady = buildPatternExpression("balanced-regulator", scan({
    noteEnergies: [
      { note: "E", score: 45, relativeEnergy: 0.25, status: "balanced" },
      { note: "C", score: 44, relativeEnergy: 0.24, status: "balanced" },
      { note: "A", score: 43, relativeEnergy: 0.23, status: "balanced" },
      { note: "G#", score: 42, relativeEnergy: 0.22, status: "balanced" },
    ],
  }), domains({
    "Recovery & Restoration": 65,
    Regulation: 68,
    "Direction & Adaptability": 66,
  }));
  assert.notEqual(strained.id, steady.id);
  assert.notDeepEqual(
    buildPatternModifiers(scan(), domains({ "Recovery & Restoration": 20 })),
    buildPatternModifiers(scan({ voiceDynamics: { ...scan().voiceDynamics!, pauseCount: 0, pitchStability: 0.9 } }), domains({ Regulation: 70 })),
  );
});

test("similar broad patterns can produce different expressions", () => {
  const openLoops = buildPatternExpression("deep-processor", scan(), domains({ "Focus & Mental Load": 80 }));
  const integrating = buildPatternExpression("deep-processor", scan({
    voiceDynamics: { ...scan().voiceDynamics!, pauseCount: 0, pitchClarity: 0.95, harmonicToNoiseRatioDb: 14 },
  }), domains({ "Focus & Mental Load": 50, "Communication & Clarity": 70 }));
  assert.notEqual(openLoops.id, integrating.id);
});

test("preferred style requires at least three selections and a clear winner", () => {
  const one = computeNarrativePreference({ Direct: 1, Supportive: 0, Insight: 0 }, "Direct");
  assert.equal(one.established, false);
  assert.equal(one.preferredStyle, null);
  const established = computeNarrativePreference({ Direct: 3, Supportive: 0, Insight: 0 }, "Direct");
  assert.equal(established.established, true);
  assert.equal(established.preferredStyle, "Direct");
});

test("established preference orders first while retaining all cards", () => {
  const candidates: UserResultStoryCandidate[] = [
    { style: "Direct", title: "D", summary: "D", strongestResources: [], areasWorkingHard: [], areasAskingForSupport: [] },
    { style: "Supportive", title: "S", summary: "S", strongestResources: [], areasWorkingHard: [], areasAskingForSupport: [] },
    { style: "Insight", title: "I", summary: "I", strongestResources: [], areasWorkingHard: [], areasAskingForSupport: [] },
  ];
  const ordered = orderStoryCandidates(candidates, computeNarrativePreference({ Direct: 0, Supportive: 4, Insight: 1 }, "Supportive"));
  assert.equal(ordered.length, 3);
  assert.equal(ordered[0].style, "Supportive");
});

test("baseline is unavailable without two prior valid scans", () => {
  const result = buildBaselineComparison(domains(), [domains()]);
  assert.equal(result.available, false);
});

test("baseline returns higher lower and stable directions", () => {
  const history = [domains(), domains()];
  const current = domains({
    "Recovery & Restoration": 70,
    "Focus & Mental Load": 35,
    Regulation: 56,
  });
  const result = buildBaselineComparison(current, history);
  assert.equal(result.available, true);
  assert.equal(result.changes.find((item) => item.dimension === "Recovery & Restoration")?.direction, "higher");
  assert.equal(result.changes.find((item) => item.dimension === "Focus & Mental Load")?.direction, "lower");
  assert.equal(result.changes.find((item) => item.dimension === "Regulation")?.direction, "stable");
});

test("poor capture quality uses neutral resolving expression", () => {
  const poor = scan({ voiceDynamics: { ...scan().voiceDynamics!, captureQuality: "poor" } });
  const expression = buildPatternExpression("deep-processor", poor, domains());
  assert.equal(expression.id, "signals-still-resolving");
});
