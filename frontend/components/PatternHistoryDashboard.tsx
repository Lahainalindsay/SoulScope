"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession, useSessionContext } from "@supabase/auth-helpers-react";
import { supabase } from "../lib/supabaseClient";
import { getLocalDevSession, LOCAL_SCAN_LIST_KEY } from "../lib/localSession";
import { buildSoulScopeReport } from "../lib/buildSoulScopeReport";
import { type NoteEnergyResult, type VoiceAnalysisResult } from "../lib/voiceSpectrum";
import { getScanHistoryViewModel } from "../lib/data/v2/getScanHistoryViewModel";
import ResonanceSignature, { type ResonanceSignatureDatum } from "./ResonanceSignature";
import HomeDailyCheckIn from "./HomeDailyCheckIn";
import styles from "../pages/History.module.css";

type ScanRow = {
  id?: string;
  created_at: string;
  result: VoiceAnalysisResult & {
    dominantBandLabel?: string;
    noteInterpretation?: { primaryNote?: string };
    noteEnergies?: NoteEnergyResult[];
  };
};

type DisplayStyle = "Direct" | "Supportive" | "Insight";

type HistoryEntry = {
  scan: ScanRow;
  report: ReturnType<typeof buildSoulScopeReport>;
  preferredStyle: DisplayStyle | null;
  conciseSummary: string;
};

function displayStyle(style: string | null): DisplayStyle | null {
  if (style === "direct") return "Direct";
  if (style === "supportive") return "Supportive";
  if (style === "insight") return "Insight";
  return null;
}

function formatScanDate(value?: string) {
  return value
    ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value))
    : "No scan recorded yet";
}

function formatScanTime(value?: string) {
  return value
    ? new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(value))
    : "";
}

function signatureData(entry: HistoryEntry | null): ResonanceSignatureDatum[] {
  if (!entry) return [];
  return [
    ...(entry.scan.result.noteEnergies ?? [])
      .filter((item) => item.note !== "G")
      .map((item) => ({
        id: `resonance:${item.note}`,
        value: Math.max(0, Math.min(1, item.score / 100)),
        weight: item.status === "balanced" ? 0.72 : 1,
      })),
    ...(entry.report.domainResults ?? []).map((domain) => ({
      id: `domain:${domain.title}`,
      value: Math.max(0, Math.min(1, domain.score / 100)),
      weight: 0.86,
    })),
  ];
}

function buildMovement(entries: HistoryEntry[]) {
  if (entries.length < 2) return [];
  const latest = entries[0].report.domainResults ?? [];
  const previous = new Map((entries[1].report.domainResults ?? []).map((domain) => [domain.title, domain.score]));
  return latest
    .map((domain) => {
      const before = previous.get(domain.title);
      if (typeof before !== "number") return null;
      const delta = domain.score - before;
      const amount = Math.abs(delta);
      const direction = amount < 4
        ? "remained close to your previous scan"
        : delta > 0
          ? "was more present than in your previous scan"
          : "was less present than in your previous scan";
      return { title: domain.title, direction, amount };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);
}

type PatternHistoryDashboardProps = { mode?: "dashboard" | "history" };

export default function PatternHistoryDashboard({ mode = "dashboard" }: PatternHistoryDashboardProps) {
  const isArchive = mode === "history";
  const session = useSession();
  const { isLoading: sessionLoading } = useSessionContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    const loadLocal = () => {
      const localSession = getLocalDevSession();
      if (!localSession) {
        setError("Please sign in to view your Resonance Timeline.");
        setLoading(false);
        return;
      }
      try {
        const raw = window.localStorage.getItem(LOCAL_SCAN_LIST_KEY);
        const scans = raw ? (JSON.parse(raw) as ScanRow[]) : [];
        setHistoryEntries(scans.map((scan) => {
          const report = buildSoulScopeReport(scan.result, { scanId: scan.id });
          return {
            scan,
            report,
            preferredStyle: null,
            conciseSummary: report.storyCandidates[0]?.summary ?? report.presentation.summary,
          };
        }));
        setError(null);
      } catch {
        setError("Could not load your SoulScope.");
      } finally {
        setLoading(false);
      }
    };

    const load = async () => {
      if (!session?.user) {
        loadLocal();
        return;
      }
      try {
        const viewModel = await getScanHistoryViewModel(supabase, isArchive ? 100 : 24);
        setHistoryEntries(viewModel.items.flatMap((item) =>
          !item.scan || !item.report
            ? []
            : [{
                scan: { id: item.scanId, created_at: item.createdAt, result: item.scan },
                report: item.report,
                preferredStyle: displayStyle(item.selectedStyle),
                conciseSummary: item.conciseSummary,
              }],
        ));
        setError(null);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Could not load your SoulScope.");
      } finally {
        setLoading(false);
      }
    };

    if (!sessionLoading) void load();
  }, [isArchive, session, sessionLoading]);

  const latestEntry = historyEntries[0] ?? null;
  const movement = useMemo(() => buildMovement(historyEntries), [historyEntries]);
  const displayedHistoryEntries = isArchive ? historyEntries : historyEntries.slice(0, 3);
  const data = useMemo(() => signatureData(latestEntry), [latestEntry]);

  return (
    <div className={styles.page}>
      <div className={styles.gridOverlay} />
      <main className={styles.shell}>
        <section className={styles.instrumentHero}>
          <div className={styles.instrumentCopy}>
            <p className={styles.eyebrow}>{isArchive ? "Your History" : "My SoulScope"}</p>
            <h1 className={styles.instrumentTitle}>{isArchive ? "Notice what changes. Recognize what returns." : "Welcome back."}</h1>
            <p className={styles.instrumentLead}>{latestEntry?.conciseSummary ?? "After your first Resonance Scan, your Signature and Reflection will appear here."}</p>
            <p className={styles.reflectionQuestion}>{latestEntry?.report.presentation.reflectionQuestion ?? "What would you like to understand more clearly today?"}</p>
            <div className={styles.instrumentMeta}>
              <span>{latestEntry ? `Last scan: ${formatScanDate(latestEntry.scan.created_at)}` : "No scan recorded yet"}</span>
              {latestEntry?.preferredStyle ? <span>Reflection: {latestEntry.preferredStyle}</span> : null}
            </div>
            <div className={styles.newScanActions}>
              {latestEntry?.scan.id ? <Link href={`/results/${latestEntry.scan.id}`} className={styles.primaryButton}>View Reflection</Link> : null}
              <Link href="/scan" className={latestEntry?.scan.id ? styles.secondaryButton : styles.primaryButton}>{latestEntry ? "Start New Scan" : "Begin My First Scan"}</Link>
            </div>
          </div>
          <div className={styles.instrumentMap}>
            <ResonanceSignature data={data} label="Latest Resonance Signature" />
          </div>
        </section>

        {!isArchive ? <HomeDailyCheckIn linkedScanId={latestEntry?.scan.id ?? null} /> : null}
        {loading ? <div className={styles.stateCard}>Opening your SoulScope...</div> : null}
        {error ? <div className={`${styles.stateCard} ${styles.stateError}`}>{error}</div> : null}

        {!loading && !error && latestEntry ? (
          <>
            <section className={styles.trendInsightGrid}>
              <article className={styles.trendInsightCard}>
                <p className={styles.insightLabel}>How this may show up</p>
                <p className={styles.insightText}>{latestEntry.report.presentation.explanation[0]}</p>
              </article>
              <article className={styles.trendInsightCard}>
                <p className={styles.insightLabel}>Something to notice</p>
                <p className={styles.insightText}>{latestEntry.report.presentation.observedBullets[0]}</p>
              </article>
              {!isArchive ? (
                <article className={styles.trendInsightCard}>
                <p className={styles.insightLabel}>Compared with your recent scans</p>
                  <p className={styles.insightText}>{latestEntry.report.presentation.longitudinalMessage}</p>
                </article>
              ) : null}
            </section>

            {movement.length ? (
              <article className={styles.chartCard}>
                <div className={styles.chartHeader}>
                  <div>
                    <p className={styles.sectionEyebrow}>What Changed</p>
                    <h2 className={styles.chartTitle}>Compared with your recent scans</h2>
                  </div>
                </div>
                <div className={styles.trendInsightGrid}>
                  {movement.map((item) => (
                    <article key={`${item.title}-${item.direction}`} className={styles.trendInsightCard}>
                      <h3 className={styles.insightTitle}>{item.title}</h3>
                      <p className={styles.insightText}>{item.title} {item.direction}.</p>
                    </article>
                  ))}
                </div>
              </article>
            ) : null}

            <section className={styles.historySection}>
              <div className={styles.historyHeader}>
                <div>
                  <p className={styles.sectionEyebrow}>{isArchive ? "Your History" : "Recent Reflections"}</p>
                  <h2 className={styles.historyTitle}>{isArchive ? "Your Resonance Timeline" : "Your latest scans"}</h2>
                </div>
                {!isArchive ? <Link href="/history" className={styles.secondaryButton}>View My History</Link> : null}
              </div>
              <div className={styles.historyList}>
                {displayedHistoryEntries.map((entry) => (
                  <article key={entry.scan.id ?? entry.scan.created_at} className={styles.historyCard}>
                    <div className={styles.historyMain}>
                      <h3 className={styles.historyBand}>{entry.report.canonicalPattern.canonicalDisplayName}</h3>
                      <p className={styles.historyTheme}>{entry.conciseSummary}</p>
                      <div className={styles.historyDate}>{formatScanTime(entry.scan.created_at)}</div>
                    </div>
                    {entry.scan.id ? (
                      <Link href={`/results/${entry.scan.id}`} className={styles.secondaryButton}>View Reflection</Link>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : null}

        {!loading && !error && !latestEntry ? (
          <div className={styles.stateCard}>
            <h2>Your story begins with one scan.</h2>
            <p>After your first Resonance Scan, your Signature and Reflection will appear here.</p>
            <Link href="/scan" className={styles.primaryButton}>Begin My First Scan</Link>
          </div>
        ) : null}
      </main>
    </div>
  );
}
