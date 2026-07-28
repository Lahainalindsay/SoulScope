export type EmotionSignalId =
  | "joy"
  | "aggression"
  | "stress"
  | "sadness"
  | "excitement"
  | "energy"
  | "uneasy"
  | "uncertainty"
  | "anticipation"
  | "concentration"
  | "arousal"
  | "mentalEffort"
  | "dissatisfaction"
  | "hesitation"
  | "imagination"
  | "cognitiveActivity";

export type EmotionSignal = {
  id: EmotionSignalId;
  label: string;
  score: number;
  confidence: number;
  evidence: string[];
};

export type DimensionPairId =
  | "activationRestoration"
  | "emotionLogic"
  | "opennessProtection"
  | "explorationStability"
  | "expressionReflection"
  | "loadCapacity"
  | "certaintyFlexibility"
  | "engagementWithdrawal";

export type DimensionPair = {
  id: DimensionPairId;
  leftLabel: string;
  rightLabel: string;
  balance: number;
  confidence: number;
  interpretation: string;
  evidence: string[];
};

export type EmotionalStyleId = "EN-LO" | "EN-EM" | "ST-LO" | "ST-EM";

export type EmotionDecisionLayer = {
  version: "soulscope-emotion-layer-v1";
  emotions: Record<EmotionSignalId, EmotionSignal>;
  pairs: Record<DimensionPairId, DimensionPair>;
  style: {
    id: EmotionalStyleId;
    label: string;
    confidence: number;
    rationale: string[];
  };
  mentalEffortEfficiency: {
    effort: number;
    efficiency: number;
    confidence: number;
    interpretation: string;
  };
};

export type EmotionLayerInput = {
  activation: number;
  organization: number;
  regulation: number;
  expression: number;
  relationalOrientation: number;
  direction: number;
  capacity: number;
  recovery: number;
  challengeModulation: number;
  evidenceConfidence: number;
  evidenceIds: string[];
};

const clamp = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0.5));
const round = (value: number) => Number(clamp(value).toFixed(3));
const mean = (...values: number[]) => values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);

function signal(id: EmotionSignalId, label: string, score: number, confidence: number, evidence: string[]): EmotionSignal {
  return { id, label, score: round(score), confidence: round(confidence), evidence };
}

function pair(
  id: DimensionPairId,
  leftLabel: string,
  rightLabel: string,
  balance: number,
  confidence: number,
  interpretation: string,
  evidence: string[],
): DimensionPair {
  return { id, leftLabel, rightLabel, balance: Number(Math.max(-1, Math.min(1, balance)).toFixed(3)), confidence: round(confidence), interpretation, evidence };
}

export function buildEmotionDecisionLayer(input: EmotionLayerInput): EmotionDecisionLayer {
  const c = input.evidenceConfidence;
  const stress = clamp(mean(1 - input.regulation, input.challengeModulation, 1 - input.capacity));
  const energy = clamp(mean(input.activation, input.capacity));
  const concentration = clamp(mean(input.organization, input.direction));
  const mentalEffort = clamp(mean(stress, input.organization, 1 - input.recovery));
  const uncertainty = clamp(mean(1 - input.direction, 1 - input.organization));
  const hesitation = clamp(mean(uncertainty, 1 - input.activation));
  const arousal = clamp(mean(input.activation, stress));
  const anticipation = clamp(mean(input.activation, input.direction, input.relationalOrientation));
  const excitement = clamp(mean(input.activation, input.expression, input.direction));
  const uneasy = clamp(mean(stress, uncertainty));
  const aggression = clamp(mean(input.activation, 1 - input.regulation, input.expression));
  const joy = clamp(mean(input.expression, input.relationalOrientation, input.regulation, input.recovery));
  const sadness = clamp(mean(1 - input.activation, 1 - input.capacity, 1 - input.relationalOrientation));
  const dissatisfaction = clamp(mean(stress, 1 - input.direction, 1 - input.recovery));
  const imagination = clamp(mean(input.expression, 1 - input.organization, input.direction));
  const cognitiveActivity = clamp(mean(input.organization, mentalEffort, concentration));

  const emotions: Record<EmotionSignalId, EmotionSignal> = {
    joy: signal("joy", "Joy", joy, c, ["expression", "relationalOrientation", "regulation", "recovery"]),
    aggression: signal("aggression", "Aggression", aggression, c, ["activation", "regulation", "expression"]),
    stress: signal("stress", "Stress", stress, c, ["regulation", "challengeModulation", "capacity"]),
    sadness: signal("sadness", "Sadness", sadness, c, ["activation", "capacity", "relationalOrientation"]),
    excitement: signal("excitement", "Excitement", excitement, c, ["activation", "expression", "direction"]),
    energy: signal("energy", "Energy", energy, c, ["activation", "capacity"]),
    uneasy: signal("uneasy", "Uneasy", uneasy, c, ["stress", "uncertainty"]),
    uncertainty: signal("uncertainty", "Uncertainty", uncertainty, c, ["direction", "organization"]),
    anticipation: signal("anticipation", "Anticipation", anticipation, c, ["activation", "direction", "relationalOrientation"]),
    concentration: signal("concentration", "Concentration", concentration, c, ["organization", "direction"]),
    arousal: signal("arousal", "Arousal", arousal, c, ["activation", "stress"]),
    mentalEffort: signal("mentalEffort", "Mental Effort", mentalEffort, c, ["stress", "organization", "recovery"]),
    dissatisfaction: signal("dissatisfaction", "Dissatisfaction", dissatisfaction, c, ["stress", "direction", "recovery"]),
    hesitation: signal("hesitation", "Hesitation", hesitation, c, ["uncertainty", "activation"]),
    imagination: signal("imagination", "Imagination", imagination, c, ["expression", "organization", "direction"]),
    cognitiveActivity: signal("cognitiveActivity", "Overall Cognitive Activity", cognitiveActivity, c, ["organization", "mentalEffort", "concentration"]),
  };

  const activationRestoration = input.activation - input.recovery;
  const emotionLogic = mean(input.expression, arousal) - mean(input.organization, concentration);
  const opennessProtection = mean(input.expression, input.relationalOrientation) - mean(stress, 1 - input.regulation);
  const explorationStability = mean(input.direction, imagination) - mean(input.organization, input.regulation);
  const expressionReflection = input.expression - (1 - input.activation + input.organization) / 2;
  const loadCapacity = mean(stress, mentalEffort) - input.capacity;
  const certaintyFlexibility = mean(input.organization, input.direction) - mean(input.recovery, imagination);
  const engagementWithdrawal = mean(input.activation, input.relationalOrientation) - mean(1 - input.capacity, hesitation);

  const pairs: Record<DimensionPairId, DimensionPair> = {
    activationRestoration: pair("activationRestoration", "Activation", "Restoration", activationRestoration, c, activationRestoration > 0.18 ? "Output is currently leading restoration." : activationRestoration < -0.18 ? "Restoration is currently leading output." : "Activation and restoration are relatively balanced.", ["activation", "recovery"]),
    emotionLogic: pair("emotionLogic", "Emotion", "Logic", emotionLogic, c, emotionLogic > 0.15 ? "Expression is leading cognitive control." : emotionLogic < -0.15 ? "Cognitive organization is leading expression." : "Emotional expression and cognitive organization are balanced.", ["expression", "arousal", "organization", "concentration"]),
    opennessProtection: pair("opennessProtection", "Openness", "Protection", opennessProtection, c, opennessProtection > 0.15 ? "The signal is leaning toward openness and contact." : opennessProtection < -0.15 ? "The signal is leaning toward protection and selectivity." : "Openness and protection are closely balanced.", ["expression", "relationalOrientation", "stress", "regulation"]),
    explorationStability: pair("explorationStability", "Exploration", "Stability", explorationStability, c, explorationStability > 0.15 ? "Exploration and possibility are leading." : explorationStability < -0.15 ? "Stability and structure are leading." : "Exploration and stability are balanced.", ["direction", "imagination", "organization", "regulation"]),
    expressionReflection: pair("expressionReflection", "Expression", "Reflection", expressionReflection, c, expressionReflection > 0.15 ? "The scan leans toward outward expression." : expressionReflection < -0.15 ? "The scan leans toward inward reflection." : "Expression and reflection are balanced.", ["expression", "activation", "organization"]),
    loadCapacity: pair("loadCapacity", "Load", "Capacity", loadCapacity, c, loadCapacity > 0.15 ? "Current load appears to exceed available capacity." : loadCapacity < -0.15 ? "Available capacity appears greater than current load." : "Load and capacity are closely matched.", ["stress", "mentalEffort", "capacity"]),
    certaintyFlexibility: pair("certaintyFlexibility", "Certainty", "Flexibility", certaintyFlexibility, c, certaintyFlexibility > 0.15 ? "The system is favoring certainty and structure." : certaintyFlexibility < -0.15 ? "The system is favoring flexibility and revision." : "Certainty and flexibility are balanced.", ["organization", "direction", "recovery", "imagination"]),
    engagementWithdrawal: pair("engagementWithdrawal", "Engagement", "Withdrawal", engagementWithdrawal, c, engagementWithdrawal > 0.15 ? "Engagement is leading." : engagementWithdrawal < -0.15 ? "The signal is conserving contact and energy." : "Engagement and withdrawal are balanced.", ["activation", "relationalOrientation", "capacity", "hesitation"]),
  };

  const energetic = activationRestoration >= 0;
  const logical = emotionLogic <= 0;
  const styleId: EmotionalStyleId = energetic ? (logical ? "EN-LO" : "EN-EM") : (logical ? "ST-LO" : "ST-EM");
  const styles: Record<EmotionalStyleId, string> = {
    "EN-LO": "Energetic–Logical",
    "EN-EM": "Energetic–Emotional",
    "ST-LO": "Restorative–Logical",
    "ST-EM": "Restorative–Emotional",
  };
  const styleConfidence = clamp(mean(Math.abs(activationRestoration), Math.abs(emotionLogic), c));
  const efficiency = clamp(mean(input.organization, input.recovery, 1 - Math.abs(input.challengeModulation - 0.35)));

  return {
    version: "soulscope-emotion-layer-v1",
    emotions,
    pairs,
    style: {
      id: styleId,
      label: styles[styleId],
      confidence: round(styleConfidence),
      rationale: [pairs.activationRestoration.interpretation, pairs.emotionLogic.interpretation],
    },
    mentalEffortEfficiency: {
      effort: round(mentalEffort),
      efficiency: round(efficiency),
      confidence: round(c),
      interpretation: mentalEffort > 0.65 && efficiency < 0.45 ? "High effort with reduced efficiency." : mentalEffort > 0.65 ? "High effort remains relatively organized." : efficiency >= 0.6 ? "Mental effort appears efficient and organized." : "Mental effort is moderate with variable efficiency.",
    },
  };
}
