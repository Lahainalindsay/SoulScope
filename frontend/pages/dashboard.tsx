"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, useSessionContext } from "@supabase/auth-helpers-react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";

type Scan = {
  id: string;
  created_at: string;
  result: any;
};

export default function DashboardPage() {
  const router = useRouter();
  const session = useSession();
  const { isLoading: sessionLoading } = useSessionContext();
  const [loading, setLoading] = useState(true);
  const [scans, setScans] = useState<Scan[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user) return;
      const { data, error: scansError } = await supabase
        .from("scans")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (scansError) {
        setError(scansError.message);
      } else {
        setScans(data || []);
      }
      setLoading(false);
    };

    if (sessionLoading) return;
    if (!session) {
      router.push("/auth/login");
      return;
    }

    fetchData();
  }, [router, session, sessionLoading]);

  if (loading || sessionLoading) {
    return <div className="auth-shell"><div className="auth-card">Loading dashboard...</div></div>;
  }

  if (error) {
    return <div className="auth-shell"><div className="auth-card">Error: {error}</div></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0c0a1b] to-[#12121e] text-white px-6 py-16">
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 shadow-xl">
          <h1 className="text-3xl font-serif mb-2">Your Resonance Dashboard</h1>
          <p className="text-gray-300">
            View your core frequency, track chakra alignment, invite friends, and manage your subscription.
          </p>
          {session?.user?.email && (
            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-gray-400">
              Signed in as <span className="text-cyan-200 normal-case tracking-normal">{session.user.email}</span>
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
            <p className="text-xs uppercase tracking-widest text-gray-400">Core Frequency</p>
            <h2 className="text-3xl font-mono mt-2">{scans[0]?.result?.summary?.coreFrequency ?? "—"} Hz</h2>
            <p className="text-sm text-gray-400">Chakra: {scans[0]?.result?.summary?.coreChakra ?? "Unknown"}</p>
          </div>
          <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
            <p className="text-xs uppercase tracking-widest text-gray-400">Chakra Map</p>
            <p className="text-sm text-gray-400 mt-2">Visualize amplified vs dim centers from your latest scan.</p>
          </div>
          <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
            <p className="text-xs uppercase tracking-widest text-gray-400">Relationship Resonance</p>
            <p className="text-sm text-gray-400 mt-2">Invite a friend or partner to unlock bonus scans.</p>
          </div>
        </div>

        <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
          <p className="text-sm uppercase tracking-widest text-gray-400 mb-2">Recent Scans</p>
          {scans.length === 0 ? (
            <p className="text-gray-400">No scans yet. Start your first session.</p>
          ) : (
            <ul className="space-y-3">
              {scans.map((scan) => (
                <li key={scan.id} className="bg-white/10 px-4 py-3 rounded flex justify-between items-center">
                  <div>
                    <strong>{new Date(scan.created_at).toLocaleString()}</strong>
                    <p className="text-sm text-gray-400">
                      {scan.result?.summary?.coreChakra} — {scan.result?.summary?.coreFrequency} Hz
                    </p>
                  </div>
                  <button className="text-cyan-400 text-sm underline" onClick={() => router.push(`/results/${scan.id}`)}>
                    View
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-2">
            <h3 className="text-xl mb-2">Trust Your Tech</h3>
            <p className="text-sm text-gray-400">
              Your phone’s microphone, camera, and sensors capture signals as precisely as dedicated hardware. We process them with sacred geometry mapping and AI.
            </p>
            <Link href="/how-it-works" className="text-xs text-cyan-300 underline">
              See the full breakdown →
            </Link>
          </div>
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
            <h3 className="text-xl mb-2">Integration Plan</h3>
            <p className="text-sm text-gray-400">
              Personalized sound, breath, and visualization practices based on your current resonance.
            </p>
          </div>
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
            <h3 className="text-xl mb-2">Subscription Status</h3>
            <p className="text-sm text-gray-400">7-day trial active · Upgrade to unlock unlimited scans and relationship readings.</p>
          </div>
        </div>

        <div className="text-center">
          <button
            className="bg-gradient-to-r from-cyan-500 to-violet-600 px-6 py-3 rounded-full shadow-lg hover:scale-105 transition"
            onClick={() => router.push("/scan")}
          >
            Start New Scan
          </button>
        </div>
      </div>
    </div>
  );
}
