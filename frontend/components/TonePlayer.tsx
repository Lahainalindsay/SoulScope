import { useRef, useState } from "react";
import styles from "./TonePlayer.module.css";

type TonePlayerProps = {
  frequency: number;
  label?: string;
};

export default function TonePlayer({ frequency, label }: TonePlayerProps) {
  const [playing, setPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);

  const stopTone = () => {
    oscillatorRef.current?.stop();
    audioCtxRef.current?.close();
    oscillatorRef.current = null;
    audioCtxRef.current = null;
    setPlaying(false);
  };

  const startTone = () => {
    if (playing) return;
    const audioCtx = new AudioContext();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();

    audioCtxRef.current = audioCtx;
    oscillatorRef.current = oscillator;
    setPlaying(true);
    window.setTimeout(() => stopTone(), 5000);
  };

  return (
    <button className={styles.button} onClick={startTone} disabled={playing}>
      {playing ? "Playing..." : `Play ${label || `${frequency} Hz`}`}
    </button>
  );
}
