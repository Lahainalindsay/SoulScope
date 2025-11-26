"use client";

import React, { useState } from "react";

type ChakraTonePlayerProps = {
  chakra: string;
  frequency: number;
};

export default function ChakraTonePlayer({ chakra, frequency }: ChakraTonePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [oscillator, setOscillator] = useState<OscillatorNode | null>(null);

  const toggleTone = () => {
    if (isPlaying) {
      oscillator?.stop();
      oscillator?.disconnect();
      audioContext?.close();
      setAudioContext(null);
      setOscillator(null);
      setIsPlaying(false);
    } else {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.connect(gain).connect(ctx.destination);
      osc.start();

      setAudioContext(ctx);
      setOscillator(osc);
      setIsPlaying(true);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded border border-gray-700 bg-gray-900/50 px-4 py-2">
      <div>
        <p className="text-white font-medium">{chakra}</p>
        <p className="text-sm text-gray-400">Tone: {frequency} Hz</p>
      </div>
      <button
        onClick={toggleTone}
        className={`rounded px-3 py-1 text-sm text-white ${isPlaying ? "bg-red-500" : "bg-blue-500"}`}
      >
        {isPlaying ? "Stop" : "Play Tone"}
      </button>
    </div>
  );
}
