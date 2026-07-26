import type { AcousticAnalysisResponse, CanonicalAcousticAnalysis, CanonicalCaptureKind } from "./acousticContract";
import { supabase } from "./supabaseClient";

const RAW_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, "");

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
    return {
      blob: interleaveToWav(mono, decoded.sampleRate),
      sampleRate: decoded.sampleRate,
      channelCount: decoded.numberOfChannels,
    };
  } finally {
    void context.close();
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
    browserSampleRate: wav.sampleRate,
    browserChannelCount: wav.channelCount,
    originalBlobType: args.blob.type,
    originalBlobSize: args.blob.size,
    captureDurationMs: args.durationMs ?? null,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
  }));
  const response = await fetch(`${API_BASE_URL}/api/acoustic/analyze`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
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
