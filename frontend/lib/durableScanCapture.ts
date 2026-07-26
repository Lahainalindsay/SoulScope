import { GUIDED_SCAN_QUESTIONS } from "./scanProtocol";
import { supabase } from "./supabaseClient";
import { canonicalizeAudioBlob } from "./serverAcousticAnalysis";
import type { GuidedScanSubject } from "./guidedScanSession";

const CLOUD_SCAN_KEY = "soulscope.activeCloudScanId";
const CAPTURE_MAP_KEY = "soulscope.activeCloudCaptureMap";
const AUDIO_BUCKET = "scan-audio";

type CaptureMap = Record<string, { captureId: string; storagePath: string }>;

function readCaptureMap(): CaptureMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.sessionStorage.getItem(CAPTURE_MAP_KEY) ?? "{}") as CaptureMap;
  } catch {
    return {};
  }
}

function writeCaptureMap(map: CaptureMap) {
  window.sessionStorage.setItem(CAPTURE_MAP_KEY, JSON.stringify(map));
}

export function getActiveCloudScanId() {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(CLOUD_SCAN_KEY);
}

export function clearDurableScanState() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(CLOUD_SCAN_KEY);
  window.sessionStorage.removeItem(CAPTURE_MAP_KEY);
}

export async function ensureDurableScanSession(args: {
  startedAt: string;
  subject: GuidedScanSubject;
  expectedRecordingCount?: number;
}) {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session?.user) {
    throw new Error("A signed-in session is required to securely save this scan.");
  }
  const user = sessionData.session.user;
  let scanId = getActiveCloudScanId();
  if (!scanId) {
    scanId = crypto.randomUUID();
    window.sessionStorage.setItem(CLOUD_SCAN_KEY, scanId);
  }

  const { error } = await supabase.from("scan_sessions").upsert({
    id: scanId,
    user_id: user.id,
    subject_id: args.subject.subjectId,
    status: "processing",
    expected_recording_count: args.expectedRecordingCount ?? GUIDED_SCAN_QUESTIONS.length,
    valid_recording_count: 0,
    invalid_recording_count: 0,
    completion_ratio: 0,
    capture_quality: "limited",
    result_confidence: "exploratory",
    retry_recommended: false,
    engine_version: "soulscope-canonical-acoustic-v1",
    completeness_metadata: {},
    invalid_recording_reasons: [],
    warnings: [],
    started_at: args.startedAt,
  }, { onConflict: "id" });
  if (error) throw new Error(`Could not prepare durable scan session: ${error.message}`);
  return { scanId, user };
}

export async function persistDurableVoiceCapture(args: {
  stepIndex: number;
  blob: Blob;
  durationMs: number;
  startedAt: string;
  subject: GuidedScanSubject;
}) {
  const question = GUIDED_SCAN_QUESTIONS[args.stepIndex];
  if (!question) throw new Error("Unknown guided scan step.");

  const { scanId, user } = await ensureDurableScanSession({
    startedAt: args.startedAt,
    subject: args.subject,
  });

  const existingMap = readCaptureMap();
  const existing = existingMap[question.id];
  const captureId = existing?.captureId ?? crypto.randomUUID();
  const storagePath = `${user.id}/${scanId}/${question.id}.wav`;
  const wav = await canonicalizeAudioBlob(args.blob);

  const { error: uploadError } = await supabase.storage
    .from(AUDIO_BUCKET)
    .upload(storagePath, wav.blob, { contentType: "audio/wav", upsert: true });
  if (uploadError) throw new Error(`Could not securely save ${question.title}: ${uploadError.message}`);

  const { data: captureRow, error: captureError } = await supabase
    .from("sensor_captures")
    .upsert({
      id: captureId,
      scan_id: scanId,
      user_id: user.id,
      sensor_type: "voice",
      task_id: question.id,
      attempt_number: 1,
      status: "valid",
      quality: "limited",
      recorded_at: new Date().toISOString(),
      duration_seconds: args.durationMs / 1000,
      invalid_reasons: [],
      storage_bucket: AUDIO_BUCKET,
      storage_path: storagePath,
      analysis_status: "uploaded",
      analysis_error: null,
      metadata: {
        captureKind: question.captureKind,
        originalBlobType: args.blob.type,
        originalBlobSize: args.blob.size,
        canonicalBlobSize: wav.blob.size,
        sourceSampleRate: wav.sourceSampleRate,
        canonicalSampleRate: wav.canonicalSampleRate,
        browserChannelCount: wav.channelCount,
      },
    }, { onConflict: "scan_id,sensor_type,task_id,attempt_number" })
    .select("id,storage_path")
    .single();
  if (captureError || !captureRow) {
    throw new Error(`Audio was saved, but its capture record could not be written: ${captureError?.message ?? "unknown error"}`);
  }

  const nextMap = {
    ...existingMap,
    [question.id]: { captureId: captureRow.id as string, storagePath: captureRow.storage_path as string },
  };
  writeCaptureMap(nextMap);
  return { scanId, captureId: captureRow.id as string, storagePath: captureRow.storage_path as string };
}

export function getDurableCapture(questionId: string) {
  return readCaptureMap()[questionId] ?? null;
}
