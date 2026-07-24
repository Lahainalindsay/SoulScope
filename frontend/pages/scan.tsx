import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  resetGuidedScanSession,
  setGuidedScanSubject,
  type GuidedScanSubject,
} from "../lib/guidedScanSession";
import { GUIDED_SCAN_QUESTIONS } from "../lib/scanProtocol";
import { supabase } from "../lib/supabaseClient";
import styles from "./scan/ScanIntro.module.css";

type ScanSubjectRow = {
  id: string;
  name: string;
  subject_type: "primary" | "secondary" | "guest" | "unidentified";
  identity_metadata: {
    identityConfidence?: number;
  } | null;
};

const DEFAULT_SELF_SCAN_SUBJECT: GuidedScanSubject = {
  subjectId: null,
  subjectLabel: "My Resonance Scan",
  identityConfidence: 0.85,
  historyEligible: false,
  status: "confirmed",
};

function subjectFromPrimaryRow(subject: ScanSubjectRow): GuidedScanSubject {
  return {
    subjectId: subject.id,
    subjectLabel: subject.name,
    identityConfidence: Math.max(0.7, Math.min(1, subject.identity_metadata?.identityConfidence ?? 0.9)),
    historyEligible: subject.subject_type === "primary",
    status: "confirmed",
  };
}

export default function ScanIntroPage() {
  const router = useRouter();
  const [preparationConfirmed, setPreparationConfirmed] = useState(false);
  const [scanSubject, setScanSubject] = useState<GuidedScanSubject | null>(null);

  useEffect(() => {
    let active = true;
    resetGuidedScanSession();

    const resolveSelfScanSubject = async () => {
      try {
        const userResponse = await supabase.auth.getUser();
        if (!active) return;

        if (userResponse.error || !userResponse.data.user) {
          setScanSubject(DEFAULT_SELF_SCAN_SUBJECT);
          return;
        }

        const response = await supabase
          .from("scan_subjects")
          .select("id, name, subject_type, identity_metadata")
          .eq("user_id", userResponse.data.user.id)
          .eq("subject_type", "primary")
          .maybeSingle();

        if (!active) return;

        const primarySubject = response.data as ScanSubjectRow | null;
        setScanSubject(primarySubject ? subjectFromPrimaryRow(primarySubject) : DEFAULT_SELF_SCAN_SUBJECT);
      } catch {
        if (active) setScanSubject(DEFAULT_SELF_SCAN_SUBJECT);
      }
    };

    void resolveSelfScanSubject();

    return () => {
      active = false;
    };
  }, []);

  const startScan = () => {
    if (!preparationConfirmed || !scanSubject) return;
    setGuidedScanSubject(scanSubject);
    void router.push("/scan/question/1");
  };

  const canBegin = preparationConfirmed && Boolean(scanSubject);

  return (
    <>
      <Head>
        <title>Resonance Scan | SoulScope</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={styles.page}>
        <div className={styles.gridOverlay} />
        <main className={styles.shell}>
          <section className={styles.introStage} aria-labelledby="scan-preparation-title">
            <div className={styles.heroPanel}>
              <p className={styles.eyebrow}>Before Your Resonance Scan</p>
              <h1 id="scan-preparation-title" className={styles.title}>Prepare for the clearest possible recording.</h1>
              <p className={styles.lead}>
                Your surroundings and the way you position your device directly affect the quality of your scan. Please
                follow each step before you begin.
              </p>
              <p className={styles.duration}>Three prompts · 30 seconds each · 10 seconds between prompts</p>

              <section className={styles.promptPreview} aria-labelledby="scan-prompts-title">
                <div className={styles.cardHeader}>
                  <p className={styles.instructionsTitle}>What You Will Answer</p>
                  <h2 id="scan-prompts-title">Speak for the full 30 seconds on each prompt.</h2>
                  <p>Read these before you begin so you are not surprised when the recording starts.</p>
                </div>

                <ol className={styles.promptPreviewList}>
                  {GUIDED_SCAN_QUESTIONS.map((question) => (
                    <li key={question.id}>
                      <div>
                        <span className={styles.promptDuration}>30 seconds</span>
                        <strong>{question.rangeLabel}</strong>
                      </div>
                      <p>{question.prompt}</p>
                    </li>
                  ))}
                </ol>
              </section>

              <section className={styles.preparationCard} aria-labelledby="scan-preparation-steps-title">
                <div className={styles.cardHeader}>
                  <p className={styles.instructionsTitle}>Scan Preparation</p>
                  <h2 id="scan-preparation-steps-title">Complete these steps before starting.</h2>
                  <p>They help SoulScope capture a clear and consistent voice sample.</p>
                </div>

                <ol className={styles.preparationList}>
                  <li>
                    <strong>Choose a quiet location</strong>
                    <span>Turn off music, television, fans, and other nearby sound. Ask others not to speak while your scan is recording.</span>
                  </li>
                  <li>
                    <strong>Position your device</strong>
                    <span>Place your device about 12 to 18 inches from your face. Keep it in the same position throughout the scan.</span>
                  </li>
                  <li>
                    <strong>Speak naturally</strong>
                    <span>Use your normal speaking voice and keep talking until each 30-second timer ends. Do not whisper, shout, perform, or try to change how you sound.</span>
                  </li>
                  <li>
                    <strong>Remain comfortably still</strong>
                    <span>Sit or stand in a relaxed position and avoid unnecessary movement while responding.</span>
                  </li>
                  <li>
                    <strong>Allow enough time</strong>
                    <span>Complete the scan without interruptions. Each response is recorded separately with a 10-second pause before the next prompt starts.</span>
                  </li>
                  <li>
                    <strong>Keep your face visible</strong>
                    <span>Face the screen in steady, even light. Avoid strong light directly behind you.</span>
                  </li>
                </ol>
              </section>

              <section className={styles.privacySummary} aria-labelledby="scan-permissions-title">
                <p className={styles.instructionsTitle}>Permissions and privacy</p>
                <h2 id="scan-permissions-title">You remain in control.</h2>
                <dl>
                  <div>
                    <dt>Microphone</dt>
                    <dd>Required to record your spoken responses.</dd>
                  </div>
                  <div>
                    <dt>Camera</dt>
                    <dd>Optional where supported. When enabled, it may be used to observe broad changes in facial movement.</dd>
                  </div>
                  <div>
                    <dt>Control</dt>
                    <dd>Your browser will ask before allowing access. You can stop before recording begins.</dd>
                  </div>
                  <div>
                    <dt>Data</dt>
                    <dd>Your completed scan creates derived measurements, a Resonance Signature, and a Reflection connected to your account.</dd>
                  </div>
                </dl>
                <Link href="/#privacy" className={styles.privacyLink}>Read the privacy overview</Link>
              </section>

              <label className={styles.confirmation}>
                <input
                  type="checkbox"
                  checked={preparationConfirmed}
                  onChange={(event) => setPreparationConfirmed(event.target.checked)}
                />
                <span>I have followed the scan preparation steps.</span>
              </label>

              <div className={styles.actions}>
                <button
                  type="button"
                  className={[
                    styles.primaryButton,
                    canBegin ? styles.primaryButtonReady : styles.primaryButtonWaiting,
                  ].join(" ")}
                  disabled={!canBegin}
                  aria-describedby="scan-confirmation-help"
                  onClick={startScan}
                >
                  Begin My Scan
                </button>
              </div>
              <p id="scan-confirmation-help" className={styles.actionHelp}>
                {canBegin ? "Your scan will begin with the first voice prompt." : "Confirm the preparation steps to begin your scan."}
              </p>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
