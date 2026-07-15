import { OBSERVATION_DEFINITIONS } from "./observationDefinitions";
import type { ConfidenceLevel, EvidenceSignal, ObservationResult } from "./types";

const CONFIDENCE_RANK: Record<ConfidenceLevel, number> = { exploratory: 0, moderate: 1, high: 2 };

function lowestConfidence(signals: EvidenceSignal[]): ConfidenceLevel {
  return signals.reduce<ConfidenceLevel>((lowest, signal) => CONFIDENCE_RANK[signal.evidenceConfidence] < CONFIDENCE_RANK[lowest] ? signal.evidenceConfidence : lowest, "high");
}

export function buildObservations(evidenceSignals: EvidenceSignal[]): ObservationResult[] {
  const byId = new Map(evidenceSignals.map((signal) => [signal.evidenceId, signal]));
  return OBSERVATION_DEFINITIONS.flatMap((definition) => {
    if (definition.requiredEvidence.some((id) => !byId.has(id))) return [];
    const result = definition.calculate(byId);
    if (!result || result.contributingEvidenceIds.length < definition.minimumEvidenceAgreement) return [];
    const contributing = result.contributingEvidenceIds.map((id) => byId.get(id)).filter((signal): signal is EvidenceSignal => Boolean(signal));
    const captureConfidence = lowestConfidence(contributing);
    const interpretationConfidence: ConfidenceLevel = contributing.length >= 3 && captureConfidence === "high" ? "high" : contributing.length >= 2 && captureConfidence !== "exploratory" ? "moderate" : "exploratory";
    return [{
      id: `observation:${definition.id}`,
      observationId: definition.id,
      label: definition.label,
      summary: definition.summary(result.direction),
      direction: result.direction,
      strength: Math.max(0, Math.min(1, result.strength)),
      contributingEvidenceIds: result.contributingEvidenceIds,
      sourceCaptureIds: Array.from(new Set(contributing.flatMap((signal) => signal.sourceCaptureIds))),
      captureConfidence,
      interpretationConfidence,
      ruleVersion: definition.version,
      alternatives: definition.alternatives,
    }];
  });
}
