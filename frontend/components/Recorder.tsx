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

function mergeBuffers(buffers: Float32Array[], totalLength: number) {
  const merged = new Float32Array(totalLength);
  let offset = 0;

  buffers.forEach((buffer) => {
    merged.set(buffer, offset);
    offset += buffer.length;
  });

  return merged;
}

function encodeWav(samples: Float32Array, sampleRate: number) {
  const bytesPerSample = 2;
  const blockAlign = bytesPerSample;
  const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
  const view = new DataView(buffer);

  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + samples.length * bytesPerSample, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, samples.length * bytesPerSample, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, samples[i] ?? 0));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += bytesPerSample;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

const Recorder = forwardRef<RecorderHandle, RecorderProps>(
  ({ durationMs, onComplete, onRecordingStateChange, hideTrigger = false, onSignalSample }, ref) => {
    const [isRecording, setIsRecording] = useState(false);
    const [hasFinished, setHasFinished] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const rafRef = useRef<number | null>(null);
    const pcmChunksRef = useRef<Float32Array[]>([]);
    const pcmLengthRef = useRef(0);
    const stopTimeoutRef = useRef<number | null>(null);
    const isRecordingRef = useRef(false);
    const sampleRateRef = useRef(48000);

    const cleanup = useCallback(() => {
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      if (stopTimeoutRef.current) {
        window.clearTimeout(stopTimeoutRef.current);
        stopTimeoutRef.current = null;
      }

      processorRef.current?.disconnect();
      sourceRef.current?.disconnect();
      analyserRef.current?.disconnect();
      streamRef.current?.getTracks().forEach((track) => track.stop());

      processorRef.current = null;
      sourceRef.current = null;
      analyserRef.current = null;
      streamRef.current = null;

      if (audioContextRef.current) {
        void audioContextRef.current.close();
        audioContextRef.current = null;
      }
    }, []);

    const emitLiveSignal = useCallback(() => {
      const analyser = analyserRef.current;
      const audioContext = audioContextRef.current;
      if (!analyser || !audioContext || !onSignalSample) return;

      const freqBuffer = new Uint8Array(analyser.frequencyBinCount);
      const timeBuffer = new Uint8Array(analyser.fftSize);

      const tick = () => {
        const liveAnalyser = analyserRef.current;
        const liveContext = audioContextRef.current;
        if (!liveAnalyser || !liveContext) return;

        liveAnalyser.getByteFrequencyData(freqBuffer);
        liveAnalyser.getByteTimeDomainData(timeBuffer);

        let sumSquares = 0;
        for (let i = 0; i < timeBuffer.length; i += 1) {
          const normalized = (timeBuffer[i] - 128) / 128;
          sumSquares += normalized * normalized;
        }
        const rms = Math.min(1, Math.sqrt(sumSquares / timeBuffer.length) * LIVE_SIGNAL_GAIN);
        const dbfs = 20 * Math.log10(Math.max(rms, 1e-8));

        const sampleRate = liveContext.sampleRate;
        const binCount = liveAnalyser.frequencyBinCount;
        const nyquist = sampleRate / 2;
        const energy = Object.fromEntries(NOTE_ORDER.map((note) => [note, 0])) as Record<
          (typeof NOTE_ORDER)[number],
          number
        >;

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
    }, [onSignalSample]);

    const stopRecording = useCallback(() => {
      if (!isRecordingRef.current) return;

      isRecordingRef.current = false;
      setIsRecording(false);
      setHasFinished(true);
      onRecordingStateChange?.(false);

      const merged = mergeBuffers(pcmChunksRef.current, pcmLengthRef.current);
      const blob = encodeWav(merged, sampleRateRef.current);

      cleanup();
      pcmChunksRef.current = [];
      pcmLengthRef.current = 0;

      onComplete?.(blob);
    }, [cleanup, onComplete, onRecordingStateChange]);

    const startRecording = useCallback(async () => {
      try {
        setError(null);
        setHasFinished(false);
        pcmChunksRef.current = [];
        pcmLengthRef.current = 0;

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            channelCount: 1,
            sampleRate: 48000,
            sampleSize: 16,
          },
        });

        const AudioCtx =
          window.AudioContext ||
          (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

        if (!AudioCtx) {
          throw new Error("This browser does not support audio capture.");
        }

        const audioContext = new AudioCtx({ sampleRate: 48000 });
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        const processor = audioContext.createScriptProcessor(4096, 1, 1);

        analyser.fftSize = 4096;
        analyser.smoothingTimeConstant = 0.85;

        source.connect(analyser);
        source.connect(processor);
        processor.connect(audioContext.destination);

        processor.onaudioprocess = (event) => {
          if (!isRecordingRef.current) return;

          const input = event.inputBuffer.getChannelData(0);
          const copy = new Float32Array(input.length);
          copy.set(input);
          pcmChunksRef.current.push(copy);
          pcmLengthRef.current += copy.length;
        };

        streamRef.current = stream;
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        sourceRef.current = source;
        processorRef.current = processor;
        sampleRateRef.current = audioContext.sampleRate;
        isRecordingRef.current = true;

        setIsRecording(true);
        onRecordingStateChange?.(true);
        emitLiveSignal();

        if (typeof durationMs === "number" && durationMs > 0) {
          stopTimeoutRef.current = window.setTimeout(() => {
            stopRecording();
          }, durationMs);
        }
      } catch (err: any) {
        console.error("startRecording error:", err);
        setError(err?.message ?? "Failed to access microphone");
        setIsRecording(false);
        setHasFinished(false);
        onRecordingStateChange?.(false);
        cleanup();
      }
    }, [cleanup, durationMs, emitLiveSignal, onRecordingStateChange, stopRecording]);

    useImperativeHandle(
      ref,
      () => ({
        start: () => {
          if (!isRecordingRef.current) {
            void startRecording();
          }
        },
        stop: () => {
          stopRecording();
        },
      }),
      [startRecording, stopRecording]
    );

    return (
      <div className="flex flex-col items-center gap-2">
        {!hideTrigger && (
          <button
            type="button"
            onClick={() => void startRecording()}
            disabled={isRecording}
            className="rounded-full border px-4 py-2"
          >
            {isRecording ? "Listening…" : "Start Scan"}
          </button>
        )}

        {isRecording && <p className="text-xs text-gray-500">Recording in progress…</p>}
        {hasFinished && !isRecording && <p className="text-xs text-emerald-500">Recording complete. Analyzing…</p>}
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

Recorder.displayName = "Recorder";

export default Recorder;
