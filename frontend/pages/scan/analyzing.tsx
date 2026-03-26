import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { buildCymaticReference } from "../../lib/cymatics";
import {
  type GuidedScanAnswer,
  getGuidedScanAnswers,
  getGuidedScanStartedAt,
  resetGuidedScanSession,
} from "../../lib/guidedScanSession";
import { NOTE_ORDER, getSoulScopeNoteProfile } from "../../lib/noteSystem";
import {
  analyzeVoiceSpectrum,
  mergeVoiceAnalyses,
  type VoiceAnalysisResult,
} from "../../lib/voiceSpectrum";
import { getLocalDevSession, LOCAL_SCAN_KEY, LOCAL_SCAN_LIST_KEY } from "../../lib/localSession";
import {
  GUIDED_SCAN_QUESTIONS,
  RESEARCH_REFERENCES,
  SCAN_OVERVIEW_LINES,
  VALIDATION_NOTE,
} from "../../lib/scanProtocol";
import styles from "./Analyzing.module.css";

type SavedScanResult = VoiceAnalysisResult & {
  id?: string;
  created_at?: string;
};

type InsertedScanRow = {
  id: string;
  created_at: string;
};

const CLOUD_REQUEST_TIMEOUT_MS = 4500;

async function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number, label: string) {
  return await new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (reason) => {
        window.clearTimeout(timer);
        reject(reason);
      }
    );
  });
}

function buildFallbackResult(
  answers: GuidedScanAnswer[],
  reason?: string
): SavedScanResult {
  const fallbackNote = "F#";
  const noteProfile = getSoulScopeNoteProfile(fallbackNote);
  const totalDurationMs = answers.reduce((sum, answer) => sum + answer.durationMs, 0);

  return {
    summary:
      "We captured your scan, but the signal was too low for a full spectral read. This fallback result keeps the flow moving while indicating that the next scan should be recorded louder and closer to the mic.",
    coreFrequencyHz: 185,
    spectralCentroidHz: 980,
    resonanceScore: 0.42,
    dominantBand: fallbackNote,
    dominantBandLabel: fallbackNote,
    noteEnergies: NOTE_ORDER.map((note) => ({
      note,
      score: note === fallbackNote ? 34 : 29.6,
      relativeEnergy: note === fallbackNote ? 0.094 : 0.082,
      status: note === fallbackNote ? "balanced" : "balanced",
    })),
    spectrumBands: [],
    missingBands: [],
    excessBands: [],
    findings: [
      "The capture reached the app, but the recorded level was too low for reliable voiced-frame analysis.",
      "A fallback result was generated so the scan can complete instead of stalling on the analyzing screen.",
      reason ?? "Retry with the microphone closer to your mouth and speak in a steady conversational voice.",
    ],
    supportPlan: [
      "Retry the scan in a quieter room with the microphone closer to your mouth.",
      "Speak continuously for each prompt instead of pausing for long stretches.",
      "If you are using a headset or Bluetooth mic, switch to the built-in microphone for comparison.",
    ],
    noteInterpretation: {
      primaryNote: noteProfile.note,
      oppositeNote: noteProfile.opposite,
      emotionalPattern: noteProfile.emotionOveractive,
      physicalPattern: `Physical correlates in this model include ${noteProfile.physicalCorrelates.join(", ")}.`,
      oppositePattern: `${noteProfile.opposite} is treated as the opposite note and may reflect balancing pressure on the same pattern.`,
      progression: noteProfile.progression,
    },
    methodology:
      "Fallback completion path used when the guided scan cannot extract enough voiced signal for a full spectrum analysis.",
    caution:
      "This fallback result indicates capture quality was insufficient for the full analysis. It is not a measured voice-spectrum reading.",
    voiceDynamics: {
      analyzedDurationMs: Math.round(totalDurationMs),
      voicedDurationMs: 0,
      silenceDurationMs: Math.round(totalDurationMs),
      voicedFrameRatio: 0,
      voicedFrameCount: 0,
      pitchFrameCount: 0,
      pauseCount: answers.length,
      averagePauseMs: 0,
      longestPauseMs: 0,
      medianPitchHz: null,
      lowPitchHz: null,
      highPitchHz: null,
      medianMidi: null,
      dominantOctave: null,
      pitchRangeHz: 0,
      pitchRangeSemitones: 0,
      pitchStability: 0,
      pitchClarity: 0,
      primaryNoteSource: "spectral-fallback",
    },
    cymaticReference: buildCymaticReference(noteProfile.note),
    protocolNotes: {
      overview: SCAN_OVERVIEW_LINES,
      prompts: GUIDED_SCAN_QUESTIONS.map((question, index) => ({
        id: question.id,
        title: question.title,
        rangeLabel: question.rangeLabel,
        prompt: question.prompt,
        rationale: question.rationale,
        durationMs: answers[index]?.durationMs,
      })),
    },
    researchBasis: {
      validationNote: VALIDATION_NOTE,
      references: RESEARCH_REFERENCES,
    },
    created_at: new Date().toISOString(),
  };
}

export default function ScanAnalyzingPage() {
  const router = useRouter();
  const startedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const run = async () => {
      const answers = await getGuidedScanAnswers();
      if (!answers.length) {
        void router.replace("/scan");
        return;
      }

      try {
        const settled = await Promise.allSettled(
          answers.map((answer) => analyzeVoiceSpectrum(answer.blob))
        );
        const analyses = settled
          .filter((result): result is PromiseFulfilledResult<VoiceAnalysisResult> => result.status === "fulfilled")
          .map((result) => result.value);
        const promptAnalyses = settled.map((result) =>
          result.status === "fulfilled" ? result.value : null
        );

        const analysisFailure = settled.find(
          (result): result is PromiseRejectedResult => result.status === "rejected"
        );
        const merged = analyses.length === 1 ? analyses[0] : analyses.length > 1 ? mergeVoiceAnalyses(analyses) : null;

        const result: SavedScanResult = merged
          ? {
              ...merged,
              cymaticReference: buildCymaticReference(merged.noteInterpretation?.primaryNote),
              protocolNotes: {
                overview: SCAN_OVERVIEW_LINES,
                prompts: GUIDED_SCAN_QUESTIONS.map((question, index) => ({
                  id: question.id,
                  title: question.title,
                  rangeLabel: question.rangeLabel,
                  prompt: question.prompt,
                  rationale: question.rationale,
                  durationMs: answers[index]?.durationMs,
                  primaryNote: promptAnalyses[index]?.noteInterpretation?.primaryNote,
                  noteScores:
                    promptAnalyses[index]?.noteEnergies?.map((entry) => ({
                      note: entry.note,
                      score: entry.score,
                    })) ?? [],
                })),
              },
              researchBasis: {
                validationNote: VALIDATION_NOTE,
                references: RESEARCH_REFERENCES,
              },
              created_at: new Date().toISOString(),
            }
          : buildFallbackResult(
              answers,
              analysisFailure?.reason instanceof Error
                ? analysisFailure.reason.message
                : "Not enough prompt responses were analyzable for the full scan."
            );

        if (typeof window !== "undefined") {
          window.localStorage.setItem(LOCAL_SCAN_KEY, JSON.stringify(result));
          const existing = window.localStorage.getItem(LOCAL_SCAN_LIST_KEY);
          const parsed = existing ? (JSON.parse(existing) as SavedScanResult[]) : [];
          window.localStorage.setItem(
            LOCAL_SCAN_LIST_KEY,
            JSON.stringify([result, ...parsed].slice(0, 10))
          );
        }

        const localSession = getLocalDevSession();
        const finishLocally = () => {
          resetGuidedScanSession();
          void router.replace("/results");
        };

        if (localSession) {
          finishLocally();
          return;
        }

        let userData: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"] | null = null;
        let userError: Awaited<ReturnType<typeof supabase.auth.getUser>>["error"] | null = null;

        try {
          const authResponse = await withTimeout(
            supabase.auth.getUser(),
            CLOUD_REQUEST_TIMEOUT_MS,
            "Supabase auth"
          );
          userData = authResponse.data;
          userError = authResponse.error;
        } catch (authError) {
          console.error("Timed out loading Supabase user for guided scan", authError);
          finishLocally();
          return;
        }

        if (userError || !userData?.user) {
          finishLocally();
          return;
        }

        let insertedScan: InsertedScanRow | null = null;
        let insertError: Error | null = null;

        try {
          const insertResponse = await withTimeout<{
            data: InsertedScanRow | null;
            error: Error | null;
          }>(
            supabase
              .from("scans")
              .insert({
                user_id: userData.user.id,
                result: {
                  ...result,
                  scanMeta: {
                    startedAt: getGuidedScanStartedAt(),
                    completedAt: new Date().toISOString(),
                    source: "authenticated",
                  },
                },
              })
              .select("id, created_at")
              .single(),
            CLOUD_REQUEST_TIMEOUT_MS,
            "Supabase scan save"
          );
          insertedScan = insertResponse.data;
          insertError = insertResponse.error;
        } catch (saveError) {
          console.error("Timed out saving guided scan row", saveError);
          finishLocally();
          return;
        }

        if (insertError || !insertedScan) {
          console.error("Failed to insert guided scan row", insertError);
          finishLocally();
          return;
        }

        if (typeof window !== "undefined") {
          const savedResult = {
            ...result,
            id: insertedScan.id,
            created_at: insertedScan.created_at,
          };
          window.localStorage.setItem(LOCAL_SCAN_KEY, JSON.stringify(savedResult));
          const existing = window.localStorage.getItem(LOCAL_SCAN_LIST_KEY);
          const parsed = existing ? (JSON.parse(existing) as SavedScanResult[]) : [];
          window.localStorage.setItem(
            LOCAL_SCAN_LIST_KEY,
            JSON.stringify([savedResult, ...parsed.filter((scan) => scan.id !== savedResult.id)].slice(0, 10))
          );
        }

        resetGuidedScanSession();
        void router.replace(`/results/${insertedScan.id}`);
      } catch (analysisError) {
        console.error("Guided scan analysis failed", analysisError);
        setError(
          analysisError instanceof Error
            ? analysisError.message
            : "Analysis failed. Please retry the scan."
        );
      }
    };

    void run();
  }, [router]);

  return (
    <>
      <Head>
        <title>Analyzing Scan | SoulScope</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={styles.page}>
        <div className={styles.gridOverlay} />
        <main className={styles.shell}>
          <section className={styles.panel}>
            <article className={styles.heroCard}>
              <p className={styles.eyebrow}>Analyzing</p>
              <h1 className={styles.title}>Analyzing your resonance…</h1>
              <p className={styles.lead}>
                Mapping vocal patterns, identifying dominant frequencies, and translating your
                expression into a voice read you can actually understand.
              </p>

              <div className={styles.mapVisual}>
                <div className={styles.mapGlow} />
                <div className={styles.mapCore}>
                  <div className={styles.mapRing} />
                  <div className={styles.mapRingInner} />
                  <div className={styles.mapNode} />
                </div>
              </div>

              <div className={styles.progressRow}>
                <div className={styles.progressCard}>
                  <span className={styles.cardLabel}>Step 1</span>
                  <strong className={styles.progressValue}>Patterns</strong>
                  <p className={styles.progressText}>
                    Mapping vocal patterns across the full speaking sample.
                  </p>
                </div>
                <div className={styles.progressCard}>
                  <span className={styles.cardLabel}>Step 2</span>
                  <strong className={styles.progressValue}>Frequencies</strong>
                  <p className={styles.progressText}>
                    Identifying your dominant frequencies and pitch center.
                  </p>
                </div>
                <div className={styles.progressCard}>
                  <span className={styles.cardLabel}>Step 3</span>
                  <strong className={styles.progressValue}>Expression</strong>
                  <p className={styles.progressText}>
                    Translating how your resonance is being expressed.
                  </p>
                </div>
              </div>
            </article>

            <aside className={styles.statusCard}>
              <div className={styles.statusOrbWrap}>
                <div className={styles.statusOrbGlow} />
                <div className={styles.statusOrb} />
              </div>
              <div className={styles.statusBody}>
                <p className={styles.statusLine}>
                  Measured layer: voiced speech only, pitch center, note balance, and the breaks between phrases.
                </p>
                <p className={styles.statusLine}>
                  SoulScope layer: your core resonance, the note map around it, and the first self-discovery readout.
                </p>
                {error ? <p className={`${styles.statusLine} ${styles.error}`}>{error}</p> : null}
              </div>
            </aside>
          </section>
        </main>
      </div>
    </>
  );
}
