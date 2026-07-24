import type { VoiceAnalysisResult } from "../voiceSpectrum";
import type { AcousticFeatureMeasurement } from "../acousticContract";
import { isQualityApprovedMeasurement } from "../acousticContract";
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

function qualityFromCanonical(quality: AcousticFeatureMeasurement["quality"]): CaptureQuality {
  return quality === "high" ? "high" : quality === "good" ? "good" : quality === "limited" ? "limited" : "poor";
}

function canonicalCompatibility(feature: AcousticFeatureMeasurement): Array<{ featureId: string; value: number; unit: string | undefined }> {
  if (!isQualityApprovedMeasurement(feature) || feature.value === null) return [];
  const unit = feature.unit ?? undefined;
  const passthrough = [{ featureId: feature.feature_id, value: feature.value, unit }];
  const aliases: Array<{ featureId: string; value: number; unit: string | undefined }> = [];
  if (feature.feature_id === "voice.jitter.local") aliases.push({ featureId: "voice.jitter", value: feature.value * 100, unit: "%" });
  if (feature.feature_id === "voice.shimmer.local") aliases.push({ featureId: "voice.shimmer", value: feature.value * 100, unit: "%" });
  if (feature.feature_id === "voice.hnr.mean") aliases.push({ featureId: "voice.hnr", value: feature.value, unit: "dB" });
  if (feature.feature_id === "voice.syllable_nuclei_rate") aliases.push({ featureId: "voice.speech_rate_proxy", value: feature.value, unit: "per_min" });
  if (feature.feature_id === "voice.phonation_time_ratio") aliases.push({ featureId: "voice.active_frame_ratio", value: feature.value, unit: "ratio" });
  if (feature.feature_id === "voice.voiced_duration_ms") aliases.push({ featureId: "voice.voiced_duration", value: feature.value, unit: "ms" });
  return [...passthrough, ...aliases];
}

export function buildCaptureReferences(
  scan: VoiceAnalysisResult,
  context: ObservationPipelineContext = {},
): SensorCaptureReference[] {
  const quality = qualityFromScan(scan, context.captureQuality);
  const promptAnalyses = scan.analysisDebug?.promptAnalyses ?? [];
  if (promptAnalyses.length) {
    return promptAnalyses.map((prompt, index) => ({
      captureId: context.captureIds?.[index] ?? prompt.canonicalAcoustic?.captureId ?? `${context.scanId ?? "scan"}:voice:${index + 1}`,
      sensorType: "voice",
      taskId: context.taskIds?.[index] ?? `prompt-${prompt.index + 1}`,
      quality: prompt.canonicalAcoustic ? qualityFromCanonical(prompt.canonicalAcoustic.quality) : prompt.voiceDynamics?.captureQuality === "good" ? "good" : prompt.voiceDynamics?.captureQuality === "poor" ? "poor" : "limited",
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
  const serverFeatureIds = new Set<string>();

  const push = (featureId: string, value: unknown, unit?: string, metadata?: Record<string, unknown>) => {
    if (!finite(value)) return;
    if (serverFeatureIds.has(featureId) && metadata?.source !== "canonical_server") return;
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

  for (const prompt of scan.analysisDebug?.promptAnalyses ?? []) {
    const canonical = prompt.canonicalAcoustic;
    if (!canonical) continue;
    for (const measurement of canonical.measurements) {
      for (const compatible of canonicalCompatibility(measurement)) {
        serverFeatureIds.add(compatible.featureId);
        output.push({
          id: `${context.scanId ?? "scan"}:${compatible.featureId}:${measurement.source_capture_id}`,
          featureId: compatible.featureId,
          sensorType: "voice",
          value: compatible.value,
          unit: compatible.unit,
          captureIds: [measurement.source_capture_id],
          taskId: measurement.capture_kind,
          extractionVersion: measurement.extractor_version,
          quality: qualityFromCanonical(measurement.quality),
          metadata: {
            source: "canonical_server",
            canonicalFeatureId: measurement.feature_id,
            canonicalUnit: measurement.unit,
            method: measurement.method,
            featureVersion: measurement.feature_version,
            extractor: measurement.extractor,
            extractorVersion: measurement.extractor_version,
            confidence: measurement.confidence,
            rejectionReason: measurement.rejection_reason,
            segmentStartMs: measurement.segment_start_ms,
            segmentEndMs: measurement.segment_end_ms,
            captureKind: measurement.capture_kind,
            parameters: measurement.parameters,
          },
        });
      }
    }
  }

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
