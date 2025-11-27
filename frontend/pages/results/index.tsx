"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Navbar from "../../components/Navbar";

type ScanResult = {
  chakraScores: Record<string, number>;
  summary: string;
  face?: {
    emotion: string;
    focusScore: number;
  };
};

const supabase = createClientComponentClient();

export default function ResultsPage() {
  const [latest, setLatest] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData?.user) {
          setError("Please sign in to view your results.");
          return;
        }

        const user = userData.user;

        const { data, error: scanError } = await supabase
          .from("scans")
          .select("result")
          .eq("user_id", user.id)
          .order("id", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (scanError) {
          console.error("Error fetching scan from Supabase", scanError);
          setError("Could not load your latest scan.");
          return;
        }

        if (!data) {
          setLatest(null);
          return;
        }

        setLatest(data.result as ScanResult);
      } catch (err) {
        console.error("Fatal error loading results", err);
        setError("Something went wrong loading your results.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50">
        <main className="mx-auto max-w-5xl px-4 py-16">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Your SoulScope Results</h1>
          <p className="mb-8 text-slate-300">Review your most recent core tone scan.</p>

          {loading && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">Loading your latest scan…</div>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-rose-700/60 bg-rose-950/40 p-6 text-rose-200">{error}</div>
          )}

          {!loading && !error && !latest && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              No scans found. Complete a Soul Resonance scan to unlock insights.
            </div>
          )}

          {!loading && !error && latest && (
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
              <h2 className="mb-2 text-lg font-semibold">{latest.summary}</h2>
              {latest.face && (
                <p className="mb-4 text-sm text-slate-300">
                  😊 Emotion: <span className="font-medium">{latest.face.emotion}</span> • 🎯 Focus:{" "}
                  <span className="font-medium">{Math.round((latest.face.focusScore ?? 0) * 100)}%</span>
                </p>
              )}

              <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
                {Object.entries(latest.chakraScores).map(([chakra, value]) => (
                  <div key={chakra} className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-3">
                    <div className="text-xs uppercase tracking-wide text-slate-400">{chakra.replace("_", " ")}</div>
                    <div className="mt-1 text-sm font-semibold">{Math.round(value * 100)}%</div>
                    <div className="mt-2 h-1.5 rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-pink-500 to-violet-500"
                        style={{ width: `${Math.round(value * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
