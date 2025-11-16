import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import TonePlayer from "../../components/TonePlayer";
import ChakraGlyph from "../../components/ChakraGlyph";

type ScanResult = {
  summary?: {
    coreFrequency?: number;
    coreChakra?: string;
    missing?: { chakra: string; note: string; range: [number, number] }[];
  };
  analysis?: any;
};

const chakraFreqs: Record<string, number> = {
  Root: 264,
  Sacral: 288,
  "Solar Plexus": 320,
  Heart: 352,
  Throat: 396,
  "Third Eye": 432,
  Crown: 480,
};

export default function ResultDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scan, setScan] = useState<ScanResult | null>(null);

  useEffect(() => {
    const fetchScan = async () => {
      if (!id || typeof id !== "string") return;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const { data, error } = await supabase
        .from("scans")
        .select("result")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();
      if (error) {
        setError(error.message);
      } else {
        setScan(data?.result ?? null);
      }
      setLoading(false);
    };

    fetchScan();
  }, [id, router]);

  const coreFrequency = useMemo(() => {
    const value = scan?.summary?.coreFrequency;
    return typeof value === "number" ? value : null;
  }, [scan]);

  if (loading) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading scan...</div>;
  }

  if (error || !scan) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">{error ?? "Scan not found."}</div>;
  }

  const summary = scan.summary || {};
  const missing = summary.missing || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0c0a1b] to-[#12121e] text-white px-6 py-20">
      <div className="max-w-4xl mx-auto relative z-10">
        <h1 className="text-4xl font-serif mb-6 text-center">SoulScope Scan Results</h1>

        <section className="mb-12 bg-white/5 p-6 rounded-lg text-center">
          <h2 className="text-2xl mb-2 text-yellow-300">🎯 Core Frequency</h2>
          <p className="text-xl font-mono text-white">{summary.coreFrequency ?? "—"} Hz</p>
          <p className="text-gray-400 mt-2">
            Chakra alignment: <span className="text-cyan-400 font-semibold">{summary.coreChakra ?? "Unknown"}</span>
          </p>
          {coreFrequency && <TonePlayer frequency={coreFrequency} label="Core Tone" />}
          {summary.coreChakra && <ChakraGlyph chakra={summary.coreChakra} />}
        </section>

        <section className="mb-12 bg-white/5 p-6 rounded-lg">
          <h2 className="text-2xl mb-2 text-pink-300">📉 Missing Chakra Tones</h2>
          {missing.length > 0 ? (
            <ul className="space-y-2">
              {missing.map((gap, index) => {
                const freqVal = chakraFreqs[gap.chakra] || null;
                return (
                  <li key={index} className="bg-white/10 px-4 py-2 rounded flex justify-between items-center">
                    <span>
                      {gap.chakra} ({gap.note}) — {gap.range?.[0]}–{gap.range?.[1]} Hz
                    </span>
                    {freqVal && <TonePlayer frequency={freqVal} label={`${gap.chakra} Tone`} />}
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
            <li>🎧 Listen to {summary.coreFrequency ?? "your tone"} Hz daily for 5 mins</li>
            <li>💨 Use 5-5-5 breath with mantra on exhale</li>
            <li>👁️ Visualize your {summary.coreChakra ?? "core"} chakra opening and radiating color</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
