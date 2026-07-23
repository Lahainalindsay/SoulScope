import type { VoiceAnalysisResult } from "../voiceSpectrum";
import type {
  CaptureQuality,
  ObservationPipelineContext,
  RawFeatureMeasurement,
  SensorCaptureReference,
} from "./types";
import { RAW_FEATURE_SCHEMA_VERSION } from "./versions";

function qualityFromScan(scan: VoiceAnalysisResult, override?: CaptureQuality): CaptureQuality {
  if (override) return override;
  const quality = scan.voiceDynamics?.captureQuality;
  if (quality === "good") return "good";
  if (quality === "fair") return "limited";
  return quality === "poor" ? "poor" : "limited";
}

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function buildCaptureReferences(
  scan: VoiceAnalysisResult,
  context: ObservationPipelineContext = {},
): SensorCaptureReference[] {
  const quality = qualityFromScan(scan, context.captureQuality);
  const promptAnalyses = scan.analysisDebug?.promptAnalyses ?? [];
  if (promptAnalyses.length) {
    return promptAnalyses.map((prompt, index) => ({
      captureId: context.captureIds?.[index] ?? `${context.scanId ?? "scan"}:voice:${index + 1}`,
      sensorType: "voice",
      taskId: context.taskIds?.[index] ?? `prompt-${prompt.index + 1}`,
      quality: prompt.voiceDynamics?.captureQuality === "good" ? "good" : prompt.voiceDynamics?.captureQuality === "poor" ? "poor" : "limited",
    }));
  }
  return [{ captureId: context.captureIds?.[0] ?? `${context.scanId ?? "scan"}:voice:aggregate`, sensorType: "voice", quality }];
}

export function buildRawFeatures(
  scan: VoiceAnalysisResult,
  context: ObservationPipelineContext = {},
): RawFeatureMeasurement[] {
  const captures = buildCaptureReferences(scan, context);
  const captureIds = captures.map((capture) => capture.captureId);
  const quality = qualityFromScan(scan, context.captureQuality);
  const dynamics = scan.voiceDynamics;
  const output: RawFeatureMeasurement[] = [];

  const push = (featureId: string, value: unknown, unit?: string, metadata?: Record<string, unknown>) => {
    if (!finite(value)) return;
    output.push({
      id: `${context.scanId ?? "scan"}:${featureId}`,
      featureId,
      sensorType: "voice",
      value,
      unit,
      captureIds,
      extractionVersion: RAW_FEATURE_SCHEMA_VERSION,
      quality,
      metadata,
    });
  };

  push("voice.f0.median", dynamics?.medianPitchHz, "Hz");
  push("voice.f0.range_hz", dynamics?.pitchRangeHz, "Hz");
  push("voice.f0.range_semitones", dynamics?.pitchRangeSemitones, "semitones");
  push("voice.pitch_stability", dynamics?.pitchStability);
  push("voice.pitch_clarity", dynamics?.pitchClarity);
  push("voice.jitter", dynamics?.jitterLocalPct, "%");
  push("voice.shimmer", dynamics?.shimmerLocalPct, "%");
  push("voice.hnr", dynamics?.harmonicToNoiseRatioDb, "dB");
  push("voice.harmonic_richness", dynamics?.harmonicRichness);
  push("voice.spectral_centroid", scan.spectralCentroidHz, "Hz");
  push("voice.spectral_flatness", dynamics?.spectralFlatness);
  push("voice.zero_crossing_rate", dynamics?.zeroCrossingRate);
  push("voice.active_frame_ratio", dynamics?.activeFrameRatio);
  push("voice.voiced_frame_ratio", dynamics?.voicedFrameRatio);
  push("voice.voiced_frame_count", dynamics?.voicedFrameCount, "frames");
  push("voice.voiced_duration", dynamics?.voicedDurationMs, "ms");
  push("voice.pause.count", dynamics?.pauseCount, "count");
  push("voice.pause.duration_mean", dynamics?.averagePauseMs, "ms");
  push("voice.pause.duration_max", dynamics?.longestPauseMs, "ms");
  push("voice.pause.density", dynamics?.pauseDensityPerMin, "per_min");
  push("voice.speech_rate_proxy", dynamics?.speechRateProxyPerMin, "per_min");
  push("voice.formant_stability", dynamics?.formantStability);
  push("voice.formant_dynamics", dynamics?.formantDynamics);
  push("voice.clipping_ratio", dynamics?.clippingFrameRatio);
  push("voice.resonance_score", scan.resonanceScore, undefined, {
    evidenceUse: "visualization_only",
    claimsBoundary: "Aggregate resonance scoring is retained for SoulScope visual rendering and is not used as evidence for health, emotion, or personality conclusions.",
  });
  push("voice.core_frequency", scan.coreFrequencyHz, "Hz", {
    evidenceUse: "visualization_only",
    claimsBoundary: "Core frequency is retained for note/cymatic visualization and is not used as evidence for health, emotion, or personality conclusions.",
  });

  for (const note of scan.noteEnergies ?? []) {
    push(`voice.note_energy.${note.note.toLowerCase().replace("#", "_sharp")}`, note.relativeEnergy, undefined, {
      score: note.score,
      status: note.status,
      evidenceUse: "visualization_only",
      claimsBoundary: "Note-energy features are experiential visualization inputs only and cannot contribute to observation evidence.",
    });
  }

  return output;
}
