import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { buildCymaticReference } from "../../lib/cymatics";
import {
  getGuidedScanCameraBaseline,
  getGuidedScanCameraCaptures,
  getGuidedScanAnswers,
  getGuidedScanStartedAt,
  resetGuidedScanSession,
} from "../../lib/guidedScanSession";
import { analyzeVoiceSpectrum, mergeVoiceAnalyses, type VoiceAnalysisResult } from "../../lib/voiceSpectrum";
import { buildSoulScopeReport } from "../../lib/buildSoulScopeReport";
import { persistCanonicalReport } from "../../lib/reportPersistence";
import { LOCAL_SCAN_KEY, LOCAL_SCAN_LIST_KEY } from "../../lib/localSession";
import { GUIDED_SCAN_QUESTIONS, RESEARCH_REFERENCES, SCAN_OVERVIEW_LINES, VALIDATION_NOTE } from "../../lib/scanProtocol";
import styles from "./Analyzing.module.css";

type SavedScanResult = VoiceAnalysisResult & { id?: string; created_at?: string };
type InsertedScanRow = { id: string; created_at: string };

const CLOUD_REQUEST_TIMEOUT_MS = 4500;
const ANALYSIS_REQUEST_TIMEOUT_MS = 15000;

function shouldDebugScan() {
  return (
    typeof window === "undefined" ||
    window.localStorage.getItem("soulscope.debugScan") !== "0"
  );
}

async function hashBlob(blob: Blob) {
  if (!crypto?.subtle) return null;
  const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}

function topNotes(result: VoiceAnalysisResult) {
  return (result.noteEnergies ?? [])
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((entry) => ({
      note: entry.note,
      score: entry.score,
      relativeEnergy: Number(entry.relativeEnergy.toFixed(4)),
      status: entry.status,
    }));
}

function analysisSnapshot(result: VoiceAnalysisResult) {
  return {
    dominantBandLabel: result.dominantBandLabel,
    coreFrequencyHz: result.coreFrequencyHz,
    spectralCentroidHz: result.spectralCentroidHz,
    resonanceScore: Number(result.resonanceScore.toFixed(3)),
    topNoteEnergies: topNotes(result),
    voiceDynamics: {
      pauseCount: result.voiceDynamics?.pauseCount,
      voicedFrameRatio: result.voiceDynamics?.voicedFrameRatio,
      pitchRangeHz: result.voiceDynamics?.pitchRangeHz,
      pitchRangeSemitones: result.voiceDynamics?.pitchRangeSemitones,
      pitchStability: result.voiceDynamics?.pitchStability,
      pitchClarity: result.voiceDynamics?.pitchClarity,
      captureQuality: result.voiceDynamics?.captureQuality,
      medianPitchHz: result.voiceDynamics?.medianPitchHz,
      harmonicToNoiseRatioDb: result.voiceDynamics?.harmonicToNoiseRatioDb,
      spectralFlatness: result.voiceDynamics?.spectralFlatness,
      speechRateProxyPerMin: result.voiceDynamics?.speechRateProxyPerMin,
    },
    analysisDebug: result.analysisDebug,
  };
}

async function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number, label: string) {
  return await new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (reason) => {
        window.clearTimeout(timer);
        reject(reason);
      },
    );
  });
}

function averageCameraMetrics(captures: ReturnType<typeof getGuidedScanCameraCaptures>) {
  if (!captures.length) return null;
  const totalFrames = captures.reduce((sum, capture) => sum + Math.max(1, capture.framesAnalyzed), 0);
  const weightedAverage = (selector: (capture: (typeof captures)[number]) => number) =>
    captures.reduce((sum, capture) => sum + selector(capture) * Math.max(1, capture.framesAnalyzed), 0) / totalFrames;
  return {
    blinkRatePerMin: Number(weightedAverage((capture) => capture.blinkRatePerMin).toFixed(1)),
    facialTension: Number(weightedAverage((capture) => capture.facialTension).toFixed(3)),
    eyeDilationProxy: Number(weightedAverage((capture) => capture.eyeDilationProxy).toFixed(3)),
    eyeOpenness: Number(weightedAverage((capture) => capture.eyeOpenness).toFixed(3)),
    trackingConfidence: Number(weightedAverage((capture) => capture.trackingConfidence).toFixed(3)),
    framesAnalyzed: captures.reduce((sum, capture) => sum + capture.framesAnalyzed, 0),
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
      const scanStartedAt = getGuidedScanStartedAt();

      if (!answers.length) {
        void router.replace("/scan");
        return;
      }

      if (answers.length !== GUIDED_SCAN_QUESTIONS.length) {
        setError(`Scan is incomplete: ${answers.length} of ${GUIDED_SCAN_QUESTIONS.length} answers were available. Please restart the scan.`);
        return;
      }

      try {
        const debugScan = shouldDebugScan();
        const blobDebug = await Promise.all(
          answers.map(async (answer, index) => ({
            index,
            questionId: answer.questionId,
            title: answer.title,
            blobSize: answer.blob.size,
            blobType: answer.blob.type,
            durationMs: answer.durationMs,
            hash: await hashBlob(answer.blob).catch(() => null),
          }))
        );

        if (debugScan) {
          console.groupCollapsed("[SoulScope scan] audio blobs");
          console.table(blobDebug);
          console.groupEnd();
        }

        const settled = await Promise.allSettled(
          answers.map((answer, index) =>
            withTimeout(
              analyzeVoiceSpectrum(answer.blob, {
                captureKind: GUIDED_SCAN_QUESTIONS[index]?.captureKind,
                captureDurationMs: answer.durationMs,
              }),
              ANALYSIS_REQUEST_TIMEOUT_MS,
              `Voice analysis for ${answer.questionId}`,
            ),
          ),
        );
        const analyses = settled
          .filter((result): result is PromiseFulfilledResult<VoiceAnalysisResult> => result.status === "fulfilled")
          .map((result) => result.value);
        const promptAnalyses = settled.map((result) => (result.status === "fulfilled" ? result.value : null));
        const analysisFailure = settled.find((result): result is PromiseRejectedResult => result.status === "rejected");
        const merged = analyses.length === 1 ? analyses[0] : analyses.length > 1 ? mergeVoiceAnalyses(analyses) : null;

        if (debugScan) {
          console.groupCollapsed("[SoulScope scan] per-question analysis");
          settled.forEach((result, index) => {
            if (result.status === "fulfilled") {
              console.info(`question ${index + 1} success`, analysisSnapshot(result.value));
            } else {
              console.warn(`question ${index + 1} failed`, result.reason);
            }
          });
          console.groupEnd();
        }

        if (!merged) {
          const reason = analysisFailure?.reason instanceof Error ? analysisFailure.reason.message : "No usable scan data was produced.";
          setError(reason);
          return;
        }

        if (analyses.length !== answers.length) {
          setError(`Only ${analyses.length} of ${answers.length} recordings could be analyzed. Please retry the scan with a clearer recording.`);
          return;
        }

        if (debugScan) {
          console.groupCollapsed("[SoulScope scan] merged analysis");
          console.info(analysisSnapshot(merged));
          console.groupEnd();
        }

        const result: SavedScanResult = {
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
              noteScores: promptAnalyses[index]?.noteEnergies?.map((entry) => ({ note: entry.note, score: entry.score })) ?? [],
            })),
          },
          researchBasis: { validationNote: VALIDATION_NOTE, references: RESEARCH_REFERENCES },
          created_at: new Date().toISOString(),
        };

        window.localStorage.setItem(LOCAL_SCAN_KEY, JSON.stringify(result));
        const existing = window.localStorage.getItem(LOCAL_SCAN_LIST_KEY);
        const parsed = existing ? (JSON.parse(existing) as SavedScanResult[]) : [];
        window.localStorage.setItem(LOCAL_SCAN_LIST_KEY, JSON.stringify([result, ...parsed].slice(0, 10)));

        const authResponse = await withTimeout(supabase.auth.getUser(), CLOUD_REQUEST_TIMEOUT_MS, "Supabase auth");
        const userData = authResponse.data;
        if (authResponse.error || !userData?.user) {
          setError("Scan completed, but it could not be saved because no signed-in user was found.");
          return;
        }

        const insertResponse = await withTimeout<{ data: InsertedScanRow | null; error: Error | null }>(
          supabase
            .from("scans")
            .insert({
              user_id: userData.user.id,
              result: {
                ...result,
                scanMeta: { startedAt: scanStartedAt, completedAt: new Date().toISOString(), source: "authenticated" },
              },
            })
            .select("id, created_at")
            .single(),
          CLOUD_REQUEST_TIMEOUT_MS,
          "Supabase scan save",
        );

        if (insertResponse.error || !insertResponse.data) {
          console.error("Failed to insert guided scan row", insertResponse.error);
          setError("Scan completed, but it could not be saved to the results database.");
          return;
        }

        const savedResult = { ...result, id: insertResponse.data.id, created_at: insertResponse.data.created_at };
        window.localStorage.setItem(LOCAL_SCAN_KEY, JSON.stringify(savedResult));
        const latestExisting = window.localStorage.getItem(LOCAL_SCAN_LIST_KEY);
        const latestParsed = latestExisting ? (JSON.parse(latestExisting) as SavedScanResult[]) : [];
        window.localStorage.setItem(
          LOCAL_SCAN_LIST_KEY,
          JSON.stringify([savedResult, ...latestParsed.filter((scan) => scan.id !== savedResult.id)].slice(0, 10)),
        );

        try {
          await persistCanonicalReport(supabase, {
            scanId: insertResponse.data.id,
            userId: userData.user.id,
            report: buildSoulScopeReport(result as VoiceAnalysisResult),
          });
        } catch (persistError) {
          console.error("Failed to persist canonical resonance report", persistError);
        }

        resetGuidedScanSession();
        void router.replace(`/results/${insertResponse.data.id}`);
      } catch (analysisError) {
        console.error("Guided scan analysis failed", analysisError);
        setError(analysisError instanceof Error ? analysisError.message : "Analysis failed. Please retry.");
      }
    };

    void run();
  }, [router]);

  return (
    <>
      <Head>
        <title>Preparing Your Insight | SoulScope</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className={styles.page}>
        <div className={styles.gridOverlay} />
        <main className={styles.shell}>
          <section className={styles.panel}>
            <article className={styles.heroCard}>
              <p className={styles.eyebrow}>Preparing Insight</p>
              <h1 className={styles.title}>Reading your current pattern...</h1>
              <p className={styles.lead}>Analyzing your signals, saving the scan, and opening your insight.</p>
              <div className={styles.mapVisual}><span /><span /><span /></div>
              {error ? (
                <div className={styles.errorBox}>
                  <p>{error}</p>
                  <button type="button" className={styles.retryButton} onClick={() => router.replace("/scan")}>Begin Again</button>
                </div>
              ) : (
                <ul className={styles.statusList}>
                  <li>Reading guided responses</li>
                  <li>Saving scan result</li>
                  <li>Opening your insight</li>
                </ul>
              )}
            </article>
          </section>
        </main>
      </div>
    </>
  );
}
