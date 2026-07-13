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

const single = (id: string) => (signals: Map<string, EvidenceSignal>) => {
  const signal = signals.get(id);
  return signal ? { direction: signal.direction, strength: signal.strength, contributingEvidenceIds: [id] } : null;
};

function agreement(ids: string[], signals: Map<string, EvidenceSignal>, desired: "elevated" | "reduced") {
  const available = ids.map((id) => signals.get(id)).filter((signal): signal is EvidenceSignal => Boolean(signal));
  const agreeing = available.filter((signal) => signal.direction === desired);
  if (agreeing.length < 2) return null;
  return {
    direction: desired,
    strength: agreeing.reduce((sum, signal) => sum + signal.strength, 0) / agreeing.length,
    contributingEvidenceIds: agreeing.map((signal) => signal.evidenceId),
  } as const;
}

export const OBSERVATION_DEFINITIONS: ObservationDefinition[] = [
  { id: "vocal_output_activation", label: "Current vocal activation", version: OBSERVATION_RULE_VERSION, requiredEvidence: ["vocal_activation"], optionalEvidence: ["vocal_energy"], minimumEvidenceAgreement: 1, summary: (direction) => direction === "elevated" ? "Current vocal output appears more activated." : direction === "reduced" ? "Current vocal output appears less activated." : "Current vocal activation appears relatively steady.", alternatives: ["Speaking task, microphone distance, and room acoustics may influence activation measures."], calculate: single("vocal_activation") },
  { id: "vocal_stability_observation", label: "Current vocal stability", version: OBSERVATION_RULE_VERSION, requiredEvidence: ["vocal_stability"], optionalEvidence: ["response_consistency"], minimumEvidenceAgreement: 1, summary: (direction) => direction === "reduced" ? "Vocal stability appears reduced in the current sample." : direction === "elevated" ? "Vocal output appears relatively consistent." : "Vocal stability appears within a middle range.", alternatives: ["Hydration, recording conditions, and the speaking task may affect stability."], calculate: single("vocal_stability") },
  { id: "processing_pause_observation", label: "Current processing pauses", version: OBSERVATION_RULE_VERSION, requiredEvidence: ["processing_pauses"], optionalEvidence: [], minimumEvidenceAgreement: 1, summary: (direction) => direction === "elevated" ? "Processing pauses appear elevated in the current responses." : direction === "reduced" ? "Processing pauses appear less prominent." : "Pause behavior appears relatively steady.", alternatives: ["Prompt complexity and deliberate pacing may also shape pause behavior."], calculate: single("processing_pauses") },
  { id: "expressive_variability_observation", label: "Current expressive variability", version: OBSERVATION_RULE_VERSION, requiredEvidence: ["expressive_variability"], optionalEvidence: ["vocal_stability"], minimumEvidenceAgreement: 1, summary: (direction) => direction === "elevated" ? "Expressive variability appears more available." : direction === "reduced" ? "Expressive variability appears reduced." : "Expressive variability appears relatively balanced.", alternatives: ["Prompt type and intentional vocal control may influence range."], calculate: single("expressive_variability") },
  { id: "vocal_energy_observation", label: "Current vocal energy", version: OBSERVATION_RULE_VERSION, requiredEvidence: ["vocal_energy"], optionalEvidence: ["vocal_activation"], minimumEvidenceAgreement: 1, summary: (direction) => direction === "elevated" ? "Vocal energy appears more available in this scan." : direction === "reduced" ? "Vocal energy appears lower in this scan." : "Vocal energy appears relatively steady.", alternatives: ["Microphone gain and speaking volume can influence energy measures."], calculate: single("vocal_energy") },
  { id: "harmonic_clarity_observation", label: "Current harmonic clarity", version: OBSERVATION_RULE_VERSION, requiredEvidence: ["harmonic_clarity"], optionalEvidence: ["vocal_stability"], minimumEvidenceAgreement: 1, summary: (direction) => direction === "reduced" ? "Harmonic clarity appears reduced in the current sample." : direction === "elevated" ? "Harmonic clarity appears more organized." : "Harmonic clarity appears within a middle range.", alternatives: ["Background noise, breathiness, and microphone response may affect harmonic measures."], calculate: single("harmonic_clarity") },
  { id: "signal_balance_observation", label: "Current signal balance", version: OBSERVATION_RULE_VERSION, requiredEvidence: ["note_balance"], optionalEvidence: [], minimumEvidenceAgreement: 1, summary: (direction) => direction === "elevated" ? "Signal balance appears concentrated in a smaller part of the current spectrum." : direction === "reduced" ? "Signal balance appears broadly distributed." : "Signal balance appears moderately distributed.", alternatives: ["The note-energy representation is an internal aggregation and not a clinical scale."], calculate: single("note_balance") },
  { id: "recovery_demand_observation", label: "Current recovery demand", version: OBSERVATION_RULE_VERSION, requiredEvidence: ["harmonic_clarity", "vocal_energy"], optionalEvidence: ["response_consistency"], minimumEvidenceAgreement: 2, summary: () => "Current signals may be consistent with greater recovery demand.", alternatives: ["Room noise, vocal technique, hydration, and temporary voice use may produce a similar signal."], calculate: (signals) => agreement(["harmonic_clarity", "vocal_energy", "response_consistency"], signals, "reduced") },
  { id: "mental_demand_observation", label: "Current mental demand", version: OBSERVATION_RULE_VERSION, requiredEvidence: ["processing_pauses", "response_consistency"], optionalEvidence: ["vocal_activation"], minimumEvidenceAgreement: 2, summary: () => "Current signals may be consistent with elevated mental demand.", alternatives: ["Deliberate reflection, unfamiliar prompts, or slower speaking style may create similar timing patterns."], calculate: (signals) => agreement(["processing_pauses", "vocal_activation"], signals, "elevated") },
  { id: "expression_effort_observation", label: "Current expression effort", version: OBSERVATION_RULE_VERSION, requiredEvidence: ["expressive_variability", "vocal_stability"], optionalEvidence: ["harmonic_clarity"], minimumEvidenceAgreement: 2, summary: () => "Current expression may require more effort than usual." , alternatives: ["Intentional restraint or the recording task may produce similar vocal control."], calculate: (signals) => agreement(["expressive_variability", "vocal_stability", "harmonic_clarity"], signals, "reduced") },
  { id: "regulation_steady_observation", label: "Current regulation steadiness", version: OBSERVATION_RULE_VERSION, requiredEvidence: ["vocal_stability", "response_consistency"], optionalEvidence: ["harmonic_clarity"], minimumEvidenceAgreement: 2, summary: () => "Regulation appears relatively steady in the current sample.", alternatives: ["Consistent vocal technique may also create a steady signal."], calculate: (signals) => agreement(["vocal_stability", "response_consistency", "harmonic_clarity"], signals, "elevated") },
];
