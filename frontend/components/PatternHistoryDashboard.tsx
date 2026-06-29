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

type SpectrumBand = {
  label: string;
  relativeEnergy: number;
};

type ScanRow = {
  id?: string;
  created_at: string;
  result: VoiceAnalysisResult & {
    summary?: string;
    dominantBandLabel?: string;
    coreFrequencyHz?: number;
    spectrumBands?: SpectrumBand[];
    noteInterpretation?: {
      primaryNote?: string;
    };
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

const BAND_COLORS = Object.fromEntries(BAND_LABELS.map((label) => [label, getSoulScopeNoteColor(label)])) as Record<
  (typeof BAND_LABELS)[number],
  string
>;

function buildSeries(scans: ScanRow[], label: (typeof BAND_LABELS)[number]) {
  const points = scans
    .slice()
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .slice(-12)
    .map((scan, index) => {
      const value = scan.result.spectrumBands?.find((band) => band.label === label)?.relativeEnergy ?? 0;
      return {
        x: index,
        y: value,
      };
    });

  if (!points.length) return "";

  return points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * 100;
      const y = 100 - point.y * 100;
      return `${index === 0 ? "M" : "L"} ${x},${y}`;
    })
    .join(" ");
}

function getBandValue(scan: ScanRow, label: string) {
  return (
    scan.result.spectrumBands?.find((band) => band.label === label)?.relativeEnergy ??
    scan.result.noteEnergies?.find((band) => band.note === label)?.relativeEnergy ??
    0
  );
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
  if (selectedStyle) {
    return report.storyCandidates.find((candidate) => candidate.style === selectedStyle) ?? report.storyCandidates[0] ?? null;
  }
  return report.storyCandidates[0] ?? null;
}

function getGreeting(date: Date) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function getPreferredName(name: string | null | undefined) {
  const safe = name?.trim();
  if (!safe) return "there";
  return safe;
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
        setError("Please sign in to view your pattern history.");
        setLoading(false);
        return;
      }

      try {
        const raw = window.localStorage.getItem(LOCAL_SCAN_LIST_KEY);
        const parsed = raw ? (JSON.parse(raw) as ScanRow[]) : [];
        setError(null);
        setScans(parsed);
        setPreferences({});
      } catch (localError) {
        console.error("Failed to load local scan history", localError);
        setError("Could not load local pattern history.");
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

      const scanIds = nextScans
        .map((scan) => scan.id)
        .filter((id): id is string => typeof id === "string" && id.length > 0);

      if (scanIds.length) {
        const { data: preferenceData, error: preferenceError } = await supabase
          .from("scan_story_preferences")
          .select("scan_id, selected_style, selected_title, selected_summary")
          .eq("user_id", session.user.id)
          .in("scan_id", scanIds);

        if (preferenceError) {
          console.error("Failed to load story preferences", preferenceError);
        } else {
          const nextPreferences = (preferenceData ?? []).reduce<Record<string, StoryPreferenceRow>>((acc, row) => {
            acc[row.scan_id] = row as StoryPreferenceRow;
            return acc;
          }, {});
          setPreferences(nextPreferences);
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

  const historyEntries = useMemo<HistoryEntry[]>(() => {
    return scans.map((scan) => {
      const report = buildSoulScopeReport(scan.result);
      const preference = preferences[preferenceKey(scan)] ?? null;
      const selectedVariant = getSelectedVariant(report, preference?.selected_style ?? null);
      return {
        scan,
        report,
        selectedStyle: preference?.selected_style ?? selectedVariant?.style ?? null,
        selectedSummary: preference?.selected_summary ?? selectedVariant?.summary ?? report.primaryPattern.explanation,
      };
    });
  }, [preferences, scans]);

  const latestEntry = historyEntries[0] ?? null;
  const chartScans = useMemo(() => scans.slice().reverse().slice(-12), [scans]);
  const trendSummary = useMemo(() => {
    if (!chartScans.length) {
      return null;
    }

    const ordered = chartScans.slice();
    const first = ordered[0];
    const last = ordered[ordered.length - 1];
    const latestDominant =
      last.result.noteInterpretation?.primaryNote ?? last.result.dominantBandLabel ?? "Unknown";
    const earliestDominant =
      first.result.noteInterpretation?.primaryNote ?? first.result.dominantBandLabel ?? "Unknown";

    const noteDeltas = BAND_LABELS.map((label) => ({
      label,
      first: getBandValue(first, label),
      last: getBandValue(last, label),
      delta: getBandValue(last, label) - getBandValue(first, label),
      average: average(ordered.map((scan) => getBandValue(scan, label))),
    })).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

    const rising = noteDeltas.filter((entry) => entry.delta > 0.015).slice(0, 2);
    const falling = noteDeltas.filter((entry) => entry.delta < -0.015).slice(0, 2);

    const resonanceValues = ordered
      .map((scan) => scan.result.resonanceScore)
      .filter((value): value is number => typeof value === "number");
    const resonanceAverage = resonanceValues.length ? round(average(resonanceValues) * 100) : null;

    return {
      totalScans: scans.length,
      windowCount: ordered.length,
      latestDominant,
      earliestDominant,
      resonanceAverage,
      rising,
      falling,
    };
  }, [chartScans, scans.length]);

  const visibleEnergies = (latestEntry?.scan.result.noteEnergies ?? []).filter((entry) => entry.note !== "G");

  const greeting = getGreeting(new Date());
  const preferredName = getPreferredName(session?.user?.user_metadata?.full_name ?? null);

  return (
    <div className={styles.page}>
      <div className={styles.gridOverlay} />
      <main className={styles.shell}>
        <section className={styles.heroSection}>
          <p className={styles.eyebrow}>Welcome Back</p>
          <h1 className={styles.heroTitle}>{greeting}, {preferredName}</h1>
          <p className={styles.heroLead}>
            Open SoulScope with intention: see what changed, where your pattern is now, and choose your next step.
          </p>
          <div className={styles.heroActions}>
            <Link href="/scan" className={styles.primaryButton}>
              New Voice Scan
            </Link>
            {latestEntry?.scan.id ? (
              <Link href={`/results/${latestEntry.scan.id}`} className={styles.secondaryButton}>
                View Latest Scan
              </Link>
            ) : null}
          </div>
        </section>

        {loading ? <div className={styles.stateCard}>Loading pattern history...</div> : null}
        {error ? <div className={`${styles.stateCard} ${styles.stateError}`}>{error}</div> : null}

        {!loading && !error && latestEntry ? (
          <>
            <section className={styles.patternSection}>
              <article className={styles.patternCard}>
                <p className={styles.sectionEyebrow}>Current Pattern</p>
                <h2 className={styles.patternTitle}>{latestEntry.report.primaryPattern.name}</h2>
                <p className={styles.patternTheme}>{latestEntry.report.primaryPattern.theme}</p>
                <p className={styles.patternSummary}>{latestEntry.selectedSummary}</p>
                <div className={styles.metaRow}>
                  <span className={styles.metaItem}>Summary style: {latestEntry.selectedStyle ?? "Direct"}</span>
                  <span className={styles.metaItem}>{new Date(latestEntry.scan.created_at).toLocaleString()}</span>
                </div>
              </article>
              <div className={styles.mapCard}>
                <NoteAuraMap noteEnergies={visibleEnergies} title="Latest Resonance Map" />
              </div>
            </section>

            <section className={styles.progressSection}>
              <div className={styles.progressHeader}>
                <div>
                  <p className={styles.sectionEyebrow}>Progress</p>
                  <h2 className={styles.sectionTitle}>Recent trend</h2>
                </div>
                {trendSummary ? (
                  <div className={styles.statRow}>
                    <span className={styles.statPill}>{trendSummary.totalScans} scans</span>
                    <span className={styles.statPill}>{trendSummary.windowCount} in window</span>
                    <span className={styles.statPill}>
                      {trendSummary.resonanceAverage !== null ? `${trendSummary.resonanceAverage}% avg coherence` : "No coherence score"}
                    </span>
                  </div>
                ) : null}
              </div>

              <div className={styles.chartShell}>
                <svg viewBox="0 0 100 100" className={styles.chart} aria-hidden="true">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <line
                      key={index}
                      x1="0"
                      x2="100"
                      y1={index * 25}
                      y2={index * 25}
                      className={styles.chartLine}
                    />
                  ))}
                  {BAND_LABELS.map((label) => (
                    <path
                      key={label}
                      d={buildSeries(chartScans, label)}
                      fill="none"
                      stroke={BAND_COLORS[label]}
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  ))}
                </svg>
              </div>
              {chartScans.length ? (
                <div className={styles.chartTimeline}>
                  {chartScans.map((scan, index) => (
                    <span key={`${scan.id ?? scan.created_at}-${index}`} className={styles.timelineTick}>
                      {new Date(scan.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  ))}
                </div>
              ) : null}
            </section>

            {trendSummary ? (
              <section className={styles.insightsSection}>
                <p className={styles.sectionEyebrow}>Quick Insights</p>
                <div className={styles.quickInsightsGrid}>
                  <article className={styles.quickInsightCard}>
                    <h3 className={styles.quickInsightTitle}>Direction</h3>
                    <p className={styles.quickInsightText}>
                      You shifted from {getResonanceSystemLabel(trendSummary.earliestDominant)} toward {getResonanceSystemLabel(trendSummary.latestDominant)}.
                    </p>
                  </article>
                  <article className={styles.quickInsightCard}>
                    <h3 className={styles.quickInsightTitle}>Largest movement</h3>
                    <p className={styles.quickInsightText}>
                      {trendSummary.rising.length
                        ? `Rising: ${trendSummary.rising.map((entry) => `${getResonanceSystemLabel(entry.label)} (+${round(entry.delta * 100, 1)}%)`).join(" · ")}`
                        : trendSummary.falling.length
                        ? `Settling: ${trendSummary.falling.map((entry) => `${getResonanceSystemLabel(entry.label)} (${round(entry.delta * 100, 1)}%)`).join(" · ")}`
                        : "Your strongest bands are currently stable across this period."}
                    </p>
                  </article>
                </div>
              </section>
            ) : null}

            <section className={styles.historySection}>
              <div className={styles.historyHeader}>
                <div>
                  <p className={styles.sectionEyebrow}>Scan History</p>
                  <h2 className={styles.sectionTitle}>Timeline</h2>
                </div>
              </div>

              <div className={styles.historyList}>
                {historyEntries.map((entry) => {
                  const supportingNote =
                    entry.scan.result.noteInterpretation?.primaryNote ?? entry.scan.result.dominantBandLabel ?? "—";
                  return (
                    <article key={entry.scan.id ?? entry.scan.created_at} className={styles.historyCard}>
                      <div className={styles.historyMain}>
                        <h3 className={styles.historyBand}>{entry.report.primaryPattern.name}</h3>
                        <p className={styles.historySummary}>{entry.report.primaryPattern.theme}</p>
                        <div className={styles.historyPills}>
                          <span
                            className={styles.historyPill}
                            style={{
                              borderColor: `${getSoulScopeNoteColor(supportingNote)}44`,
                              color: getSoulScopeNoteColor(supportingNote),
                              background: `${getSoulScopeNoteColor(supportingNote)}12`,
                            }}
                          >
                            Marker {supportingNote}
                          </span>
                          <span className={styles.historyPill}>{entry.selectedStyle ?? "Direct"}</span>
                        </div>
                        <div className={styles.historyDate}>{new Date(entry.scan.created_at).toLocaleString()}</div>
                      </div>
                      <Link href={entry.scan.id ? `/results/${entry.scan.id}` : "/dashboard"} className={styles.secondaryButton}>
                        View
                      </Link>
                    </article>
                  );
                })}
              </div>
            </section>
          </>
        ) : null}

        {!loading && !error && !latestEntry ? (
          <div className={styles.stateCard}>No scans saved yet. Start a Resonance Scan to begin your pattern timeline.</div>
        ) : null}
      </main>
    </div>
  );
}
