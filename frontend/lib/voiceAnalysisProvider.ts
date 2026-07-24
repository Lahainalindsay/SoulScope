import { analyzeVoiceSpectrum, type VoiceAnalysisResult } from "./voiceSpectrum";
import type { CanonicalCaptureKind } from "./acousticContract";

export type VoiceProviderNamespace = "soulscope" | "vendor";

export type ConsentRecord = {
  consentId: string;
  obtainedFromDataSubject: boolean;
  obtainedAt: string;
  method: "scan_preparation" | "account_setting" | "admin_import";
};

export type AudioInput = {
  blob: Blob;
  captureKind?: CanonicalCaptureKind;
  captureDurationMs?: number;
  captureId?: string;
  scanId?: string;
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
  readonly providerId = "soulscope-canonical-acoustic";
  readonly engineVersion = "soulscope-canonical-acoustic-v1";

  async analyzeFile(input: AudioInput, consent: ConsentRecord): Promise<ProviderResult> {
    if (!consent.obtainedFromDataSubject) {
      throw new Error("Voice analysis requires explicit consent from the data subject.");
    }

    const captureId = input.captureId ?? "voice-capture";
    if (!input.scanId) {
      throw new Error("Server acoustic analysis requires a scan id.");
    }
    const { analyzeAudioOnServer } = await import("./serverAcousticAnalysis");
    const canonicalAcoustic = await analyzeAudioOnServer({
      blob: input.blob,
      scanId: input.scanId,
      captureId,
      captureKind: input.captureKind ?? "guided_speech",
      durationMs: input.captureDurationMs,
    });

    const result = await analyzeVoiceSpectrum(input.blob, {
      captureKind: input.captureKind,
      captureDurationMs: input.captureDurationMs,
    });

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
            "SoulScope acoustic analysis uses deterministic server-side acoustic measurements for reflective state evidence. It does not infer deception, authenticity, diagnosis, medical state, or fixed personality.",
        },
        canonicalAcoustic,
        analysisLedger: {
          records: [
            {
              recordType: "analysis_session",
              namespace: this.namespace,
              id: `${captureId}:session`,
              formulaVersion: this.engineVersion,
              qualityGate: canonicalAcoustic.quality,
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
              confidence: canonicalAcoustic.confidence,
              qualityGate: canonicalAcoustic.quality,
              modality: "audio",
              alternatives: ["Microphone distance, room noise, clipping, and recording duration may affect quality."],
            },
            ...canonicalAcoustic.measurements.slice(0, 12).map((measurement) => ({
              recordType: "segment_feature" as const,
              namespace: this.namespace,
              id: `${captureId}:${measurement.feature_id}`,
              timeRangeMs: [measurement.segment_start_ms, measurement.segment_end_ms] as [number, number],
              formulaVersion: measurement.extractor_version,
              confidence: measurement.confidence,
              qualityGate: measurement.rejection_reason ?? measurement.quality,
              modality: "audio" as const,
            })),
          ],
        },
      },
    };
  }
}

export function createDefaultVoiceAnalysisProvider(): VoiceAnalysisProvider {
  return new SoulScopeAcousticProvider();
}
