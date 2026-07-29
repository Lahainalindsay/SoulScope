import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import Recorder, { type RecorderHandle, type RecorderSignalSample } from "../../../components/Recorder";
import {
  ensureGuidedScanSession,
  getGuidedScanProgress,
  saveGuidedScanAnswer,
} from "../../../lib/guidedScanSession";
import { nextGuidedScanRoute } from "../../../lib/guidedScanWorkflow";
import { GUIDED_SCAN_QUESTIONS } from "../../../lib/scanProtocol";
import styles from "./GuidedScanQuestion.module.css";

const AUTO_START_DELAY_MS = 10000;
const FIRST_PROMPT_SETTLE_MS = 3000;
const BACKEND_WARMUP_URL = "/backend-api/openapi.json";

function signalClass(dbfs: number) {
  if (dbfs < -58) return styles.statusWarn;
  if (dbfs > -6) return styles.statusBad;
  return styles.statusGood;
}

function signalText(dbfs: number) {
  if (dbfs < -58) return "Move closer or find quiet";
  if (dbfs > -6) return "Speak a little softer";
  return "Ready";
}

export default function GuidedScanQuestionPage() {
  const router = useRouter();
  const recorderRef = useRef<RecorderHandle | null>(null);
  const recordingStartedAtRef = useRef<number>(0);

  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveSample, setLiveSample] = useState<RecorderSignalSample | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [hasCompletedRecording, setHasCompletedRecording] = useState(false);
  const [isAutoStarting, setIsAutoStarting] = useState(true);
  const [autoStartRemaining, setAutoStartRemaining] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const step = useMemo(() => {
    const raw = router.query.step;
    const parsed = typeof raw === "string" ? Number.parseInt(raw, 10) : NaN;
    return Number.isFinite(parsed) ? parsed : 1;
  }, [router.query.step]);

  const questionIndex = step - 1;
  const question = GUIDED_SCAN_QUESTIONS[questionIndex];
  const recordingDurationMs = question?.durationMs ?? 10000;
  const recordingDurationSeconds = Math.max(1, Math.round(recordingDurationMs / 1000));

  useEffect(() => {
    recordingStartedAtRef.current = 0;
    setIsRecording(false);
    setError(null);
    setElapsedSeconds(0);
    setLiveSample(null);
    setHasCompletedRecording(false);
    setIsAutoStarting(true);
    setAutoStartRemaining(step === 1
      ? Math.ceil(FIRST_PROMPT_SETTLE_MS / 1000)
      : Math.ceil(AUTO_START_DELAY_MS / 1000));
    setIsSaving(false);
  }, [step]);

  useEffect(() => {
    if (!isRecording || !recordingStartedAtRef.current) return;
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - recordingStartedAtRef.current) / 1000));
    }, 250);
    return () => window.clearInterval(timer);
  }, [isRecording]);

  useEffect(() => {
    if (!router.isReady) return;
    ensureGuidedScanSession();
    if (!question) {
      void router.replace("/scan");
      return;
    }
    if (questionIndex > getGuidedScanProgress()) {
      void router.replace("/scan");
    }
  }, [question, questionIndex, router]);

  useEffect(() => {
    if (!router.isReady || !question) return;
    void fetch(BACKEND_WARMUP_URL, { cache: "no-store", keepalive: true }).catch((warmupError) => {
      console.info("Acoustic backend warmup is still pending", warmupError);
    });
  }, [question, router.isReady, step]);

  useEffect(() => {
    if (!router.isReady || !question) return;
    const delayMs = step === 1 ? FIRST_PROMPT_SETTLE_MS : AUTO_START_DELAY_MS;
    const deadline = Date.now() + delayMs;
    setAutoStartRemaining(Math.ceil(delayMs / 1000));

    const countdown = window.setInterval(() => {
      setAutoStartRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    }, 250);
    const timer = window.setTimeout(() => {
      window.clearInterval(countdown);
      setAutoStartRemaining(0);
      recordingStartedAtRef.current = Date.now();
      setElapsedSeconds(0);
      setHasCompletedRecording(false);
      setError(null);
      setIsAutoStarting(false);
      recorderRef.current?.start();
    }, delayMs);
    return () => {
      window.clearInterval(countdown);
      window.clearTimeout(timer);
    };
  }, [question, router.isReady, step]);

  const handleComplete = async (blob: Blob) => {
    const durationMs = Math.max(0, Date.now() - recordingStartedAtRef.current);
    setIsSaving(true);
    setError(null);

    try {
      await saveGuidedScanAnswer(questionIndex, blob, durationMs);
      setHasCompletedRecording(true);
    } catch (saveError) {
      console.error("Failed to persist guided scan answer", saveError);
      setError("This response did not save. Please reload and retry this question.");
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    void router.push(nextGuidedScanRoute(step, GUIDED_SCAN_QUESTIONS.length));
  };

  if (!question) return null;

  const stepLabel = `${question.rangeLabel} · Prompt ${step} of ${GUIDED_SCAN_QUESTIONS.length}`;
  const progressPercent = Math.round((step / GUIDED_SCAN_QUESTIONS.length) * 100);
  const remainingSeconds = isRecording
    ? Math.max(0, Math.ceil((recordingDurationMs - elapsedSeconds * 1000) / 1000))
    : recordingDurationSeconds;

  return (
    <>
      <Head>
        <title>Resonance Scan | SoulScope</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={styles.page}>
        <div className={styles.gridOverlay} />
        <div className={styles.shell}>
          <div className={styles.header}>
            <div>
              <p className={styles.eyebrow}>{stepLabel}</p>
              <h1
                className={styles.title}
                style={{ fontSize: "clamp(28px, 4.2vw, 48px)", lineHeight: 1.08 }}
              >
                {question.prompt}
              </h1>
            </div>
            <div className={`${styles.statusPill} ${signalClass(liveSample?.dbfs ?? -120)}`}>{signalText(liveSample?.dbfs ?? -120)}</div>
          </div>

          <div className={styles.progressTrack} aria-hidden="true">
            <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
          </div>

          <div className={styles.main}>
            <section className={styles.heroCard}>
              <div className={styles.heroInner}>
                <div className={styles.recordStage}>
                  <div className={styles.scanStatusRow}>
                    <div className={styles.liveBadge}><span className={isRecording ? styles.liveDot : styles.idleDot} />{isRecording ? "Recording" : isSaving ? "Saving response" : hasCompletedRecording ? "Response captured" : "Ready"}</div>
                    <div className={styles.timeBadge}>
                      {isRecording
                        ? `${remainingSeconds}s left`
                        : isAutoStarting
                          ? `Starting in ${autoStartRemaining}s`
                          : `${recordingDurationSeconds}s`}
                    </div>
                  </div>

                  <p className={styles.ctaHint}>
                    {isSaving
                      ? "Saving your response before moving on."
                      : isAutoStarting
                        ? step === 1
                          ? "Take a moment to settle. Recording starts in a few seconds."
                          : "Get ready. Recording starts automatically."
                        : isRecording
                          ? `Keep speaking continuously for ${recordingDurationSeconds} seconds.`
                          : hasCompletedRecording
                            ? "Response captured. Loading the next prompt."
                            : "Preparing your scan."}
                  </p>

                  {error ? <p className={styles.errorText}>{error}</p> : null}
                </div>
              </div>
            </section>
          </div>
        </div>
        <div style={{ display: "none" }}>
          <Recorder key={question.id} ref={recorderRef} hideTrigger durationMs={recordingDurationMs} onComplete={handleComplete} onRecordingStateChange={setIsRecording} onSignalSample={setLiveSample} />
        </div>
      </div>
    </>
  );
}
