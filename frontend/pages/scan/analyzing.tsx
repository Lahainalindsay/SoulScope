import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { buildCymaticReference } from "../../lib/cymatics";
import {
  type GuidedScanAnswer,
  getGuidedScanCameraBaseline,
  getGuidedScanCameraCaptures,
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
import { buildSoulScopeReport } from "../../lib/buildSoulScopeReport";
import { persistCanonicalReport } from "../../lib/reportPersistence";
import { LOCAL_SCAN_KEY, LOCAL_SCAN_LIST_KEY } from "../../lib/localSession";
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
const ANALYSIS_REQUEST_TIMEOUT_MS = 15000;
const ENABLE_ANALYSIS_FALLBACK = false;

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

function averageCameraMetrics(
  captures: ReturnType<typeof getGuidedScanCameraCaptures>
) {
  if (!captures.length) {
    return null;
  }

  const totalFrames = captures.reduce((sum, capture) => sum + Math.max(1, capture.framesAnalyzed), 0);
  const weightedAverage = (
    selector: (capture: (typeof captures)[number]) => number
  ) =>
    captures.reduce(
      (sum, capture) => sum + selector(capture) * Math.max(1, capture.framesAnalyzed),
      0
    ) / totalFrames;

  return {
    blinkRatePerMin: Number(weightedAverage((capture) => capture.blinkRatePerMin).toFixed(1)),
    facialTension: Number(weightedAverage((capture) => capture.facialTension).toFixed(3)),
    eyeDilationProxy: Number(weightedAverage((capture) => capture.eyeDilationProxy).toFixed(3)),
    eyeOpenness: Number(weightedAverage((capture) => capture.eyeOpenness).toFixed(3)),
    trackingConfidence: Number(weightedAverage((capture) => capture.trackingConfidence).toFixed(3)),
    framesAnalyzed: captures.reduce((sum, capture) => sum + capture.framesAnalyzed, 0),
  };
}

function buildFallbackResult(
  answers: GuidedScanAnswer[],
  cameraCaptures: ReturnType<typeof getGuidedScanCameraCaptures>,
  cameraBaseline: ReturnType<typeof getGuidedScanCameraBaseline>,
  reason?: string
): SavedScanResult {
  const fallbackNote = "F#";
  const noteProfile = getSoulScopeNoteProfile(fallbackNote);
  const totalDurationMs = answers.reduce((sum, answer) => sum + answer.durationMs, 0);

  return {
    summary:
      "We captured your Resonance Scan, but the signal was too low for a full pattern read. This fallback result keeps the flow moving while indicating that the next Resonance Scan should be recorded louder and closer to the mic.",
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
      "A fallback result was generated so the Resonance Scan can complete instead of stalling on the analyzing screen.",
      reason ?? "Retry with the microphone closer to your mouth and speak in a steady conversational voice.",
    ],
    supportPlan: [
      "Retry the Resonance Scan in a quieter room with the microphone closer to your mouth.",
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
      "Fallback completion path used when the Resonance Scan cannot extract enough voiced signal for a full pattern analysis.",
    caution:
      "This fallback result indicates capture quality was insufficient for the full analysis. It is not a measured voice-spectrum reading.",
    voiceDynamics: {
      analyzedDurationMs: Math.round(totalDurationMs),
      voicedDurationMs: 0,
      silenceDurationMs: Math.round(totalDurationMs),
      activeFrameRatio: 0,
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
      jitterLocalPct: 0,
      shimmerLocalPct: 0,
      harmonicToNoiseRatioDb: 0,
      harmonicRichness: 0,
      spectralFlatness: 1,
      zeroCrossingRate: 0,
      pauseDensityPerMin: 0,
      speechRateProxyPerMin: 0,
      formantStability: 0,
      formantDynamics: 0,
      clippingFrameRatio: 0,
      captureQuality: "poor",
      captureRecommendation:
        "Signal quality was weak. Move closer to the microphone, reduce room noise, and speak continuously for a stronger result.",
      primaryNoteSource: "spectral-fallback",
    },
    cymaticReference: buildCymaticReference(noteProfile.note),
    protocolNotes: {
      overview: SCAN_OVERVIEW_LINES,
      camera: averageCameraMetrics(cameraCaptures) ?? undefined,
      cameraBaseline: cameraBaseline ?? undefined,
        prompts: GUIDED_SCAN_QUESTIONS.map((question, index) => ({
          id: question.id,
          title: question.title,
          rangeLabel: question.rangeLabel,
          prompt: question.prompt,
          rationale: question.rationale,
          durationMs: answers[index]?.durationMs,
          captureKind: question.captureKind,
          camera: cameraCaptures[index]
            ? {
              blinkRatePerMin: cameraCaptures[index].blinkRatePerMin,
              facialTension: cameraCaptures[index].facialTension,
              eyeDilationProxy: cameraCaptures[index].eyeDilationProxy,
              eyeOpenness: cameraCaptures[index].eyeOpenness,
              trackingConfidence: cameraCaptures[index].trackingConfidence,
              framesAnalyzed: cameraCaptures[index].framesAnalyzed,
            }
          : undefined,
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
      const cameraCaptures = getGuidedScanCameraCaptures();
      const cameraBaseline = getGuidedScanCameraBaseline();
      if (!answers.length) {
        void router.replace("/scan");
        return;
      }

      try {
        const settled = await Promise.allSettled(
          answers.map((answer, index) =>
            withTimeout(
              analyzeVoiceSpectrum(answer.blob, {
                captureKind: GUIDED_SCAN_QUESTIONS[index]?.captureKind,
                captureDurationMs: answer.durationMs,
              }),
              ANALYSIS_REQUEST_TIMEOUT_MS,
              `Voice analysis for ${answer.questionId}`
            )
          )
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

        const fallbackReason =
          analysisFailure?.reason instanceof Error
            ? analysisFailure.reason.message
            : "Not enough prompt responses were analyzable for the full Resonance Scan.";

        const result: SavedScanResult | null = merged
          ? {
              ...merged,
              cymaticReference: buildCymaticReference(merged.noteInterpretation?.primaryNote),
              protocolNotes: {
                overview: SCAN_OVERVIEW_LINES,
                camera: averageCameraMetrics(cameraCaptures) ?? undefined,
                cameraBaseline: cameraBaseline ?? undefined,
                prompts: GUIDED_SCAN_QUESTIONS.map((question, index) => ({
                  id: question.id,
                  title: question.title,
                  rangeLabel: question.rangeLabel,
                  prompt: question.prompt,
                  rationale: question.rationale,
                  durationMs: answers[index]?.durationMs,
                  captureKind: question.captureKind,
                  camera: cameraCaptures[index]
                    ? {
                        blinkRatePerMin: cameraCaptures[index].blinkRatePerMin,
                        facialTension: cameraCaptures[index].facialTension,
                        eyeDilationProxy: cameraCaptures[index].eyeDilationProxy,
                        eyeOpenness: cameraCaptures[index].eyeOpenness,
                        trackingConfidence: cameraCaptures[index].trackingConfidence,
                        framesAnalyzed: cameraCaptures[index].framesAnalyzed,
                      }
                    : undefined,
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
          : ENABLE_ANALYSIS_FALLBACK
          ? buildFallbackResult(answers, cameraCaptures, cameraBaseline, fallbackReason)
          : null;

        if (!result) {
          setError(`Analysis did not produce a usable result: ${fallbackReason}`);
          return;
        }

        if (typeof window !== "undefined") {
          window.localStorage.setItem(LOCAL_SCAN_KEY, JSON.stringify(result));
          const existing = window.localStorage.getItem(LOCAL_SCAN_LIST_KEY);
          const parsed = existing ? (JSON.parse(existing) as SavedScanResult[]) : [];
          window.localStorage.setItem(
            LOCAL_SCAN_LIST_KEY,
            JSON.stringify([result, ...parsed].slice(0, 10))
          );
        }

        resetGuidedScanSession();

        void (async () => {
          try {
            const authResponse = await withTimeout(
              supabase.auth.getUser(),
              CLOUD_REQUEST_TIMEOUT_MS,
              "Supabase auth"
            );
            const userData = authResponse.data;
            const userError = authResponse.error;
            if (userError || !userData?.user) {
              console.error(userError?.message ?? "No Supabase user is signed in. Result was not saved to Supabase.");
              return;
            }

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

            if (insertResponse.error || !insertResponse.data) {
              console.error("Failed to insert guided scan row", insertResponse.error);
              return;
            }

            try {
              const report = buildSoulScopeReport(result as VoiceAnalysisResult);
              await persistCanonicalReport(supabase, {
                scanId: insertResponse.data.id,
                userId: userData.user.id,
                report,
              });
            } catch (persistError) {
              console.error("Failed to persist canonical resonance report", persistError);
            }

            if (typeof window !== "undefined") {
              const savedResult = {
                ...result,
                id: insertResponse.data.id,
                created_at: insertResponse.data.created_at,
              };
              window.localStorage.setItem(LOCAL_SCAN_KEY, JSON.stringify(savedResult));
              const existing = window.localStorage.getItem(LOCAL_SCAN_LIST_KEY);
              const parsed = existing ? (JSON.parse(existing) as SavedScanResult[]) : [];
              window.localStorage.setItem(
                LOCAL_SCAN_LIST_KEY,
                JSON.stringify([savedResult, ...parsed.filter((scan) => scan.id !== savedResult.id)].slice(0, 10))
              );
            }
          } catch (saveError) {
            console.error("Background Supabase save failed", saveError);
          }
        })();

        void router.replace("/results");
      } catch (analysisError) {
        console.error("Guided scan analysis failed", analysisError);
        setError(
          analysisError instanceof Error
            ? analysisError.message
            : "Analysis failed. Please retry the Resonance Scan."
        );
      }
    };

    void run();
  }, [router]);

  return (
    <>
      <Head>
        <title>Building Insights | SoulScope</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={styles.page}>
        <div className={styles.gridOverlay} />
        <main className={styles.shell}>
          <section className={styles.panel}>
            <article className={styles.heroCard}>
              <p className={styles.eyebrow}>Building Insights</p>
              <h1 className={styles.title}>Mapping your current resonance…</h1>
              <p className={styles.lead}>
                Translating your voice patterns into a whole-self view of clarity, expression, load,
                recovery, and adaptability.
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
                    Mapping patterns across the full speaking sample.
                  </p>
                </div>
                <div className={styles.progressCard}>
                  <span className={styles.cardLabel}>Step 2</span>
                  <strong className={styles.progressValue}>State</strong>
                  <p className={styles.progressText}>
                    Looking for signals associated with balance, strain, and adaptation.
                  </p>
                </div>
                <div className={styles.progressCard}>
                  <span className={styles.cardLabel}>Step 3</span>
                  <strong className={styles.progressValue}>Insights</strong>
                  <p className={styles.progressText}>
                    Translating complex voice data into language you can use.
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
                  Measured layer: voice patterns, pauses, signal balance, and expression dynamics.
                </p>
                <p className={styles.statusLine}>
                  SoulScope layer: your Core Resonance, Resonance Map, and self-awareness readout.
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
