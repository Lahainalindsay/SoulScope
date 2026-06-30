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