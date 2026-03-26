"use client";

import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ResonanceResultsDashboard from "../../components/ResonanceResultsDashboard";
import TonePlayer from "../../components/TonePlayer";
import { getSoulScopeNoteColor } from "../../lib/noteSystem";
import { supabase } from "../../lib/supabaseClient";
import { type SpectrumBandResult, type VoiceAnalysisResult } from "../../lib/voiceSpectrum";
import styles from "./ResultDetail.module.css";

type ScanResult = VoiceAnalysisResult & {
  face?: {
    emotion: string;
    focusScore: number;
  };
  chakraScores?: Record<string, number>;
  dominant?: string;
};

type ScanRow = {
  result: ScanResult;
};

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

function FocusCard({
  label,
  value,
  text,
}: {
  label: string;
  value: string;
  text: string;
}) {
  return (
    <article className={styles.focusCard}>
      <span className={styles.focusLabel}>{label}</span>
      <h3 className={styles.focusValue}>{value}</h3>
      <p className={styles.focusText}>{text}</p>
    </article>
  );
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
  const router = useRouter();
  const { id } = router.query;
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || typeof id !== "string") return;

    const fetchScan = async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("scans")
        .select("result")
        .eq("id", id)
        .single<ScanRow>();

      if (fetchError) {
        setError(fetchError.message);
        setScan(null);
      } else {
        setScan(data?.result ?? null);
      }

      setLoading(false);
    };

    void fetchScan();
  }, [id]);

  const missingBands = useMemo(
    () => scan?.missingBands ?? (scan ? getLegacyMissingBands(scan) : []),
    [scan]
  );
  const excessBands = useMemo(
    () => scan?.excessBands ?? (scan ? getLegacyExcessBands(scan) : []),
    [scan]
  );
  const underactiveNotes = useMemo(() => getStatusNotes(scan, "underactive"), [scan]);
  const overactiveNotes = useMemo(() => getStatusNotes(scan, "overactive"), [scan]);
  const promptToneGroups = useMemo(
    () => (scan?.protocolNotes?.prompts?.length ? buildPromptToneGroups(scan.protocolNotes.prompts) : []),
    [scan]
  );

  const primaryConcern = missingBands[0] ?? null;
  const primaryExcess = excessBands[0] ?? null;

  return (
    <div className={styles.page}>
      <div className={styles.gridOverlay} />
      <main className={styles.shell}>
        {loading ? <div className={styles.stateCard}>Retrieving your voice profile...</div> : null}
        {error ? <div className={`${styles.stateCard} ${styles.stateError}`}>{error}</div> : null}

        {scan ? (
          <>
            <section className={styles.hero}>
              <div className={styles.heroMain}>
                <p className={styles.eyebrow}>Composite Voiceprint</p>
                <h1 className={styles.title}>
                  {scan.dominantBandLabel} is
                  <span className={styles.titleAccent}> carrying the signal.</span>
                </h1>
                <p className={styles.lead}>
                  {scan.summary} This page combines two layers: measured speech spectrum analysis and the
                  SoulScope note interpretation model built on top of that signal. The composite note score
                  totals 360, with 30 as the balanced target for each of the 12 notes.
                </p>

                <div className={styles.heroActions}>
                  <Link href="/scan" className={styles.primaryButton}>
                    New Scan
                  </Link>
                  <Link href="/results" className={styles.secondaryButton}>
                    Latest Result
                  </Link>
                </div>
              </div>

              <aside className={styles.snapshotPanel}>
                <span className={styles.snapshotLabel}>Signal snapshot</span>
                <div className={styles.snapshotGrid}>
                  <div className={styles.snapshotCard}>
                    <span className={styles.snapshotMetricLabel}>Resonance score</span>
                    <strong className={styles.snapshotMetricValue}>
                      {Math.round((scan.resonanceScore ?? 0) * 100)}%
                    </strong>
                  </div>
                  <div className={styles.snapshotCard}>
                    <span className={styles.snapshotMetricLabel}>Spectral centroid</span>
                    <strong className={styles.snapshotMetricValue}>{scan.spectralCentroidHz} Hz</strong>
                  </div>
                  <div className={styles.snapshotCard}>
                    <span className={styles.snapshotMetricLabel}>Pitch center</span>
                    <strong className={styles.snapshotMetricValue}>
                      {scan.voiceDynamics?.medianPitchHz
                        ? `${scan.voiceDynamics.medianPitchHz} Hz`
                        : "Spectrum"}
                    </strong>
                  </div>
                  <div className={styles.snapshotCard}>
                    <span className={styles.snapshotMetricLabel}>Pause count</span>
                    <strong className={styles.snapshotMetricValue}>
                      {scan.voiceDynamics?.pauseCount ?? "—"}
                    </strong>
                  </div>
                </div>
                {scan.coreFrequencyHz ? (
                  <div className={styles.toneWrap}>
                    <TonePlayer frequency={scan.coreFrequencyHz} label="Play Reference Tone" />
                  </div>
                ) : null}
              </aside>
            </section>

            <ResonanceResultsDashboard
              soulTone={scan.noteInterpretation?.primaryNote ?? "F#"}
              frequencyHz={scan.voiceDynamics?.medianPitchHz ?? scan.coreFrequencyHz}
              medianMidi={scan.voiceDynamics?.medianMidi}
              noteEnergies={scan.noteEnergies}
            />

            <section className={styles.focusGrid}>
              <FocusCard
                label="Core tone"
                value={scan.noteInterpretation?.primaryNote ?? scan.dominantBandLabel ?? "Unavailable"}
                text="Primary note anchor estimated from the strongest measured energy in your guided sample."
              />
              <FocusCard
                label="Primary note"
                value={scan.dominantBandLabel ?? "Unknown"}
                text={
                  scan.voiceDynamics?.primaryNoteSource === "tracked-pitch"
                    ? "The measured note class was led by tracked voiced pitch across the prompts."
                    : "Tracked pitch was limited, so the broader spectrum carried the primary note read."
                }
              />
              <FocusCard
                label="Main deficit"
                value={primaryConcern?.label ?? "None detected"}
                text={
                  primaryConcern
                    ? primaryConcern.note
                    : "No major low-support note stood out in this result."
                }
              />
              <FocusCard
                label="Main excess"
                value={primaryExcess?.label ?? "None detected"}
                text={
                  primaryExcess
                    ? primaryExcess.note
                    : "No major overload note stood out in this result."
                }
              />
            </section>
            {promptToneGroups.length ? (
              <section className={styles.rangeSection}>
                <div className={styles.rangeHeader}>
                  <div>
                    <p className={styles.sectionEyebrow}>Vocal Tone</p>
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
                            <span className={styles.emptyText}>Grouped note breakdown unavailable.</span>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ) : null}

            <section className={styles.analysisGrid}>
              <article className={styles.analysisCard}>
                <p className={styles.sectionEyebrow}>Measured findings</p>
                <div className={styles.chipBlock}>
                  <span className={`${styles.chipLabel} ${styles.chipDeficient}`}>Deficient notes</span>
                  <div className={styles.chips}>
                    {missingBands.length > 0 ? (
                      missingBands.map((band) => (
                        <span key={band.key} className={`${styles.chip} ${styles.chipDeficient}`}>
                          {band.label}
                        </span>
                      ))
                    ) : (
                      <span className={styles.emptyText}>No strong deficits detected.</span>
                    )}
                  </div>
                </div>

                <div className={styles.chipBlock}>
                  <span className={`${styles.chipLabel} ${styles.chipExcess}`}>Excess notes</span>
                  <div className={styles.chips}>
                    {excessBands.length > 0 ? (
                      excessBands.map((band) => (
                        <span key={band.key} className={`${styles.chip} ${styles.chipExcess}`}>
                          {band.label}
                        </span>
                      ))
                    ) : (
                      <span className={styles.emptyText}>No strong overload notes detected.</span>
                    )}
                  </div>
                </div>

                <div className={styles.findingsList}>
                  {(scan.findings ?? []).slice(0, 4).map((finding) => (
                    <div key={finding} className={styles.findingCard}>
                      {finding}
                    </div>
                  ))}
                </div>
              </article>

              <article className={styles.analysisCard}>
                <div className={styles.planHeader}>
                  <div>
                    <p className={styles.sectionEyebrow}>SoulScope interpretation</p>
                    <h2 className={styles.planTitle}>Work the weak notes, calm the overloaded ones.</h2>
                  </div>
                  {scan.face ? (
                    <div className={styles.faceCard}>
                      <span className={styles.faceLabel}>Context</span>
                      <strong className={styles.faceValue}>{scan.face.emotion}</strong>
                      <span className={styles.faceMeta}>
                        Focus {Math.round((scan.face.focusScore ?? 0) * 100)}%
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className={styles.planGrid}>
                  {scan.noteInterpretation ? (
                    <article className={styles.planCard}>
                      <p className={styles.planText}>
                        <strong>{scan.noteInterpretation.primaryNote}</strong> is the primary note anchor in this
                        scan, with <strong>{scan.noteInterpretation.oppositeNote}</strong> read as the opposite
                        pole.
                      </p>
                      <p className={styles.planText}>
                        The statements below are part of the SoulScope proprietary interpretation model, not
                        direct medical findings from the acoustic measurement itself.
                      </p>
                      <p className={styles.planText}>{scan.noteInterpretation.emotionalPattern}</p>
                      <p className={styles.planText}>{scan.noteInterpretation.physicalPattern}</p>
                      <p className={styles.planText}>{scan.noteInterpretation.oppositePattern}</p>
                      {scan.noteInterpretation.progression?.map((item) => (
                        <p key={item} className={styles.planText}>
                          {item}
                        </p>
                      ))}
                    </article>
                  ) : null}
                  {(scan.supportPlan ?? []).length > 0 ? (
                    scan.supportPlan.map((step) => (
                      <article key={step} className={styles.planCard}>
                        <p className={styles.planText}>{step}</p>
                      </article>
                    ))
                  ) : (
                    <article className={styles.planCard}>
                      <p className={styles.planText}>No guided plan is available for this saved scan.</p>
                    </article>
                  )}
                </div>
              </article>
            </section>

            <section className={styles.footerNote}>
              <p>{scan.methodology}</p>
              <p>{scan.caution}</p>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
