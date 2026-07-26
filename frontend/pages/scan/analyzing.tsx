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
  getGuidedScanSubject,
  resetGuidedScanSession,
  type GuidedScanSubject,
} from "../../lib/guidedScanSession";
import { mergeVoiceAnalyses, type VoiceAnalysisResult } from "../../lib/voiceSpectrum";
import { createDefaultVoiceAnalysisProvider, type ConsentRecord } from "../../lib/voiceAnalysisProvider";
import { buildSoulScopeReport } from "../../lib/buildSoulScopeReport";
import { persistCanonicalReport } from "../../lib/reportPersistence";
import { buildScanCompleteness, isUsableAnalysis, type ScanCompleteness, type ScanWithCompleteness } from "../../lib/partialScan";
import { LOCAL_SCAN_KEY, LOCAL_SCAN_LIST_KEY } from "../../lib/localSession";
import { GUIDED_SCAN_QUESTIONS, RESEARCH_REFERENCES, SCAN_OVERVIEW_LINES, VALIDATION_NOTE } from "../../lib/scanProtocol";
import styles from "./Analyzing.module.css";

type SavedScanResult = ScanWithCompleteness & { id?: string; created_at?: string };

const AUTH_REFRESH_TIMEOUT_MS = 30000;
const CLOUD_WRITE_TIMEOUT_MS = 20000;
const ANALYSIS_REQUEST_TIMEOUT_MS = 120000;
const UNCONFIRMED_SUBJECT: GuidedScanSubject = {
  subjectId: null,
  subjectLabel: "Unconfirmed subject",
  identityConfidence: 0,
  historyEligible: false,
  status: "unconfirmed",
};

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

async function getReliableSession() {
  // getSession reads the cached mobile session first and normally does not need a network request.
  const cached = await supabase.auth.getSession();
  if (cached.error) throw new Error(`Could not read your saved session: ${cached.error.message}`);
  if (cached.data.session?.user) return cached.data.session;

  // Only contact Supabase Auth when the cached session is absent or expired.
  const refreshed = await withTimeout(
    supabase.auth.refreshSession(),
    AUTH_REFRESH_TIMEOUT_MS,
    "Session refresh",
  );
  if (refreshed.error || !refreshed.data.session?.user) {
    throw new Error("Your sign-in session could not be restored. Please sign in again; your recorded answers are still saved on this device.");
  }
  return refreshed.data.session;
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

function hardRetryMessage() {
  return {
    heading: "We need a clearer sample",
    body: "Not enough voice data was captured to create a reliable reflection. Find a quiet space, speak naturally, and try again.",
  };
}

function analysisFailureMessage(reasons: Array<{ reason: string }>) {
  const first = reasons.find((entry) => entry.reason)?.reason;
  if (!first) return hardRetryMessage().body;
  if (/scan is not owned|could not verify scan ownership|failed to fetch|network|localhost|127\.0\.0\.1/i.test(first)) {
    return `The voice-analysis service could not complete this scan. ${first}`;
  }
  return first;
}

export default function ScanAnalyzingPage() {
  const router = useRouter();
  const startedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [errorHeading, setErrorHeading] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState("Preparing your scan session");
  const [completeness, setCompleteness] = useState<ScanCompleteness | null>(null);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const run = async () => {
      const answers = await getGuidedScanAnswers();
      const cameraCaptures = getGuidedScanCameraCaptures();
      const cameraBaseline = getGuidedScanCameraBaseline();
      const scanStartedAt = getGuidedScanStartedAt();
      const scanSubject = getGuidedScanSubject() ?? UNCONFIRMED_SUBJECT;
      const expectedRecordings = GUIDED_SCAN_QUESTIONS.length;

      if (!answers.length) {
        setErrorHeading(null);
        setError(hardRetryMessage().body);
        return;
      }

      let scanId: string | null = null;

      try {
        setProgressMessage("Restoring your secure session");
        const session = await getReliableSession();
        const user = session.user;

        scanId = crypto.randomUUID();
        const startedAt = scanStartedAt ?? new Date().toISOString();
        setProgressMessage("Preparing your scan session");
        const initialSession = await withTimeout(
          supabase
            .from("scan_sessions")
            .upsert({
              id: scanId,
              user_id: user.id,
              subject_id: scanSubject.subjectId,
              status: "processing",
              expected_recording_count: expectedRecordings,
              valid_recording_count: 0,
              invalid_recording_count: 0,
              completion_ratio: 0,
              capture_quality: "limited",
              result_confidence: "exploratory",
              retry_recommended: false,
              engine_version: "soulscope-canonical-acoustic-v1",
              observation_engine_version: null,
              observation_pipeline: null,
              observation_pipeline_created_at: null,
              raw_result: null,
              completeness_metadata: {},
              invalid_recording_reasons: [],
              warnings: [],
              started_at: startedAt,
              completed_at: null,
            }, { onConflict: "id" })
            .select("id")
            .single(),
          CLOUD_WRITE_TIMEOUT_MS,
          "Scan session initialization",
        );
        if (initialSession.error || !initialSession.data) {
          throw new Error(`Could not initialize scan session: ${initialSession.error?.message ?? "no row returned"}`);
        }

        setProgressMessage("Organizing patterns across your responses");
        const provider = createDefaultVoiceAnalysisProvider();
        const consent: ConsentRecord = {
          consentId: `${scanSubject.subjectId ?? "unconfirmed"}:${startedAt}:voice-analysis-consent`,
          obtainedFromDataSubject: true,
          obtainedAt: startedAt,
          method: "scan_preparation",
        };

        // Run each recording end-to-end before starting the next. The transport is
        // intentionally serialized, so starting all three timeout clocks together
        // incorrectly caused queued recordings to expire before their upload began.
        const settled: PromiseSettledResult<VoiceAnalysisResult>[] = [];
        for (const [index, answer] of answers.entries()) {
          setProgressMessage(`Analyzing response ${index + 1} of ${answers.length}`);
          try {
            const value = await withTimeout(
              provider.analyzeFile({
                blob: answer.blob,
                captureKind: GUIDED_SCAN_QUESTIONS.find((question) => question.id === answer.questionId)?.captureKind,
                captureDurationMs: answer.durationMs,
                captureId: `${answer.questionId}:voice:${index + 1}`,
                scanId: scanId as string,
              }, consent).then((providerResult) => providerResult.result),
              ANALYSIS_REQUEST_TIMEOUT_MS,
              `Voice analysis for ${answer.questionId}`,
            );
            settled.push({ status: "fulfilled", value });
          } catch (reason) {
            settled.push({ status: "rejected", reason });
          }
        }

        const promptAnalyses: Array<VoiceAnalysisResult | null> = settled.map((entry) => entry.status === "fulfilled" ? entry.value : null);
        const invalidRecordingReasons = settled
          .map((entry, index) => entry.status === "rejected"
            ? {
                index,
                questionId: answers[index]?.questionId,
                reason: entry.reason instanceof Error ? entry.reason.message : "Recording could not be analyzed.",
              }
            : !isUsableAnalysis(entry.value)
              ? { index, questionId: answers[index]?.questionId, reason: "Recording did not meet the minimum usable voice-signal threshold." }
              : null)
          .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

        const validAnalyses = promptAnalyses.filter((entry): entry is VoiceAnalysisResult => isUsableAnalysis(entry));
        const nextCompleteness = buildScanCompleteness({ expectedRecordings, analyses: promptAnalyses, invalidRecordingReasons });
        setCompleteness(nextCompleteness);

        if (nextCompleteness.status === "failed" || validAnalyses.length < 3) {
          await supabase.from("scan_sessions").update({
            status: "failed",
            valid_recording_count: validAnalyses.length,
            invalid_recording_count: invalidRecordingReasons.length,
            completion_ratio: expectedRecordings ? validAnalyses.length / expectedRecordings : 0,
            retry_recommended: true,
            invalid_recording_reasons: invalidRecordingReasons,
            warnings: invalidRecordingReasons.map((entry) => entry.reason),
          }).eq("id", scanId).eq("user_id", user.id);
          setErrorHeading("The scan service could not complete this reading");
          setError(analysisFailureMessage(invalidRecordingReasons));
          return;
        }

        setProgressMessage("Comparing rhythm, timing, steadiness, and expression");
        const merged = validAnalyses.length === 1 ? validAnalyses[0] : mergeVoiceAnalyses(validAnalyses);
        if (!merged) throw new Error(hardRetryMessage().body);

        const completedAt = new Date().toISOString();
        const result: SavedScanResult = {
          ...merged,
          scanCompleteness: nextCompleteness,
          cymaticReference: buildCymaticReference(merged.noteInterpretation?.primaryNote),
          protocolNotes: {
            overview: SCAN_OVERVIEW_LINES,
            camera: averageCameraMetrics(cameraCaptures) ?? undefined,
            cameraBaseline: cameraBaseline ?? undefined,
            prompts: GUIDED_SCAN_QUESTIONS.map((question) => {
              const answerIndex = answers.findIndex((answer) => answer.questionId === question.id);
              const analysis = answerIndex >= 0 ? promptAnalyses[answerIndex] : null;
              const capture = answerIndex >= 0 ? cameraCaptures[answerIndex] : undefined;
              return {
                id: question.id,
                title: question.title,
                rangeLabel: question.rangeLabel,
                prompt: question.prompt,
                rationale: question.rationale,
                durationMs: answerIndex >= 0 ? answers[answerIndex]?.durationMs : undefined,
                captureKind: question.captureKind,
                camera: capture ? {
                  blinkRatePerMin: capture.blinkRatePerMin,
                  facialTension: capture.facialTension,
                  eyeDilationProxy: capture.eyeDilationProxy,
                  eyeOpenness: capture.eyeOpenness,
                  trackingConfidence: capture.trackingConfidence,
                  framesAnalyzed: capture.framesAnalyzed,
                } : undefined,
                primaryNote: analysis?.noteInterpretation?.primaryNote,
                noteScores: analysis?.noteEnergies?.map((entry) => ({ note: entry.note, score: entry.score })) ?? [],
              };
            }),
          },
          analysisDebug: {
            ...(merged.analysisDebug ?? {}),
            promptAnalyses: validAnalyses.map((analysis, index) => ({
              index,
              captureKind: analysis.captureKind,
              dominantBandLabel: analysis.dominantBandLabel,
              coreFrequencyHz: analysis.coreFrequencyHz,
              spectralCentroidHz: analysis.spectralCentroidHz,
              resonanceScore: analysis.resonanceScore,
              voiceDynamics: analysis.voiceDynamics,
              canonicalAcoustic: analysis.canonicalAcoustic,
              topNotes: (analysis.noteEnergies ?? []).slice(0, 5).map((note) => ({ note: note.note, score: note.score, relativeEnergy: note.relativeEnergy })),
            })),
          },
          researchBasis: { validationNote: VALIDATION_NOTE, references: RESEARCH_REFERENCES },
          scanMeta: { subject: scanSubject, startedAt, completedAt, source: "guided-resonance-scan" },
          id: scanId,
          created_at: completedAt,
        };

        window.localStorage.setItem(LOCAL_SCAN_KEY, JSON.stringify(result));
        const existing = window.localStorage.getItem(LOCAL_SCAN_LIST_KEY);
        const parsed = existing ? (JSON.parse(existing) as SavedScanResult[]) : [];
        window.localStorage.setItem(LOCAL_SCAN_LIST_KEY, JSON.stringify([result, ...parsed.filter((scan) => scan.id !== scanId)].slice(0, 10)));

        setProgressMessage("Preparing your Reflection");
        const report = buildSoulScopeReport(result, { scanId });
        await withTimeout(
          persistCanonicalReport(supabase, {
            scanId,
            userId: user.id,
            report,
            completeness: nextCompleteness,
            rawResult: {
              ...result,
              scanMeta: { ...result.scanMeta, subject: scanSubject, startedAt, completedAt, source: "authenticated" },
            },
            startedAt,
          }),
          30000,
          "Supabase V2 result save",
        );

        resetGuidedScanSession();
        void router.replace(`/results/${scanId}`);
      } catch (analysisError) {
        console.error("Guided scan analysis or persistence failed", analysisError);
        const message = analysisError instanceof Error ? analysisError.message : hardRetryMessage().body;
        setErrorHeading(/^Could not initialize|Could not save|could not be saved|Session refresh|session could not|Supabase|A signed-in/i.test(message)
          ? "We could not complete your scan"
          : null);
        setError(message);
      }
    };

    void run();
  }, [router]);

  const failed = Boolean(error);
  const heading = failed ? errorHeading ?? hardRetryMessage().heading : "Creating your Resonance Signature.";
  const lead = failed ? error : progressMessage;

  return (
    <>
      <Head>
        <title>Creating Your Resonance Signature | SoulScope</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className={styles.page}>
        <div className={styles.gridOverlay} />
        <main className={styles.shell}>
          <section className={styles.panel}>
            <article className={styles.heroCard}>
              <p className={styles.eyebrow}>{failed ? "Scan Interrupted" : "Resonance Scan"}</p>
              <h1 className={styles.title}>{heading}</h1>
              <p className={styles.lead}>{lead}</p>
              {!failed ? <div className={styles.mapVisual}><span /><span /><span /></div> : null}
              {failed ? (
                <div className={styles.errorBox}>
                  <button type="button" className={styles.retryButton} onClick={() => router.replace("/scan")}>Try Again</button>
                </div>
              ) : (
                <ul className={styles.statusList}>
                  <li>Restoring your secure session</li>
                  <li>Preparing your scan session</li>
                  <li>Organizing patterns across your responses</li>
                  <li>Comparing rhythm, timing, steadiness, and expression</li>
                  <li>Preparing your Reflection</li>
                </ul>
              )}
              {completeness?.status === "partial" ? <p className={styles.lead}>{completeness.userMessage}</p> : null}
            </article>
          </section>
        </main>
      </div>
    </>
  );
}
