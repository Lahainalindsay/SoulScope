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

type PhaseName = "baseline" | "challenge" | "hope";

type PhaseSummary = {
  phase: PhaseName;
  available: boolean;
  quality: VoiceDynamics["captureQuality"] | "unknown";
  stress: number;
  energy: number;
  expression: number;
  cognitiveControl: number;
  hesitation: number;
  mentalEffort: number;
  resonance: number;
};

export type VocalStateProfile = {
  version: "v2";
  model: "soulscope-baseline-aware-vocal-state-profile";
  indicators: VocalStateIndicator[];
  dominantIndicators: VocalStateIndicatorId[];
  emotionalStyle: "energetic-logical" | "energetic-emotional" | "stressed-emotional" | "stressed-logical" | "mixed";
  axes: {
    energy: number;
    stress: number;
    emotionalExpression: number;
    cognitiveControl: number;
  };
  phaseComparison: {
    baseline: PhaseSummary;
    challenge: PhaseSummary;
    hope: PhaseSummary;
    challengeDelta: {
      stress: number;
      energy: number;
      expression: number;
      cognitiveControl: number;
      hesitation: number;
      mentalEffort: number;
    };
    hopeDelta: {
      stress: number;
      energy: number;
      expression: number;
      cognitiveControl: number;
      hesitation: number;
      mentalEffort: number;
    };
    recovery: number;
    mode: "within-person" | "aggregate-fallback";
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

type PromptAnalysis = NonNullable<NonNullable<VoiceAnalysisResult["analysisDebug"]>["promptAnalyses"]>[number];

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const round = (value: number) => Math.round(value * 1000) / 1000;
const inv = (value: number) => 1 - clamp(value);
const mix = (...values: Array<[number, number]>) => {
  const weight = values.reduce((sum, [, next]) => sum + next, 0) || 1;
  return clamp(values.reduce((sum, [value, next]) => sum + clamp(value) * next, 0) / weight);
};
const normalized = (value: number | undefined, low: number, high: number, fallback = 0.5) =>
  value == null || !Number.isFinite(value) ? fallback : clamp((value - low) / (high - low));
const positiveDelta = (value: number) => clamp(0.5 + value / 2);

function inputsFromDynamics(d: VoiceDynamics | undefined, resonanceScore: number | undefined): Inputs {
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
    resonance: clamp(resonanceScore ?? 0.5),
  };
}

function summarize(phase: PhaseName, d: VoiceDynamics | undefined, resonanceScore: number | undefined): PhaseSummary {
  const x = inputsFromDynamics(d, resonanceScore);
  const energy = mix([x.active, 0.25], [x.voiced, 0.2], [x.rate, 0.2], [x.range, 0.2], [x.richness, 0.15]);
  const instability = mix([x.jitter, 0.25], [x.shimmer, 0.2], [inv(x.hnr), 0.2], [x.flatness, 0.15], [x.zcr, 0.1], [inv(x.stability), 0.1]);
  const hesitation = mix([x.pauses, 0.3], [x.pauseLength, 0.25], [inv(x.rate), 0.15], [x.formantStability, 0.15], [inv(x.formantDynamics), 0.15]);
  const mentalEffort = mix([x.pauses, 0.18], [x.pauseLength, 0.17], [instability, 0.2], [inv(x.clarity), 0.15], [x.formantDynamics, 0.15], [x.range, 0.15]);
  const stress = mix([instability, 0.5], [hesitation, 0.18], [energy, 0.12], [inv(x.resonance), 0.2]);
  const expression = mix([x.range, 0.25], [x.formantDynamics, 0.25], [x.richness, 0.2], [x.active, 0.15], [inv(hesitation), 0.15]);
  const cognitiveControl = mix([x.formantStability, 0.22], [x.stability, 0.2], [x.clarity, 0.18], [hesitation, 0.2], [inv(instability), 0.2]);

  return {
    phase,
    available: Boolean(d),
    quality: d?.captureQuality ?? "unknown",
    stress: round(stress),
    energy: round(energy),
    expression: round(expression),
    cognitiveControl: round(cognitiveControl),
    hesitation: round(hesitation),
    mentalEffort: round(mentalEffort),
    resonance: round(x.resonance),
  };
}

function phaseFromPrompt(prompt: PromptAnalysis | undefined, phase: PhaseName): PhaseSummary {
  return summarize(phase, prompt?.voiceDynamics, prompt?.resonanceScore);
}

function level(score: number): VocalStateIndicator["level"] {
  return score >= 0.67 ? "high" : score >= 0.37 ? "moderate" : "low";
}

function qualityValue(quality: PhaseSummary["quality"]) {
  return quality === "good" ? 0.92 : quality === "fair" ? 0.7 : quality === "poor" ? 0.42 : 0.35;
}

function overallCaptureQuality(phases: PhaseSummary[]): VocalStateProfile["quality"]["captureQuality"] {
  const available = phases.filter((phase) => phase.available);
  if (!available.length) return "unknown";
  if (available.every((phase) => phase.quality === "good")) return "good";
  if (available.some((phase) => phase.quality === "poor")) return "poor";
  return "fair";
}

export function buildVocalStateProfile(scan: VoiceAnalysisResult): VocalStateProfile {
  const prompts = [...(scan.analysisDebug?.promptAnalyses ?? [])].sort((a, b) => a.index - b.index);
  const hasAllPhases = prompts.length >= 3 && prompts.slice(0, 3).every((prompt) => Boolean(prompt.voiceDynamics));

  const aggregate = summarize("baseline", scan.voiceDynamics, scan.resonanceScore);
  const baseline = hasAllPhases ? phaseFromPrompt(prompts[0], "baseline") : aggregate;
  const challenge = hasAllPhases ? phaseFromPrompt(prompts[1], "challenge") : summarize("challenge", scan.voiceDynamics, scan.resonanceScore);
  const hope = hasAllPhases ? phaseFromPrompt(prompts[2], "hope") : summarize("hope", scan.voiceDynamics, scan.resonanceScore);

  const delta = (phase: PhaseSummary, key: keyof Pick<PhaseSummary, "stress" | "energy" | "expression" | "cognitiveControl" | "hesitation" | "mentalEffort">) =>
    round(phase[key] - baseline[key]);

  const challengeDelta = {
    stress: delta(challenge, "stress"),
    energy: delta(challenge, "energy"),
    expression: delta(challenge, "expression"),
    cognitiveControl: delta(challenge, "cognitiveControl"),
    hesitation: delta(challenge, "hesitation"),
    mentalEffort: delta(challenge, "mentalEffort"),
  };
  const hopeDelta = {
    stress: delta(hope, "stress"),
    energy: delta(hope, "energy"),
    expression: delta(hope, "expression"),
    cognitiveControl: delta(hope, "cognitiveControl"),
    hesitation: delta(hope, "hesitation"),
    mentalEffort: delta(hope, "mentalEffort"),
  };

  const challengeDistance = Math.abs(challenge.stress - baseline.stress)
    + Math.abs(challenge.hesitation - baseline.hesitation)
    + Math.abs(challenge.mentalEffort - baseline.mentalEffort);
  const hopeDistance = Math.abs(hope.stress - baseline.stress)
    + Math.abs(hope.hesitation - baseline.hesitation)
    + Math.abs(hope.mentalEffort - baseline.mentalEffort);
  const recovery = hasAllPhases
    ? clamp(challengeDistance <= 0.03 ? 0.5 : 1 - hopeDistance / challengeDistance)
    : mix([inv(aggregate.stress), 0.4], [aggregate.resonance, 0.3], [aggregate.cognitiveControl, 0.3]);

  const stress = hasAllPhases
    ? mix([positiveDelta(challengeDelta.stress), 0.5], [positiveDelta(challengeDelta.hesitation), 0.2], [positiveDelta(challengeDelta.mentalEffort), 0.2], [challenge.stress, 0.1])
    : aggregate.stress;
  const energy = hasAllPhases
    ? mix([positiveDelta(challengeDelta.energy), 0.35], [positiveDelta(hopeDelta.energy), 0.25], [challenge.energy, 0.2], [hope.energy, 0.2])
    : aggregate.energy;
  const expression = hasAllPhases
    ? mix([positiveDelta(hopeDelta.expression), 0.4], [hope.expression, 0.25], [positiveDelta(challengeDelta.expression), 0.15], [baseline.expression, 0.2])
    : aggregate.expression;
  const cognitiveControl = hasAllPhases
    ? mix([positiveDelta(challengeDelta.cognitiveControl), 0.3], [positiveDelta(hopeDelta.cognitiveControl), 0.3], [challenge.cognitiveControl, 0.2], [hope.cognitiveControl, 0.2])
    : aggregate.cognitiveControl;

  const rawIndicators: Array<[VocalStateIndicatorId, string, number, string[]]> = [
    ["stress", "Stress", stress, ["challenge change from baseline", "micro-instability", "hesitation shift"]],
    ["stress_recovery", "Stress recovery", recovery, ["movement from challenge toward baseline", "vocal organization", "resonance"]],
    ["joy", "Joy expression", mix([positiveDelta(hopeDelta.expression), 0.35], [positiveDelta(hopeDelta.energy), 0.25], [hope.resonance, 0.25], [recovery, 0.15]), ["hope-phase expression", "energy change", "resonance"]],
    ["sadness", "Sadness expression", mix([positiveDelta(-challengeDelta.energy), 0.3], [positiveDelta(-challengeDelta.expression), 0.25], [positiveDelta(challengeDelta.hesitation), 0.2], [challenge.stress, 0.25]), ["reduced energy", "narrowed expression", "increased pausing"]],
    ["aggression", "Forceful activation", mix([positiveDelta(challengeDelta.energy), 0.4], [positiveDelta(challengeDelta.stress), 0.25], [positiveDelta(challengeDelta.expression), 0.15], [challenge.energy, 0.2]), ["challenge activation", "energy increase", "stress loading"]],
    ["hesitation", "Hesitation", mix([positiveDelta(challengeDelta.hesitation), 0.5], [positiveDelta(hopeDelta.hesitation), 0.2], [challenge.hesitation, 0.3]), ["pause change from baseline", "response monitoring", "speech continuity"]],
    ["concentration", "Concentration", mix([challenge.cognitiveControl, 0.35], [positiveDelta(challengeDelta.mentalEffort), 0.25], [positiveDelta(-challengeDelta.hesitation), 0.15], [challenge.energy, 0.25]), ["organized effort", "continuity", "challenge engagement"]],
    ["anticipation", "Anticipation", mix([positiveDelta(hopeDelta.energy), 0.3], [positiveDelta(hopeDelta.expression), 0.3], [hope.mentalEffort, 0.2], [hope.resonance, 0.2]), ["future-oriented activation", "expressive movement", "mental preparation"]],
    ["excitement", "Excitement", mix([positiveDelta(hopeDelta.energy), 0.4], [positiveDelta(hopeDelta.expression), 0.35], [hope.energy, 0.25]), ["hope-phase energy", "expressive expansion", "activation"]],
    ["arousal", "Arousal", mix([positiveDelta(challengeDelta.energy), 0.3], [positiveDelta(challengeDelta.stress), 0.3], [positiveDelta(challengeDelta.expression), 0.2], [challenge.energy, 0.2]), ["challenge reactivity", "activation", "expressive movement"]],
    ["uneasiness", "Uneasiness", mix([positiveDelta(challengeDelta.stress), 0.4], [positiveDelta(challengeDelta.hesitation), 0.3], [positiveDelta(-challengeDelta.cognitiveControl), 0.2], [challenge.stress, 0.1]), ["stress increase", "hesitation increase", "reduced organization"]],
    ["uncertainty", "Uncertainty", mix([positiveDelta(challengeDelta.hesitation), 0.35], [positiveDelta(challengeDelta.mentalEffort), 0.3], [positiveDelta(-challengeDelta.cognitiveControl), 0.25], [challenge.hesitation, 0.1]), ["hesitation", "mental effort", "control change"]],
    ["imagination", "Imaginative processing", mix([positiveDelta(hopeDelta.expression), 0.35], [positiveDelta(hopeDelta.energy), 0.25], [hope.mentalEffort, 0.2], [hope.expression, 0.2]), ["future-prompt expression", "variation", "cognitive engagement"]],
    ["mental_effort", "Mental effort", mix([positiveDelta(challengeDelta.mentalEffort), 0.55], [challenge.mentalEffort, 0.25], [positiveDelta(challengeDelta.hesitation), 0.2]), ["effort change from baseline", "pause behavior", "vocal organization"]],
    ["atmosphere", "Positive atmosphere", mix([positiveDelta(hopeDelta.expression), 0.25], [positiveDelta(hopeDelta.energy), 0.2], [hope.resonance, 0.25], [recovery, 0.3]), ["hope-phase resonance", "recovery", "expressive availability"]],
    ["discomfort", "Discomfort", mix([positiveDelta(challengeDelta.stress), 0.35], [positiveDelta(challengeDelta.hesitation), 0.25], [positiveDelta(challengeDelta.mentalEffort), 0.2], [inv(challenge.resonance), 0.2]), ["challenge stress", "guarded delivery", "effort increase"]],
  ];

  const phases = [baseline, challenge, hope];
  const phaseQuality = phases.reduce((sum, phase) => sum + qualityValue(phase.quality), 0) / phases.length;
  const completeness = hasAllPhases ? 1 : 0.58;
  const overallConfidence = clamp(phaseQuality * completeness);
  const indicators = rawIndicators.map(([id, label, rawScore, evidence]) => {
    const score = round(rawScore);
    return {
      id,
      label,
      score,
      confidence: round(overallConfidence),
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

  return {
    version: "v2",
    model: "soulscope-baseline-aware-vocal-state-profile",
    indicators,
    dominantIndicators: [...indicators].sort((a, b) => b.score - a.score).slice(0, 4).map((item) => item.id),
    emotionalStyle,
    axes: {
      energy: round(energy),
      stress: round(stress),
      emotionalExpression: round(expression),
      cognitiveControl: round(cognitiveControl),
    },
    phaseComparison: {
      baseline,
      challenge,
      hope,
      challengeDelta,
      hopeDelta,
      recovery: round(recovery),
      mode: hasAllPhases ? "within-person" : "aggregate-fallback",
    },
    quality: {
      confidence: round(overallConfidence),
      captureQuality: overallCaptureQuality(phases),
      warning: !hasAllPhases
        ? "A complete baseline, challenge, and hope comparison was unavailable, so this profile used the aggregate scan as a provisional fallback."
        : overallConfidence < 0.55
        ? "Treat this profile as provisional because one or more captured signals were limited."
        : undefined,
    },
    methodology: "One report-wide profile derived from three measurement conditions. The first recording establishes the personal baseline; challenge and hope recordings are interpreted as within-person change. Deterministic acoustic scoring is independent of proprietary LVA formulas and remains non-diagnostic.",
  };
}
