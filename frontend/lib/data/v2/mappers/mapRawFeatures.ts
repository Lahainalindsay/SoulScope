import type { RawFeatureMeasurementInsert } from "../types";
import { stableUuid } from "../stableId";
import { toJsonObject } from "../json";
import type { V2MappingContext } from "./context";

export function mapRawFeatures(context: V2MappingContext): RawFeatureMeasurementInsert[] {
  return context.pipeline.rawFeatures.map((feature) => {
    const sourceCaptureIds = feature.captureIds.map((captureId) => stableUuid(context.scanId, "capture", captureId));
    return {
      id: stableUuid(context.scanId, "feature", feature.featureId, feature.taskId ?? "aggregate"),
      scan_id: context.scanId,
      user_id: context.userId,
      capture_id: sourceCaptureIds[0] ?? null,
      feature_id: feature.featureId,
      sensor_type: feature.sensorType,
      value: feature.value,
      unit: feature.unit ?? null,
      task_id: feature.taskId ?? null,
      extraction_version: feature.extractionVersion,
      quality: feature.quality,
      source_capture_ids: sourceCaptureIds,
      metadata: toJsonObject(feature.metadata ?? {}),
    };
  });
}
