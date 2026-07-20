"use client";

import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import ResonanceSignature, { type ResonanceSignatureDatum } from "../components/ResonanceSignature";
import { supabase } from "../lib/supabaseClient";
import { getScanHistoryViewModel, type ScanHistoryItemViewModel } from "../lib/data/v2/getScanHistoryViewModel";
import { getOwnProfile, normalizeProfileName, upsertOwnProfileName, type ProfileRow } from "../lib/data/v2/profileRepository";
import styles from "./Profile.module.css";

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function buildSignatureData(latest: ScanHistoryItemViewModel | null): ResonanceSignatureDatum[] {
  if (!latest?.scan || !latest.report) return [];
  const resonance = (latest.scan.noteEnergies ?? [])
    .filter((entry) => entry.note !== "G")
    .map((entry) => ({ id: `resonance:${entry.note}`, value: Math.max(0, Math.min(1, entry.score / 100)), weight: entry.status === "balanced" ? 0.72 : 1 }));
  const domains = (latest.report.domainResults ?? []).map((domain) => ({ id: `domain:${domain.title}`, value: Math.max(0, Math.min(1, domain.score / 100)), weight: 0.86 }));
  return [...resonance, ...domains];
}

export default function ProfilePage() {
  const session = useSession();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [scans, setScans] = useState<ScanHistoryItemViewModel[]>([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) return;
    void (async () => {
      setLoading(true);
      try {
        const [nextProfile, history] = await Promise.all([getOwnProfile(supabase), getScanHistoryViewModel(supabase, 1)]);
        setProfile(nextProfile);
        setNameInput(nextProfile?.display_name ?? "");
        setScans(history.items);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Could not open your personal space.");
      } finally {
        setLoading(false);
      }
    })();
  }, [session?.user?.id]);

  const latest = scans[0] ?? null;
  const signatureData = useMemo(() => buildSignatureData(latest), [latest]);
  const displayName = profile?.display_name?.trim();

  const saveName = async () => {
    try {
      const saved = await upsertOwnProfileName(supabase, nameInput);
      setProfile(saved);
      setNameInput(saved.display_name ?? "");
      setStatus("Name saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save your name.");
    }
  };

  return (
    <>
      <Head><title>Your SoulScope | SoulScope</title></Head>
      <main className={styles.page}>
        <div className={styles.shell}>
          <header className={styles.hero}>
            <div>
              <p className={styles.eyebrow}>Welcome back</p>
              <h1 className={styles.title}>{displayName || "Your personal SoulScope"}</h1>
              <p className={styles.lead}>Your current Resonance Signature, baseline, and account essentials in one calm space.</p>
            </div>
            <div className={styles.actions}>
              <Link href="/scan" className={styles.primary}>{latest ? "Start New Scan" : "Start Scan"}</Link>
              <Link href="/dashboard" className={styles.secondary}>Today</Link>
            </div>
          </header>

          {error ? <p className={styles.error}>{error}</p> : null}
          {loading ? <div className={styles.empty}>Opening your profile...</div> : null}

          {!loading ? (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <p className={styles.eyebrow}>Current Resonance Signature</p>
                <h2 className={styles.sectionTitle}>{latest ? latest.patternName : "Your first signature begins with a scan."}</h2>
              </div>
              {latest ? (
                <div className={styles.resonance}>
                  <div className={styles.mapWrap}><ResonanceSignature data={signatureData} label="Your current Resonance Signature" /></div>
                  <div className={styles.reflection}>
                    <p className={styles.meta}>{formatDate(latest.createdAt)}</p>
                    <h3>{latest.patternName}</h3>
                    <p>{latest.conciseSummary}</p>
                    <div><p className={styles.meta}>Current baseline</p><p>{latest.report?.baselineComparison?.overallSummary ?? "Your baseline will become clearer as more scans are completed."}</p></div>
                    <div><p className={styles.meta}>Member since</p><p>{session?.user?.created_at ? formatDate(session.user.created_at) : "—"}</p></div>
                  </div>
                </div>
              ) : <div className={styles.empty}><p>Your first Resonance Signature will appear here after a scan.</p><Link href="/scan" className={styles.primary}>Start Scan</Link></div>}
            </section>
          ) : null}

          <section className={styles.section}>
            <div className={styles.sectionHeader}><p className={styles.eyebrow}>Your Space</p><h2 className={styles.sectionTitle}>Where would you like to go?</h2></div>
            <div className={styles.notes}>
              <Link href="/history" className={styles.noteCard}><h3>View Scan History →</h3><p>See previous signatures and pattern movement over time.</p></Link>
              <Link href="/dashboard#daily-check-in" className={styles.noteCard}><h3>Journal →</h3><p>Open today’s check-in and add a private note.</p></Link>
              <a href="#account-settings" className={styles.noteCard}><h3>Account Settings →</h3><p>Update how SoulScope addresses you and review account details.</p></a>
            </div>
          </section>

          <details id="account-settings" className={styles.account}>
            <summary>Account Settings</summary>
            <div className={styles.accountBody}>
              <div className={styles.field}><label>Preferred name</label><input className={styles.input} value={nameInput} maxLength={50} onChange={(event) => setNameInput(normalizeProfileName(event.target.value))} /><button className={styles.secondary} onClick={saveName}>Save Name</button></div>
              <div><p className={styles.meta}>Email</p><p className={styles.email}>{session?.user?.email ?? ""}</p></div>
              <div><p className={styles.meta}>Member since</p><p>{session?.user?.created_at ? formatDate(session.user.created_at) : "—"}</p></div>
              <p className={styles.status}>{status}</p>
            </div>
          </details>
        </div>
      </main>
    </>
  );
}
