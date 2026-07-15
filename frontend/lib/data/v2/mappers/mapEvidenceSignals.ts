import type { EvidenceSignalResultInsert } from "../types";
import { stableUuid } from "../stableId";
import { toJsonValue } from "../json";
import type { V2MappingContext } from "./context";

export function mapEvidenceSignals(context: V2MappingContext): EvidenceSignalResultInsert[] {
  return context.pipeline.evidenceSignals.map((signal) => ({
    id: stableUuid(context.scanId, "evidence", signal.evidenceId, signal.ruleVersion),
    scan_id: context.scanId,
    user_id: context.userId,
    evidence_id: signal.evidenceId,
    label: signal.label,
    direction: signal.direction,
    strength: signal.strength,
    capture_confidence: signal.captureConfidence,
    evidence_confidence: signal.evidenceConfidence,
    validity_level: signal.validityLevel,
    rule_version: signal.ruleVersion,
    contributing_feature_ids: signal.contributingFeatureIds.map((featureId) => stableUuid(context.scanId, "feature", featureId, "aggregate")),
    source_capture_ids: signal.sourceCaptureIds.map((captureId) => stableUuid(context.scanId, "capture", captureId)),
    notes: (signal.notes ?? []).map(toJsonValue),
  }));
}
