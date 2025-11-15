const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers =
    init.body && (!init.headers || !(init.headers as Record<string, string>)["Content-Type"])
      ? { "Content-Type": "application/json", ...init.headers }
      : init.headers;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

export type SensorKey = "heart" | "eda" | "breath";
export type SensorApiStatus = "idle" | "checking" | "stable";

export interface SensorSnapshot {
  status: SensorApiStatus;
  detail: string;
}

export interface SensorCheckResponse {
  ready: boolean;
  sensors: Record<SensorKey, SensorSnapshot>;
  preview: {
    heart_rate: number;
    hrv_rmssd: number;
    eda_drift: number;
    breath_rate?: number;
  };
}

export type PhaseId = "baseline" | "challenge" | "recovery";

export interface PhaseStartResponse {
  phase: PhaseId;
  duration_seconds: number;
  started_at: string;
  instructions: string;
}

export interface VoiceClipResponse {
  clip_id: string;
  status: "saved" | "error";
}

export interface CoreFrequencyApiResponse {
  core_index: number;
  body_resonance: number;
  soul_resonance: number;
  heart_mind_resonance: number;
  qualitative_label: string;
}

export function checkSensors() {
  return request<SensorCheckResponse>("/api/sensors/check", { method: "POST" });
}

export function startPhase(phase: PhaseId) {
  return request<PhaseStartResponse>(`/api/phases/${phase}/start`, {
    method: "POST",
  });
}

export function saveVoiceClip(promptLabel: string, script: string) {
  return request<VoiceClipResponse>("/api/voice-clips", {
    method: "POST",
    body: JSON.stringify({ prompt_label: promptLabel, script }),
  });
}

export function fetchCoreFrequencyResult() {
  return request<CoreFrequencyApiResponse>("/api/scan/finalize", {
    method: "POST",
  });
}

