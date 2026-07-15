import type { SensorCaptureInsert } from "../types";
import { stableUuid } from "../stableId";
import { toJsonObject, toJsonValue } from "../json";
import type { V2MappingContext } from "./context";

export function mapSensorCaptures(context: V2MappingContext): SensorCaptureInsert[] {
  const rows = context.pipeline.captures.map((capture, index) => ({
    id: stableUuid(context.scanId, "capture", capture.captureId),
    scan_id: context.scanId,
    user_id: context.userId,
    sensor_type: capture.sensorType,
    task_id: capture.taskId ?? `capture-${index + 1}`,
    attempt_number: 1,
    status: capture.quality === "poor" ? "invalid" as const : "valid" as const,
    quality: capture.quality,
    recorded_at: capture.recordedAt ?? null,
    duration_seconds: null,
    invalid_reasons: [],
    metadata: toJsonObject({ sourceCaptureId: capture.captureId }),
  }));

  const existingTasks = new Set(rows.map((row) => row.task_id));
  for (const invalid of context.completeness.invalidRecordingReasons) {
    const taskId = invalid.questionId ?? `invalid-${invalid.index + 1}`;
    if (existingTasks.has(taskId)) continue;
    rows.push({
      id: stableUuid(context.scanId, "capture", taskId),
      scan_id: context.scanId,
      user_id: context.userId,
      sensor_type: "voice",
      task_id: taskId,
      attempt_number: 1,
      status: "invalid",
      quality: "poor",
      recorded_at: null,
      duration_seconds: null,
      invalid_reasons: [toJsonValue(invalid.reason)],
      metadata: toJsonObject({ index: invalid.index }),
    });
  }
  return rows;
}
