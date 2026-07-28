import type { VoiceAnalysisResult } from "./voiceSpectrum";

export const REFERENCE_SIGNATURE_VERSION = "reference-signature-v1";

export const REFERENCE_SIGNATURE_PROMPT = {
  id: "reference_self_intro",
  title: "Your Reference Signature",
  prompt: "Tell me something about yourself—something you enjoy doing, something familiar, or anything that feels easy and natural to talk about.",
  rationale: "Speak naturally for 30 seconds. This recording calibrates SoulScope and does not create a result.",
  durationMs: 30000,
} as const;

export type ReferenceSignatureVector = {
  coreFrequencyHz: number;
  spectralCentroidHz: number;
  resonanceScore: number;
  pitchMeanHz: number | null;
  pitchVariation: number | null;
  speakingRate: number | null;
  pauseRatio: number | null;
  intensityMean: number | null;
  harmonicity: number | null;
};

export type ReferenceSignature = {
  version: string;
  createdAt: string;
  vector: ReferenceSignatureVector;
  source: {
    promptId: string;
    durationMs: number;
    engineVersion: string;
  };
};

export type ReferenceComparison = {
  similarity: number;
  identityConfidence: number;
  deviation: number;
  status: "matched" | "shifted" | "mismatch" | "insufficient";
  differences: Partial<Record<keyof ReferenceSignatureVector, number>>;
};

function finite(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function dynamicsValue(result: VoiceAnalysisResult, key: string): number | null {
  const dynamics = result.voiceDynamics as Record<string, unknown> | undefined;
  return finite(dynamics?.[key]);
}

export function buildReferenceSignature(
  analysis: VoiceAnalysisResult,
  durationMs: number,
  createdAt = new Date().toISOString(),
): ReferenceSignature {
  return {
    version: REFERENCE_SIGNATURE_VERSION,
    createdAt,
    vector: {
      coreFrequencyHz: analysis.coreFrequencyHz,
      spectralCentroidHz: analysis.spectralCentroidHz,
      resonanceScore: analysis.resonanceScore,
      pitchMeanHz: dynamicsValue(analysis, "pitchMeanHz") ?? dynamicsValue(analysis, "meanPitchHz"),
      pitchVariation: dynamicsValue(analysis, "pitchVariation") ?? dynamicsValue(analysis, "pitchStdHz"),
      speakingRate: dynamicsValue(analysis, "speakingRate") ?? dynamicsValue(analysis, "wordsPerMinute"),
      pauseRatio: dynamicsValue(analysis, "pauseRatio"),
      intensityMean: dynamicsValue(analysis, "intensityMean") ?? dynamicsValue(analysis, "meanDbfs"),
      harmonicity: dynamicsValue(analysis, "harmonicity") ?? dynamicsValue(analysis, "hnrDb"),
    },
    source: {
      promptId: REFERENCE_SIGNATURE_PROMPT.id,
      durationMs,
      engineVersion: analysis.analysisDebug?.engineVersion ?? "soulscope-canonical-acoustic-v1",
    },
  };
}

const SCALES: Record<keyof ReferenceSignatureVector, number> = {
  coreFrequencyHz: 90,
  spectralCentroidHz: 1400,
  resonanceScore: 0.35,
  pitchMeanHz: 90,
  pitchVariation: 45,
  speakingRate: 80,
  pauseRatio: 0.35,
  intensityMean: 18,
  harmonicity: 18,
};

export function compareToReferenceSignature(
  reference: ReferenceSignature,
  current: VoiceAnalysisResult,
): ReferenceComparison {
  const currentVector = buildReferenceSignature(current, 0).vector;
  const differences: ReferenceComparison["differences"] = {};
  const similarities: number[] = [];

  for (const key of Object.keys(reference.vector) as Array<keyof ReferenceSignatureVector>) {
    const baselineValue = reference.vector[key];
    const currentValue = currentVector[key];
    if (baselineValue === null || currentValue === null) continue;
    const normalizedDifference = Math.min(1, Math.abs(currentValue - baselineValue) / SCALES[key]);
    differences[key] = Number(normalizedDifference.toFixed(3));
    similarities.push(1 - normalizedDifference);
  }

  if (similarities.length < 3) {
    return { similarity: 0, identityConfidence: 0, deviation: 1, status: "insufficient", differences };
  }

  const similarity = similarities.reduce((sum, value) => sum + value, 0) / similarities.length;
  const identityConfidence = Math.max(0, Math.min(1, (similarity - 0.35) / 0.55));
  const deviation = 1 - similarity;
  const status = similarity >= 0.72 ? "matched" : similarity >= 0.52 ? "shifted" : "mismatch";

  return {
    similarity: Number(similarity.toFixed(3)),
    identityConfidence: Number(identityConfidence.toFixed(3)),
    deviation: Number(deviation.toFixed(3)),
    status,
    differences,
  };
}
