export type CanonicalCaptureKind =
  | "sustained_vowel"
  | "guided_speech"
  | "neutral_baseline"
  | "challenge_response"
  | "recovery_response";

export type CanonicalQualityLevel = "high" | "good" | "limited" | "poor";

export type AcousticFeatureMeasurement = {
  feature_id: string;
  feature_version: string;
  value: number | null;
  unit: string | null;
  method: string;
  source_capture_id: string;
  capture_kind: CanonicalCaptureKind;
  segment_start_ms: number;
  segment_end_ms: number;
  quality: CanonicalQualityLevel;
  confidence: number;
  rejection_reason: string | null;
  extractor: string;
  extractor_version: string;
  parameters: Record<string, unknown>;
  device_metadata: Record<string, unknown>;
  created_at: string;
};

export type AcousticVadSegment = {
  kind: "speech" | "silence" | "leading_silence" | "internal_pause" | "trailing_silence";
  start_ms: number;
  end_ms: number;
  confidence: number;
};

export type AcousticAnalysisResponse = {
  schema_version: string;
  scan_id: string;
  user_id: string;
  source_capture_id: string;
  capture_kind: CanonicalCaptureKind;
  storage_path: string | null;
  retention_policy: string;
  original_content_type: string;
  canonical_format: string;
  duration_ms: number;
  sample_rate_hz: number;
  channel_count: number;
  extractor: string;
  extractor_version: string;
  quality: CanonicalQualityLevel;
  confidence: number;
  failure_reason: string | null;
  features: AcousticFeatureMeasurement[];
  vad_segments: AcousticVadSegment[];
  metadata: Record<string, unknown>;
  created_at: string;
};

export type CanonicalAcousticAnalysis = {
  schemaVersion: string;
  authoritative: true;
  captureId: string;
  captureKind: CanonicalCaptureKind;
  extractor: string;
  extractorVersion: string;
  quality: CanonicalQualityLevel;
  confidence: number;
  storagePath: string | null;
  retentionPolicy: string;
  measurements: AcousticFeatureMeasurement[];
  vadSegments: AcousticVadSegment[];
  metadata: Record<string, unknown>;
};

export function isQualityApprovedMeasurement(measurement: AcousticFeatureMeasurement) {
  return measurement.value !== null && measurement.quality !== "poor" && measurement.confidence >= 0.35;
}
