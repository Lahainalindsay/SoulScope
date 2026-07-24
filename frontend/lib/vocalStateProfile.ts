import type { VoiceAnalysisResult, VoiceDynamics } from "./voiceSpectrum";

export type VocalStateIndicatorId =
  | "stress"
  | "stress_recovery"
  | "joy"
  | "sadness"
  | "aggression"
  | "hesitation"
  | "concentration"
  | "anticipation"
  | "excitement"
  | "arousal"
  | "uneasiness"
  | "uncertainty"
  | "imagination"
  | "mental_effort"
  | "atmosphere"
  | "discomfort";

export type VocalStateIndicator = {
  id: VocalStateIndicatorId;
  label: string;
  score: number;
  confidence: number;
  level: "low" | "moderate" | "high";
  evidence: string[];
  caution: string;
};

export type VocalStateProfile = {
  version: "v1";
  model: "soulscope-independent-vocal-state-profile";
  indicators: VocalStateIndicator[];
  dominantIndicators: VocalStateIndicatorId[];
  emotionalStyle: "energetic-logical" | "energetic-emotional" | "stressed-emotional" | "stressed-logical" | "mixed";
  axes: {
    energy: number;
    stress: number;
    emotionalExpression: number;
    cognitiveControl: number;
  };
  quality: {
    confidence: number;
    captureQuality: VoiceDynamics["captureQuality"] | "unknown";
    warning?: string;
  };
  methodology: string;
};

type Inputs = {
  active: number;
  voiced: number;
  pauses: number;
  pauseLength: number;
  rate: number;
  range: number;
  stability: number;
  clarity: number;
  jitter: number;
  shimmer: number;
  hnr: number;
  richness: number;
  flatness: number;
  zcr: number;
  formantStability: number;
  formantDynamics: number;
  resonance: number;
};

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const inv = (value: number) => 1 - clamp(value);
const mix = (...values: Array<[number, number]>) => {
  const weight = values.reduce((sum, [, next]) => sum + next, 0) || 1;
  return clamp(values.reduce((sum, [value, next]) => sum + clamp(value) * next, 0) / weight);
};
const normalized = (value: number | undefined, low: number, high: number, fallback = 0.5) =>
  value == null || !Number.isFinite(value) ? fallback : clamp((value - low) / (high - low));

function inputsFrom(scan: VoiceAnalysisResult): Inputs {
  const d = scan.voiceDynamics;
  return {
    active: clamp(d?.activeFrameRatio ?? 0.5),
    voiced: clamp(d?.voicedFrameRatio ?? 0.5),
    pauses: normalized(d?.pauseDensityPerMin, 1, 16),
    pauseLength: normalized(d?.averagePauseMs, 180, 1300),
    rate: normalized(d?.speechRateProxyPerMin, 65, 175),
    range: normalized(d?.pitchRangeSemitones, 2, 13),
    stability: clamp(d?.pitchStability ?? 0.5),
    clarity: clamp(d?.pitchClarity ?? 0.5),
    jitter: normalized(d?.jitterLocalPct, 0.4, 4),
    shimmer: normalized(d?.shimmerLocalPct, 1.5, 11),
    hnr: normalized(d?.harmonicToNoiseRatioDb, 3, 22),
    richness: clamp(d?.harmonicRichness ?? 0.5),
    flatness: normalized(d?.spectralFlatness, 0.08, 0.5),
    zcr: normalized(d?.zeroCrossingRate, 0.03, 0.16),
    formantStability: clamp(d?.formantStability ?? 0.5),
    formantDynamics: clamp(d?.formantDynamics ?? 0.5),
    resonance: clamp(scan.resonanceScore),
  };
}

function level(score: number): VocalStateIndicator["level"] {
  return score >= 0.67 ? "high" : score >= 0.37 ? "moderate" : "low";
}

function confidenceFor(scan: VoiceAnalysisResult, evidenceCount: number) {
  const d = scan.voiceDynamics;
  const quality = d?.captureQuality === "good" ? 0.92 : d?.captureQuality === "fair" ? 0.7 : 0.42;
  const voiced = clamp(d?.voicedFrameRatio ?? 0.4);
  const duration = normalized(d?.voicedDurationMs, 2500, 18000, 0.45);
  return clamp(mix([quality, 0.5], [voiced, 0.25], [duration, 0.25]) * Math.min(1, evidenceCount / 3));
}

export function buildVocalStateProfile(scan: VoiceAnalysisResult): VocalStateProfile {
  const x = inputsFrom(scan);
  const energy = mix([x.active, 0.25], [x.voiced, 0.2], [x.rate, 0.2], [x.range, 0.2], [x.richness, 0.15]);
  const instability = mix([x.jitter, 0.25], [x.shimmer, 0.2], [inv(x.hnr), 0.2], [x.flatness, 0.15], [x.zcr, 0.1], [inv(x.stability), 0.1]);
  const selfFiltering = mix([x.pauses, 0.3], [x.pauseLength, 0.25], [inv(x.rate), 0.15], [x.formantStability, 0.15], [inv(x.formantDynamics), 0.15]);
  const cognitiveLoad = mix([x.pauses, 0.18], [x.pauseLength, 0.17], [instability, 0.2], [inv(x.clarity), 0.15], [x.formantDynamics, 0.15], [x.range, 0.15]);
  const stress = mix([instability, 0.5], [selfFiltering, 0.18], [energy, 0.12], [inv(x.resonance), 0.2]);
  const expression = mix([x.range, 0.25], [x.formantDynamics, 0.25], [x.richness, 0.2], [x.active, 0.15], [inv(selfFiltering), 0.15]);
  const cognitiveControl = mix([x.formantStability, 0.22], [x.stability, 0.2], [x.clarity, 0.18], [selfFiltering, 0.2], [inv(instability), 0.2]);
  const recovery = mix([inv(stress), 0.32], [x.resonance, 0.25], [x.stability, 0.18], [x.hnr, 0.15], [inv(x.pauseLength), 0.1]);

  const definitions: Array<[VocalStateIndicatorId, string, number, string[]]> = [
    ["stress", "Stress", stress, ["micro-instability", "harmonic noise", "vocal self-filtering"]],
    ["stress_recovery", "Stress recovery", recovery, ["resonance", "pitch steadiness", "harmonic organization"]],
    ["joy", "Joy expression", mix([energy, 0.3], [expression, 0.3], [x.resonance, 0.25], [x.hnr, 0.15]), ["energy", "expressive range", "resonance"]],
    ["sadness", "Sadness expression", mix([inv(energy), 0.35], [inv(x.range), 0.2], [inv(x.rate), 0.15], [x.pauseLength, 0.15], [inv(x.richness), 0.15]), ["lower energy", "narrower range", "slower pacing"]],
    ["aggression", "Forceful activation", mix([energy, 0.32], [x.rate, 0.18], [x.zcr, 0.16], [x.range, 0.14], [instability, 0.2]), ["activation", "speech rate", "spectral edge"]],
    ["hesitation", "Hesitation", selfFiltering, ["pause density", "pause length", "controlled delivery"]],
    ["concentration", "Concentration", mix([cognitiveControl, 0.35], [x.active, 0.2], [x.clarity, 0.2], [inv(x.pauses), 0.1], [x.formantStability, 0.15]), ["clarity", "continuity", "formant organization"]],
    ["anticipation", "Anticipation", mix([energy, 0.2], [x.range, 0.2], [x.rate, 0.18], [x.formantDynamics, 0.22], [selfFiltering, 0.2]), ["forward energy", "pitch movement", "response monitoring"]],
    ["excitement", "Excitement", mix([energy, 0.42], [expression, 0.28], [x.rate, 0.15], [x.range, 0.15]), ["energy", "pace", "expressive movement"]],
    ["arousal", "Arousal", mix([energy, 0.38], [stress, 0.22], [expression, 0.2], [x.active, 0.2]), ["activation", "intensity", "expressive movement"]],
    ["uneasiness", "Uneasiness", mix([stress, 0.4], [selfFiltering, 0.22], [inv(x.clarity), 0.18], [instability, 0.2]), ["stress loading", "hesitation", "reduced clarity"]],
    ["uncertainty", "Uncertainty", mix([selfFiltering, 0.3], [cognitiveLoad, 0.28], [inv(x.clarity), 0.2], [inv(x.stability), 0.22]), ["hesitation", "mental effort", "pitch variability"]],
    ["imagination", "Imaginative processing", mix([x.formantDynamics, 0.3], [x.range, 0.25], [cognitiveLoad, 0.2], [expression, 0.25]), ["formant movement", "pitch range", "cognitive variation"]],
    ["mental_effort", "Mental effort", cognitiveLoad, ["pause behavior", "voice organization", "spectral instability"]],
    ["atmosphere", "Positive atmosphere", mix([x.resonance, 0.3], [recovery, 0.25], [expression, 0.2], [energy, 0.15], [x.hnr, 0.1]), ["resonance", "recovery", "expressive availability"]],
    ["discomfort", "Discomfort", mix([stress, 0.35], [instability, 0.25], [selfFiltering, 0.2], [inv(x.resonance), 0.2]), ["stress", "micro-instability", "guarded delivery"]],
  ];

  const indicators = definitions.map(([id, labelText, rawScore, evidence]) => {
    const score = Math.round(clamp(rawScore) * 1000) / 1000;
    return {
      id,
      label: labelText,
      score,
      confidence: Math.round(confidenceFor(scan, evidence.length) * 1000) / 1000,
      level: level(score),
      evidence,
      caution: "A vocal correlate for reflection, not a direct measurement of a private emotion or diagnosis.",
    } satisfies VocalStateIndicator;
  });

  const emotionalStyle = stress >= 0.58
    ? expression >= 0.52 ? "stressed-emotional" : "stressed-logical"
    : energy >= 0.55
    ? expression >= 0.52 ? "energetic-emotional" : "energetic-logical"
    : "mixed";
  const overallConfidence = indicators.reduce((sum, item) => sum + item.confidence, 0) / indicators.length;

  return {
    version: "v1",
    model: "soulscope-independent-vocal-state-profile",
    indicators,
    dominantIndicators: [...indicators].sort((a, b) => b.score - a.score).slice(0, 4).map((item) => item.id),
    emotionalStyle,
    axes: {
      energy: Math.round(energy * 1000) / 1000,
      stress: Math.round(stress * 1000) / 1000,
      emotionalExpression: Math.round(expression * 1000) / 1000,
      cognitiveControl: Math.round(cognitiveControl * 1000) / 1000,
    },
    quality: {
      confidence: Math.round(overallConfidence * 1000) / 1000,
      captureQuality: scan.voiceDynamics?.captureQuality ?? "unknown",
      warning: overallConfidence < 0.55 ? "Treat this profile as provisional because the captured signal was limited." : undefined,
    },
    methodology: "Deterministic, explainable scoring of acoustic features already measured by SoulScope. Inspired by public multi-profile voice-report architecture; no proprietary LVA formulas or models are used.",
  };
}
