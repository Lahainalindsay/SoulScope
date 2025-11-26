"use client";

import { useEffect, useState } from "react";
import ChakraVisual, { ChakraVisualData } from "../../components/ChakraVisual";
import ChakraTonePlayer from "../../components/ChakraTonePlayer";
import { mapFrequenciesToChakras } from "../../lib/mapFrequenciesToChakras";
import { analyzeChakras, ChakraInterpretation } from "../../lib/interpreters/analyzeChakras";
import { getLatestScan } from "../../lib/data/scanAPI";

const chakraFreqs: Record<string, number> = {
  Root: 256,
  Sacral: 288,
  "Solar Plexus": 320,
  Heart: 341,
  Throat: 384,
  "Third Eye": 426.7,
  Crown: 480,
};

function getFreqForChakra(name: string) {
  return chakraFreqs[name] ?? 432;
}

export default function ResultsPage() {
  const [chakraData, setChakraData] = useState<ChakraVisualData | null>(null);
  const [analysis, setAnalysis] = useState<ChakraInterpretation[]>([]);
  const [statusMessage, setStatusMessage] = useState("Loading your energetic signature...");

  useEffect(() => {
    async function loadData() {
      const scan = await getLatestScan();
      if (!scan) {
        setStatusMessage("No scans found. Complete a Soul Resonance scan to unlock insights.");
        return;
      }
      if (!scan.fftData || scan.fftData.length === 0) {
        setStatusMessage("We couldn't find frequency data for your last scan.");
        return;
      }
      const mapped = mapFrequenciesToChakras(scan.fftData, scan.sampleRate ?? 22050);
      setChakraData(mapped);
      setAnalysis(analyzeChakras(mapped));
      setStatusMessage("");
    }
    loadData();
  }, []);

  if (!chakraData) {
    return <p className="mt-20 text-center text-white">{statusMessage}</p>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#020205] via-[#0d091c] to-[#120b24] px-6 py-16 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-center text-3xl font-serif tracking-wide text-amber-200">Your Chakra Scan Results</h1>
        <p className="mt-2 text-center text-sm text-gray-300">Decoded from your most recent SoulScope voice scan.</p>

        <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6">
          <ChakraVisual data={chakraData} />
        </div>

        <div className="mt-12 space-y-6">
          {analysis.map((chakra, index) => (
            <div key={`${chakra.chakra}-${index}`} className="rounded-3xl border border-white/5 bg-black/40 p-5 shadow-xl shadow-amber-500/5">
              <h2 className="text-xl font-semibold text-[gold]">
                {chakra.chakra} Chakra — <span className="capitalize">{chakra.state}</span>
              </h2>
              <p className="mt-1 text-sm text-gray-200 italic">{chakra.message}</p>
              <ul className="mt-3 space-y-1 text-sm text-gray-100">
                <li>
                  <strong>Tone:</strong> {chakra.remedy.tone}
                </li>
                <li>
                  <strong>Breath Practice:</strong> {chakra.remedy.breath}
                </li>
                <li>
                  <strong>Movement:</strong> {chakra.remedy.practice}
                </li>
                <li>
                  <strong>Affirmation:</strong> “{chakra.remedy.affirmation}”
                </li>
              </ul>
              <div className="mt-4">
                <ChakraTonePlayer chakra={chakra.chakra} frequency={getFreqForChakra(chakra.chakra)} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
