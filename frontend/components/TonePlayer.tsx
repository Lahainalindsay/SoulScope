import { useRef, useState } from "react";

type TonePlayerProps = {
  frequency: number;
  label?: string;
  durationMs?: number;
};

export default function TonePlayer({ frequency, label, durationMs = 5000 }: TonePlayerProps) {
  const [playing, setPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);

  const startTone = () => {
    if (playing) return;
    const audioCtx = new AudioContext();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    audioCtxRef.current = audioCtx;
    oscillatorRef.current = oscillator;
    setPlaying(true);
    setTimeout(() => stopTone(), durationMs);
  };

  const stopTone = () => {
    if (!playing) return;
    oscillatorRef.current?.stop();
    audioCtxRef.current?.close();
    oscillatorRef.current = null;
    audioCtxRef.current = null;
    setPlaying(false);
  };

  return (
    <button
      className="bg-cyan-700 px-4 py-2 rounded mt-2 hover:bg-cyan-500 transition disabled:opacity-40"
      onClick={startTone}
      disabled={playing}
    >
      {playing ? "Playing..." : `Play ${label || `${frequency} Hz`}`}
    </button>
  );
}
