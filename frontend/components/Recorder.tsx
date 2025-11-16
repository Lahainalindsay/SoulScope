import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const chakraMap = [
  { name: "Root", range: [256, 270], note: "C" },
  { name: "Sacral", range: [285, 300], note: "D" },
  { name: "Solar Plexus", range: [320, 340], note: "E" },
  { name: "Heart", range: [345, 365], note: "F" },
  { name: "Throat", range: [385, 410], note: "G" },
  { name: "Third Eye", range: [430, 450], note: "A" },
  { name: "Crown", range: [480, 500], note: "B" },
];

export default function Recorder() {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyzerRef = useRef<any>(null);

  const spectrumSum = useRef<number[]>([]);
  const frameCount = useRef(0);
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    return () => {
      analyzerRef.current?.stop();
      audioContextRef.current?.close();
    };
  }, []);

  const startRecording = async () => {
    if (!isClient) return;
    const { default: Meyda } = await import("meyda");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContextRef.current = new AudioContext();
    sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);

    spectrumSum.current = [];
    frameCount.current = 0;

    mediaRecorderRef.current = new MediaRecorder(stream);
    mediaRecorderRef.current.ondataavailable = (event) => audioChunks.current.push(event.data);
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(audioChunks.current, { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      setAudioURL(url);
      audioChunks.current = [];
    };

    analyzerRef.current = Meyda.createMeydaAnalyzer({
      audioContext: audioContextRef.current,
      source: sourceRef.current,
      bufferSize: 512,
      featureExtractors: ["amplitudeSpectrum"],
      callback: (features: any) => {
        const spectrum = features.amplitudeSpectrum;
        if (!spectrum) return;
        if (spectrumSum.current.length === 0) {
          spectrumSum.current = new Array(spectrum.length).fill(0);
        }
        for (let i = 0; i < spectrum.length; i++) {
          spectrumSum.current[i] += spectrum[i];
        }
        frameCount.current++;
      },
    });

    analyzerRef.current.start();
    mediaRecorderRef.current.start();
    setRecording(true);
  };

  const stopRecording = async () => {
    const sampleRate = audioContextRef.current?.sampleRate || 44100;

    analyzerRef.current?.stop();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      await audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    setRecording(false);

    const averaged = spectrumSum.current.map((sum) => sum / Math.max(frameCount.current, 1));
    const peakIndex = averaged.indexOf(Math.max(...averaged));
    const nyquist = sampleRate / 2;
    const freqResolution = nyquist / averaged.length;
    const coreFreq = peakIndex * freqResolution;

    const missing = chakraMap.filter(({ range }) => {
      const start = Math.floor(range[0] / freqResolution);
      const end = Math.ceil(range[1] / freqResolution);
      const power = averaged.slice(start, end).reduce((a, b) => a + b, 0);
      return power <= 1;
    });

    const coreChakra = chakraMap.find(({ range }) => coreFreq >= range[0] && coreFreq <= range[1]);

    const summary = {
      coreFrequency: Math.round(coreFreq),
      coreChakra: coreChakra?.name || "Unknown",
      missing: missing.map((item) => ({
        chakra: item.name,
        note: item.note,
        range: item.range,
      })),
    };
    setResult(summary);

    try {
      setLoadingAnalysis(true);
      setAnalysisError(null);
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(summary),
      });
      if (!response.ok) {
        throw new Error("Failed to analyze audio");
      }
      const data = await response.json();
      setAnalysis(data);

      const { data: { user } } = await supabase.auth.getUser();
      let scanId: string | null = null;
      if (user) {
        const { data: inserted, error } = await supabase
          .from("scans")
          .insert({
            user_id: user.id,
            result: {
              summary,
              analysis: data,
            },
          })
          .select("id")
          .single();
        if (!error && inserted) {
          scanId = inserted.id;
        }
      }

      if (scanId) {
        router.push(`/results/${scanId}`);
      } else {
        router.push({
          pathname: "/results",
          query: {
            freq: summary.coreFrequency,
            chakra: summary.coreChakra,
            missing: JSON.stringify(summary.missing?.map((m) => m.chakra).filter(Boolean) ?? []),
          },
        });
      }
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : "Analysis failed");
      setAnalysis(null);
      router.push({
        pathname: "/results",
        query: {
          freq: summary.coreFrequency,
          chakra: summary.coreChakra,
          missing: JSON.stringify(summary.missing?.map((m) => m.chakra).filter(Boolean) ?? []),
        },
      });
    } finally {
      setLoadingAnalysis(false);
    }
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      {!recording ? (
        <button onClick={startRecording} className="px-6 py-3 bg-cyan-600 rounded-full">
          Start Recording
        </button>
      ) : (
        <button onClick={stopRecording} className="px-6 py-3 bg-red-600 rounded-full">
          Stop Recording
        </button>
      )}

      {audioURL && (
        <div className="mt-4">
          <audio controls src={audioURL} />
        </div>
      )}

      {result && (
        <div className="mt-6 bg-gray-800 p-4 rounded-lg w-full max-w-md">
          <h3 className="text-xl font-semibold mb-2 text-yellow-400">🧠 Core Frequency</h3>
          <p>
            {result.coreFrequency} Hz — Chakra: {result.coreChakra}
          </p>

          <h4 className="text-lg font-semibold mt-4 text-blue-300">⚠️ Missing Chakra Tones</h4>
          <ul className="list-disc list-inside text-sm mt-1">
            {result.missing.map((m: any, i: number) => (
              <li key={i}>
                {m.chakra} ({m.note}) — {m.range[0]}–{m.range[1]} Hz
              </li>
            ))}
          </ul>
        </div>
      )}

      {loadingAnalysis && <p className="text-sm text-gray-400">Analyzing spectrum...</p>}
      {analysisError && <p className="text-sm text-red-400">{analysisError}</p>}

      {analysis && (
        <div className="mt-6 bg-gray-900 p-4 rounded-lg w-full max-w-md space-y-3">
          <div>
            <h4 className="text-lg font-semibold text-cyan-300">🔊 Harmonic Center</h4>
            <p className="text-sm">
              {analysis.coreFrequency} Hz — {analysis.coreNote} ({analysis.coreChakra})
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-blue-300">📉 Harmonic Gaps</h4>
            <ul className="list-disc list-inside text-sm">
              {analysis.missing?.map((gap: any, index: number) => (
                <li key={index}>
                  {gap.range} — {gap.chakra} ({gap.note})
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-purple-300">🌀 Integration Protocol</h4>
            <ul className="list-disc list-inside text-sm">
              <li><strong>Listen:</strong> {analysis.suggestion?.listen?.join(", ")}</li>
              <li><strong>See:</strong> {analysis.suggestion?.see}</li>
              <li><strong>Breathe:</strong> {analysis.suggestion?.breathe}</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
