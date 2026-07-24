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

function formatConfidence(value: number | null | undefined) {
  if (!Number.isFinite(value)) return "Emerging";
  return `${Math.round(Math.max(0, Math.min(1, value ?? 0)) * 100)}%`;
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
  }, [session?.user]);

  const latest = scans[0] ?? null;
  const signatureData = useMemo(() => buildSignatureData(latest), [latest]);
  const confidence = latest?.report?.canonicalPattern.confidence ?? latest?.report?.primaryPattern.confidence ?? null;

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
            <p className={styles.eyebrow}>Your Latest Resonance Scan</p>
          </header>

          {error ? <p className={styles.error}>{error}</p> : null}
          {loading ? <div className={styles.empty}>Opening your profile...</div> : null}

          {!loading ? (
            <section className={styles.section}>
              {latest ? (
                <div className={styles.resonance}>
                  <div className={styles.mapWrap}><ResonanceSignature data={signatureData} label="Latest Resonance Signature" /></div>
                  <div className={styles.reflection}>
                    <p className={styles.meta}>Pattern</p>
                    <h1 className={styles.title}>{latest.patternName}</h1>
                    <p className={styles.summary}>{latest.conciseSummary}</p>
                    <div className={styles.scanMetaGrid}>
                      <div>
                        <p className={styles.meta}>Resonance Signature</p>
                        <p>Recorded</p>
                      </div>
                      <div>
                        <p className={styles.meta}>Date</p>
                        <p>{formatDate(latest.createdAt)}</p>
                      </div>
                      <div>
                        <p className={styles.meta}>Confidence</p>
                        <p>{formatConfidence(confidence)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : <div className={styles.empty}><p>Your latest scan will appear here.</p></div>}
              <div className={styles.belowActions}>
                <Link href="/scan" className={styles.primary}>{latest ? "Begin New Scan" : "Begin First Resonance Scan"}</Link>
                {latest ? <Link href={`/results/${latest.scanId}`} className={styles.secondary}>View Full Reflection</Link> : null}
                {latest ? <Link href="/history" className={styles.secondary}>History</Link> : null}
              </div>
            </section>
          ) : null}

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
