"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";

type Scan = {
  id: string;
  created_at: string;
  result: any;
};

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [scans, setScans] = useState<Scan[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error: scansError } = await supabase
        .from("scans")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (scansError) {
        setError(scansError.message);
      } else {
        setScans(data || []);
      }
      setLoading(false);
    };

    fetchData();
  }, [router]);

  if (loading) {
    return <div className="auth-shell"><div className="auth-card">Loading dashboard...</div></div>;
  }

  if (error) {
    return <div className="auth-shell"><div className="auth-card">Error: {error}</div></div>;
  }

  return (
    <div className="dashboard-shell">
      <div className="dashboard-card">
        <h1 className="auth-title">Your Core Frequency Dashboard</h1>
        <p className="auth-subtitle">Recent scans and insights tailored to your energy.</p>
        {scans.length === 0 ? (
          <p className="ss-text">
            No scans recorded yet. Start a session to see your personalized results.
          </p>
        ) : (
          <ul className="dashboard-list">
            {scans.map((scan) => (
              <li key={scan.id} className="dashboard-item">
                <strong>{new Date(scan.created_at).toLocaleString()}</strong>
                <pre>{JSON.stringify(scan.result, null, 2)}</pre>
              </li>
            ))}
          </ul>
        )}
        <button className="ss-btn-primary auth-submit" onClick={() => router.push("/")}>
          Start New Scan
        </button>
      </div>
    </div>
  );
}
