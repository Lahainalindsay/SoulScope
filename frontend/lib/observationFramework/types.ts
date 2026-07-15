export type ConfidenceLevel = "high" | "moderate" | "exploratory";
export type SignalDirection = "elevated" | "reduced" | "stable" | "mixed" | "unavailable";
export type SensorType = "voice" | "face" | "blink" | "head_movement" | "breathing" | "hrv" | "sleep" | "movement" | "journal" | "typing";
export type CaptureQuality = "high" | "good" | "limited" | "poor";
export type ValidityLevel = "supported" | "emerging" | "exploratory";

export type SensorCaptureReference = {
  captureId: string;
  sensorType: SensorType;
  taskId?: string;
  recordedAt?: string;
  quality: CaptureQuality;
};

export type RawFeatureMeasurement = {
  id: string;
  featureId: string;
  sensorType: SensorType;
  value: number;
  unit?: string;
  taskId?: string;
  captureIds: string[];
  extractionVersion: string;
  quality: CaptureQuality;
  metadata?: Record<string, unknown>;
};

export type EvidenceSignal = {
  id: string;
  evidenceId: string;
  label: string;
  direction: SignalDirection;
  strength: number;
  contributingFeatureIds: string[];
  sourceCaptureIds: string[];
  captureConfidence: ConfidenceLevel;
  evidenceConfidence: ConfidenceLevel;
  validityLevel: ValidityLevel;
  ruleVersion: string;
  notes?: string[];
};

export type ObservationResult = {
  id: string;
  observationId: string;
  label: string;
  summary: string;
  direction: SignalDirection;
  strength: number;
  contributingEvidenceIds: string[];
  sourceCaptureIds: string[];
  captureConfidence: ConfidenceLevel;
  interpretationConfidence: ConfidenceLevel;
  ruleVersion: string;
  alternatives?: string[];
};

export type DomainState = "available" | "balanced" | "working_hard" | "asking_for_support";

export type DomainResultV2 = {
  id: string;
  domainId: string;
  name: string;
  score: number;
  state: DomainState;
  orientation: "availability" | "demand";
  contributingObservationIds: string[];
  sourceCaptureIds: string[];
  interpretationConfidence: ConfidenceLevel;
  ruleVersion: string;
  userFacingSummary: string;
};

export type ObservationPipelineContext = {
  scanId?: string;
  generatedAt?: string;
  captureIds?: string[];
  taskIds?: string[];
  captureQuality?: CaptureQuality;
  recordingCompleteness?: {
    expectedRecordings: number;
    validRecordings: number;
  };
};

export type ObservationPipelineResult = {
  engineVersion: string;
  generatedAt: string;
  captures: SensorCaptureReference[];
  rawFeatures: RawFeatureMeasurement[];
  evidenceSignals: EvidenceSignal[];
  observations: ObservationResult[];
  domains: DomainResultV2[];
  warnings: string[];
};
