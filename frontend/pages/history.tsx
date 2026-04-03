"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession, useSessionContext } from "@supabase/auth-helpers-react";
import { supabase } from "../lib/supabaseClient";
import { getLocalDevSession, LOCAL_SCAN_LIST_KEY } from "../lib/localSession";
import { NOTE_ORDER, getSoulScopeNoteColor } from "../lib/noteSystem";
import { type NoteEnergyResult } from "../lib/voiceSpectrum";
import styles from "./History.module.css";

type SpectrumBand = {
  label: string;
  relativeEnergy: number;
};

type ScanRow = {
  id?: string;
  created_at: string;
  result: {
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

export default function HistoryPage() {
  const session = useSession();
  const { isLoading: sessionLoading } = useSessionContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scans, setScans] = useState<ScanRow[]>([]);

  useEffect(() => {
    const loadLocal = () => {
      const localSession = getLocalDevSession();
      if (!localSession) {
        setError("Please sign in to view your scan history.");
        setLoading(false);
        return;
      }

      try {
        const raw = window.localStorage.getItem(LOCAL_SCAN_LIST_KEY);
        const parsed = raw ? (JSON.parse(raw) as ScanRow[]) : [];
        setScans(parsed);
      } catch (localError) {
        console.error("Failed to load local scan history", localError);
        setError("Could not load local scan history.");
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
      } else {
        setScans(data ?? []);
      }

      setLoading(false);
    };

    if (sessionLoading) return;
    void load();
  }, [session, sessionLoading]);

  const latest = scans[0];
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
    }))
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

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
          <p className={styles.eyebrow}>History</p>
          <h1 className={styles.title}>Track how your voice pattern changes over time.</h1>
          <p className={styles.lead}>
            Retests matter. This view now tracks your last 12 scans, highlights which note energies are
            strengthening or fading, and gives you a clearer sense of whether your vocal pattern is staying
            stable or shifting over time.
          </p>
          <div className={styles.heroActions}>
            <Link href="/scan" className={styles.primaryButton}>
              Run New Scan
            </Link>
            <Link href="/results" className={styles.secondaryButton}>
              Latest Result
            </Link>
          </div>
        </section>

        {loading ? <div className={styles.stateCard}>Loading history...</div> : null}
        {error ? <div className={`${styles.stateCard} ${styles.stateError}`}>{error}</div> : null}

        {!loading && !error && latest ? (
          <>
            <section className={styles.topGrid}>
              <article className={styles.latestCard}>
                <p className={styles.sectionEyebrow}>Latest scan</p>
                <h2 className={styles.latestTitle}>{latest.result.dominantBandLabel ?? "Unknown"}</h2>
                <p className={styles.latestText}>{latest.result.summary}</p>
                <div className={styles.metaRow}>
                  <span className={styles.metaItem}>
                    Core tone <strong>{latest.result.coreFrequencyHz ?? "—"} Hz</strong>
                  </span>
                  <span className={styles.metaItem}>{new Date(latest.created_at).toLocaleString()}</span>
                </div>
                <Link href={latest.id ? `/results/${latest.id}` : "/results"} className={styles.primaryButton}>
                  Open Latest Report
                </Link>
              </article>

              <article className={styles.chartCard}>
                <div className={styles.chartHeader}>
                  <div>
                    <p className={styles.sectionEyebrow}>12-scan trend</p>
                    <h2 className={styles.chartTitle}>Note movement over time.</h2>
                    <p className={styles.chartLead}>
                      Each line tracks one note-class energy band across your latest 12 saved scans.
                    </p>
                  </div>
                  {trendSummary ? (
                    <div className={styles.chartStats}>
                      <div className={styles.chartStat}>
                        <span className={styles.chartStatLabel}>Saved scans</span>
                        <strong className={styles.chartStatValue}>{trendSummary.totalScans}</strong>
                      </div>
                      <div className={styles.chartStat}>
                        <span className={styles.chartStatLabel}>Trend window</span>
                        <strong className={styles.chartStatValue}>{trendSummary.windowCount}</strong>
                      </div>
                      <div className={styles.chartStat}>
                        <span className={styles.chartStatLabel}>Avg resonance</span>
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
                        Your oldest scan in this window centered around {trendSummary.earliestDominant}, while the
                        most recent scan centers around {trendSummary.latestDominant}.
                      </p>
                    </article>
                    <article className={styles.trendInsightCard}>
                      <p className={styles.insightLabel}>Rising bands</p>
                      <p className={styles.insightText}>
                        {trendSummary.rising.length
                          ? trendSummary.rising
                              .map((entry) => `${entry.label} (+${round(entry.delta * 100, 1)}%)`)
                              .join(" · ")
                          : "No strong upward shifts stand out across this 12-scan window."}
                      </p>
                    </article>
                    <article className={styles.trendInsightCard}>
                      <p className={styles.insightLabel}>Fading bands</p>
                      <p className={styles.insightText}>
                        {trendSummary.falling.length
                          ? trendSummary.falling
                              .map((entry) => `${entry.label} (${round(entry.delta * 100, 1)}%)`)
                              .join(" · ")
                          : "No strong downward shifts stand out across this 12-scan window."}
                      </p>
                    </article>
                    <article className={styles.trendInsightCard}>
                      <p className={styles.insightLabel}>Most stable</p>
                      <p className={styles.insightText}>
                        {trendSummary.mostStable
                          .map((entry) => `${entry.label} (${round(entry.average * 100, 1)}% avg)`)
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
                  <p className={styles.sectionEyebrow}>Recent scans</p>
                  <h2 className={styles.historyTitle}>Your saved reports.</h2>
                </div>
              </div>

              <div className={styles.historyList}>
                {scans.map((scan) => (
                  <article key={scan.id ?? scan.created_at} className={styles.historyCard}>
                    <div className={styles.historyMain}>
                      <h3 className={styles.historyBand}>
                        {scan.result.dominantBandLabel ?? "Unknown"} • {scan.result.coreFrequencyHz ?? "—"} Hz
                      </h3>
                      <p className={styles.historySummary}>{scan.result.summary}</p>
                      {scan.result.noteEnergies?.length ? (
                        <div className={styles.historyPills}>
                          {scan.result.noteEnergies
                            .slice()
                            .sort((a, b) => b.relativeEnergy - a.relativeEnergy)
                            .slice(0, 3)
                            .map((entry) => (
                              <span
                                key={`${scan.id ?? scan.created_at}-${entry.note}`}
                                className={styles.historyPill}
                                style={{
                                  borderColor: `${getSoulScopeNoteColor(entry.note)}44`,
                                  color: getSoulScopeNoteColor(entry.note),
                                  background: `${getSoulScopeNoteColor(entry.note)}12`,
                                }}
                              >
                                {entry.note} {round(entry.relativeEnergy * 100, 1)}%
                              </span>
                            ))}
                        </div>
                      ) : null}
                      <div className={styles.historyDate}>{new Date(scan.created_at).toLocaleString()}</div>
                    </div>
                    <Link href={scan.id ? `/results/${scan.id}` : "/results"} className={styles.secondaryButton}>
                      Open Report
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : null}

        {!loading && !error && !latest ? (
          <div className={styles.stateCard}>No scans saved yet. Run a guided scan to start building history.</div>
        ) : null}
      </main>
    </div>
  );
}
