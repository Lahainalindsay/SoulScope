import type { VoiceAnalysisResult } from "../voiceSpectrum";
import { buildDomains } from "./buildDomains";
import { buildEvidenceSignals } from "./buildEvidenceSignals";
import { buildObservations } from "./buildObservations";
import { buildCaptureReferences, buildRawFeatures } from "./buildRawFeatures";
import type { ObservationPipelineContext, ObservationPipelineResult } from "./types";
import { OBSERVATION_ENGINE_VERSION } from "./versions";

export function buildObservationPipeline(
  scan: VoiceAnalysisResult,
  context: ObservationPipelineContext = {},
): ObservationPipelineResult {
  const captures = buildCaptureReferences(scan, context);
  const rawFeatures = buildRawFeatures(scan, context);
  const evidenceSignals = buildEvidenceSignals(rawFeatures);
  const observations = buildObservations(evidenceSignals);
  const domains = buildDomains(observations);
  const warnings: string[] = [];

  if (!rawFeatures.length) warnings.push("No usable raw features were available for the observation pipeline.");
  if (scan.voiceDynamics?.captureQuality === "poor") warnings.push("Capture quality was poor; derived confidence is intentionally limited.");
  if (context.recordingCompleteness && context.recordingCompleteness.validRecordings < context.recordingCompleteness.expectedRecordings) {
    warnings.push(`Pipeline used ${context.recordingCompleteness.validRecordings} of ${context.recordingCompleteness.expectedRecordings} expected recordings.`);
  }
  if (domains.length < 4) warnings.push("The observation pipeline produced too few domains for safe legacy pattern adaptation.");

  return {
    engineVersion: OBSERVATION_ENGINE_VERSION,
    generatedAt: context.generatedAt ?? new Date().toISOString(),
    captures,
    rawFeatures,
    evidenceSignals,
    observations,
    domains,
    warnings,
  };
}
