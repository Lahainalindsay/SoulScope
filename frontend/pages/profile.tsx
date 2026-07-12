"use client";

import Head from "next/head";
import Link from "next/link";
import { useUser } from "@supabase/auth-helpers-react";

export default function ProfilePage() {
  const user = useUser();

  return (
    <>
      <Head>
        <title>Profile | SoulScope</title>
      </Head>
      <main style={{ width: "100%", minHeight: "calc(100dvh - 64px)", padding: "clamp(24px, 6vw, 72px) 16px calc(48px + env(safe-area-inset-bottom))" }}>
        <section style={{ width: "min(100%, 720px)", margin: "0 auto", padding: "clamp(22px, 5vw, 40px)", borderRadius: 24, border: "1px solid rgba(255,255,255,.09)", background: "rgba(8,18,34,.78)" }}>
          <p style={{ margin: "0 0 10px", color: "rgba(103,232,249,.85)", fontSize: 12, letterSpacing: ".18em", textTransform: "uppercase" }}>Profile</p>
          <h1 style={{ margin: 0, fontSize: "clamp(2rem, 8vw, 3.5rem)", lineHeight: 1 }}>Your SoulScope account</h1>
          <p style={{ margin: "20px 0 0", color: "rgba(226,232,240,.78)", overflowWrap: "anywhere" }}>
            {user?.email ?? "Your account details will appear here when you are signed in."}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))", gap: 12, marginTop: 28 }}>
            <Link href="/dashboard" style={{ minHeight: 48, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 18px", borderRadius: 999, background: "linear-gradient(135deg,#67e8f9,#34d399)", color: "#031019", textDecoration: "none", fontWeight: 700 }}>Today</Link>
            <Link href="/history" style={{ minHeight: 48, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 18px", borderRadius: 999, border: "1px solid rgba(255,255,255,.12)", color: "#fff", textDecoration: "none" }}>Pattern History</Link>
          </div>
        </section>
      </main>
    </>
  );
}
