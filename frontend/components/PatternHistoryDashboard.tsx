"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession, useSessionContext } from "@supabase/auth-helpers-react";
import { supabase } from "../lib/supabaseClient";
import { getLocalDevSession, LOCAL_SCAN_LIST_KEY } from "../lib/localSession";
import { NOTE_ORDER, getSoulScopeNoteColor } from "../lib/noteSystem";
import { getResonanceSystemLabel } from "../lib/resonanceLanguage";
import { buildSoulScopeReport } from "../lib/buildSoulScopeReport";
import { type NoteEnergyResult, type VoiceAnalysisResult } from "../lib/voiceSpectrum";
import NoteAuraMap from "./NoteAuraMap";
import styles from "../pages/History.module.css";

type SpectrumBand = { label: string; relativeEnergy: number };

type ScanRow = {
  id?: string;
  created_at: string;
  result: VoiceAnalysisResult & {
    summary?: string;
    dominantBandLabel?: string;
    coreFrequencyHz?: number;
    spectrumBands?: SpectrumBand[];
    noteInterpretation?: { primaryNote?: string };
    noteEnergies?: NoteEnergyResult[];
    resonanceScore?: number;
  };
};

type StoryPreferenceRow = {
  scan_id: string;
  selected_style: "Direct" | "Supportive" | "Insight";
  selected_title: string;
  selected_summary: string;
};

type HistoryEntry = {
  scan: ScanRow;
  report: ReturnType<typeof buildSoulScopeReport>;
  selectedStyle: StoryPreferenceRow["selected_style"] | null;
  selectedSummary: string;
};

const BAND_LABELS = [...NOTE_ORDER];
const BAND_COLORS = Object.fromEntries(BAND_LABELS.map((label) => [label, getSoulScopeNoteColor(label)])) as Record<(typeof BAND_LABELS)[number], string>;

function buildSeries(scans: ScanRow[], label: (typeof BAND_LABELS)[number]) {
  const points = scans
    .slice()
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .slice(-12)
    .map((scan, index) => ({ x: index, y: getBandValue(scan, label) }));
  if (!points.length) return "";
  return points.map((point, index) => {
    const x = (index / Math.max(points.length - 1, 1)) * 100;
    const y = 100 - point.y * 100;
    return `${index === 0 ? "M" : "L"} ${x},${y}`;
  }).join(" ");
}

function getBandValue(scan: ScanRow, label: string) {
  return scan.result.spectrumBands?.find((band) => band.label === label)?.relativeEnergy ?? scan.result.noteEnergies?.find((band) => band.note === label)?.relativeEnergy ?? 0;
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value: number, digits = 0) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function preferenceKey(scan: ScanRow) {
  return scan.id ?? scan.created_at;
}

function getSelectedVariant(report: ReturnType<typeof buildSoulScopeReport>, selectedStyle: HistoryEntry["selectedStyle"]) {
  if (selectedStyle) return report.storyCandidates.find((candidate) => candidate.style === selectedStyle) ?? report.storyCandidates[0] ?? null;
  return report.storyCandidates[0] ?? null;
}

function buildDashboardFocus(entry: HistoryEntry | null) {
  const domains = entry?.report.domainResults ?? [];
  const support = domains
    .filter((domain) => ["Asking for Support", "Less Accessible", "Recovering"].includes(domain.functionalState))
    .sort((a, b) => a.score - b.score)[0];
  const working = domains
    .filter((domain) => ["Working Hard", "Under Pressure"].includes(domain.functionalState))
    .sort((a, b) => b.score - a.score)[0];

  if (support && working) {
    return `This week, protect ${support.title.toLowerCase()} while ${working.title.toLowerCase()} is carrying more effort.`;
  }
  if (support) return `This week, give extra attention to ${support.title.toLowerCase()} and let that area rebuild without pressure.`;
  if (working) return `This week, notice where ${working.title.toLowerCase()} is working hard and reduce one unnecessary demand.`;
  return "This week, keep the rhythm that is already helping you feel steady.";
}

function buildJourneyInsight(entries: HistoryEntry[]) {
  if (!entries.length) return "Your resonance journey begins with your first saved scan.";
  if (entries.length === 1) return "You have one saved reflection so far. Your next scan will begin showing how your patterns shift over time.";

  const latest = entries[0].report.primaryPattern.name;
  const previous = entries[1].report.primaryPattern.name;
  if (latest === previous) return `${latest} is repeating across your latest scans, which may point to a pattern worth observing over time.`;
  return `Your latest pattern shifted from ${previous} into ${latest}, suggesting your current state is already moving rather than staying fixed.`;
}

export default function PatternHistoryDashboard() {
  const session = useSession();
  const { isLoading: sessionLoading } = useSessionContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scans, setScans] = useState<ScanRow[]>([]);
  const [preferences, setPreferences] = useState<Record<string, StoryPreferenceRow>>({});

  useEffect(() => {
    const loadLocal = () => {
      const localSession = getLocalDevSession();
      if (!localSession) {
        setError("Please sign in to view your resonance journey.");
        setLoading(false);
        return;
      }
      try {
        const raw = window.localStorage.getItem(LOCAL_SCAN_LIST_KEY);
        setScans(raw ? (JSON.parse(raw) as ScanRow[]) : []);
        setPreferences({});
        setError(null);
      } catch (localError) {
        console.error("Failed to load local scan history", localError);
        setError("Could not load your resonance journey.");
      } finally {
        setLoading(false);
      }
    };

    const load = async () => {
      if (!session?.user) {
        loadLocal();
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("scans")
        .select("id, created_at, result")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(24);

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      const nextScans = (data ?? []) as ScanRow[];
      setScans(nextScans);

      const scanIds = nextScans.map((scan) => scan.id).filter((id): id is string => typeof id === "string" && id.length > 0);
      if (scanIds.length) {
        const { data: preferenceData, error: preferenceError } = await supabase
          .from("scan_story_preferences")
          .select("scan_id, selected_style, selected_title, selected_summary")
          .eq("user_id", session.user.id)
          .in("scan_id", scanIds);

        if (!preferenceError) {
          setPreferences((preferenceData ?? []).reduce<Record<string, StoryPreferenceRow>>((acc, row) => {
            acc[row.scan_id] = row as StoryPreferenceRow;
            return acc;
          }, {}));
        }
      } else {
        setPreferences({});
      }

      setError(null);
      setLoading(false);
    };

    if (sessionLoading) return;
    void load();
  }, [session, sessionLoading]);

  const historyEntries = useMemo<HistoryEntry[]>(() => scans.map((scan) => {
    const report = buildSoulScopeReport(scan.result);
    const preference = preferences[preferenceKey(scan)] ?? null;
    const selectedVariant = getSelectedVariant(report, preference?.selected_style ?? null);
    return {
      scan,
      report,
      selectedStyle: preference?.selected_style ?? selectedVariant?.style ?? null,
      selectedSummary: preference?.selected_summary ?? selectedVariant?.summary ?? report.primaryPattern.explanation,
    };
  }), [preferences, scans]);

  const latestEntry = historyEntries[0] ?? null;
  const chartScans = useMemo(() => scans.slice().reverse().slice(-12), [scans]);
  const visibleEnergies = (latestEntry?.scan.result.noteEnergies ?? []).filter((entry) => entry.note !== "G");
  const journeyInsight = buildJourneyInsight(historyEntries);
  const weeklyFocus = buildDashboardFocus(latestEntry);

  const trendSummary = useMemo(() => {
    if (!chartScans.length) return null;
    const ordered = chartScans.slice();
    const first = ordered[0];
    const last = ordered[ordered.length - 1];
    const latestDominant = last.result.noteInterpretation?.primaryNote ?? last.result.dominantBandLabel ?? "Unknown";
    const earliestDominant = first.result.noteInterpretation?.primaryNote ?? first.result.dominantBandLabel ?? "Unknown";
    const noteDeltas = BAND_LABELS.map((label) => ({
      label,
      first: getBandValue(first, label),
      last: getBandValue(last, label),
      delta: getBandValue(last, label) - getBandValue(first, label),
      average: average(ordered.map((scan) => getBandValue(scan, label))),
    })).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
    const rising = noteDeltas.filter((entry) => entry.delta > 0.015).slice(0, 3);
    const falling = noteDeltas.filter((entry) => entry.delta < -0.015).slice(0, 3);
    const resonanceValues = ordered.map((scan) => scan.result.resonanceScore).filter((value): value is number => typeof value === "number");
    return {
      totalScans: scans.length,
      windowCount: ordered.length,
      latestDominant,
      earliestDominant,
      resonanceAverage: resonanceValues.length ? round(average(resonanceValues) * 100) : null,
      rising,
      falling,
    };
  }, [chartScans, scans.length]);

  return (
    <div className={styles.page}>
      <div className={styles.gridOverlay} />
      <main className={styles.shell}>
        <section className={styles.newScanSection}>
          <p className={styles.eyebrow}>Your Resonance Journey</p>
          <h1 className={styles.newScanTitle}>Welcome back.</h1>
          <p className={styles.newScanLead}>
            This is your living record of how your voice patterns shift over time. Each scan becomes a reflection point — not a label, but a snapshot of how your inner landscape is expressing itself.
          </p>
          <div className={styles.newScanActions}>
            <Link href="/scan" className={styles.primaryButton}>Start New Scan</Link>
            {latestEntry?.scan.id ? <Link href={`/results/${latestEntry.scan.id}`} className={styles.secondaryButton}>View Latest Report</Link> : null}
          </div>
        </section>

        {loading ? <div className={styles.stateCard}>Loading your resonance journey...</div> : null}
        {error ? <div className={`${styles.stateCard} ${styles.stateError}`}>{error}</div> : null}

        {!loading && !error && latestEntry ? (
          <>
            <section className={styles.historyLatestSection}>
              <article className={styles.historyLatestCard}>
                <p className={styles.sectionEyebrow}>Current Story</p>
                <h2 className={styles.historyLatestTitle}>{latestEntry.report.primaryPattern.name}</h2>
                <p className={styles.historyLatestTheme}>{latestEntry.report.primaryPattern.theme}</p>
                <p className={styles.historyLatestText}>{latestEntry.selectedSummary}</p>
                <div className={styles.metaRow}>
                  <span className={styles.metaItem}>Saved scans <strong>{historyEntries.length}</strong></span>
                  <span className={styles.metaItem}>Narrative style <strong>{latestEntry.selectedStyle ?? "Direct"}</strong></span>
                  <span className={styles.metaItem}>{new Date(latestEntry.scan.created_at).toLocaleString()}</span>
                </div>
              </article>
              <div className={styles.historyLatestMapContainer}>
                <NoteAuraMap noteEnergies={visibleEnergies} title="Current Resonance Map" />
              </div>
            </section>

            <section className={styles.trendInsightGrid}>
              <article className={styles.trendInsightCard}>
                <p className={styles.insightLabel}>Insight of the Week</p>
                <h3 className={styles.insightTitle}>What is shifting</h3>
                <p className={styles.insightText}>{journeyInsight}</p>
              </article>
              <article className={styles.trendInsightCard}>
                <p className={styles.insightLabel}>This Week&rsquo;s Focus</p>
                <h3 className={styles.insightTitle}>Balance point</h3>
                <p className={styles.insightText}>{weeklyFocus}</p>
              </article>
            </section>

            <article className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <div>
                  <p className={styles.sectionEyebrow}>Resonance Trends</p>
                  <h2 className={styles.chartTitle}>How your system has been moving.</h2>
                  <p className={styles.chartLead}>This view tracks the signal layer across your saved scans, helping you notice what is rising, softening, or staying steady.</p>
                </div>
                {trendSummary ? (
                  <div className={styles.chartStats}>
                    <div className={styles.chartStat}><span className={styles.chartStatLabel}>Saved scans</span><strong className={styles.chartStatValue}>{trendSummary.totalScans}</strong></div>
                    <div className={styles.chartStat}><span className={styles.chartStatLabel}>Window</span><strong className={styles.chartStatValue}>{trendSummary.windowCount}</strong></div>
                    <div className={styles.chartStat}><span className={styles.chartStatLabel}>Avg coherence</span><strong className={styles.chartStatValue}>{trendSummary.resonanceAverage !== null ? `${trendSummary.resonanceAverage}%` : "—"}</strong></div>
                  </div>
                ) : null}
              </div>

              <div className={styles.chartShell}>
                <svg viewBox="0 0 100 100" className={styles.chart} aria-hidden="true">
                  {Array.from({ length: 5 }).map((_, index) => <line key={index} x1="0" x2="100" y1={index * 25} y2={index * 25} className={styles.chartLine} />)}
                  {BAND_LABELS.map((label) => <path key={label} d={buildSeries(chartScans, label)} fill="none" stroke={BAND_COLORS[label]} strokeWidth="1.8" strokeLinecap="round" />)}
                </svg>
              </div>

              {trendSummary ? (
                <div className={styles.trendInsightGrid}>
                  <article className={styles.trendInsightCard}>
                    <p className={styles.insightLabel}>Overall direction</p>
                    <p className={styles.insightText}>{getResonanceSystemLabel(trendSummary.earliestDominant)} → {getResonanceSystemLabel(trendSummary.latestDominant)}</p>
                  </article>
                  <article className={styles.trendInsightCard}>
                    <p className={styles.insightLabel}>Rising</p>
                    <p className={styles.insightText}>{trendSummary.rising.length ? trendSummary.rising.map((entry) => `${getResonanceSystemLabel(entry.label)} +${round(entry.delta * 100, 1)}%`).join(" · ") : "No strong upward shift yet."}</p>
                  </article>
                  <article className={styles.trendInsightCard}>
                    <p className={styles.insightLabel}>Softening</p>
                    <p className={styles.insightText}>{trendSummary.falling.length ? trendSummary.falling.map((entry) => `${getResonanceSystemLabel(entry.label)} ${round(entry.delta * 100, 1)}%`).join(" · ") : "No strong downward shift yet."}</p>
                  </article>
                </div>
              ) : null}
            </article>

            <section className={styles.historySection}>
              <div className={styles.historyHeader}>
                <div>
                  <p className={styles.sectionEyebrow}>Resonance Journal</p>
                  <h2 className={styles.historyTitle}>Your previous reflections</h2>
                </div>
              </div>
              <div className={styles.historyList}>
                {historyEntries.map((entry) => {
                  const supportingNote = entry.scan.result.noteInterpretation?.primaryNote ?? entry.scan.result.dominantBandLabel ?? "—";
                  return (
                    <article key={entry.scan.id ?? entry.scan.created_at} className={styles.historyCard}>
                      <div className={styles.historyMain}>
                        <h3 className={styles.historyBand}>{entry.report.primaryPattern.name}</h3>
                        <p className={styles.historySummary}>{entry.selectedSummary}</p>
                        <div className={styles.historyPills}>
                          <span className={styles.historyPill} style={{ borderColor: `${getSoulScopeNoteColor(supportingNote)}44`, color: getSoulScopeNoteColor(supportingNote), background: `${getSoulScopeNoteColor(supportingNote)}12` }}>Marker {supportingNote}</span>
                          <span className={styles.historyPill}>{entry.selectedStyle ?? "Direct"}</span>
                        </div>
                        <div className={styles.historyDate}>{new Date(entry.scan.created_at).toLocaleString()}</div>
                      </div>
                      <Link href={entry.scan.id ? `/results/${entry.scan.id}` : "/dashboard"} className={styles.secondaryButton}>Read Reflection</Link>
                    </article>
                  );
                })}
              </div>
            </section>
          </>
        ) : null}

        {!loading && !error && !latestEntry ? (
          <div className={styles.stateCard}>No scans saved yet. Start a Resonance Scan to begin your Resonance Journey.</div>
        ) : null}
      </main>
    </div>
  );
}
