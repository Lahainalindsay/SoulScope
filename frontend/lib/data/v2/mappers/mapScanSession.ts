import type { ScanSessionInsert } from "../types";
import { toJsonObject, toJsonValue } from "../json";
import type { V2MappingContext } from "./context";

function confidenceFor(quality: V2MappingContext["completeness"]["qualityLevel"]): ScanSessionInsert["result_confidence"] {
  if (quality === "high") return "high";
  if (quality === "good") return "moderate";
  return "exploratory";
}

export function mapScanSession(context: V2MappingContext, status: ScanSessionInsert["status"] = "processing"): ScanSessionInsert {
  const { completeness, pipeline } = context;
  return {
    id: context.scanId,
    user_id: context.userId,
    status,
    expected_recording_count: completeness.expectedRecordings,
    valid_recording_count: completeness.validRecordings,
    invalid_recording_count: completeness.invalidRecordings,
    completion_ratio: completeness.completionRatio,
    capture_quality: completeness.qualityLevel,
    result_confidence: confidenceFor(completeness.qualityLevel),
    retry_recommended: completeness.retryRecommended,
    engine_version: pipeline.engineVersion,
    observation_engine_version: pipeline.engineVersion,
    observation_pipeline: toJsonObject(pipeline),
    observation_pipeline_created_at: pipeline.generatedAt,
    raw_result: toJsonObject(context.rawResult),
    completeness_metadata: toJsonObject(completeness),
    invalid_recording_reasons: completeness.invalidRecordingReasons.map(toJsonValue),
    warnings: pipeline.warnings.map(toJsonValue),
    started_at: context.startedAt ?? null,
    completed_at: status === "completed" || status === "partial" ? context.completedAt : null,
  };
}
