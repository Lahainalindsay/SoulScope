import { contributionScore, DOMAIN_DEFINITIONS } from "./domainDefinitions";
import type { ConfidenceLevel, DomainResultV2, ObservationResult } from "./types";

const CONFIDENCE_RANK: Record<ConfidenceLevel, number> = { exploratory: 0, moderate: 1, high: 2 };

function confidence(observations: ObservationResult[]): ConfidenceLevel {
  if (!observations.length) return "exploratory";
  const lowest = observations.reduce<ConfidenceLevel>((current, observation) =>
    CONFIDENCE_RANK[observation.interpretationConfidence] < CONFIDENCE_RANK[current]
      ? observation.interpretationConfidence
      : current, "high");
  if (observations.length >= 3 && lowest === "high") return "high";
  if (observations.length >= 2 && lowest !== "exploratory") return "moderate";
  return "exploratory";
}

function stateFor(score: number, orientation: DomainResultV2["orientation"]): DomainResultV2["state"] {
  if (orientation === "demand") {
    if (score >= 68) return "working_hard";
    if (score <= 35) return "available";
    return "balanced";
  }
  if (score >= 65) return "available";
  if (score <= 35) return "asking_for_support";
  return "balanced";
}

export function buildDomains(observations: ObservationResult[]): DomainResultV2[] {
  const byId = new Map(observations.map((observation) => [observation.observationId, observation]));
  return DOMAIN_DEFINITIONS.flatMap((definition) => {
    const matches = definition.observations
      .map((entry) => ({ entry, observation: byId.get(entry.id) }))
      .filter((item): item is { entry: typeof definition.observations[number]; observation: ObservationResult } => Boolean(item.observation));
    if (matches.length < definition.minimumObservationCount) return [];
    const totalWeight = matches.reduce((sum, item) => sum + item.entry.weight, 0);
    const score = Math.round(matches.reduce((sum, item) => sum + contributionScore(item.observation, item.entry.positiveDirection) * item.entry.weight, 0) / Math.max(totalWeight, 0.001));
    const state = stateFor(score, definition.orientation);
    return [{
      id: `domain:${definition.id}`,
      domainId: definition.id,
      name: definition.name,
      score,
      state,
      orientation: definition.orientation,
      contributingObservationIds: matches.map((item) => item.observation.observationId),
      sourceCaptureIds: [...new Set(matches.flatMap((item) => item.observation.sourceCaptureIds))],
      interpretationConfidence: confidence(matches.map((item) => item.observation)),
      ruleVersion: definition.version,
      userFacingSummary: definition.summary(score, state),
    }];
  });
}
