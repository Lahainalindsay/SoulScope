import type { VoiceAnalysisResult } from "./voiceSpectrum";

export type ScanStatus = "completed" | "partial" | "failed";
export type ScanQualityLevel = "high" | "good" | "limited";

export type InvalidRecordingReason = {
  index: number;
  questionId?: string;
  reason: string;
};

export type ScanCompleteness = {
  status: ScanStatus;
  expectedRecordings: number;
  validRecordings: number;
  invalidRecordings: number;
  completionRatio: number;
  qualityLevel: ScanQualityLevel;
  resultConfidence: ScanQualityLevel;
  userMessage: string;
  retryRecommended: boolean;
  invalidRecordingReasons: InvalidRecordingReason[];
};

export type ScanWithCompleteness = VoiceAnalysisResult & {
  scanCompleteness?: ScanCompleteness;
};

export function isUsableAnalysis(result: VoiceAnalysisResult | null | undefined) {
  if (!result) return false;
  const dynamics = result.voiceDynamics;
  if (!Number.isFinite(result.coreFrequencyHz) || result.coreFrequencyHz <= 0) return false;
  if (!Number.isFinite(result.spectralCentroidHz) || result.spectralCentroidHz <= 0) return false;
  if (!Number.isFinite(result.resonanceScore)) return false;
  if (!Array.isArray(result.noteEnergies) || result.noteEnergies.length < 3) return false;
  if (!dynamics) return false;
  if ((dynamics.voicedFrameCount ?? 0) < 4) return false;
  if ((dynamics.voicedDurationMs ?? 0) < 250) return false;
  if ((dynamics.voicedFrameRatio ?? 0) < 0.06) return false;
  if ((dynamics.clippingFrameRatio ?? 0) > 0.5) return false;
  if (dynamics.captureQuality === "poor") return false;
  return true;
}

export function buildScanCompleteness(args: {
  expectedRecordings: number;
  analyses: Array<VoiceAnalysisResult | null>;
  invalidRecordingReasons?: InvalidRecordingReason[];
}): ScanCompleteness {
  const expected = Math.max(1, args.expectedRecordings);
  const validRecordings = args.analyses.filter(isUsableAnalysis).length;
  const invalidRecordings = Math.max(0, expected - validRecordings);
  const completionRatio = validRecordings / expected;

  let status: ScanStatus = "failed";
  let qualityLevel: ScanQualityLevel = "limited";
  let userMessage = "Not enough voice data was captured to create a reliable reflection. Find a quiet space, speak naturally, and try again.";
  let retryRecommended = true;

  if (validRecordings >= 6) {
    status = "completed";
    qualityLevel = validRecordings === expected ? "high" : "good";
    userMessage = validRecordings === expected
      ? "Your reflection is ready."
      : `We analyzed ${validRecordings} of ${expected} recordings. Your result is based on the signals captured successfully and may be slightly less detailed than a complete scan.`;
    retryRecommended = validRecordings !== expected;
  } else if (validRecordings >= 4) {
    status = "partial";
    qualityLevel = "good";
    userMessage = "This result is based on the recordings captured clearly. Because part of the scan was incomplete, some details may be less specific.";
    retryRecommended = true;
  } else if (validRecordings === 3) {
    status = "partial";
    qualityLevel = "limited";
    userMessage = "We captured enough information to offer an initial reflection, but the result is less complete than a full scan.";
    retryRecommended = true;
  }

  return {
    status,
    expectedRecordings: expected,
    validRecordings,
    invalidRecordings,
    completionRatio,
    qualityLevel,
    resultConfidence: qualityLevel,
    userMessage,
    retryRecommended,
    invalidRecordingReasons: args.invalidRecordingReasons ?? [],
  };
}

export function shouldIncludeInBaseline(scan: ScanWithCompleteness) {
  const completeness = scan.scanCompleteness;
  if (!completeness) return scan.voiceDynamics?.captureQuality === "good";
  if (completeness.status === "failed") return false;
  if (completeness.qualityLevel === "limited") return false;
  return scan.voiceDynamics?.captureQuality !== "poor";
}
