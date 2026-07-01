import { type VoiceAnalysisResult } from "./voiceSpectrum";

export type SystemDimensionName =
  | "Regulation"
  | "Vitality"
  | "Recovery"
  | "Adaptability"
  | "Expression"
  | "Cognitive Load";

export type SystemDimension = {
  name: SystemDimensionName;
  score: number;
  level: "High" | "Medium" | "Low";
  band: "Extremely Low" | "Low" | "Balanced" | "High" | "Extremely High";
  state: "available" | "balanced" | "requesting attention";
  derivedFrom: string;
  interpretation: string;
  attention?: string;
};

export type SystemSignature = {
  name: "Stress Load" | "Fatigue Load" | "Burnout Pattern" | "Anxious Activation" | "Low Activation";
  strength: number;
  interpretation: string;
  likelySystems: string[];
};

export type SpectralMeasurement = {
  label: string;
  level: "High" | "Moderate" | "Low" | "Informational";
  evidence: string;
  meaning: string;
};

export type VoiceFrequencyBand = {
  rangeHz: string;
  voiceCharacteristic: string;
  potentialInterpretation: string;
};

export type StressSpectralEffect = {
  spectralChange: string;
  commonEffect: string;
};

export type ResearchFinding = {
  finding: string;
  evidenceLevel: "Strong" | "Moderate" | "Weak/insufficient" | "No evidence";
};

export type VoiceWellnessDimension = {
  dimension: "Vitality" | "Regulation" | "Adaptability" | "Recovery" | "Expression" | "Cognitive Load";
  spectralIndicators: string;
  narrativeMeaning: string;
};

export type UserResultDimensionName =
  | "Grounding & Stability"
  | "Energy & Vitality"
  | "Communication Clarity"
  | "Emotional Expression"
  | "Presence & Engagement"
  | "Awareness & Sensitivity"
  | "Recovery"
  | "Cognitive Load"
  | "Adaptability"
  | "Future Focus"
  | "Reflection & Insight"
  | "Connection";

export type DimensionOrientation = "support" | "demand";
export type ScoreBand = "Extremely Low" | "Low" | "Balanced" | "High" | "Extremely High";

export type UserResultDimension = {
  name: UserResultDimensionName;
  score: number;
  band: ScoreBand;
  orientation: DimensionOrientation;
  stateLabel: string;
  interpretation: string;
  whatThisOftenLooksLike: string;
  signalReference: string;
};

export type UserResultDomainName =
  | "Energy & Vitality"
  | "Recovery & Restoration"
  | "Communication & Clarity"
  | "Emotional Expression"
  | "Connection & Support"
  | "Focus & Mental Load"
  | "Direction & Adaptability"
  | "Regulation";

export type UserResultDomainActivity = "Low" | "Moderate" | "High";

export type UserResultFunctionalState =
  | "Highly Engaged"
  | "Working Hard"
  | "Readily Available"
  | "Asking for Support"
  | "Under Pressure"
  | "Less Accessible"
  | "Recovering";

export type UserResultDomain = {
  title: UserResultDomainName;
  activityLevel: UserResultDomainActivity;
  functionalState: UserResultFunctionalState;
  currentPattern: string;
  thisCouldExpressAs: string[];
  itCanAlsoShowUpAs: string[];
  supportiveReframe: string;
  signalSources: string[];
  score: number;
};

export type UserResultStory = {
  headline: string;
  whatsGoingWell: string;
  whatMayFeelHard: string;
  integration: string;
  nextStep: string;
};

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 50;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function average(values: number[]): number {
  const valid = values.filter((value) => Number.isFinite(value));
  if (!valid.length) return 50;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function scoreForNotes(scan: VoiceAnalysisResult, notes: string[]): number {
  const noteScores = scan.noteEnergies ?? [];
  const scores = noteScores.filter((entry) => notes.includes(entry.note)).map((entry) => entry.score);
  return clampScore(average(scores));
}

function levelForScore(score: number): SystemDimension["level"] {
  if (score >= 67) return "High";
  if (score <= 40) return "Low";
  return "Medium";
}

function bandForScore(score: number): SystemDimension["band"] {
  if (score <= 20) return "Extremely Low";
  if (score <= 40) return "Low";
  if (score < 67) return "Balanced";
  if (score < 85) return "High";
  return "Extremely High";
}

function stateForScore(score: number): SystemDimension["state"] {
  if (score <= 40 || score >= 75) return "requesting attention";
  if (score >= 45 && score <= 66) return "balanced";
  return "available";
}

function dimension(name: SystemDimensionName, score: number, derivedFrom: string, interpretation: string): SystemDimension {
  const normalized = clampScore(score);
  const attention = stateForScore(normalized) === "requesting attention" ? `${name} may be asking for extra support right now.` : undefined;

  return {
    name,
    score: normalized,
    level: levelForScore(normalized),
    band: bandForScore(normalized),
    state: stateForScore(normalized),
    derivedFrom,
    interpretation,
    attention,
  };
}

export function buildSystemDimensions(scan: VoiceAnalysisResult): SystemDimension[] {
  const dynamics = scan.voiceDynamics;
  const vitality = scoreForNotes(scan, ["C", "D", "E"]);
  const recoveryBase = scoreForNotes(scan, ["C", "G#"]);
  const cognitiveBase = scoreForNotes(scan, ["B", "A#", "F#"]);
  const expressionBase = scoreForNotes(scan, ["G", "D", "E"]);
  const adaptabilityBase = scoreForNotes(scan, ["A", "D#", "F#"]);
  const regulationBase = scoreForNotes(scan, ["C", "F", "G#"]);

  const cognitiveAdjustment = dynamics?.pauseCount && dynamics.pauseCount >= 3 ? 10 : 0;
  const recoveryAdjustment = dynamics?.voicedFrameRatio && dynamics.voicedFrameRatio > 0.55 ? -8 : 0;

  return [
    dimension("Regulation", regulationBase, "C, F, G# notes and stability indicators", "How steadily the system appears to return toward balance."),
    dimension("Vitality", vitality, "C, D, E note activity", "How much available body-energy and activation appears present."),
    dimension("Recovery", recoveryBase + recoveryAdjustment, "C and G# recovery indicators", "How much restoration capacity appears available relative to demand."),
    dimension("Adaptability", adaptabilityBase, "A, D#, F# note activity", "How responsive and change-ready the system appears."),
    dimension("Expression", expressionBase, "G, D, E expression indicators", "How available communication and emotional expression appear."),
    dimension("Cognitive Load", cognitiveBase + cognitiveAdjustment, "B, A#, F# mental-load indicators", "How much processing demand appears active."),
  ];
}

export function buildSystemSignatures(scan: VoiceAnalysisResult): SystemSignature[] {
  const dimensions = buildSystemDimensions(scan);
  const byName = (name: SystemDimensionName) => dimensions.find((dimension) => dimension.name === name)?.score ?? 50;

  const stressLoad = clampScore((byName("Cognitive Load") + byName("Expression") + (100 - byName("Recovery"))) / 3);
  const fatigueLoad = clampScore((100 - byName("Vitality") + (100 - byName("Recovery"))) / 2);
  const burnoutPattern = clampScore((stressLoad + fatigueLoad + (100 - byName("Regulation"))) / 3);
  const anxiousActivation = clampScore((byName("Cognitive Load") + byName("Adaptability") + byName("Expression")) / 3);
  const lowActivation = clampScore((100 - byName("Vitality") + 100 - byName("Expression")) / 2);

  return [
    {
      name: "Stress Load",
      strength: stressLoad,
      interpretation: "How much active demand appears to be present in the system.",
      likelySystems: ["Cognitive Load", "Expression", "Recovery"],
    },
    {
      name: "Fatigue Load",
      strength: fatigueLoad,
      interpretation: "How much output may be exceeding restoration capacity.",
      likelySystems: ["Vitality", "Recovery"],
    },
    {
      name: "Burnout Pattern",
      strength: burnoutPattern,
      interpretation: "How much sustained demand may be outpacing regulation and recovery.",
      likelySystems: ["Regulation", "Recovery", "Cognitive Load"],
    },
    {
      name: "Anxious Activation",
      strength: anxiousActivation,
      interpretation: "How much forward-drive, processing, and expression appear activated together.",
      likelySystems: ["Cognitive Load", "Adaptability", "Expression"],
    },
    {
      name: "Low Activation",
      strength: lowActivation,
      interpretation: "How much the system may be conserving or reducing outward activation.",
      likelySystems: ["Vitality", "Expression"],
    },
  ];
}
