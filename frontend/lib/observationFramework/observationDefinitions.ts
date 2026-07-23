import type { EvidenceSignal, ObservationResult, SignalDirection } from "./types";
import { OBSERVATION_RULE_VERSION } from "./versions";

export type ObservationDefinition = {
  id: string;
  label: string;
  version: string;
  requiredEvidence: string[];
  optionalEvidence: string[];
  contradictoryEvidence?: string[];
  minimumEvidenceAgreement: number;
  summary: (direction: SignalDirection) => string;
  alternatives: string[];
  calculate: (signals: Map<string, EvidenceSignal>) => Pick<ObservationResult, "direction" | "strength" | "contributingEvidenceIds"> | null;
};

function opposite(direction: SignalDirection) {
  return direction === "elevated" ? "reduced" : direction === "reduced" ? "elevated" : undefined;
}

function corroborated(primaryId: string, supportingIds: string[]) {
  return (signals: Map<string, EvidenceSignal>) => {
    const primary = signals.get(primaryId);
    if (!primary || primary.direction === "unavailable" || primary.direction === "mixed") return null;
    const conflict = opposite(primary.direction);
    const support = supportingIds
      .map((id) => signals.get(id))
      .filter((signal): signal is EvidenceSignal => Boolean(signal))
      .filter((signal) => signal.direction === primary.direction || signal.direction === "stable");
    const contradictions = supportingIds
      .map((id) => signals.get(id))
      .filter((signal): signal is EvidenceSignal => Boolean(signal))
      .filter((signal) => signal.direction === conflict && signal.strength >= 0.45);
    if (!support.length || contradictions.length > support.length) return null;
    const contributors = [primary, ...support.slice(0, 2)];
    const weightedStrength = contributors.reduce((sum, signal, index) => sum + signal.strength * (index === 0 ? 1.4 : 1), 0) / (contributors.length + 0.4);
    return { direction: primary.direction, strength: weightedStrength, contributingEvidenceIds: contributors.map((signal) => signal.evidenceId) };
  };
}

function agreement(ids: string[], signals: Map<string, EvidenceSignal>, desired: "elevated" | "reduced", contradictoryIds: string[] = []) {
  const available = ids.map((id) => signals.get(id)).filter((signal): signal is EvidenceSignal => Boolean(signal));
  const agreeing = available.filter((signal) => signal.direction === desired);
  const contradictory = [...available, ...contradictoryIds.map((id) => signals.get(id)).filter((signal): signal is EvidenceSignal => Boolean(signal))]
    .filter((signal) => signal.direction === (desired === "elevated" ? "reduced" : "elevated") && signal.strength >= 0.4);
  if (agreeing.length < 2 || contradictory.length >= agreeing.length) return null;
  return {
    direction: desired,
    strength: agreeing.reduce((sum, signal) => sum + signal.strength, 0) / agreeing.length,
    contributingEvidenceIds: agreeing.map((signal) => signal.evidenceId),
  } as const;
}

export const OBSERVATION_DEFINITIONS: ObservationDefinition[] = [
  { id: "vocal_output_activation", label: "Current vocal activation", version: OBSERVATION_RULE_VERSION, requiredEvidence: ["vocal_activation"], optionalEvidence: ["vocal_energy", "speech_dynamics"], contradictoryEvidence: ["processing_pauses"], minimumEvidenceAgreement: 2, summary: (direction) => direction === "elevated" ? "Current vocal output appears more activated." : direction === "reduced" ? "Current vocal output appears less activated." : "Current vocal activation appears relatively steady.", alternatives: ["Speaking task, microphone distance, and room acoustics may influence activation measures."], calculate: corroborated("vocal_activation", ["vocal_energy", "speech_dynamics"]) },
  { id: "vocal_stability_observation", label: "Current vocal stability", version: OBSERVATION_RULE_VERSION, requiredEvidence: ["vocal_stability"], optionalEvidence: ["response_consistency", "spectral_organization", "harmonic_clarity"], minimumEvidenceAgreement: 2, summary: (direction) => direction === "reduced" ? "Vocal stability appears reduced in the current sample." : direction === "elevated" ? "Vocal output appears relatively consistent." : "Vocal stability appears within a middle range.", alternatives: ["Hydration, recording conditions, and the speaking task may affect stability."], calculate: corroborated("vocal_stability", ["response_consistency", "spectral_organization", "harmonic_clarity"]) },
  { id: "response_consistency_observation", label: "Current response consistency", version: OBSERVATION_RULE_VERSION, requiredEvidence: ["response_consistency"], optionalEvidence: ["vocal_stability", "spectral_organization"], minimumEvidenceAgreement: 2, summary: (direction) => direction === "elevated" ? "Responses appear relatively consistent across the available signal." : direction === "reduced" ? "Response consistency appears reduced." : "Response consistency appears mixed.", alternatives: ["Prompt differences and recording conditions may affect consistency."], calculate: corroborated("response_consistency", ["vocal_stability", "spectral_organization"]) },
  { id: "processing_pause_observation", label: "Current processing pauses", version: OBSERVATION_RULE_VERSION, requiredEvidence: ["processing_pauses"], optionalEvidence: ["speech_dynamics", "vocal_activation"], minimumEvidenceAgreement: 2, summary: (direction) => direction === "elevated" ? "Processing pauses appear elevated in the current responses." : direction === "reduced" ? "Processing pauses appear less prominent." : "Pause behavior appears relatively steady.", alternatives: ["Prompt complexity, deliberate pacing, and speaking style may also shape pause behavior."], calculate: corroborated("processing_pauses", ["speech_dynamics", "vocal_activation"]) },
  { id: "expressive_variability_observation", label: "Current expressive variability", version: OBSERVATION_RULE_VERSION, requiredEvidence: ["expressive_variability"], optionalEvidence: ["speech_dynamics", "vocal_activation"], minimumEvidenceAgreement: 2, summary: (direction) => direction === "elevated" ? "Expressive variability appears more available." : direction === "reduced" ? "Expressive variability appears reduced." : "Expressive variability appears relatively balanced.", alternatives: ["Prompt type and intentional vocal control may influence range."], calculate: corroborated("expressive_variability", ["speech_dynamics", "vocal_activation"]) },
  { id: "vocal_energy_observation", label: "Current vocal energy", version: OBSERVATION_RULE_VERSION, requiredEvidence: ["vocal_energy"], optionalEvidence: ["vocal_activation", "speech_dynamics"], minimumEvidenceAgreement: 2, summary: (direction) => direction === "elevated" ? "Vocal energy appears more available in this scan." : direction === "reduced" ? "Vocal energy appears lower in this scan." : "Vocal energy appears relatively steady.", alternatives: ["Microphone gain, speaking volume, and task length can influence energy measures."], calculate: corroborated("vocal_energy", ["vocal_activation", "speech_dynamics"]) },
  { id: "harmonic_clarity_observation", label: "Current harmonic clarity", version: OBSERVATION_RULE_VERSION, requiredEvidence: ["harmonic_clarity"], optionalEvidence: ["spectral_organization", "vocal_stability"], minimumEvidenceAgreement: 2, summary: (direction) => direction === "reduced" ? "Harmonic clarity appears reduced in the current sample." : direction === "elevated" ? "Harmonic clarity appears more organized." : "Harmonic clarity appears within a middle range.", alternatives: ["Background noise, breathiness, and microphone response may affect harmonic measures."], calculate: corroborated("harmonic_clarity", ["spectral_organization", "vocal_stability"]) },
  { id: "speech_dynamics_observation", label: "Current speech dynamics", version: OBSERVATION_RULE_VERSION, requiredEvidence: ["speech_dynamics"], optionalEvidence: ["expressive_variability", "vocal_activation"], minimumEvidenceAgreement: 2, summary: (direction) => direction === "elevated" ? "Speech dynamics appear more active and varied." : direction === "reduced" ? "Speech dynamics appear more contained." : "Speech dynamics appear relatively even.", alternatives: ["Prompt length and deliberate delivery may affect pacing and range."], calculate: corroborated("speech_dynamics", ["expressive_variability", "vocal_activation"]) },
  { id: "recovery_demand_observation", label: "Current recovery demand", version: OBSERVATION_RULE_VERSION, requiredEvidence: ["harmonic_clarity", "vocal_energy"], optionalEvidence: ["response_consistency", "spectral_organization"], contradictoryEvidence: ["vocal_activation"], minimumEvidenceAgreement: 2, summary: () => "Current observations may be consistent with greater recovery demand.", alternatives: ["Room noise, vocal technique, hydration, temporary voice use, and speaking volume may produce a similar signal."], calculate: (signals) => agreement(["harmonic_clarity", "vocal_energy", "response_consistency", "spectral_organization"], signals, "reduced", ["vocal_activation"]) },
  { id: "mental_demand_observation", label: "Current mental demand", version: OBSERVATION_RULE_VERSION, requiredEvidence: ["processing_pauses", "response_consistency"], optionalEvidence: ["vocal_activation", "speech_dynamics"], contradictoryEvidence: ["vocal_energy"], minimumEvidenceAgreement: 2, summary: () => "Current observations may be consistent with elevated mental demand.", alternatives: ["Deliberate reflection, unfamiliar prompts, or a naturally slower speaking style may create similar timing patterns."], calculate: (signals) => agreement(["processing_pauses", "vocal_activation"], signals, "elevated", ["response_consistency", "speech_dynamics"]) ?? agreement(["processing_pauses", "response_consistency"], signals, "elevated") },
  { id: "expression_effort_observation", label: "Current expression effort", version: OBSERVATION_RULE_VERSION, requiredEvidence: ["expressive_variability", "vocal_stability"], optionalEvidence: ["harmonic_clarity", "speech_dynamics"], minimumEvidenceAgreement: 2, summary: () => "Current observations suggest expression may require more effort in this scan.", alternatives: ["Intentional restraint, vocal technique, or the recording task may produce similar control."], calculate: (signals) => agreement(["expressive_variability", "vocal_stability", "harmonic_clarity", "speech_dynamics"], signals, "reduced") },
  { id: "regulation_steady_observation", label: "Current regulation steadiness", version: OBSERVATION_RULE_VERSION, requiredEvidence: ["vocal_stability", "response_consistency"], optionalEvidence: ["harmonic_clarity", "spectral_organization"], contradictoryEvidence: ["processing_pauses"], minimumEvidenceAgreement: 2, summary: () => "Current observations suggest regulation appears relatively steady in this sample.", alternatives: ["Consistent vocal technique and a familiar speaking task may also create a steady signal."], calculate: (signals) => agreement(["vocal_stability", "response_consistency", "harmonic_clarity", "spectral_organization"], signals, "elevated", ["processing_pauses"]) },
];
