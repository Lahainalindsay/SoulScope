import type { ObservationResultInsert } from "../types";
import { stableUuid } from "../stableId";
import { toJsonValue } from "../json";
import type { V2MappingContext } from "./context";

export function mapObservations(context: V2MappingContext): ObservationResultInsert[] {
  return context.pipeline.observations.map((observation) => ({
    id: stableUuid(context.scanId, "observation", observation.observationId, observation.ruleVersion),
    scan_id: context.scanId,
    user_id: context.userId,
    observation_id: observation.observationId,
    label: observation.label,
    summary: observation.summary,
    direction: observation.direction,
    strength: observation.strength,
    capture_confidence: observation.captureConfidence,
    interpretation_confidence: observation.interpretationConfidence,
    rule_version: observation.ruleVersion,
    contributing_evidence_ids: observation.contributingEvidenceIds.map((evidenceId) => {
      const source = context.pipeline.evidenceSignals.find((signal) => signal.evidenceId === evidenceId);
      return stableUuid(context.scanId, "evidence", evidenceId, source?.ruleVersion ?? "unknown");
    }),
    source_capture_ids: observation.sourceCaptureIds.map((captureId) => stableUuid(context.scanId, "capture", captureId)),
    alternatives: (observation.alternatives ?? []).map(toJsonValue),
  }));
}
