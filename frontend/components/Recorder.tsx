"use client";

import React, { useRef, useState } from "react";

type RecorderProps = {
  durationMs?: number;
  onComplete?: (blob: Blob) => void;
  onRecordingStateChange?: (recording: boolean) => void;
};

export const Recorder: React.FC<RecorderProps> = ({ durationMs = 15000, onComplete, onRecordingStateChange }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const startRecording = async () => {
    console.log("🎙 startRecording called");
    try {
      setError(null);
      setHasFinished(false);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      mediaRecorder.onerror = (event: any) => {
        console.error("MediaRecorder error", event);
        const message = event?.error?.message ?? event?.message ?? "Recorder error";
        setError(message);
        setIsRecording(false);
        setHasFinished(false);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        chunksRef.current = [];
        stream.getTracks().forEach((track) => track.stop());

        setIsRecording(false);
        setHasFinished(true);
        onRecordingStateChange?.(false);

        onComplete?.(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      onRecordingStateChange?.(true);

      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      }, durationMs);
    } catch (err) {
      console.error("startRecording error:", err);
      setError(err instanceof Error ? err.message : "Failed to access microphone");
      setIsRecording(false);
      setHasFinished(false);
      onRecordingStateChange?.(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button type="button" onClick={startRecording} disabled={isRecording} className="rounded-full border px-4 py-2">
        {isRecording ? "Listening…" : "Start scan"}
      </button>

      {isRecording && <p className="text-xs text-gray-500">Speak freely for 15 seconds…</p>}
      {hasFinished && !isRecording && <p className="text-xs text-emerald-500">Recording complete. Analyzing…</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};
