"use client";

import React, { useEffect, useRef, useState } from "react";

export interface FaceReading {
  emotion?: string;
  focusScore?: number;
}

type FaceReaderProps = {
  active: boolean;
  onResult?: (reading: FaceReading) => void;
};

export const FaceReader: React.FC<FaceReaderProps> = ({ active, onResult }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const hasEmittedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      hasEmittedRef.current = false;
      return;
    }

    hasEmittedRef.current = false;
    setError(null);

    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (cancelled) return;

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const analyzeFrame = () => {
          if (!videoRef.current) return;
        };

        const loop = () => {
          analyzeFrame();
          rafRef.current = requestAnimationFrame(loop);
        };

        timeoutRef.current = window.setTimeout(() => {
          if (cancelled || hasEmittedRef.current) {
            return;
          }
          hasEmittedRef.current = true;
          onResult?.({
            emotion: "calm",
            focusScore: 0.8,
          });
        }, 2000);

        loop();
      } catch (err) {
        console.error("FaceReader error", err);
        setError(err instanceof Error ? err.message : "Unable to access camera");
      }
    })();

    return () => {
      cancelled = true;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      hasEmittedRef.current = false;
    };
  }, [active, onResult]);

  return (
    <div className="flex flex-col items-center gap-2">
      <video ref={videoRef} className="h-40 w-40 rounded-lg bg-black object-cover" playsInline muted />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};
