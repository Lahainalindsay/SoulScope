import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import TonePlayer from "../../components/TonePlayer";
import ChakraGlyph from "../../components/ChakraGlyph";
import { supabase } from "../../lib/supabaseClient";

type ScanRecord = {
  summary: {
    coreFrequency: number;
    coreChakra: string;
    missing: { chakra: string; note: string; range: number[] }[];
  };
  analysis?: {
    coreFrequency: number;
    coreNote: string;
    coreChakra: string;
    missing?: { range: string; chakra: string; note: string }[];
    suggestion?: { listen?: string[]; see?: string; breathe?: string };
  };
};

export default function ResultsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [scan, setScan] = useState<ScanRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || typeof id !== "string") return;

    const fetchScan = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.from("scans").select("result").eq("id", id).single();
      if (error) {
        setError(error.message);
        setScan(null);
      } else if (data?.result) {
        setScan(data.result as ScanRecord);
      } else {
        setError("Scan not found.");
      }
      setLoading(false);
    };

    fetchScan();
  }, [id]);

  const coreFrequency = useMemo(() => {
    if (!scan) return null;
    return scan.analysis?.coreFrequency ?? scan.summary.coreFrequency;
  }, [scan]);

  const coreChakra = useMemo(() => {
    if (!scan) return null;
    return scan.analysis?.coreChakra ?? scan.summary.coreChakra;
  }, [scan]);

  const missingList = useMemo(() => {
    if (!scan) return [];
    if (scan.analysis?.missing && scan.analysis.missing.length > 0) {
      return scan.analysis.missing.map((gap) => ({
        label: `${gap.chakra} (${gap.note}) — ${gap.range}`,
      }));
    }
    return scan.summary.missing.map((gap) => ({
      label: `${gap.chakra} (${gap.note}) — ${gap.range[0]}–${gap.range[1]} Hz`,
    }));
  }, [scan]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0c0a1b] to-[#12121e] text-white px-6 py-20">
      <div className="max-w-4xl mx-auto relative z-10 space-y-10">
        <h1 className="text-4xl font-serif text-center">SoulScope Scan Results</h1>

        {loading && <p className="text-center text-gray-400">Retrieving your resonance map…</p>}
        {error && <p className="text-center text-red-400">{error}</p>}

        {scan && (
          <>
            <section className="bg-white/5 p-6 rounded-lg text-center space-y-2">
              <h2 className="text-2xl text-yellow-300">🎯 Core Frequency</h2>
              <p className="text-xl font-mono">{coreFrequency} Hz</p>
              <p className="text-gray-400">
                Chakra alignment: <span className="text-cyan-400 font-semibold">{coreChakra}</span>
              </p>
              {coreFrequency && <TonePlayer frequency={coreFrequency} label="Core Tone" />}
              {coreChakra && <ChakraGlyph chakra={coreChakra} />}
            </section>

            <section className="bg-white/5 p-6 rounded-lg space-y-4">
              <h2 className="text-2xl text-cyan-300">📉 Missing Chakra Tones</h2>
              {missingList.length > 0 ? (
                <ul className="space-y-2">
                  {missingList.map((gap, index) => (
                    <li key={index} className="bg-white/10 px-4 py-2 rounded">
                      {gap.label}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400">All chakra frequency bands were present in your voice.</p>
              )}
            </section>

            <section className="bg-white/5 p-6 rounded-lg space-y-3">
              <h2 className="text-2xl text-pink-300">🌀 Integration Protocol</h2>
              {scan.analysis?.suggestion ? (
                <ul className="list-disc ml-6 space-y-2 text-sm text-gray-300">
                  {scan.analysis.suggestion.listen && (
                    <li>
                      <strong>Listen:</strong> {scan.analysis.suggestion.listen.join(", ")}
                    </li>
                  )}
                  {scan.analysis.suggestion.breathe && (
                    <li>
                      <strong>Breathe:</strong> {scan.analysis.suggestion.breathe}
                    </li>
                  )}
                  {scan.analysis.suggestion.see && (
                    <li>
                      <strong>See:</strong> {scan.analysis.suggestion.see}
                    </li>
                  )}
                </ul>
              ) : (
                <ul className="list-disc ml-6 space-y-2 text-sm text-gray-300">
                  <li>🎧 Listen to {coreFrequency} Hz daily for 5 minutes.</li>
                  <li>💨 Use 5-5-5 breath with a soft humming release.</li>
                  <li>👁️ Visualize your {coreChakra} chakra opening and radiating color.</li>
                </ul>
              )}
            </section>

            <div className="text-center">
              <button className="bg-gradient-to-r from-violet-500 to-cyan-500 px-6 py-3 rounded-full shadow-lg hover:scale-105 transition">
                Generate Deep SoulCode ($97)
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
