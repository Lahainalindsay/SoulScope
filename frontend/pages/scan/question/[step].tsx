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
const AUTO_RECORDING_MS = 10000;
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
  const [cameraMetrics, setCameraMetrics] = useState<FaceReading | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [hasCompletedRecording, setHasCompletedRecording] = useState(false);
  const [isAutoStarting, setIsAutoStarting] = useState(true);

  const step = useMemo(() => {
    const raw = router.query.step;
    const parsed = typeof raw === "string" ? Number.parseInt(raw, 10) : NaN;
    return Number.isFinite(parsed) ? parsed : 1;
  }, [router.query.step]);

  const questionIndex = step - 1;
  const question = GUIDED_SCAN_QUESTIONS[questionIndex];
  const isLastQuestion = questionIndex === GUIDED_SCAN_QUESTIONS.length - 1;
  const isCalibrating = step === 1 && !isRecording && isAutoStarting;

  const handleCameraSummaryChange = (reading: FaceReading | null) => {
    cameraSummaryRef.current = reading;
  };

  const handleCalibrationComplete = (reading: FaceReading | null) => {
    if (!reading || step !== 1) {
      return;
    }
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
      return;
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
    try {
      await saveGuidedScanAnswer(questionIndex, blob, durationMs);
      if (cameraSummaryRef.current) {
        saveGuidedScanCameraCapture(questionIndex, cameraSummaryRef.current);
      }
      setHasCompletedRecording(true);
    } catch (saveError) {
      console.error("Failed to persist guided scan answer", saveError);
      setError("Could not save this response. Please record it again.");
      setHasCompletedRecording(false);
      return;
    }

    const action = pendingActionRef.current;
    pendingActionRef.current = null;

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
  const stepLabel = `Step ${step} of ${GUIDED_SCAN_QUESTIONS.length}`;

  return (
    <>
      <Head>
        <title>{question.title} | SoulScope Scan</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={styles.page}>
        <div className={styles.gridOverlay} />
        <div className={styles.shell}>
          <div className={styles.header}>
            <div>
              <p className={styles.eyebrow}>{stepLabel}</p>
              <h1 className={styles.title}>Just speak naturally.</h1>
              <p className={styles.subtitle}>
                Read the question first. Recording starts 3 seconds later and runs for 10 seconds.
              </p>
            </div>
            <div className={`${styles.statusPill} ${signalClass(liveSample?.dbfs ?? -120)}`}>
              {signalText(liveSample?.dbfs ?? -120)}
            </div>
          </div>

          <div className={styles.stepperRow}>
            <div className={styles.stepper}>
              {GUIDED_SCAN_QUESTIONS.map((prompt, index) => (
                <div key={prompt.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    className={[
                      styles.stepNode,
                      index === questionIndex ? styles.stepNodeActive : "",
                      index < questionIndex ? styles.stepNodeDone : "",
                    ].join(" ")}
                  >
                    {index < questionIndex ? "✓" : index + 1}
                  </div>
                  {index < GUIDED_SCAN_QUESTIONS.length - 1 ? <div className={styles.stepLine} /> : null}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.main}>
            <section className={styles.heroCard}>
              <div className={styles.heroInner}>
                <div className={styles.recordStage}>
                  <div className={styles.liveBadge}>
                    <span className={isRecording ? styles.liveDot : styles.idleDot} />
                    {isRecording ? "Recording" : hasCompletedRecording ? "Response captured" : "Ready"}
                  </div>

                  <p className={styles.promptText}>{question.prompt}</p>

                  <div className={styles.orbShell}>
                    <div className={styles.orbGlow} />
                    <div className={styles.orbFrame}>
                      <div
                        className={styles.orbMotion}
                        style={{
                          transform: `scale(${orbScale})`,
                        }}
                      >
                        <CymaticSigil amplitude={Math.max(0.08, liveSample?.rms ?? 0.08)} className="" />
                      </div>
                    </div>
                  </div>

                <div className={styles.controlRow}>
                  <div className={styles.recordMeta}>
                      <div className={styles.timeBadge}>{elapsedSeconds}s</div>
                      <p className={styles.ctaHint}>
                        {isAutoStarting
                          ? step === 1
                            ? "Hold steady and read the question. Camera baseline and recording start in 3 seconds."
                            : "Get ready. Recording starts automatically."
                          : isRecording
                          ? "You have 10 seconds. Speak naturally and keep your face in frame."
                          : hasCompletedRecording
                          ? "Response captured. Loading the next prompt."
                          : "Preparing your microphone."}
                      </p>
                  </div>
                </div>

                <div className={styles.cameraGrid}>
                  <div className={styles.cameraPanel}>
                    <div className={styles.cameraHeader}>
                      <div>
                        <p className={styles.sectionLabel}>Camera read</p>
                        <p className={styles.cameraNote}>
                          Blink rate and facial tension are measured directly from landmarks. Eye
                          dilation is a webcam proxy, not a clinical pupil measurement.
                        </p>
                      </div>
                    </div>
                    <FaceReader
                      active={router.isReady}
                      tracking={isRecording}
                      calibrating={isCalibrating}
                      onMetricsChange={setCameraMetrics}
                      onSummaryChange={handleCameraSummaryChange}
                      onCalibrationComplete={handleCalibrationComplete}
                    />
                  </div>
                  <div className={styles.cameraMetrics}>
                    <article className={styles.cameraMetricCard}>
                      <span className={styles.cameraMetricLabel}>Blink rate</span>
                      <strong className={styles.cameraMetricValue}>
                        {cameraMetrics ? `${cameraMetrics.blinkRatePerMin}/min` : "—"}
                      </strong>
                    </article>
                    <article className={styles.cameraMetricCard}>
                      <span className={styles.cameraMetricLabel}>Facial tension</span>
                      <strong className={styles.cameraMetricValue}>
                        {cameraMetrics ? `${Math.round(cameraMetrics.facialTension * 100)}%` : "—"}
                      </strong>
                    </article>
                    <article className={styles.cameraMetricCard}>
                      <span className={styles.cameraMetricLabel}>Eye dilation proxy</span>
                      <strong className={styles.cameraMetricValue}>
                        {cameraMetrics ? `${Math.round(cameraMetrics.eyeDilationProxy * 100)}%` : "—"}
                      </strong>
                    </article>
                    <article className={styles.cameraMetricCard}>
                      <span className={styles.cameraMetricLabel}>Tracking confidence</span>
                      <strong className={styles.cameraMetricValue}>
                        {cameraMetrics ? `${Math.round(cameraMetrics.trackingConfidence * 100)}%` : "—"}
                      </strong>
                    </article>
                  </div>
                </div>

                  {error ? <p className={styles.errorText}>{error}</p> : null}
                </div>
              </div>
            </section>
          </div>
        </div>

        <div style={{ display: "none" }}>
          <Recorder
            key={question.id}
            ref={recorderRef}
            hideTrigger
            durationMs={AUTO_RECORDING_MS}
            onComplete={handleComplete}
            onRecordingStateChange={setIsRecording}
            onSignalSample={setLiveSample}
          />
        </div>
      </div>
    </>
  );
}
