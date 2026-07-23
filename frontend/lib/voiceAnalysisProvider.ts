import { analyzeVoiceSpectrum, type VoiceAnalysisResult } from "./voiceSpectrum";

export type VoiceProviderNamespace = "soulscope" | "vendor";

export type ConsentRecord = {
  consentId: string;
  obtainedFromDataSubject: boolean;
  obtainedAt: string;
  method: "scan_preparation" | "account_setting" | "admin_import";
};

export type AudioInput = {
  blob: Blob;
  captureKind?: "sustained_vowel" | "guided_speech";
  captureDurationMs?: number;
  captureId?: string;
};

export type ProviderResult = {
  namespace: VoiceProviderNamespace;
  providerId: string;
  engineVersion: string;
  result: VoiceAnalysisResult;
  rawResponse?: unknown;
};

export type SegmentResult = {
  namespace: VoiceProviderNamespace;
  providerId: string;
  segmentId: string;
  timeRangeMs: [number, number];
  result: Partial<VoiceAnalysisResult>;
};

export interface VoiceAnalysisProvider {
  readonly namespace: VoiceProviderNamespace;
  readonly providerId: string;
  analyzeFile(input: AudioInput, consent: ConsentRecord): Promise<ProviderResult>;
  analyzeStream?(input: AsyncIterable<AudioInput>, consent: ConsentRecord): AsyncIterable<SegmentResult>;
}

export class SoulScopeAcousticProvider implements VoiceAnalysisProvider {
  readonly namespace = "soulscope" as const;
  readonly providerId = "soulscope-acoustic";
  readonly engineVersion = "soulscope-acoustic-v1";

  async analyzeFile(input: AudioInput, consent: ConsentRecord): Promise<ProviderResult> {
    if (!consent.obtainedFromDataSubject) {
      throw new Error("Voice analysis requires explicit consent from the data subject.");
    }

    const result = await analyzeVoiceSpectrum(input.blob, {
      captureKind: input.captureKind,
      captureDurationMs: input.captureDurationMs,
    });
    const captureId = input.captureId ?? "voice-capture";

    return {
      namespace: this.namespace,
      providerId: this.providerId,
      engineVersion: this.engineVersion,
      result: {
        ...result,
        provider: {
          namespace: this.namespace,
          providerId: this.providerId,
          engineVersion: this.engineVersion,
          consentId: consent.consentId,
          rawResponseStored: false,
          claimsBoundary:
            "SoulScope acoustic analysis uses open, deterministic voice features for reflective state evidence. It does not infer deception, authenticity, diagnosis, or fixed personality.",
        },
        analysisLedger: {
          records: [
            {
              recordType: "analysis_session",
              namespace: this.namespace,
              id: `${captureId}:session`,
              formulaVersion: this.engineVersion,
              qualityGate: result.voiceDynamics?.captureQuality ?? "limited",
              modality: "audio",
            },
            {
              recordType: "capture",
              namespace: this.namespace,
              id: captureId,
              timeRangeMs: [0, input.captureDurationMs ?? result.voiceDynamics?.analyzedDurationMs ?? 0],
              modality: "audio",
            },
            {
              recordType: "audio_quality",
              namespace: this.namespace,
              id: `${captureId}:quality`,
              confidence: result.voiceDynamics?.captureQuality === "good" ? 0.86 : result.voiceDynamics?.captureQuality === "fair" ? 0.64 : 0.32,
              qualityGate: result.voiceDynamics?.captureRecommendation ?? "Quality could not be fully determined.",
              modality: "audio",
              alternatives: ["Microphone distance, room noise, clipping, and recording duration may affect quality."],
            },
          ],
        },
      },
    };
  }
}

export function createDefaultVoiceAnalysisProvider(): VoiceAnalysisProvider {
  return new SoulScopeAcousticProvider();
}
