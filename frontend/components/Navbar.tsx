"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.email) setEmail(data.user.email);
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <nav
      style={{
        width: "100%",
        padding: "14px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "rgba(0,0,0,0.15)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <Link href="/" style={{ textDecoration: "none" }}>
        <h1
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "0.04em",
            background: "linear-gradient(90deg, #ec4899, #6366f1)",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          SoulScope™
        </h1>
      </Link>

      <div style={{ display: "flex", gap: 20, alignItems: "center", fontSize: 14 }}>
        <Link href="/scan" style={{ color: "#e5e7eb", textDecoration: "none" }}>
          Scan
        </Link>
        <Link href="/results" style={{ color: "#e5e7eb", textDecoration: "none" }}>
          Results
        </Link>
        <Link href="/how" style={{ color: "#e5e7eb", textDecoration: "none" }}>
          How It Works
        </Link>

        {email && (
          <button
            onClick={handleSignOut}
            style={{
              marginLeft: 12,
              padding: "6px 14px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.05)",
              color: "#f1f1f1",
              cursor: "pointer",
            }}
          >
            Sign Out
          </button>
        )}
      </div>
    </nav>
  );
}
