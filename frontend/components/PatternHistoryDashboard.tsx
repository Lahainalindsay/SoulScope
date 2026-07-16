"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession, useSessionContext } from "@supabase/auth-helpers-react";
import { supabase } from "../lib/supabaseClient";
import { getLocalDevSession, LOCAL_SCAN_LIST_KEY } from "../lib/localSession";
import { buildSoulScopeReport } from "../lib/buildSoulScopeReport";
import { type NoteEnergyResult, type VoiceAnalysisResult } from "../lib/voiceSpectrum";
import { getScanHistoryViewModel } from "../lib/data/v2/getScanHistoryViewModel";
import NoteAuraMap from "./NoteAuraMap";
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
};

function displayStyle(style: string | null): DisplayStyle | null {
  if (style === "direct") return "Direct";
  if (style === "supportive") return "Supportive";
  if (style === "insight") return "Insight";
  return null;
}

function formatScanDate(value?: string) {
  if (!value) return "No scan recorded yet";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function formatScanTime(value?: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  }).format(new Date(value));
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
      const direction = amount < 4 ? "remained close to your previous scan" : delta > 0 ? "was more present than in your previous scan" : "was less present than in your previous scan";
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
        setError("Please sign in to view today's reflection.");
        setLoading(false);
        return;
      }
      try {
        const raw = window.localStorage.getItem(LOCAL_SCAN_LIST_KEY);
        const scans = raw ? (JSON.parse(raw) as ScanRow[]) : [];
        setHistoryEntries(scans.map((scan) => ({
          scan,
          report: buildSoulScopeReport(scan.result, { scanId: scan.id }),
          preferredStyle: null,
        })));
        setError(null);
      } catch (localError) {
        console.error("Failed to load local scan history", localError);
        setError("Could not load today's reflection.");
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
        setHistoryEntries(viewModel.items.flatMap((item) => {
          if (!item.scan || !item.report) return [];
          return [{
            scan: { id: item.scanId, created_at: item.createdAt, result: item.scan },
            report: item.report,
            preferredStyle: displayStyle(item.selectedStyle),
          }];
        }));
        setError(null);
      } catch (fetchError) {
        console.error("Failed to load V2 history", fetchError);
        setError(fetchError instanceof Error ? fetchError.message : "Could not load today's reflection.");
      } finally {
        setLoading(false);
      }
    };
    if (!sessionLoading) void load();
  }, [isArchive, session, sessionLoading]);

  const latestEntry = historyEntries[0] ?? null;
  const visibleEnergies = (latestEntry?.scan.result.noteEnergies ?? []).filter((entry) => entry.note !== "G");
  const movement = useMemo(() => buildMovement(historyEntries), [historyEntries]);
  const displayedHistoryEntries = isArchive ? historyEntries : historyEntries.slice(0, 3);

  return (
    <div className={styles.page}>
      <div className={styles.gridOverlay} />
      <main className={styles.shell}>
        <section className={styles.instrumentHero}>
          <div className={styles.instrumentCopy}>
            <p className={styles.eyebrow}>Today&rsquo;s Reflection</p>
            <h1 className={styles.instrumentTitle}>{latestEntry?.report.primaryPattern.name ?? "Start with a short scan."}</h1>
            <p className={styles.instrumentLead}>{latestEntry?.report.presentation.summary ?? "A short scan begins your personal pattern history."}</p>
            <p className={styles.reflectionQuestion}>{latestEntry?.report.presentation.reflectionQuestion ?? "What would you like to understand more clearly today?"}</p>
            <div className={styles.instrumentMeta}>
              <span>Last scan: {formatScanDate(latestEntry?.scan.created_at)}</span>
              {latestEntry?.preferredStyle ? <span>Reflection: {latestEntry.preferredStyle}</span> : null}
            </div>
            <div className={styles.newScanActions}>
              {latestEntry?.scan.id ? <Link href={`/results/${latestEntry.scan.id}`} className={styles.primaryButton}>View Reflection</Link> : null}
              <Link href="/scan" className={latestEntry?.scan.id ? styles.secondaryButton : styles.primaryButton}>Start New Scan</Link>
            </div>
          </div>
          <div className={styles.instrumentMap}><NoteAuraMap noteEnergies={visibleEnergies} title="Resonance Map" /></div>
        </section>

        {loading ? <div className={styles.stateCard}>Opening today&rsquo;s reflection...</div> : null}
        {error ? <div className={`${styles.stateCard} ${styles.stateError}`}>{error}</div> : null}

        {!loading && !error && latestEntry ? (
          <>
            <section className={styles.trendInsightGrid}>
              <article className={styles.trendInsightCard}><p className={styles.insightLabel}>What This May Reflect</p><p className={styles.insightText}>{latestEntry.report.presentation.explanation[0]}</p></article>
              <article className={styles.trendInsightCard}><p className={styles.insightLabel}>Worth Noticing</p><p className={styles.insightText}>{latestEntry.report.presentation.observedBullets[0]}</p></article>
              <article className={styles.trendInsightCard}><p className={styles.insightLabel}>Looking Over Time</p><p className={styles.insightText}>{latestEntry.report.presentation.longitudinalMessage}</p></article>
            </section>

            {movement.length ? (
              <article className={styles.chartCard}>
                <div className={styles.chartHeader}><div><p className={styles.sectionEyebrow}>Since Your Previous Scan</p><h2 className={styles.chartTitle}>What changed most.</h2></div></div>
                <div className={styles.trendInsightGrid}>
                  {movement.map((item) => <article key={`${item.title}-${item.direction}`} className={styles.trendInsightCard}><h3 className={styles.insightTitle}>{item.title}</h3><p className={styles.insightText}>{item.title} {item.direction}.</p></article>)}
                </div>
              </article>
            ) : null}

            <section className={styles.historySection}>
              <div className={styles.historyHeader}><div><p className={styles.sectionEyebrow}>{isArchive ? "Pattern History" : "Recent Pattern History"}</p><h2 className={styles.historyTitle}>{isArchive ? "Your reflection history." : "Your latest scans."}</h2></div>{!isArchive ? <Link href="/history" className={styles.secondaryButton}>View Pattern History</Link> : null}</div>
              <div className={styles.historyList}>
                {displayedHistoryEntries.map((entry) => (
                  <article key={entry.scan.id ?? entry.scan.created_at} className={styles.historyCard}>
                    <div className={styles.historyMain}>
                      <h3 className={styles.historyBand}>{entry.report.primaryPattern.name}</h3>
                      <p className={styles.historyTheme}>{entry.report.presentation.summary}</p>
                      {isArchive ? <p className={styles.historySummary}>{entry.report.presentation.longitudinalMessage}</p> : null}
                      <div className={styles.historyDate}>{formatScanTime(entry.scan.created_at)}</div>
                    </div>
                    <Link href={entry.scan.id ? `/results/${entry.scan.id}` : "/dashboard"} className={styles.secondaryButton}>View Reflection</Link>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : null}

        {!loading && !error && !latestEntry ? <div className={styles.stateCard}>No scans saved yet. Start a scan to begin your reflection history.</div> : null}
      </main>
    </div>
  );
}
