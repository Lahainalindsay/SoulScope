import type { DomainResultInsert } from "../types";
import { stableUuid } from "../stableId";
import { toJsonObject } from "../json";
import type { V2MappingContext } from "./context";

export function mapDomains(context: V2MappingContext): DomainResultInsert[] {
  return context.pipeline.domains.map((domain) => ({
    id: stableUuid(context.scanId, "domain", domain.domainId, domain.ruleVersion),
    scan_id: context.scanId,
    user_id: context.userId,
    domain_id: domain.domainId,
    name: domain.name,
    score: domain.score,
    state: domain.state,
    orientation: domain.orientation,
    interpretation_confidence: domain.interpretationConfidence,
    rule_version: domain.ruleVersion,
    contributing_observation_ids: domain.contributingObservationIds.map((observationId) => {
      const source = context.pipeline.observations.find((item) => item.observationId === observationId);
      return stableUuid(context.scanId, "observation", observationId, source?.ruleVersion ?? domain.ruleVersion);
    }),
    source_capture_ids: domain.sourceCaptureIds.map((captureId) => stableUuid(context.scanId, "capture", captureId)),
    user_facing_summary: domain.userFacingSummary,
    metadata: toJsonObject({ engineVersion: context.pipeline.engineVersion }),
  }));
}
