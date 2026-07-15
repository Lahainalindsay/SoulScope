import type { DomainResultV2, ObservationResult } from "./types";
import { DOMAIN_RULE_VERSION } from "./versions";

export type DomainDefinition = {
  id: string;
  name: string;
  version: string;
  orientation: DomainResultV2["orientation"];
  observations: Array<{ id: string; weight: number; positiveDirection: "elevated" | "reduced" | "stable" }>;
  contradictoryObservations?: string[];
  minimumObservationCount: number;
  summary: (score: number, state: DomainResultV2["state"]) => string;
};

export const DOMAIN_DEFINITIONS: DomainDefinition[] = [
  {
    id: "energy_vitality",
    name: "Energy & Vitality",
    version: DOMAIN_RULE_VERSION,
    orientation: "availability",
    observations: [
      { id: "vocal_energy_observation", weight: 0.38, positiveDirection: "elevated" },
      { id: "vocal_output_activation", weight: 0.22, positiveDirection: "elevated" },
      { id: "speech_dynamics_observation", weight: 0.2, positiveDirection: "elevated" },
      { id: "harmonic_clarity_observation", weight: 0.2, positiveDirection: "elevated" },
    ],
    contradictoryObservations: ["recovery_demand_observation"],
    minimumObservationCount: 2,
    summary: (score) => score >= 62 ? "Energy appears more available in the current scan." : score <= 38 ? "Energy appears less available today." : "Energy appears within a middle range.",
  },
  {
    id: "recovery_restoration",
    name: "Recovery & Restoration",
    version: DOMAIN_RULE_VERSION,
    orientation: "availability",
    observations: [
      { id: "recovery_demand_observation", weight: 0.32, positiveDirection: "reduced" },
      { id: "harmonic_clarity_observation", weight: 0.23, positiveDirection: "elevated" },
      { id: "vocal_energy_observation", weight: 0.2, positiveDirection: "elevated" },
      { id: "response_consistency_observation", weight: 0.15, positiveDirection: "elevated" },
      { id: "vocal_stability_observation", weight: 0.1, positiveDirection: "elevated" },
    ],
    minimumObservationCount: 2,
    summary: (score) => score >= 62 ? "Recovery appears more available in the current observations." : score <= 38 ? "Recovery appears to need more support." : "Recovery appears moderately available.",
  },
  {
    id: "focus_mental_demand",
    name: "Focus & Mental Demand",
    version: DOMAIN_RULE_VERSION,
    orientation: "demand",
    observations: [
      { id: "mental_demand_observation", weight: 0.34, positiveDirection: "elevated" },
      { id: "processing_pause_observation", weight: 0.28, positiveDirection: "elevated" },
      { id: "response_consistency_observation", weight: 0.18, positiveDirection: "reduced" },
      { id: "speech_dynamics_observation", weight: 0.12, positiveDirection: "reduced" },
      { id: "vocal_output_activation", weight: 0.08, positiveDirection: "elevated" },
    ],
    contradictoryObservations: ["regulation_steady_observation"],
    minimumObservationCount: 2,
    summary: (score) => score >= 62 ? "Mental demand appears elevated in the current observations." : score <= 38 ? "Mental demand appears lighter." : "Mental demand appears within a middle range.",
  },
  {
    id: "expression_communication",
    name: "Expression & Communication",
    version: DOMAIN_RULE_VERSION,
    orientation: "availability",
    observations: [
      { id: "expressive_variability_observation", weight: 0.28, positiveDirection: "elevated" },
      { id: "expression_effort_observation", weight: 0.25, positiveDirection: "reduced" },
      { id: "speech_dynamics_observation", weight: 0.2, positiveDirection: "elevated" },
      { id: "vocal_stability_observation", weight: 0.15, positiveDirection: "elevated" },
      { id: "harmonic_clarity_observation", weight: 0.12, positiveDirection: "elevated" },
    ],
    minimumObservationCount: 2,
    summary: (score) => score >= 62 ? "Expression appears more available." : score <= 38 ? "Expression appears to require more effort." : "Expression appears moderately available.",
  },
  {
    id: "emotional_flexibility",
    name: "Emotional Flexibility",
    version: DOMAIN_RULE_VERSION,
    orientation: "availability",
    observations: [
      { id: "expressive_variability_observation", weight: 0.34, positiveDirection: "elevated" },
      { id: "signal_balance_observation", weight: 0.2, positiveDirection: "reduced" },
      { id: "speech_dynamics_observation", weight: 0.2, positiveDirection: "elevated" },
      { id: "response_consistency_observation", weight: 0.14, positiveDirection: "elevated" },
      { id: "vocal_stability_observation", weight: 0.12, positiveDirection: "elevated" },
    ],
    minimumObservationCount: 2,
    summary: (score) => score >= 62 ? "Vocal expression shows more range and flexibility." : score <= 38 ? "Vocal expression appears more narrowly held." : "Vocal flexibility appears within a middle range.",
  },
  {
    id: "regulation_stability",
    name: "Regulation & Stability",
    version: DOMAIN_RULE_VERSION,
    orientation: "availability",
    observations: [
      { id: "regulation_steady_observation", weight: 0.3, positiveDirection: "elevated" },
      { id: "vocal_stability_observation", weight: 0.24, positiveDirection: "elevated" },
      { id: "response_consistency_observation", weight: 0.2, positiveDirection: "elevated" },
      { id: "harmonic_clarity_observation", weight: 0.16, positiveDirection: "elevated" },
      { id: "processing_pause_observation", weight: 0.1, positiveDirection: "reduced" },
    ],
    minimumObservationCount: 2,
    summary: (score) => score >= 62 ? "Regulation appears relatively steady." : score <= 38 ? "Regulation appears to need more support." : "Regulation appears moderately steady.",
  },
  {
    id: "adaptability_direction",
    name: "Adaptability & Direction",
    version: DOMAIN_RULE_VERSION,
    orientation: "availability",
    observations: [
      { id: "response_consistency_observation", weight: 0.25, positiveDirection: "elevated" },
      { id: "expressive_variability_observation", weight: 0.23, positiveDirection: "elevated" },
      { id: "speech_dynamics_observation", weight: 0.2, positiveDirection: "elevated" },
      { id: "signal_balance_observation", weight: 0.17, positiveDirection: "reduced" },
      { id: "vocal_output_activation", weight: 0.15, positiveDirection: "elevated" },
    ],
    minimumObservationCount: 2,
    summary: (score) => score >= 62 ? "Adaptability appears more available." : score <= 38 ? "Adaptability appears more constrained today." : "Adaptability appears within a middle range.",
  },
];

export function contributionScore(observation: ObservationResult, expected: "elevated" | "reduced" | "stable"): number {
  if (observation.direction === expected) return 50 + observation.strength * 50;
  if (observation.direction === "stable") return expected === "stable" ? 65 : 50;
  if (observation.direction === "mixed" || observation.direction === "unavailable") return 50;
  return 50 - observation.strength * 50;
}