export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export type ScanStatus = "processing" | "completed" | "partial" | "failed";
export type CaptureStatus = "valid" | "invalid" | "missing";
export type QualityLevel = "high" | "good" | "limited" | "poor";
export type PatternRole = "primary" | "supporting" | "emerging";
export type ReflectionStyle = "direct" | "supportive" | "insight";
export type ConfidenceLevel = "high" | "moderate" | "exploratory";
export type SignalDirection = "elevated" | "reduced" | "stable" | "mixed" | "unavailable";
export type DomainState = "available" | "balanced" | "working_hard" | "asking_for_support";
export type DomainOrientation = "availability" | "demand" | "neutral";

export interface ScanSessionRow {
  id: string;
  user_id: string;
  status: ScanStatus;
  expected_recording_count: number;
  valid_recording_count: number;
  invalid_recording_count: number;
  completion_ratio: number | null;
  capture_quality: QualityLevel;
  result_confidence: ConfidenceLevel;
  retry_recommended: boolean;
  engine_version: string | null;
  observation_engine_version: string | null;
  observation_pipeline: JsonObject | null;
  observation_pipeline_created_at: string | null;
  subject_id?: string | null;
  raw_result: JsonObject | null;
  completeness_metadata: JsonObject;
  invalid_recording_reasons: JsonValue[];
  warnings: JsonValue[];
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}
export type ScanSessionInsert = Omit<ScanSessionRow, "created_at" | "updated_at">;
export type ScanSessionUpdate = Partial<Omit<ScanSessionRow, "id" | "user_id" | "created_at">>;

export interface SensorCaptureRow {
  id: string; scan_id: string; user_id: string; sensor_type: string; task_id: string | null;
  attempt_number: number; status: CaptureStatus; quality: QualityLevel; recorded_at: string | null;
  duration_seconds: number | null; invalid_reasons: JsonValue[]; metadata: JsonObject;
  created_at: string; updated_at: string;
}
export type SensorCaptureInsert = Omit<SensorCaptureRow, "created_at" | "updated_at">;

export interface RawFeatureMeasurementRow {
  id: string; scan_id: string; user_id: string; capture_id: string | null; feature_id: string;
  sensor_type: string; value: number; unit: string | null; task_id: string | null;
  extraction_version: string; quality: QualityLevel; source_capture_ids: string[];
  metadata: JsonObject; created_at: string;
}
export type RawFeatureMeasurementInsert = Omit<RawFeatureMeasurementRow, "created_at">;

export interface EvidenceSignalResultRow {
  id: string; scan_id: string; user_id: string; evidence_id: string; label: string;
  direction: SignalDirection; strength: number; capture_confidence: ConfidenceLevel;
  evidence_confidence: ConfidenceLevel; validity_level: "supported" | "emerging" | "exploratory";
  rule_version: string; contributing_feature_ids: string[]; source_capture_ids: string[];
  notes: JsonValue[]; created_at: string;
}
export type EvidenceSignalResultInsert = Omit<EvidenceSignalResultRow, "created_at">;

export interface ObservationResultRow {
  id: string; scan_id: string; user_id: string; observation_id: string; label: string; summary: string;
  direction: SignalDirection; strength: number; capture_confidence: ConfidenceLevel;
  interpretation_confidence: ConfidenceLevel; rule_version: string; contributing_evidence_ids: string[];
  source_capture_ids: string[]; alternatives: JsonValue[]; created_at: string;
}
export type ObservationResultInsert = Omit<ObservationResultRow, "created_at">;

export interface DomainResultRow {
  id: string; scan_id: string; user_id: string; domain_id: string; name: string; score: number;
  state: DomainState; orientation: DomainOrientation; interpretation_confidence: ConfidenceLevel;
  rule_version: string; contributing_observation_ids: string[]; source_capture_ids: string[];
  user_facing_summary: string; metadata: JsonObject; created_at: string; updated_at: string;
}
export type DomainResultInsert = Omit<DomainResultRow, "created_at" | "updated_at">;

export interface PatternMatchRow {
  id: string; scan_id: string; user_id: string; role: PatternRole; pattern_id: string;
  pattern_name: string; pattern_theme: string | null; explanation: string; confidence: ConfidenceLevel;
  confidence_score: number | null; pattern_expression_id: string | null; pattern_expression_title: string | null;
  pattern_expression_summary: string | null; modifiers: JsonValue[]; evidence_provenance: JsonValue[];
  baseline_comparison: JsonObject | null; created_at: string; updated_at: string;
}
export type PatternMatchInsert = Omit<PatternMatchRow, "created_at" | "updated_at">;

export interface ReflectionVariantRow {
  id: string; scan_id: string; user_id: string; style: ReflectionStyle; title: string;
  summary: string; content: JsonObject; created_at: string; updated_at: string;
}
export type ReflectionVariantInsert = Omit<ReflectionVariantRow, "created_at" | "updated_at">;

export interface ScanReflectionPreferenceRow {
  id: string; scan_id: string; user_id: string; selected_variant_id: string | null;
  selected_style: ReflectionStyle; selected_title: string; selected_summary: string;
  created_at: string; updated_at: string;
}

export interface UserNarrativePreferenceRow {
  user_id: string; direct_count: number; supportive_count: number; insight_count: number;
  preferred_style: ReflectionStyle | null; total_selections: number;
  last_selected_style: ReflectionStyle | null; created_at: string; updated_at: string;
}

export interface PersonalBaselineRow {
  id: string; user_id: string; domain_id: string; calculation_version: string;
  baseline_score: number; scans_used: number; source_scan_ids: string[]; confidence: ConfidenceLevel;
  summary: string | null; metadata: JsonObject; calculated_at: string; created_at: string; updated_at: string;
}
export type PersonalBaselineInsert = Omit<PersonalBaselineRow, "created_at" | "updated_at">;
