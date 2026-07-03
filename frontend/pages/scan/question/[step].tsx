import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import CymaticSigil from "../../../components/CymaticSigil";
import FaceReader, { type FaceReading } from "../../../components/FaceReader";
import Recorder, { type RecorderHandle, type RecorderSignalSample } from "../../../components/Recorder";
import {
  ensureGuidedScanSession,
  getGuidedScanProgress,
  saveGuidedScanAnswer,
  saveGuidedScanCameraBaseline,
  saveGuidedScanCameraCapture,
} from "../../../lib/guidedScanSession";
import { GUIDED_SCAN_QUESTIONS } from "../../../lib/scanProtocol";
import styles from "./GuidedScanQuestion.module.css";

type PendingAction = "next" | "finish" | null;
const AUTO_START_DELAY_MS = 3000;
const CAMERA_BASELINE_MS = 3000;

function signalClass(dbfs: number) {
  if (dbfs < -58) return styles.statusWarn;
  if (dbfs > -6) return styles.statusBad;
  return styles.statusGood;
}

function signalText(dbfs: number) {
  if (dbfs < -58) return "Speak a little louder";
  if (dbfs > -6) return "Clipping risk";
  return "Good signal";
}

export default function GuidedScanQuestionPage() {
  const router = useRouter();
  const recorderRef = useRef<RecorderHandle | null>(null);
  const recordingStartedAtRef = useRef<number>(0);
  const pendingActionRef = useRef<PendingAction>(null);
  const cameraSummaryRef = useRef<FaceReading | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveSample, setLiveSample] = useState<RecorderSignalSample | null>(null);
  const [, setCameraMetrics] = useState<FaceReading | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [hasCompletedRecording, setHasCompletedRecording] = useState(false);
  const [isAutoStarting, setIsAutoStarting] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const step = useMemo(() => {
    const raw = router.query.step;
    const parsed = typeof raw === "string" ? Number.parseInt(raw, 10) : NaN;
    return Number.isFinite(parsed) ? parsed : 1;
  }, [router.query.step]);

  const questionIndex = step - 1;
  const question = GUIDED_SCAN_QUESTIONS[questionIndex];
  const isLastQuestion = questionIndex === GUIDED_SCAN_QUESTIONS.length - 1;
  const isCalibrating = step === 1 && !isRecording && isAutoStarting;
  const recordingDurationMs = question?.durationMs ?? 10000;

  const handleCameraSummaryChange = (reading: FaceReading | null) => {
    cameraSummaryRef.current = reading;
  };

  const handleCalibrationComplete = (reading: FaceReading | null) => {
    if (!reading || step !== 1) return;
    saveGuidedScanCameraBaseline(reading);
  };

  useEffect(() => {
    pendingActionRef.current = null;
    recordingStartedAtRef.current = 0;
    setIsRecording(false);
    setError(null);
    setElapsedSeconds(0);
    setLiveSample(null);
    setCameraMetrics(null);
    cameraSummaryRef.current = null;
    setHasCompletedRecording(false);
    setIsAutoStarting(true);
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
    const timer = window.setTimeout(() => {
      pendingActionRef.current = isLastQuestion ? "finish" : "next";
      recordingStartedAtRef.current = Date.now();
      setElapsedSeconds(0);
      setHasCompletedRecording(false);
      setError(null);
      setIsAutoStarting(false);
      recorderRef.current?.start();
    }, step === 1 ? CAMERA_BASELINE_MS : AUTO_START_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [isLastQuestion, question, router.isReady, step]);

  const handleComplete = async (blob: Blob) => {
    const durationMs = Math.max(0, Date.now() - recordingStartedAtRef.current);
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    setIsSaving(true);
    setError(null);

    try {
      await saveGuidedScanAnswer(questionIndex, blob, durationMs);
      if (cameraSummaryRef.current) {
        saveGuidedScanCameraCapture(questionIndex, cameraSummaryRef.current);
      }
      setHasCompletedRecording(true);
    } catch (saveError) {
      console.error("Failed to persist guided scan answer", saveError);
      setError("This response did not save. Please reload and retry this question.");
      setIsSaving(false);
      return;
    }

    setIsSaving(false);

    if (action === "finish") {
      void router.push("/scan/analyzing");
      return;
    }
    if (action === "next") {
      void router.push(`/scan/question/${step + 1}`);
      return;
    }
    setError("Recording stopped unexpectedly. Reload and retry this question.");
  };

  if (!question) return null;

  const orbScale = 1 + Math.max(0.02, (liveSample?.rms ?? 0.08) * 0.18);
  const stepLabel = `Question ${step} of ${GUIDED_SCAN_QUESTIONS.length}`;
  const progressPercent = Math.round((step / GUIDED_SCAN_QUESTIONS.length) * 100);

  return (
    <>
      <Head>
        <title>{question.title} | SoulScope Resonance Scan</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={styles.page}>
        <div className={styles.gridOverlay} />
        <div className={styles.shell}>
          <div className={styles.header}>
            <div>
              <p className={styles.eyebrow}>{stepLabel}</p>
              <h1 className={styles.title}>Answer naturally.</h1>
              <p className={styles.subtitle}>Read the question first, then keep your face comfortably in view while you answer.</p>
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
                  <p className={styles.promptText}>{question.prompt}</p>

                  <div className={styles.scanStatusRow}>
                    <div className={styles.liveBadge}><span className={isRecording ? styles.liveDot : styles.idleDot} />{isRecording ? "Recording" : isSaving ? "Saving response" : hasCompletedRecording ? "Response captured" : "Get ready"}</div>
                    <div className={styles.timeBadge}>{elapsedSeconds}s</div>
                  </div>

                  <div className={styles.cameraGrid}>
                    <div className={styles.cameraPanel}>
                      <div className={styles.cameraHeader}>
                        <div>
                          <p className={styles.sectionLabel}>Camera</p>
                          <p className={styles.cameraNote}>Keep your face comfortably in view while answering naturally.</p>
                        </div>
                      </div>
                      <FaceReader active={router.isReady} tracking={isRecording} calibrating={isCalibrating} onMetricsChange={setCameraMetrics} onSummaryChange={handleCameraSummaryChange} onCalibrationComplete={handleCalibrationComplete} />
                    </div>
                  </div>

                  <div className={styles.orbShell}>
                    <div className={styles.orbGlow} />
                    <div className={styles.orbFrame}>
                      <div className={styles.orbMotion} style={{ transform: `scale(${orbScale})` }}>
                        <CymaticSigil amplitude={Math.max(0.08, liveSample?.rms ?? 0.08)} className="" />
                      </div>
                    </div>
                  </div>

                  <p className={styles.ctaHint}>
                    {isSaving
                      ? "Saving your response before moving on."
                      : isAutoStarting
                        ? step === 1
                          ? "Hold steady. Camera baseline and recording start in 3 seconds."
                          : "Get ready. Recording starts automatically."
                        : isRecording
                          ? question.captureKind === "sustained_vowel"
                            ? `Hold the sound steadily for ${Math.max(1, Math.round(recordingDurationMs / 1000))} seconds.`
                            : `Speak naturally for ${Math.max(1, Math.round(recordingDurationMs / 1000))} seconds.`
                          : hasCompletedRecording
                            ? "Response captured. Loading the next prompt."
                            : "Preparing your microphone."}
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
