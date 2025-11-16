import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import TonePlayer from "../../components/TonePlayer";
import ChakraGlyph from "../../components/ChakraGlyph";

const chakraFreqs: Record<string, number> = {
  Root: 264,
  Sacral: 288,
  "Solar Plexus": 320,
  Heart: 352,
  Throat: 396,
  "Third Eye": 432,
  Crown: 480,
};

export default function ResultsPage() {
  const router = useRouter();
  const { freq, chakra, missing } = router.query;
  const [missingChakras, setMissingChakras] = useState<string[]>([]);

  useEffect(() => {
    if (missing) {
      try {
        setMissingChakras(JSON.parse(missing as string));
      } catch {
        setMissingChakras([]);
      }
    }
  }, [missing]);

  const coreFrequency = useMemo(() => {
    const parsed = typeof freq === "string" ? parseInt(freq, 10) : NaN;
    return isNaN(parsed) ? null : parsed;
  }, [freq]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0c0a1b] to-[#12121e] text-white px-6 py-20">
      <div className="max-w-4xl mx-auto relative z-10">
        <h1 className="text-4xl font-serif mb-6 text-center">SoulScope Scan Results</h1>

        <section className="mb-12 bg-white/5 p-6 rounded-lg text-center">
          <h2 className="text-2xl mb-2 text-yellow-300">🎯 Core Frequency</h2>
          <p className="text-xl font-mono text-white">{freq} Hz</p>
          <p className="text-gray-400 mt-2">
            Chakra alignment: <span className="text-cyan-400 font-semibold">{chakra}</span>
          </p>
          {coreFrequency && <TonePlayer frequency={coreFrequency} label="Core Tone" />}
          {chakra && <ChakraGlyph chakra={chakra as string} />}
        </section>

        <section className="mb-12 bg-white/5 p-6 rounded-lg">
          <h2 className="text-2xl mb-2 text-pink-300">📉 Missing Chakra Tones</h2>
          {missingChakras.length > 0 ? (
            <ul className="space-y-2">
              {missingChakras.map((ch, i) => {
                const freqVal = chakraFreqs[ch] || null;
                return (
                  <li key={i} className="bg-white/10 px-4 py-2 rounded flex justify-between items-center">
                    <span>{ch}</span>
                    {freqVal && <TonePlayer frequency={freqVal} label={`${ch} Tone`} />}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-gray-400">All chakra tone ranges were present in your voice.</p>
          )}
        </section>

        <section className="bg-white/5 p-6 rounded-lg">
          <h2 className="text-2xl mb-2 text-green-300">🌀 Integration Protocol</h2>
          <ul className="list-disc ml-6 space-y-2 text-sm text-gray-300">
            <li>🎧 Listen to {freq} Hz daily for 5 mins</li>
            <li>💨 Use 5-5-5 breath with mantra on exhale</li>
            <li>👁️ Visualize your {chakra} chakra opening and radiating color</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
