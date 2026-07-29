import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import Recorder, { type RecorderHandle, type RecorderSignalSample } from "../components/Recorder";
import { supabase } from "../lib/supabaseClient";
import { createDefaultVoiceAnalysisProvider, type ConsentRecord } from "../lib/voiceAnalysisProvider";
import { buildReferenceSignature, REFERENCE_SIGNATURE_PROMPT } from "../lib/referenceSignature";
import { replaceActiveReferenceSignature } from "../lib/referenceSignatureRepository";
import styles from "./scan/question/GuidedScanQuestion.module.css";

const RECORDING_DURATION_SECONDS = Math.max(
  1,
  Math.round(REFERENCE_SIGNATURE_PROMPT.durationMs / 1000)
);

function signalText(dbfs: number) {
  if (dbfs < -58) return "Move closer or find quiet";
  if (dbfs > -6) return "Speak a little softer";
  return "Ready";
}

export default function BaselinePage() {
  const router = useRouter();
  const recorderRef = useRef<RecorderHandle | null>(null);
  const startedAtRef = useRef(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [liveSample, setLiveSample] = useState<RecorderSignalSample | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(RECORDING_DURATION_SECONDS);

  const start = () => {
    setError(null);
    setRemainingSeconds(RECORDING_DURATION_SECONDS);
    recorderRef.current?.start();
  };

  const handleRecordingStateChange = (recording: boolean) => {
    if (recording) {
      startedAtRef.current = Date.now();
      setRemainingSeconds(RECORDING_DURATION_SECONDS);
    }
    setIsRecording(recording);
  };

  useEffect(() => {
    if (!isRecording || !startedAtRef.current) return;

    const updateCountdown = () => {
      const elapsedMs = Date.now() - startedAtRef.current;
      setRemainingSeconds(Math.max(
        0,
        Math.ceil((REFERENCE_SIGNATURE_PROMPT.durationMs - elapsedMs) / 1000)
      ));
    };

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 250);
    return () => window.clearInterval(timer);
  }, [isRecording]);

  const handleComplete = async (blob: Blob) => {
    const durationMs = Math.max(1, Date.now() - startedAtRef.current);
    setIsSaving(true);
    setError(null);

    try {
      const session = await supabase.auth.getSession();
      const user = session.data.session?.user;
      if (!user) throw new Error("Please sign in before creating your Reference Signature.");

      const scanId = crypto.randomUUID();
      const startedAt = new Date().toISOString();
      const initialized = await supabase.from("scan_sessions").insert({
        id: scanId,
        user_id: user.id,
        status: "processing",
        expected_recording_count: 1,
        valid_recording_count: 0,
        invalid_recording_count: 0,
        completion_ratio: 0,
        capture_quality: "limited",
        result_confidence: "exploratory",
        retry_recommended: false,
        engine_version: "soulscope-reference-signature-v1",
        raw_result: null,
        completeness_metadata: { purpose: "reference_signature" },
        invalid_recording_reasons: [],
        warnings: [],
        started_at: startedAt,
        completed_at: null,
      });
      if (initialized.error) throw new Error(`Could not initialize calibration: ${initialized.error.message}`);

      const consent: ConsentRecord = {
        consentId: `${user.id}:${startedAt}:reference-signature-consent`,
        obtainedFromDataSubject: true,
        obtainedAt: startedAt,
        method: "scan_preparation",
      };
      const provider = createDefaultVoiceAnalysisProvider();
      const providerResult = await provider.analyzeFile({
        blob,
        captureKind: "guided_speech",
        captureDurationMs: durationMs,
        captureId: `${REFERENCE_SIGNATURE_PROMPT.id}:voice:1`,
        scanId,
      }, consent);
      const signature = buildReferenceSignature(providerResult.result, durationMs);

      await replaceActiveReferenceSignature(supabase, {
        user_id: user.id,
        subject_id: null,
        prompt_id: REFERENCE_SIGNATURE_PROMPT.id,
        prompt_text: REFERENCE_SIGNATURE_PROMPT.prompt,
        duration_ms: durationMs,
        signature,
        quality: {
          blobSize: blob.size,
          captureKind: "guided_speech",
          resonanceScore: providerResult.result.resonanceScore,
        },
        engine_version: signature.source.engineVersion,
      });

      await supabase.from("scan_sessions").update({
        status: "complete",
        valid_recording_count: 1,
        completion_ratio: 1,
        capture_quality: "complete",
        result_confidence: "supported",
        completed_at: new Date().toISOString(),
        raw_result: { purpose: "reference_signature", signatureVersion: signature.version },
      }).eq("id", scanId).eq("user_id", user.id);

      void router.replace("/scan");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Your Reference Signature could not be saved.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Head>
        <title>Your Reference Signature | SoulScope</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className={styles.page}>
        <div className={styles.gridOverlay} />
        <div className={styles.shell}>
          <div className={styles.header}>
            <div>
              <p className={styles.eyebrow}>One-time calibration</p>
              <h1 className={styles.title}>Create your Reference Signature.</h1>
            </div>
            <div className={styles.statusPill}>{signalText(liveSample?.dbfs ?? -120)}</div>
          </div>
          <div className={styles.main}>
            <section className={styles.heroCard}>
              <div className={styles.heroInner}>
                <div className={styles.recordStage}>
                  <p className={styles.eyebrow}>30 seconds · no result is created</p>
                  <h2 className={styles.title} style={{ fontSize: "clamp(25px, 4vw, 42px)" }}>{REFERENCE_SIGNATURE_PROMPT.prompt}</h2>
                  <p className={styles.ctaHint}>{REFERENCE_SIGNATURE_PROMPT.rationale}</p>
                  {isRecording ? (
                    <div className={styles.timeBadge} role="timer" aria-live="polite">
                      {remainingSeconds}s left
                    </div>
                  ) : null}
                  <button type="button" onClick={start} disabled={isRecording || isSaving} className={styles.primaryButton}>
                    {isSaving ? "Saving your signature" : isRecording ? `Recording · ${remainingSeconds}s` : "Begin 30-second recording"}
                  </button>
                  {error ? <p className={styles.errorText}>{error}</p> : null}
                </div>
              </div>
            </section>
          </div>
        </div>
        <div style={{ display: "none" }}>
          <Recorder ref={recorderRef} hideTrigger durationMs={REFERENCE_SIGNATURE_PROMPT.durationMs} onComplete={handleComplete} onRecordingStateChange={handleRecordingStateChange} onSignalSample={setLiveSample} />
        </div>
      </div>
    </>
  );
}
