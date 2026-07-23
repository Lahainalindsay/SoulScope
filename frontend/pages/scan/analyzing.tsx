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

const CLOUD_REQUEST_TIMEOUT_MS = 4500;
const ANALYSIS_REQUEST_TIMEOUT_MS = 15000;
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

export default function ScanAnalyzingPage() {
  const router = useRouter();
  const startedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState("Organizing patterns across your responses");
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
        setError(hardRetryMessage().body);
        return;
      }

      try {
        setProgressMessage("Organizing patterns across your responses");
        const provider = createDefaultVoiceAnalysisProvider();
        const consent: ConsentRecord = {
          consentId: `${scanSubject.subjectId ?? "unconfirmed"}:${scanStartedAt ?? Date.now()}:voice-analysis-consent`,
          obtainedFromDataSubject: true,
          obtainedAt: scanStartedAt ?? new Date().toISOString(),
          method: "scan_preparation",
        };
        const settled = await Promise.allSettled(
          answers.map((answer, index) =>
            withTimeout(
              provider.analyzeFile({
                blob: answer.blob,
                captureKind: GUIDED_SCAN_QUESTIONS.find((question) => question.id === answer.questionId)?.captureKind,
                captureDurationMs: answer.durationMs,
                captureId: `${answer.questionId}:voice:${index + 1}`,
              }, consent).then((providerResult) => providerResult.result),
              ANALYSIS_REQUEST_TIMEOUT_MS,
              `Voice analysis for ${answer.questionId}`,
            ),
          ),
        );

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
        const nextCompleteness = buildScanCompleteness({
          expectedRecordings,
          analyses: promptAnalyses,
          invalidRecordingReasons,
        });
        setCompleteness(nextCompleteness);

        if (nextCompleteness.status === "failed" || validAnalyses.length < 3) {
          setError(hardRetryMessage().body);
          return;
        }

        setProgressMessage("Comparing rhythm, timing, steadiness, and expression");
        const merged = validAnalyses.length === 1 ? validAnalyses[0] : mergeVoiceAnalyses(validAnalyses);
        if (!merged) {
          setError(hardRetryMessage().body);
          return;
        }

        const completedAt = new Date().toISOString();
        const scanId = crypto.randomUUID();
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
              topNotes: (analysis.noteEnergies ?? []).slice(0, 5).map((note) => ({ note: note.note, score: note.score, relativeEnergy: note.relativeEnergy })),
            })),
          },
          researchBasis: { validationNote: VALIDATION_NOTE, references: RESEARCH_REFERENCES },
          scanMeta: {
            subject: scanSubject,
            startedAt: scanStartedAt,
            completedAt,
            source: "guided-resonance-scan",
          },
          id: scanId,
          created_at: completedAt,
        };

        window.localStorage.setItem(LOCAL_SCAN_KEY, JSON.stringify(result));
        const existing = window.localStorage.getItem(LOCAL_SCAN_LIST_KEY);
        const parsed = existing ? (JSON.parse(existing) as SavedScanResult[]) : [];
        window.localStorage.setItem(LOCAL_SCAN_LIST_KEY, JSON.stringify([result, ...parsed.filter((scan) => scan.id !== scanId)].slice(0, 10)));

        setProgressMessage("Preparing your Reflection");
        const authResponse = await withTimeout(supabase.auth.getUser(), CLOUD_REQUEST_TIMEOUT_MS, "Supabase auth");
        const userData = authResponse.data;
        if (authResponse.error || !userData?.user) {
          setError("Your reflection was created, but it could not be saved because no signed-in user was found.");
          return;
        }

        const report = buildSoulScopeReport(result, { scanId });
        await withTimeout(
          persistCanonicalReport(supabase, {
            scanId,
            userId: userData.user.id,
            report,
            completeness: nextCompleteness,
            rawResult: {
              ...result,
              scanMeta: {
                ...result.scanMeta,
                subject: scanSubject,
                startedAt: scanStartedAt,
                completedAt,
                source: "authenticated",
              },
            },
            startedAt: scanStartedAt,
          }),
          20000,
          "Supabase V2 result save",
        );

        resetGuidedScanSession();
        void router.replace(`/results/${scanId}`);
      } catch (analysisError) {
        console.error("Guided scan analysis or persistence failed", analysisError);
        setError(analysisError instanceof Error ? analysisError.message : hardRetryMessage().body);
      }
    };

    void run();
  }, [router]);

  const failed = Boolean(error);
  const heading = failed ? hardRetryMessage().heading : "Creating your Resonance Signature.";
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
              <p className={styles.eyebrow}>{failed ? "Clearer Sample Needed" : "Resonance Scan"}</p>
              <h1 className={styles.title}>{heading}</h1>
              <p className={styles.lead}>{lead}</p>
              {!failed ? <div className={styles.mapVisual}><span /><span /><span /></div> : null}
              {failed ? (
                <div className={styles.errorBox}>
                  <button type="button" className={styles.retryButton} onClick={() => router.replace("/scan")}>Try Again</button>
                </div>
              ) : (
                <ul className={styles.statusList}>
                  <li>Organizing patterns across your responses</li>
                  <li>Comparing rhythm, timing, steadiness, and expression</li>
                  <li>Preparing your Reflection</li>
                  <li>Shaping this scan into a visual signature</li>
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
