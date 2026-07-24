import type { SupabaseClient } from "@supabase/supabase-js";
import type { VoiceAnalysisResult } from "../../voiceSpectrum";
import type { AcousticFeatureMeasurementInsert, PersonalAcousticBaselineInsert, VoiceAudioCaptureInsert } from "./types";
import { stableUuid } from "./stableId";
import { throwIfError } from "./client";
import { toJsonObject } from "./json";

const ACOUSTIC_BASELINE_VERSION = "soulscope-acoustic-baseline-v1";

function promptIdFor(sourceCaptureId: string) {
  return sourceCaptureId.split(":voice:")[0] || null;
}

function allCanonicalAnalyses(report: { analysisDebug?: VoiceAnalysisResult["analysisDebug"] }) {
  return (report.analysisDebug?.promptAnalyses ?? [])
    .map((prompt) => prompt.canonicalAcoustic)
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
}

export async function persistCanonicalAcoustics(
  client: SupabaseClient,
  args: { userId: string; scanId: string; result: VoiceAnalysisResult },
) {
  const analyses = allCanonicalAnalyses(args.result);
  if (!analyses.length) throw new Error("Canonical acoustic analysis is missing; scan cannot be marked complete.");
  const captureRows: VoiceAudioCaptureInsert[] = analyses.map((analysis) => ({
    id: stableUuid(args.scanId, "voice-audio-capture", analysis.captureId),
    scan_id: args.scanId,
    user_id: args.userId,
    sensor_capture_id: stableUuid(args.scanId, "capture", analysis.captureId),
    source_capture_id: analysis.captureId,
    capture_kind: analysis.captureKind,
    prompt_id: promptIdFor(analysis.captureId) ?? "",
    storage_provider: "server_private",
    storage_bucket: null,
    storage_path: analysis.storagePath,
    original_content_type: typeof analysis.metadata.originalContentType === "string" ? analysis.metadata.originalContentType : null,
    canonical_format: typeof analysis.metadata.canonicalFormat === "string" ? analysis.metadata.canonicalFormat : "mono PCM WAV, 16000 Hz",
    duration_ms: typeof analysis.metadata.durationMs === "number" ? analysis.metadata.durationMs : null,
    sample_rate_hz: typeof analysis.metadata.sampleRateHz === "number" ? analysis.metadata.sampleRateHz : null,
    channel_count: typeof analysis.metadata.channelCount === "number" ? analysis.metadata.channelCount : null,
    retention_policy: analysis.retentionPolicy,
    retention_delete_after: null,
    status: "processed",
    failure_reason: null,
    metadata: toJsonObject({ ...analysis.metadata, extractor: analysis.extractor, extractorVersion: analysis.extractorVersion }),
  }));
  const captureResponse = await client.from("voice_audio_captures").upsert(captureRows, { onConflict: "scan_id,source_capture_id" }).select("id,source_capture_id");
  throwIfError(captureResponse.error, "Could not save canonical voice capture metadata");
  const captureIds = new Map((captureResponse.data ?? []).map((row: { id: string; source_capture_id: string }) => [row.source_capture_id, row.id]));
  const featureRows: AcousticFeatureMeasurementInsert[] = analyses.flatMap((analysis) =>
    analysis.measurements.map((measurement) => ({
      scan_id: args.scanId,
      user_id: args.userId,
      voice_audio_capture_id: captureIds.get(measurement.source_capture_id) ?? null,
      source_capture_id: measurement.source_capture_id,
      capture_kind: measurement.capture_kind,
      feature_id: measurement.feature_id,
      feature_version: measurement.feature_version,
      value: measurement.value,
      unit: measurement.unit,
      method: measurement.method,
      segment_start_ms: measurement.segment_start_ms,
      segment_end_ms: measurement.segment_end_ms,
      quality: measurement.quality,
      confidence: measurement.confidence,
      rejection_reason: measurement.rejection_reason,
      extractor: measurement.extractor,
      extractor_version: measurement.extractor_version,
      parameters: toJsonObject(measurement.parameters),
      device_metadata: toJsonObject(measurement.device_metadata),
    })),
  );
  if (!featureRows.length) throw new Error("Canonical acoustic analysis returned no measurements; scan cannot be marked complete.");
  const featureResponse = await client
    .from("acoustic_feature_measurements")
    .upsert(featureRows, { onConflict: "scan_id,source_capture_id,feature_id,feature_version,segment_start_ms,segment_end_ms" });
  throwIfError(featureResponse.error, "Could not save canonical acoustic measurements");
}

function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function iqr(values: number[]) {
  if (values.length < 4) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = median(sorted.slice(0, Math.floor(sorted.length / 2)));
  const q3 = median(sorted.slice(Math.ceil(sorted.length / 2)));
  return q1 === null || q3 === null ? null : q3 - q1;
}

export type AcousticBaselineInput = {
  scan_id: string;
  feature_id: string;
  feature_version: string;
  capture_kind: string;
  source_capture_id: string;
  unit: string | null;
  method: string;
  extractor: string;
  extractor_version: string;
  value: number | null;
  quality: string;
  confidence: number;
  created_at: string;
};

export function buildPersonalAcousticBaselines(rows: AcousticBaselineInput[], now = Date.now()): PersonalAcousticBaselineInsert[] {
  const eligible = rows.filter((row) =>
    row.value !== null && Number.isFinite(row.value) &&
    ["high", "good", "limited"].includes(row.quality) && row.confidence >= 0.35,
  );
  const groups = new Map<string, AcousticBaselineInput[]>();
  for (const row of eligible) {
    const promptId = promptIdFor(row.source_capture_id) ?? "";
    const key = [row.feature_id, row.feature_version, row.unit ?? "", row.capture_kind, promptId, row.method, row.extractor, row.extractor_version].join("|");
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  const output: PersonalAcousticBaselineInsert[] = [];
  for (const [key, group] of Array.from(groups.entries())) {
    const [featureId, featureVersion, unit, captureKind, promptId, method, extractor, extractorVersion] = key.split("|");
    for (const window of ["7_day", "30_day", "stable"] as const) {
      const maxAge = window === "7_day" ? 7 : window === "30_day" ? 30 : null;
      const windowRows = maxAge === null ? group : group.filter((row) => now - Date.parse(row.created_at) <= maxAge * 86400000);
      const rawValues = windowRows.map((row) => row.value as number).filter(Number.isFinite);
      const rawCenter = median(rawValues);
      const rawMad = rawCenter === null ? null : median(rawValues.map((value) => Math.abs(value - rawCenter)));
      const threshold = rawMad !== null && rawMad > 0 ? 3 * 1.4826 * rawMad : null;
      const values = threshold === null || rawCenter === null
        ? rawValues.filter((value) => rawMad === 0 ? value === rawCenter : true)
        : rawValues.filter((value) => Math.abs(value - rawCenter) <= threshold);
      const center = median(values);
      const mad = center === null ? null : median(values.map((value) => Math.abs(value - center)));
      const spreadIqr = iqr(values);
      const current = values[0] ?? null;
      const deviation = current !== null && center !== null ? current - center : null;
      const robustZ = deviation !== null && mad !== null && mad > 0 ? deviation / (1.4826 * mad) : null;
      const scansUsed = new Set(windowRows.filter((row) => values.includes(row.value as number)).map((row) => row.scan_id)).size;
      const status = scansUsed >= 8 ? "established" : scansUsed >= 3 ? "provisional" : "not_established";
      output.push({
        id: stableUuid(group[0].scan_id, "personal-acoustic-baseline", featureId, featureVersion, captureKind, promptId, window, ACOUSTIC_BASELINE_VERSION),
        user_id: "",
        feature_id: featureId,
        feature_version: featureVersion,
        capture_kind: captureKind as PersonalAcousticBaselineInsert["capture_kind"],
        prompt_id: promptId,
        baseline_window: window,
        calculation_version: ACOUSTIC_BASELINE_VERSION,
        status,
        scans_used: scansUsed,
        measurements_used: values.length,
        measurements_rejected: windowRows.length - values.length,
        source_scan_ids: Array.from(new Set<string>(windowRows.map((row) => row.scan_id))).slice(0, 100),
        center_value: center,
        dispersion_value: mad,
        iqr: spreadIqr,
        current_value: current,
        current_deviation: deviation,
        current_robust_z: robustZ,
        confidence: status === "established" ? 0.82 : status === "provisional" ? 0.54 : 0,
        unit: unit || null,
        metadata: toJsonObject({ method, extractor, extractorVersion, baselineWindow: window, minimumProvisionalScans: 3, minimumEstablishedScans: 8, outlierRule: "3 robust standard deviations; MAD=0 retains exact center values" }),
        calculated_at: new Date().toISOString(),
      });
    }
  }
  return output;
}

export async function refreshPersonalAcousticBaselines(client: SupabaseClient, userId: string): Promise<void> {
  const { data, error } = await client
    .from("acoustic_feature_measurements")
    .select("scan_id,source_capture_id,feature_id,feature_version,capture_kind,value,unit,method,extractor,extractor_version,quality,confidence,created_at")
    .eq("user_id", userId)
    .not("value", "is", null)
    .gte("confidence", 0.35)
    .in("quality", ["high", "good", "limited"])
    .order("created_at", { ascending: false })
    .limit(5000);
  throwIfError(error, "Could not load acoustic measurements for baselines");
  const rows = (data ?? []) as AcousticBaselineInput[];
  const output = buildPersonalAcousticBaselines(rows, Date.now()).map((row) => ({ ...row, user_id: userId, id: stableUuid(userId, "personal-acoustic-baseline", row.feature_id, row.feature_version, row.capture_kind, row.prompt_id, row.baseline_window, ACOUSTIC_BASELINE_VERSION) }));
  if (!output.length) return;
  const response = await client
    .from("personal_acoustic_baselines")
    .upsert(output, { onConflict: "user_id,feature_id,feature_version,capture_kind,prompt_id,baseline_window,calculation_version" });
  throwIfError(response.error, "Could not save personal acoustic baselines");
}
