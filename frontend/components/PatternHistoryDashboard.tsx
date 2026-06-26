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
  const primaryCta = latestEntry?.scan.id
    ? { href: `/results/${latestEntry.scan.id}`, label: "Open Latest Insight" }
    : { href: "/scan", label: "Start New Scan" };
  const secondaryCta = latestEntry
    ? { href: "/scan", label: "Start New Scan" }
    : { href: "/how-it-works", label: "How It Works" };
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

    const rising = noteDeltas.filter((entry) => entry.delta > 0.015).slice(0, 3);
    const falling = noteDeltas.filter((entry) => entry.delta < -0.015).slice(0, 3);
    const mostStable = [...noteDeltas]
      .sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta))
      .slice(0, 3);

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
      mostStable,
    };
  }, [chartScans, scans.length]);

  return (
    <div className={styles.page}>
      <div className={styles.gridOverlay} />
      <main className={styles.shell}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Dashboard</p>
          <h1 className={styles.title}>Your Pattern History</h1>
          <p className={styles.lead}>
            One scan. One coherent interpretation. Review the pattern your system is expressing, and follow
            how it changes over time.
          </p>
          <div className={styles.heroActions}>
            <Link href={primaryCta.href} className={styles.primaryButton}>
              {primaryCta.label}
            </Link>
            <Link href={secondaryCta.href} className={styles.secondaryButton}>
              {secondaryCta.label}
            </Link>
          </div>
        </section>

        {loading ? <div className={styles.stateCard}>Loading pattern history...</div> : null}
        {error ? <div className={`${styles.stateCard} ${styles.stateError}`}>{error}</div> : null}

        {!loading && !error && latestEntry ? (
          <>
            <section className={styles.topGrid}>
              <article className={styles.latestCard}>
                <p className={styles.sectionEyebrow}>Latest Insight</p>
                <h2 className={styles.latestTitle}>{latestEntry.report.primaryPattern.name}</h2>
                <p className={styles.latestText}>{latestEntry.report.primaryPattern.theme}</p>
                <p className={styles.latestText}>{latestEntry.selectedSummary}</p>
                <div className={styles.metaRow}>
                  <span className={styles.metaItem}>
                    Preferred reading <strong>{latestEntry.selectedStyle ?? "Direct"}</strong>
                  </span>
                  <span className={styles.metaItem}>
                    Pattern <strong>{latestEntry.report.primaryPattern.name}</strong>
                  </span>
                  <span className={styles.metaItem}>{new Date(latestEntry.scan.created_at).toLocaleString()}</span>
                </div>
                <p className={styles.historySummary}>
                  Supporting signal reference:{" "}
                  {latestEntry.scan.result.noteInterpretation?.primaryNote ?? latestEntry.scan.result.dominantBandLabel ?? "—"}
                </p>
                <Link href={latestEntry.scan.id ? `/results/${latestEntry.scan.id}` : "/dashboard"} className={styles.primaryButton}>
                  Open Latest Report
                </Link>
              </article>

              <article className={styles.chartCard}>
                <div className={styles.chartHeader}>
                  <div>
                    <p className={styles.sectionEyebrow}>Movement Over Time</p>
                    <h2 className={styles.chartTitle}>How the system has been shifting.</h2>
                    <p className={styles.chartLead}>
                      See the underlying signal layer without losing the larger human story. Recovery, expression,
                      clarity, load, adaptability, and direction remain the frame of reference.
                    </p>
                  </div>
                  {trendSummary ? (
                    <div className={styles.chartStats}>
                      <div className={styles.chartStat}>
                        <span className={styles.chartStatLabel}>Saved scans</span>
                        <strong className={styles.chartStatValue}>{trendSummary.totalScans}</strong>
                      </div>
                      <div className={styles.chartStat}>
                        <span className={styles.chartStatLabel}>Window</span>
                        <strong className={styles.chartStatValue}>{trendSummary.windowCount}</strong>
                      </div>
                      <div className={styles.chartStat}>
                        <span className={styles.chartStatLabel}>Avg coherence</span>
                        <strong className={styles.chartStatValue}>
                          {trendSummary.resonanceAverage !== null ? `${trendSummary.resonanceAverage}%` : "—"}
                        </strong>
                      </div>
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
                    {Array.from({ length: Math.max(chartScans.length, 2) }).map((_, index) => {
                      const x = (index / Math.max(chartScans.length - 1, 1)) * 100;
                      return (
                        <line
                          key={`v-${index}`}
                          x1={x}
                          x2={x}
                          y1="0"
                          y2="100"
                          className={styles.chartAxisLine}
                        />
                      );
                    })}
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

                <div className={styles.legend}>
                  {BAND_LABELS.map((label) => (
                    <span
                      key={label}
                      className={styles.legendPill}
                      style={{
                        borderColor: `${BAND_COLORS[label]}55`,
                        color: BAND_COLORS[label],
                        background: `${BAND_COLORS[label]}11`,
                      }}
                    >
                      {label}
                    </span>
                  ))}
                </div>

                {trendSummary ? (
                  <div className={styles.trendInsightGrid}>
                    <article className={styles.trendInsightCard}>
                      <p className={styles.insightLabel}>Overall direction</p>
                      <h3 className={styles.insightTitle}>
                        {trendSummary.earliestDominant} to {trendSummary.latestDominant}
                      </h3>
                      <p className={styles.insightText}>
                        Your oldest scan in this window centered around {getResonanceSystemLabel(trendSummary.earliestDominant)}, while the
                        most recent scan centers around {getResonanceSystemLabel(trendSummary.latestDominant)}.
                      </p>
                    </article>
                    <article className={styles.trendInsightCard}>
                      <p className={styles.insightLabel}>Rising bands</p>
                      <p className={styles.insightText}>
                        {trendSummary.rising.length
                          ? trendSummary.rising
                              .map((entry) => `${getResonanceSystemLabel(entry.label)} (+${round(entry.delta * 100, 1)}%)`)
                              .join(" · ")
                          : "No strong upward shifts stand out across this 12-scan window."}
                      </p>
                    </article>
                    <article className={styles.trendInsightCard}>
                      <p className={styles.insightLabel}>Fading bands</p>
                      <p className={styles.insightText}>
                        {trendSummary.falling.length
                          ? trendSummary.falling
                              .map((entry) => `${getResonanceSystemLabel(entry.label)} (${round(entry.delta * 100, 1)}%)`)
                              .join(" · ")
                          : "No strong downward shifts stand out across this 12-scan window."}
                      </p>
                    </article>
                    <article className={styles.trendInsightCard}>
                      <p className={styles.insightLabel}>Most stable</p>
                      <p className={styles.insightText}>
                        {trendSummary.mostStable
                          .map((entry) => `${getResonanceSystemLabel(entry.label)} (${round(entry.average * 100, 1)}% avg)`)
                          .join(" · ")}
                      </p>
                    </article>
                  </div>
                ) : null}
              </article>
            </section>

            <section className={styles.historySection}>
              <div className={styles.historyHeader}>
                <div>
                  <p className={styles.sectionEyebrow}>Pattern History</p>
                  <h2 className={styles.historyTitle}>Recent Patterns</h2>
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
                        <p className={styles.historySummary}>{entry.selectedSummary}</p>
                        <div className={styles.historyPills}>
                          <span
                            className={styles.historyPill}
                            style={{
                              borderColor: `${getSoulScopeNoteColor(supportingNote)}44`,
                              color: getSoulScopeNoteColor(supportingNote),
                              background: `${getSoulScopeNoteColor(supportingNote)}12`,
                            }}
                          >
                            Signal reference {supportingNote}
                          </span>
                          <span className={styles.historyPill}>{entry.selectedStyle ?? "Direct"}</span>
                        </div>
                        <div className={styles.historyDate}>{new Date(entry.scan.created_at).toLocaleString()}</div>
                      </div>
                      <Link href={entry.scan.id ? `/results/${entry.scan.id}` : "/dashboard"} className={styles.secondaryButton}>
                        Open Latest Insight
                      </Link>
                    </article>
                  );
                })}
              </div>
            </section>
          </>
        ) : null}

        {!loading && !error && !latestEntry ? (
          <div className={styles.stateCard}>No scans saved yet. Start a Resonance Scan to begin your Pattern History.</div>
        ) : null}
      </main>
    </div>
  );
}
