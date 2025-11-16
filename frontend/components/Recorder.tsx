import { useEffect, useRef, useState } from "react";

export default function Recorder() {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyzerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      analyzerRef.current?.stop();
      audioContextRef.current?.close();
    };
  }, []);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContextRef.current = new AudioContext();
    sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);

    mediaRecorderRef.current = new MediaRecorder(stream);
    mediaRecorderRef.current.ondataavailable = (event) => audioChunks.current.push(event.data);
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(audioChunks.current, { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      setAudioURL(url);
      audioChunks.current = [];
    };

    const { default: Meyda } = await import("meyda");
    analyzerRef.current = Meyda.createMeydaAnalyzer({
      audioContext: audioContextRef.current,
      source: sourceRef.current,
      bufferSize: 512,
      featureExtractors: ["amplitudeSpectrum"],
      callback: (features: any) => {
        const spectrum = features.amplitudeSpectrum;
        if (!spectrum) return;
        const peakIndex = spectrum.indexOf(Math.max(...spectrum));
        const nyquist = audioContextRef.current!.sampleRate / 2;
        const freqResolution = nyquist / spectrum.length;
        const dominantFreq = peakIndex * freqResolution;
        console.log("Dominant Frequency:", Math.round(dominantFreq), "Hz");
      },
    });

    analyzerRef.current.start();
    mediaRecorderRef.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    analyzerRef.current?.stop();
    mediaRecorderRef.current?.stop();
    audioContextRef.current?.close();
    setRecording(false);
  };

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
    </div>
  );
}
