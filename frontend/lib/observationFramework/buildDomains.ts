import { contributionScore, DOMAIN_DEFINITIONS } from "./domainDefinitions";
import type { ConfidenceLevel, DomainResultV2, ObservationResult } from "./types";

const CONFIDENCE_RANK: Record<ConfidenceLevel, number> = { exploratory: 0, moderate: 1, high: 2 };
const CONFIDENCE_WEIGHT: Record<ConfidenceLevel, number> = { exploratory: 0.45, moderate: 0.75, high: 1 };

function confidence(observations: ObservationResult[]): ConfidenceLevel {
  if (!observations.length) return "exploratory";
  const average = observations.reduce((sum, observation) => sum + CONFIDENCE_RANK[observation.interpretationConfidence], 0) / observations.length;
  if (observations.length >= 3 && average >= 1.6) return "high";
  if (observations.length >= 2 && average >= 0.8) return "moderate";
  return "exploratory";
}

function stateFor(score: number, orientation: DomainResultV2["orientation"]): DomainResultV2["state"] {
  if (orientation === "demand") {
    if (score >= 66) return "working_hard";
    if (score <= 37) return "available";
    return "balanced";
  }
  if (score >= 63) return "available";
  if (score <= 37) return "asking_for_support";
  return "balanced";
}

export function buildDomains(observations: ObservationResult[]): DomainResultV2[] {
  const byId = new Map(observations.map((observation) => [observation.observationId, observation]));
  return DOMAIN_DEFINITIONS.flatMap((definition) => {
    const matches = definition.observations
      .map((entry) => ({ entry, observation: byId.get(entry.id) }))
      .filter((item): item is { entry: typeof definition.observations[number]; observation: ObservationResult } => Boolean(item.observation));
    if (matches.length < definition.minimumObservationCount) return [];

    const weightedMatches = matches.map((item) => ({
      ...item,
      effectiveWeight: item.entry.weight * CONFIDENCE_WEIGHT[item.observation.interpretationConfidence] * (0.55 + item.observation.strength * 0.45),
    }));
    const totalWeight = weightedMatches.reduce((sum, item) => sum + item.effectiveWeight, 0);
    const rawScore = weightedMatches.reduce((sum, item) => sum + contributionScore(item.observation, item.entry.positiveDirection) * item.effectiveWeight, 0) / Math.max(totalWeight, 0.001);
    const directional = matches.filter((item) => item.observation.direction !== "stable" && item.observation.direction !== "mixed" && item.observation.direction !== "unavailable");
    const agreementRatio = directional.length ? Math.max(...["elevated", "reduced"].map((direction) => directional.filter((item) => item.observation.direction === direction).length)) / directional.length : 0.5;
    const agreementAdjustment = (agreementRatio - 0.5) * 8;
    const score = Math.round(Math.max(0, Math.min(100, rawScore + (rawScore >= 50 ? agreementAdjustment : -agreementAdjustment))));
    const state = stateFor(score, definition.orientation);

    return [{
      id: `domain:${definition.id}`,
      domainId: definition.id,
      name: definition.name,
      score,
      state,
      orientation: definition.orientation,
      contributingObservationIds: matches.map((item) => item.observation.observationId),
      sourceCaptureIds: Array.from(new Set(matches.flatMap((item) => item.observation.sourceCaptureIds))),
      interpretationConfidence: confidence(matches.map((item) => item.observation)),
      ruleVersion: definition.version,
      userFacingSummary: definition.summary(score, state),
    }];
  });
}