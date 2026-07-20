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

const LIVE_SIGNAL_GAIN = 1.4;

function preferredMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

const Recorder = forwardRef<RecorderHandle, RecorderProps>(
  ({ durationMs, onComplete, onRecordingStateChange, hideTrigger = false, onSignalSample }, ref) => {
    const [isRecording, setIsRecording] = useState(false);
    const [hasFinished, setHasFinished] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const streamRef = useRef<MediaStream | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const rafRef = useRef<number | null>(null);
    const stopTimeoutRef = useRef<number | null>(null);
    const isRecordingRef = useRef(false);

    const stopLiveAnalysis = useCallback(() => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      sourceRef.current?.disconnect();
      analyserRef.current?.disconnect();
      sourceRef.current = null;
      analyserRef.current = null;
      if (audioContextRef.current) {
        void audioContextRef.current.close();
        audioContextRef.current = null;
      }
    }, []);

    const cleanupStream = useCallback(() => {
      if (stopTimeoutRef.current !== null) {
        window.clearTimeout(stopTimeoutRef.current);
        stopTimeoutRef.current = null;
      }
      stopLiveAnalysis();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      mediaRecorderRef.current = null;
    }, [stopLiveAnalysis]);

    const emitLiveSignal = useCallback(() => {
      const analyser = analyserRef.current;
      const audioContext = audioContextRef.current;
      if (!analyser || !audioContext || !onSignalSample) return;

      const freqBuffer = new Uint8Array(analyser.frequencyBinCount);
      const timeBuffer = new Uint8Array(analyser.fftSize);

      const tick = () => {
        const liveAnalyser = analyserRef.current;
        const liveContext = audioContextRef.current;
        if (!liveAnalyser || !liveContext || !isRecordingRef.current) return;

        liveAnalyser.getByteFrequencyData(freqBuffer);
        liveAnalyser.getByteTimeDomainData(timeBuffer);

        let sumSquares = 0;
        for (let index = 0; index < timeBuffer.length; index += 1) {
          const normalized = ((timeBuffer[index] ?? 128) - 128) / 128;
          sumSquares += normalized * normalized;
        }
        const rms = Math.min(1, Math.sqrt(sumSquares / Math.max(timeBuffer.length, 1)) * LIVE_SIGNAL_GAIN);
        const dbfs = 20 * Math.log10(Math.max(rms, 1e-8));
        const energy = Object.fromEntries(NOTE_ORDER.map((note) => [note, 0])) as Record<
          (typeof NOTE_ORDER)[number],
          number
        >;
        const nyquist = liveContext.sampleRate / 2;

        for (let index = 1; index < freqBuffer.length; index += 1) {
          const frequency = (index / liveAnalyser.frequencyBinCount) * nyquist;
          if (frequency < 85 || frequency > 1200) continue;
          const midi = Math.round(69 + 12 * Math.log2(Math.max(frequency, 1e-6) / 440));
          const note = NOTE_ORDER[((midi % 12) + 12) % 12];
          energy[note] += freqBuffer[index] ?? 0;
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
    }, [onSignalSample]);

    const stopRecording = useCallback(() => {
      if (!isRecordingRef.current) return;
      isRecordingRef.current = false;
      setIsRecording(false);
      onRecordingStateChange?.(false);

      if (stopTimeoutRef.current !== null) {
        window.clearTimeout(stopTimeoutRef.current);
        stopTimeoutRef.current = null;
      }

      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.stop();
      } else {
        cleanupStream();
        setError("The microphone stopped before a recording could be saved. Please retry this response.");
      }
    }, [cleanupStream, onRecordingStateChange]);

    const startRecording = useCallback(async () => {
      if (isRecordingRef.current) return;

      try {
        setError(null);
        setHasFinished(false);
        chunksRef.current = [];

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
          },
        });
        streamRef.current = stream;

        const mimeType = preferredMimeType();
        const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) chunksRef.current.push(event.data);
        };

        recorder.onerror = () => {
          isRecordingRef.current = false;
          setIsRecording(false);
          setHasFinished(false);
          onRecordingStateChange?.(false);
          setError("The microphone recording was interrupted. Please retry this response.");
          cleanupStream();
        };

        recorder.onstop = () => {
          const chunks = chunksRef.current;
          const finalType = recorder.mimeType || chunks[0]?.type || "audio/webm";
          const blob = new Blob(chunks, { type: finalType });
          chunksRef.current = [];
          cleanupStream();

          if (blob.size < 1024) {
            setHasFinished(false);
            setError("The microphone did not return enough audio data. Please retry this response.");
            return;
          }

          setHasFinished(true);
          onComplete?.(blob);
        };

        isRecordingRef.current = true;
        setIsRecording(true);
        onRecordingStateChange?.(true);
        recorder.start(250);

        try {
          const AudioCtx = window.AudioContext ||
            (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
          if (AudioCtx && onSignalSample) {
            const audioContext = new AudioCtx();
            audioContextRef.current = audioContext;
            if (audioContext.state === "suspended") await audioContext.resume();
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 4096;
            analyser.smoothingTimeConstant = 0.85;
            source.connect(analyser);
            sourceRef.current = source;
            analyserRef.current = analyser;
            emitLiveSignal();
          }
        } catch (analysisError) {
          console.warn("Live microphone visualization unavailable; recording will continue.", analysisError);
        }

        if (typeof durationMs === "number" && durationMs > 0) {
          stopTimeoutRef.current = window.setTimeout(stopRecording, durationMs);
        }
      } catch (recordingError) {
        console.error("startRecording error:", recordingError);
        isRecordingRef.current = false;
        setIsRecording(false);
        setHasFinished(false);
        onRecordingStateChange?.(false);
        setError(recordingError instanceof Error ? recordingError.message : "Failed to access microphone");
        cleanupStream();
      }
    }, [cleanupStream, durationMs, emitLiveSignal, onComplete, onRecordingStateChange, onSignalSample, stopRecording]);

    useImperativeHandle(ref, () => ({
      start: () => { void startRecording(); },
      stop: stopRecording,
    }), [startRecording, stopRecording]);

    return (
      <div className="flex flex-col items-center gap-2">
        {!hideTrigger ? (
          <button type="button" onClick={() => void startRecording()} disabled={isRecording} className="rounded-full border px-4 py-2">
            {isRecording ? "Listening…" : "Start Scan"}
          </button>
        ) : null}
        {isRecording ? <p className="text-xs text-gray-500">Recording in progress…</p> : null}
        {hasFinished && !isRecording ? <p className="text-xs text-emerald-500">Recording complete. Analyzing…</p> : null}
        {error ? <p className="text-xs text-red-500">{error}</p> : null}
      </div>
    );
  }
);

Recorder.displayName = "Recorder";
export default Recorder;
