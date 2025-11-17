"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "../lib/supabaseClient";

const chakraData = [
  { name: "Root", range: [63, 250], color: "#B71C1C", meaning: "Grounding, survival, security" },
  { name: "Sacral", range: [250, 500], color: "#F57C00", meaning: "Creativity, sexuality, flow" },
  { name: "Solar Plexus", range: [500, 1000], color: "#FBC02D", meaning: "Confidence, identity, power" },
  { name: "Heart", range: [1000, 2000], color: "#388E3C", meaning: "Love, compassion, connection" },
  { name: "Throat", range: [2000, 4000], color: "#1976D2", meaning: "Truth, expression, authenticity" },
  { name: "Third Eye", range: [4000, 6000], color: "#512DA8", meaning: "Intuition, vision, inner knowing" },
  { name: "Crown", range: [6000, 8000], color: "#9C27B0", meaning: "Oneness, divine connection, surrender" },
];

function calculateSlice(
  minHz: number,
  maxHz: number,
  sampleRate: number,
  binCount: number
): [number, number] {
  const nyquist = sampleRate / 2;
  const hzPerBin = nyquist / binCount;
  const minIndex = Math.max(0, Math.floor(minHz / hzPerBin));
  const maxIndex = Math.min(binCount - 1, Math.ceil(maxHz / hzPerBin));
  return [minIndex, maxIndex];
}

export default function Recorder() {
  const session = useSession();
  const [recording, setRecording] = useState(false);
  const [chakraActivity, setChakraActivity] = useState<number[]>(Array(chakraData.length).fill(0));
  const [interpretation, setInterpretation] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recordingRef = useRef(false);

  const cleanupAudio = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    analyserRef.current?.disconnect();
    sourceRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    analyserRef.current = null;
    sourceRef.current = null;
    streamRef.current = null;
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const processFrequencies = () => {
    if (!analyserRef.current || !dataArrayRef.current || !audioContextRef.current) {
      return null;
    }

    analyserRef.current.getByteFrequencyData(dataArrayRef.current);

    const snapshot = chakraData.map((chakra) => {
      const [minIndex, maxIndex] = calculateSlice(
        chakra.range[0],
        chakra.range[1],
        audioContextRef.current!.sampleRate,
        analyserRef.current!.frequencyBinCount
      );
      const slice = dataArrayRef.current!.slice(minIndex, maxIndex + 1);
      if (slice.length === 0) return 0;
      return slice.reduce((sum, value) => sum + value, 0) / slice.length;
    });

    setChakraActivity(snapshot);
    return snapshot;
  };

  const startRecording = async () => {
    try {
      setError(null);
      setInterpretation([]);
      setStatusMessage(null);
      setChakraActivity(Array(chakraData.length).fill(0));

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);

      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      recordingRef.current = true;
      setRecording(true);
      intervalRef.current = setInterval(processFrequencies, 500);
      timeoutRef.current = setTimeout(() => stopRecording(), 15000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to access microphone");
      cleanupAudio();
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) {
      cleanupAudio();
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const snapshot = processFrequencies() ?? chakraActivity;
    cleanupAudio();
    recordingRef.current = false;
    setRecording(false);

    const weakIndices = snapshot
      .map((value, index) => ({ value, index }))
      .sort((a, b) => a.value - b.value)
      .slice(0, 2)
      .map((entry) => entry.index);

    const insights = weakIndices.map((index) =>
      `Your ${chakraData[index].name} chakra may be underactive. This can relate to: ${chakraData[index].meaning}.`
    );

    setInterpretation(insights);

    if (session?.user) {
      const { error: insertError } = await supabase.from("scans").insert({
        user_id: session.user.id,
        chakra_profile: snapshot,
        notes: insights,
      });
      setStatusMessage(insertError ? insertError.message : "Scan saved to your dashboard");
    } else {
      setStatusMessage("Create an account to save scans and view your dashboard");
    }
  };

  useEffect(() => {
    return () => cleanupAudio();
  }, []);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white shadow-2xl">
      <h2 className="text-xl font-semibold text-amber-300">Soul Resonance Scan</h2>
      <p className="mt-1 text-sm text-gray-300">Speak freely for 15 seconds. We map your live spectrum to chakra intensity.</p>

      <div className="mt-6 grid grid-cols-7 gap-3">
        {chakraData.map((chakra, index) => (
          <div key={chakra.name} className="flex flex-col items-center text-center text-xs" title={chakra.meaning}>
            <div
              className="h-12 w-12 rounded-full shadow-lg"
              style={{
                backgroundColor: chakra.color,
                opacity: Math.min((chakraActivity[index] || 0) / 120, 1),
                transition: "opacity 200ms ease",
              }}
            />
            <p className="mt-1 text-[11px] text-gray-200">{chakra.name}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-4">
        {recording ? (
          <button
            className="rounded-full bg-red-600 px-6 py-2 text-sm font-semibold text-white shadow hover:bg-red-500"
            onClick={stopRecording}
          >
            Stop Scan
          </button>
        ) : (
          <button
            className="rounded-full bg-gradient-to-r from-amber-300 to-orange-400 px-6 py-2 text-sm font-semibold text-black shadow hover:scale-105"
            onClick={startRecording}
          >
            Start Scan
          </button>
        )}
        <span className="text-xs text-gray-400">Auto-stops after 15 seconds</span>
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      {statusMessage && <p className="mt-2 text-xs text-gray-400">{statusMessage}</p>}

      {interpretation.length > 0 && (
        <div className="mt-6 rounded-xl border border-white/10 bg-black/30 p-4">
          <h3 className="text-base font-semibold text-amber-200">Insights</h3>
          <ul className="mt-2 list-disc space-y-2 pl-4 text-sm text-gray-200">
            {interpretation.map((message, index) => (
              <li key={`insight-${index}`}>{message}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
