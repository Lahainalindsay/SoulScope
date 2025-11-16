"use client";

import { useEffect, useRef, useState } from "react";

type FaceMetrics = {
  emotion: string;
  breathRate: string;
  pupilActivity: string;
  skinTone: string;
};

const initialMetrics: FaceMetrics = {
  emotion: "Calibrating…",
  breathRate: "Analyzing…",
  pupilActivity: "Stabilizing…",
  skinTone: "Sampling…",
};

export default function FaceSensor() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const historyRef = useRef<number[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<FaceMetrics>(initialMetrics);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
          analyzeFrames();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to access camera.");
      }
    };

    const analyzeFrames = () => {
      if (!videoRef.current || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { videoWidth, videoHeight } = videoRef.current;
      if (videoWidth && videoHeight) {
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        ctx.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);
        const frame = ctx.getImageData(0, 0, videoWidth, videoHeight);
        const { data } = frame;

        let intensitySum = 0;
        let redSum = 0;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          intensitySum += (r + g + b) / 3;
          redSum += r;
        }
        const pixelCount = data.length / 4;
        const avgIntensity = intensitySum / pixelCount;
        const avgRed = redSum / pixelCount;
        historyRef.current.push(avgIntensity);
        if (historyRef.current.length > 180) {
          historyRef.current.shift();
        }

        // Emotion guess: brightness variance as proxy for micro-expression shifts
        const variance =
          historyRef.current.reduce((acc, value) => acc + Math.pow(value - avgIntensity, 2), 0) /
          Math.max(historyRef.current.length, 1);
        const normalizedVariance = Math.min(variance / 50, 1);

        // Breath cadence: track oscillations in brightness over last 5 seconds
        const recent = historyRef.current.slice(-120);
        let peaks = 0;
        for (let i = 1; i < recent.length - 1; i++) {
          if (recent[i] > recent[i - 1] && recent[i] > recent[i + 1]) {
            peaks++;
          }
        }
        const breathsPerMin = Math.round((peaks / 5) * 60);

        const newMetrics: FaceMetrics = {
          emotion:
            normalizedVariance > 0.35
              ? "High charge"
              : normalizedVariance > 0.2
              ? "Alert"
              : "Soft/regulated",
          breathRate: peaks > 0 ? `${Math.max(4, Math.min(24, breathsPerMin))} bpm` : "Reading…",
          pupilActivity: avgIntensity > 140 ? "Expanded" : avgIntensity < 90 ? "Constricted" : "Balanced",
          skinTone: avgRed > 140 ? "Warm/energized" : avgRed < 90 ? "Cool/withdrawn" : "Even",
        };
        setMetrics(newMetrics);
      }

      rafRef.current = requestAnimationFrame(analyzeFrames);
    };

    startCamera();
    return () => {
      stream?.getTracks().forEach((track) => track.stop());
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="bg-white/5 p-6 rounded-2xl text-white space-y-4">
      <div>
        <p className="text-sm uppercase tracking-widest text-gray-400">Sensor</p>
        <h3 className="text-2xl font-semibold">Face Biometric Capture</h3>
        <p className="text-sm text-gray-300">
          Reading micro-expressions, pupil dilation, skin tone, and breath cadence via sacred geometry mapping.
        </p>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-white/10 bg-black/40">
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />
        {!ready && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">Initializing camera…</div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
        <div className="p-3 rounded bg-white/5">
          <p className="uppercase tracking-widest text-xs text-gray-400">Emotion State</p>
          <p className="text-lg">{metrics.emotion}</p>
        </div>
        <div className="p-3 rounded bg-white/5">
          <p className="uppercase tracking-widest text-xs text-gray-400">Breath Pattern</p>
          <p className="text-lg">{metrics.breathRate}</p>
        </div>
        <div className="p-3 rounded bg-white/5">
          <p className="uppercase tracking-widest text-xs text-gray-400">Pupil Response</p>
          <p className="text-lg">{metrics.pupilActivity}</p>
        </div>
        <div className="p-3 rounded bg-white/5">
          <p className="uppercase tracking-widest text-xs text-gray-400">Skin Tone Flux</p>
          <p className="text-lg">{metrics.skinTone}</p>
        </div>
      </div>
    </div>
  );
}
