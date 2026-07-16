"use client";

import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useUser } from "@supabase/auth-helpers-react";
import { supabase } from "../lib/supabaseClient";
import styles from "./Profile.module.css";

type ProfileSummary = {
  scansCompleted: number;
  preferredStyle: string;
  recentActivity: string;
};

function formatMemberSince(value?: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(new Date(value));
}

function formatActivity(value?: string | null) {
  if (!value) return "Your journey begins with your first scan.";
  return `Last scan ${new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value))}`;
}

export default function ProfilePage() {
  const user = useUser();
  const [summary, setSummary] = useState<ProfileSummary>({ scansCompleted: 0, preferredStyle: "Not established yet", recentActivity: "Your journey begins with your first scan." });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [scanResponse, preferenceResponse, recentResponse] = await Promise.all([
        supabase.from("scan_sessions").select("id", { count: "exact", head: true }).eq("user_id", user.id).in("status", ["completed", "partial"]),
        supabase.from("user_narrative_preferences").select("preferred_style").eq("user_id", user.id).maybeSingle(),
        supabase.from("scan_sessions").select("created_at").eq("user_id", user.id).in("status", ["completed", "partial"]).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);

      setSummary({
        scansCompleted: scanResponse.count ?? 0,
        preferredStyle: preferenceResponse.data?.preferred_style
          ? `${preferenceResponse.data.preferred_style.charAt(0).toUpperCase()}${preferenceResponse.data.preferred_style.slice(1)}`
          : "Not established yet",
        recentActivity: formatActivity(recentResponse.data?.created_at),
      });
    };
    void load();
  }, [user]);

  return (
    <>
      <Head>
        <title>Your Journey | SoulScope</title>
      </Head>
      <main className={styles.page}>
        <section className={styles.shell}>
          <header className={styles.hero}>
            <p className={styles.eyebrow}>Profile</p>
            <h1 className={styles.title}>Your Journey</h1>
            <p className={styles.lead}>A quiet record of the reflections you return to.</p>
          </header>

          <section className={styles.summaryGrid} aria-label="Journey summary">
            <article className={styles.summaryItem}>
              <p className={styles.label}>Member Since</p>
              <p className={styles.value}>{formatMemberSince(user?.created_at)}</p>
            </article>
            <article className={styles.summaryItem}>
              <p className={styles.label}>Scans Completed</p>
              <p className={styles.value}>{summary.scansCompleted}</p>
            </article>
            <article className={styles.summaryItem}>
              <p className={styles.label}>Preferred Reflection</p>
              <p className={styles.value}>{summary.preferredStyle}</p>
            </article>
          </section>

          <section className={styles.activity}>
            <p className={styles.label}>Recent Activity</p>
            <h2 className={styles.sectionTitle}>{summary.recentActivity}</h2>
          </section>

          <section className={styles.account}>
            <div>
              <p className={styles.label}>Account</p>
              <p className={styles.email}>{user?.email ?? "Sign in to view your account."}</p>
            </div>
            <div className={styles.actions}>
              <Link href="/dashboard" className={styles.primaryAction}>Today</Link>
              <Link href="/history" className={styles.secondaryAction}>Pattern History</Link>
              <Link href="/scan" className={styles.secondaryAction}>{summary.scansCompleted ? "Start New Scan" : "Start Scan"}</Link>
            </div>
          </section>
        </section>
      </main>
    </>
  );
}
