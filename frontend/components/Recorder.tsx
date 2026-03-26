"use client";

import React, { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";
import { NOTE_ORDER } from "../lib/noteSystem";

export type RecorderSignalSample = {
  rms: number;
  dbfs: number;
  bandPercentages: Record<(typeof NOTE_ORDER)[number], number>;
};

type RecorderProps = {
  durationMs?: number;
  onComplete?: (blob: Blob) => void;
  onRecordingStateChange?: (isRecording: boolean) => void;
  hideTrigger?: boolean;
  onSignalSample?: (sample: RecorderSignalSample) => void;
};

export type RecorderHandle = {
  start: () => void;
  stop: () => void;
};

const LIVE_SIGNAL_GAIN = 3.2;

const Recorder = forwardRef<RecorderHandle, RecorderProps>(
  ({ durationMs, onComplete, onRecordingStateChange, hideTrigger = false, onSignalSample }, ref) => {
  const [isRecording, setIsRecording] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const stopSignalAnalysis = useCallback(() => {
    if (rafRef.current) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    try {
      sourceRef.current?.disconnect();
    } catch {}

    try {
      analyserRef.current?.disconnect();
    } catch {}

    sourceRef.current = null;
    analyserRef.current = null;

    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  const startSignalAnalysis = useCallback(
    (stream: MediaStream) => {
      if (!onSignalSample) return;

      const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      const audioContext = new AudioCtx();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();

      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0.85;

      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      sourceRef.current = source;

      const freqBuffer = new Uint8Array(analyser.frequencyBinCount);
      const timeBuffer = new Uint8Array(analyser.fftSize);

      const tick = () => {
        if (!analyserRef.current || !audioContextRef.current) return;

        analyser.getByteFrequencyData(freqBuffer);
        analyser.getByteTimeDomainData(timeBuffer);

        let sumSquares = 0;
        for (let i = 0; i < timeBuffer.length; i += 1) {
          const normalized = (timeBuffer[i] - 128) / 128;
          sumSquares += normalized * normalized;
        }
        const rms = Math.min(1, Math.sqrt(sumSquares / timeBuffer.length) * LIVE_SIGNAL_GAIN);
        const dbfs = 20 * Math.log10(Math.max(rms, 1e-8));

        const sampleRate = audioContext.sampleRate;
        const binCount = analyser.frequencyBinCount;
        const nyquist = sampleRate / 2;
        const energy = Object.fromEntries(NOTE_ORDER.map((note) => [note, 0])) as Record<(typeof NOTE_ORDER)[number], number>;

        for (let i = 1; i < freqBuffer.length; i += 1) {
          const frequency = (i / binCount) * nyquist;
          if (frequency < 85 || frequency > 1200) {
            continue;
          }

          const midi = Math.round(69 + 12 * Math.log2(Math.max(frequency, 1e-6) / 440));
          const note = NOTE_ORDER[((midi % 12) + 12) % 12];
          energy[note] += freqBuffer[i] ?? 0;
        }

        const totalEnergy = Object.values(energy).reduce((sum, value) => sum + value, 0) || 1;

        onSignalSample({
          rms,
          dbfs,
          bandPercentages: Object.fromEntries(
            NOTE_ORDER.map((note) => [note, (energy[note] / totalEnergy) * 100])
          ) as Record<(typeof NOTE_ORDER)[number], number>,
        });

        rafRef.current = window.requestAnimationFrame(tick);
      };

      rafRef.current = window.requestAnimationFrame(tick);
    },
    [onSignalSample]
  );

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setHasFinished(false);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      const mediaRecorder = new MediaRecorder(stream);
      startSignalAnalysis(stream);

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
        onRecordingStateChange?.(false);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        chunksRef.current = [];
        stream.getTracks().forEach((track) => track.stop());
        stopSignalAnalysis();

        setIsRecording(false);
        setHasFinished(true);
        onRecordingStateChange?.(false);

        onComplete?.(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      onRecordingStateChange?.(true);

      if (typeof durationMs === "number" && durationMs > 0) {
        setTimeout(() => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
          }
        }, durationMs);
      }
    } catch (err: any) {
      console.error("startRecording error:", err);
      setError(err?.message ?? "Failed to access microphone");
      setIsRecording(false);
      setHasFinished(false);
      onRecordingStateChange?.(false);
      stopSignalAnalysis();
    }
  }, [durationMs, onComplete, onRecordingStateChange, startSignalAnalysis, stopSignalAnalysis]);

  useImperativeHandle(
    ref,
    () => ({
      start: () => {
        if (!isRecording) {
          startRecording();
        }
      },
      stop: () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      },
    }),
    [isRecording, startRecording]
  );

  return (
    <div className="flex flex-col items-center gap-2">
      {!hideTrigger && (
        <button type="button" onClick={startRecording} disabled={isRecording} className="rounded-full border px-4 py-2">
          {isRecording ? "Listening…" : "Start scan"}
        </button>
      )}

      {isRecording && <p className="text-xs text-gray-500">Recording in progress…</p>}
      {hasFinished && !isRecording && <p className="text-xs text-emerald-500">Recording complete. Analyzing…</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
});

Recorder.displayName = "Recorder";

export default Recorder;
