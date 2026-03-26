"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ResonanceResultsDashboard from "../../components/ResonanceResultsDashboard";
import { getSoulScopeNoteColor } from "../../lib/noteSystem";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { type SpectrumBandResult, type VoiceAnalysisResult } from "../../lib/voiceSpectrum";
import styles from "./ResultsIndex.module.css";

type ScanResult = VoiceAnalysisResult & {
  face?: {
    emotion: string;
    focusScore: number;
  };
  chakraScores?: Record<string, number>;
  dominant?: string;
};

const supabase = createClientComponentClient();
const LOCAL_SCAN_KEY = "soulscope.latestScan";

function getLegacyMissingBands(scan: ScanResult): SpectrumBandResult[] {
  return Object.entries(scan.chakraScores ?? {})
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3)
    .map(([key, value]) => ({
      key,
      label: key.replace(/_/g, " "),
      rangeHz: [0, 0],
      relativeEnergy: value,
      status: "underrepresented",
      correlates: "legacy chakra-based result",
      note: "This scan predates the newer voice spectrum model.",
      practice: "Run a fresh guided scan to produce measured band energy.",
    }));
}

function getLegacyExcessBands(scan: ScanResult): SpectrumBandResult[] {
  return Object.entries(scan.chakraScores ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([key, value]) => ({
      key,
      label: key.replace(/_/g, " "),
      rangeHz: [0, 0],
      relativeEnergy: value,
      status: "overrepresented",
      correlates: "legacy chakra-based result",
      note: "This scan predates the newer voice spectrum model.",
      practice: "Run a fresh guided scan to produce measured band energy.",
    }));
}

function topPromptNotes(
  notes: {
    note: string;
    score: number;
  }[] = []
) {
  return [...notes].sort((a, b) => b.score - a.score).slice(0, 3);
}

type PromptToneGroup = {
  key: string;
  label: string;
  title: string;
  subheading: string;
  prompts: NonNullable<ScanResult["protocolNotes"]>["prompts"];
  primaryNote?: string;
  durationMs?: number;
  topNotes: {
    note: string;
    score: number;
  }[];
};

function buildPromptToneGroups(prompts: NonNullable<ScanResult["protocolNotes"]>["prompts"]): PromptToneGroup[] {
  const groups = [
    {
      key: "base-tone",
      label: "Your Base Tone",
      title: "Opening",
      subheading: "This is you speaking naturally with no emotional triggers.",
      promptIndexes: [0, 1],
    },
    {
      key: "emotional",
      label: "Emotional",
      title: "Emotional",
      subheading: "This is where we introduced some emotional triggers into the conversation.",
      promptIndexes: [2, 3, 4],
    },
    {
      key: "future",
      label: "Future",
      title: "Future",
      subheading: "This is your subconscious dreams and balance coming through.",
      promptIndexes: [5],
    },
  ];

  return groups.map((group) => {
    const groupedPrompts = group.promptIndexes.map((index) => prompts[index]).filter(Boolean);
    const noteTotals = new Map<string, number>();

    groupedPrompts.forEach((prompt) => {
      prompt.noteScores?.forEach((entry) => {
        noteTotals.set(entry.note, (noteTotals.get(entry.note) ?? 0) + entry.score);
      });
    });

    const combinedNotes = Array.from(noteTotals.entries())
      .map(([note, score]) => ({ note, score }))
      .sort((a, b) => b.score - a.score);

    return {
      key: group.key,
      label: group.label,
      title: group.title,
      subheading: group.subheading,
      prompts: groupedPrompts,
      primaryNote: combinedNotes[0]?.note ?? groupedPrompts[0]?.primaryNote,
      durationMs: groupedPrompts.reduce((sum, prompt) => sum + (prompt.durationMs ?? 0), 0),
      topNotes: combinedNotes.slice(0, 3),
    };
  });
}

function getStatusNotes(
  scan: ScanResult | null,
  status: "underactive" | "overactive"
) {
  if (!scan?.noteEnergies?.length) {
    return status === "underactive"
      ? (scan?.missingBands ?? []).map((band) => band.label)
      : (scan?.excessBands ?? []).map((band) => band.label);
  }

  return scan.noteEnergies
    .filter((entry) => entry.status === status)
    .sort((a, b) =>
      status === "underactive" ? a.relativeEnergy - b.relativeEnergy : b.relativeEnergy - a.relativeEnergy
    )
    .slice(0, status === "underactive" ? 3 : 2)
    .map((entry) => entry.note);
}

export default function ResultsPage() {
  const [latest, setLatest] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLocalFallback = () => {
      if (typeof window === "undefined") return false;
      const stored = window.localStorage.getItem(LOCAL_SCAN_KEY);
      if (!stored) return false;
      try {
        setLatest(JSON.parse(stored) as ScanResult);
        return true;
      } catch (parseError) {
        console.error("Failed to parse local scan cache", parseError);
        return false;
      }
    };

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData?.user) {
          if (!loadLocalFallback()) {
            setError("Please sign in to view your cloud-saved results.");
          }
          return;
        }

        const { data, error: scanError } = await supabase
          .from("scans")
          .select("result")
          .eq("user_id", userData.user.id)
          .order("id", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (scanError) {
          console.error("Error fetching scan from Supabase", scanError);
          if (!loadLocalFallback()) {
            setError("Could not load your latest scan.");
          }
          return;
        }

        if (!data) {
          if (!loadLocalFallback()) {
            setLatest(null);
          }
          return;
        }

        setLatest(data.result as ScanResult);
      } catch (err) {
        console.error("Fatal error loading results", err);
        setError("Something went wrong loading your results.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const missingBands = useMemo(
    () => (latest?.missingBands?.length ? latest.missingBands : latest ? getLegacyMissingBands(latest) : []),
    [latest]
  );
  const excessBands = useMemo(
    () => (latest?.excessBands?.length ? latest.excessBands : latest ? getLegacyExcessBands(latest) : []),
    [latest]
  );
  const underactiveNotes = useMemo(() => getStatusNotes(latest, "underactive"), [latest]);
  const overactiveNotes = useMemo(() => getStatusNotes(latest, "overactive"), [latest]);
  const promptToneGroups = useMemo(
    () => (latest?.protocolNotes?.prompts?.length ? buildPromptToneGroups(latest.protocolNotes.prompts) : []),
    [latest]
  );

  return (
    <div className={styles.page}>
      <div className={styles.gridOverlay} />
      <main className={styles.shell}>
        {!loading && !error && latest ? (
          <ResonanceResultsDashboard
            soulTone={latest.noteInterpretation?.primaryNote ?? "F#"}
            frequencyHz={latest.voiceDynamics?.medianPitchHz ?? latest.coreFrequencyHz}
            medianMidi={latest.voiceDynamics?.medianMidi}
            noteEnergies={latest.noteEnergies}
          />
        ) : null}

        {loading ? <div className={styles.stateCard}>Loading your latest scan...</div> : null}
        {!loading && error ? <div className={`${styles.stateCard} ${styles.stateError}`}>{error}</div> : null}
        {!loading && !error && !latest ? (
          <div className={styles.stateCard}>No scans found. Complete a new guided scan to generate a result.</div>
        ) : null}

        {!loading && !error && latest ? (
          <>
            <section className={styles.summaryGrid}>
              <article className={styles.summaryCard}>
                <span className={styles.cardLabel}>Dominant note</span>
                <h2 className={styles.cardValue}>{latest.dominantBandLabel ?? "Legacy scan"}</h2>
                <p className={styles.cardText}>
                  {latest.summary} Read this as the place your voice is currently doing the most work,
                  not just the loudest part of the chart.
                </p>
              </article>
              <article className={styles.metricCard}>
                <span className={styles.cardLabel}>Core tone</span>
                <strong className={styles.metricValue}>
                  {latest.noteInterpretation?.primaryNote ?? latest.dominantBandLabel ?? "—"}
                </strong>
              </article>
              <article className={styles.metricCard}>
                <span className={styles.cardLabel}>Resonance</span>
                <strong className={styles.metricValue}>{Math.round((latest.resonanceScore ?? 0) * 100)}%</strong>
              </article>
              <article className={styles.metricCard}>
                <span className={styles.cardLabel}>Spectral centroid</span>
                <strong className={styles.metricValue}>{latest.spectralCentroidHz} Hz</strong>
              </article>
              <article className={styles.metricCard}>
                <span className={styles.cardLabel}>Pitch center</span>
                <strong className={styles.metricValue}>
                  {latest.voiceDynamics?.medianPitchHz
                    ? `${latest.voiceDynamics.medianPitchHz} Hz`
                    : "Spectrum"}
                </strong>
              </article>
              <article className={styles.metricCard}>
                <span className={styles.cardLabel}>Voiced signal</span>
                <strong className={styles.metricValue}>
                  {latest.voiceDynamics
                    ? `${Math.round(latest.voiceDynamics.voicedFrameRatio * 100)}%`
                    : "—"}
                </strong>
              </article>
              <article className={styles.metricCard}>
                <span className={styles.cardLabel}>Pause count</span>
                <strong className={styles.metricValue}>
                  {latest.voiceDynamics?.pauseCount ?? "—"}
                </strong>
              </article>
            </section>
            <section className={styles.quickReadGrid}>
              <article className={`${styles.quickCard} ${styles.quickDeficient}`}>
                <span className={styles.quickLabel}>Deficient notes</span>
                <p className={styles.quickText}>
                  {underactiveNotes.length
                    ? `${underactiveNotes.join(", ")} may be the places where your voice is holding back, thinning out, or losing support.`
                    : "No strong deficits detected."}
                </p>
              </article>
              <article className={`${styles.quickCard} ${styles.quickExcess}`}>
                <span className={styles.quickLabel}>Excess notes</span>
                <p className={styles.quickText}>
                  {overactiveNotes.length
                    ? `${overactiveNotes.join(", ")} may be carrying extra pressure, compensation, or stress load in the current pattern.`
                    : "No overload notes detected."}
                </p>
              </article>
            </section>
            {promptToneGroups.length ? (
              <section className={styles.rangeSection}>
                <div className={styles.rangeHeader}>
                  <div>
                    <p className={styles.planEyebrow}>Vocal Tone</p>
                    <h2 className={styles.rangeTitle}>Your Expressed Tones</h2>
                  </div>
                </div>

                <div className={styles.rangeGrid}>
                  {promptToneGroups.map((group) => {
                    return (
                      <article key={group.key} className={styles.rangeCard}>
                        <span className={styles.rangeLabel}>{group.label}</span>
                        <h3 className={styles.rangeCardTitle}>{group.title}</h3>
                        <p className={styles.rangePrompt}>{group.subheading}</p>
                        <div className={styles.rangeMeta}>
                          <span className={styles.rangePill}>
                            Primary note {group.primaryNote ?? "—"}
                          </span>
                          {typeof group.durationMs === "number" && group.durationMs > 0 ? (
                            <span className={styles.rangePill}>
                              {Math.round(group.durationMs / 1000)}s
                            </span>
                          ) : null}
                        </div>
                        <div className={styles.rangeScores}>
                          {group.topNotes.length ? (
                            group.topNotes.map((entry) => (
                              <div key={`${group.key}-${entry.note}`} className={styles.rangeScoreCard}>
                                <div className={styles.rangeScoreTop}>
                                  <span
                                    className={styles.rangeScoreNote}
                                    style={{ color: getSoulScopeNoteColor(entry.note) }}
                                  >
                                    {entry.note}
                                  </span>
                                  <span className={styles.rangeScoreValue}>{entry.score.toFixed(1)}</span>
                                </div>
                                <div className={styles.rangeScoreTrack}>
                                  <div
                                    className={styles.rangeScoreFill}
                                    style={{
                                      width: `${Math.max(12, Math.min(100, Math.round((entry.score / 60) * 100)))}%`,
                                      background: `linear-gradient(90deg, ${getSoulScopeNoteColor(entry.note)}55, ${getSoulScopeNoteColor(entry.note)})`,
                                    }}
                                  />
                                </div>
                              </div>
                            ))
                          ) : (
                            <span className={styles.rangeEmpty}>Grouped note breakdown unavailable.</span>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ) : null}

            <section className={styles.footerNote}>
              <p>{latest.methodology}</p>
              <p>{latest.caution}</p>
              <div className={styles.footerAction}>
                <Link href="/scan" className={styles.primaryButton}>
                  Run New Scan
                </Link>
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
