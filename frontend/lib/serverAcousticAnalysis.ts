import type { AcousticAnalysisResponse, CanonicalAcousticAnalysis, CanonicalCaptureKind } from "./acousticContract";
import { supabase } from "./supabaseClient";

const ACOUSTIC_ANALYSIS_URL = "/backend-api/api/acoustic/analyze";
const CANONICAL_SAMPLE_RATE = 16000;
const MAX_FETCH_ATTEMPTS = 3;
const RETRYABLE_STATUS_CODES = new Set([429, 502, 503, 504]);

let uploadQueue: Promise<void> = Promise.resolve();

function interleaveToWav(samples: Float32Array, sampleRate: number) {
  const bytesPerSample = 2;
  const dataLength = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);
  const writeString = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) view.setUint8(offset + index, value.charCodeAt(index));
  };
  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, dataLength, true);
  let offset = 44;
  for (let index = 0; index < samples.length; index += 1) {
    const sample = samples[index];
    const clamped = Math.max(-1, Math.min(1, sample));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += 2;
  }
  return new Blob([buffer], { type: "audio/wav" });
}

function resampleLinear(samples: Float32Array, sourceRate: number, targetRate: number) {
  if (sourceRate === targetRate) return samples;
  const outputLength = Math.max(1, Math.round(samples.length * targetRate / sourceRate));
  const output = new Float32Array(outputLength);
  const ratio = sourceRate / targetRate;
  for (let index = 0; index < outputLength; index += 1) {
    const sourcePosition = index * ratio;
    const leftIndex = Math.floor(sourcePosition);
    const rightIndex = Math.min(leftIndex + 1, samples.length - 1);
    const fraction = sourcePosition - leftIndex;
    output[index] = samples[leftIndex] * (1 - fraction) + samples[rightIndex] * fraction;
  }
  return output;
}

async function decodeToMonoWav(blob: Blob) {
  const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) throw new Error("Audio decoding is not available in this browser.");
  const context = new AudioContextCtor();
  try {
    const decoded = await context.decodeAudioData(await blob.arrayBuffer());
    const length = decoded.length;
    const mono = new Float32Array(length);
    for (let channel = 0; channel < decoded.numberOfChannels; channel += 1) {
      const data = decoded.getChannelData(channel);
      for (let index = 0; index < length; index += 1) mono[index] += data[index] / decoded.numberOfChannels;
    }
    const canonicalMono = resampleLinear(mono, decoded.sampleRate, CANONICAL_SAMPLE_RATE);
    return {
      blob: interleaveToWav(canonicalMono, CANONICAL_SAMPLE_RATE),
      sourceSampleRate: decoded.sampleRate,
      canonicalSampleRate: CANONICAL_SAMPLE_RATE,
      channelCount: decoded.numberOfChannels,
    };
  } finally {
    void context.close();
  }
}

async function waitBeforeRetry(attempt: number) {
  await new Promise((resolve) => window.setTimeout(resolve, 1200 * attempt));
}

async function postAcousticAnalysis(form: FormData, token: string) {
  let lastError: unknown;
  let lastResponse: Response | null = null;

  for (let attempt = 1; attempt <= MAX_FETCH_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(ACOUSTIC_ANALYSIS_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      lastResponse = response;

      if (!RETRYABLE_STATUS_CODES.has(response.status) || attempt === MAX_FETCH_ATTEMPTS) {
        return response;
      }
    } catch (error) {
      lastError = error;
      if (attempt === MAX_FETCH_ATTEMPTS) break;
    }

    await waitBeforeRetry(attempt);
  }

  if (lastResponse) return lastResponse;
  const detail = lastError instanceof Error ? lastError.message : "unknown network failure";
  throw new Error(`Acoustic upload could not reach the analysis service after ${MAX_FETCH_ATTEMPTS} attempts: ${detail}`);
}

async function serializeUpload<T>(task: () => Promise<T>): Promise<T> {
  const previous = uploadQueue;
  let release: () => void = () => undefined;
  uploadQueue = new Promise<void>((resolve) => {
    release = resolve;
  });

  await previous;
  try {
    return await task();
  } finally {
    release();
  }
}

export async function analyzeAudioOnServer(args: {
  blob: Blob;
  scanId: string;
  captureId: string;
  captureKind: CanonicalCaptureKind;
  durationMs?: number;
}): Promise<CanonicalAcousticAnalysis> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("A signed-in session is required for server acoustic analysis.");
  const wav = await decodeToMonoWav(args.blob);
  const form = new FormData();
  form.append("file", wav.blob, `${args.captureId}.wav`);
  form.append("scan_id", args.scanId);
  form.append("source_capture_id", args.captureId);
  form.append("capture_kind", args.captureKind);
  form.append("device_metadata", JSON.stringify({
    browserSampleRate: wav.sourceSampleRate,
    canonicalSampleRate: wav.canonicalSampleRate,
    browserChannelCount: wav.channelCount,
    originalBlobType: args.blob.type,
    originalBlobSize: args.blob.size,
    canonicalBlobSize: wav.blob.size,
    captureDurationMs: args.durationMs ?? null,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
  }));

  const response = await serializeUpload(() => postAcousticAnalysis(form, token));
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Server acoustic analysis failed with ${response.status}`);
  }
  const body = (await response.json()) as AcousticAnalysisResponse;
  return {
    schemaVersion: body.schema_version,
    authoritative: true,
    captureId: body.source_capture_id,
    captureKind: body.capture_kind,
    extractor: body.extractor,
    extractorVersion: body.extractor_version,
    quality: body.quality,
    confidence: body.confidence,
    storagePath: body.storage_path,
    retentionPolicy: body.retention_policy,
    measurements: body.features,
    vadSegments: body.vad_segments,
    metadata: body.metadata,
  };
}
