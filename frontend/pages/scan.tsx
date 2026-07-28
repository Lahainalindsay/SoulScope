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
import { getActiveReferenceSignature } from "../lib/referenceSignatureRepository";
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
  const [scanSubject, setScanSubject] = useState<GuidedScanSubject | null>(null);
  const [referenceReady, setReferenceReady] = useState<boolean | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    resetGuidedScanSession();

    const resolveScanContext = async () => {
      try {
        const userResponse = await supabase.auth.getUser();
        if (!active) return;

        const user = userResponse.data.user;
        if (userResponse.error || !user) {
          setSignedIn(false);
          setReferenceReady(false);
          setScanSubject(DEFAULT_SELF_SCAN_SUBJECT);
          return;
        }

        setSignedIn(true);
        const [subjectResponse, reference] = await Promise.all([
          supabase
            .from("scan_subjects")
            .select("id, name, subject_type, identity_metadata")
            .eq("user_id", user.id)
            .eq("subject_type", "primary")
            .maybeSingle(),
          getActiveReferenceSignature(supabase, user.id),
        ]);

        if (!active) return;
        const primarySubject = subjectResponse.data as ScanSubjectRow | null;
        setScanSubject(primarySubject ? subjectFromPrimaryRow(primarySubject) : DEFAULT_SELF_SCAN_SUBJECT);
        setReferenceReady(Boolean(reference));
      } catch {
        if (!active) return;
        setScanSubject(DEFAULT_SELF_SCAN_SUBJECT);
        setReferenceReady(false);
      }
    };

    void resolveScanContext();
    return () => {
      active = false;
    };
  }, []);

  const startScan = () => {
    if (!scanSubject || referenceReady === null || signedIn === null) return;
    if (!signedIn) {
      void router.push("/auth/login?next=/baseline");
      return;
    }
    if (!referenceReady) {
      void router.push("/baseline");
      return;
    }
    setGuidedScanSubject(scanSubject);
    void router.push("/scan/question/1");
  };

  const contextReady = Boolean(scanSubject) && referenceReady !== null && signedIn !== null;
  const buttonLabel = !contextReady
    ? "Preparing"
    : !signedIn
      ? "Sign in to begin"
      : !referenceReady
        ? "Create My Reference Signature"
        : "Begin My Scan";

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
              <section className={styles.preparationCard} aria-labelledby="scan-preparation-title">
                <div className={styles.cardHeader}>
                  <h1 id="scan-preparation-title" className={styles.title}>Scan Preparation</h1>
                </div>

                <ol className={styles.preparationList}>
                  <li>
                    <strong>Your Reference Signature.</strong>
                    <span>SoulScope uses a one-time, natural 30-second recording as an internal calibration point. It supports measurement and speaker continuity without appearing as report language.</span>
                  </li>
                  <li>
                    <strong>Be in a quiet location.</strong>
                    <span>Background voices, television, and other media can limit results or fail the speaker check.</span>
                  </li>
                  <li>
                    <strong>Speak naturally and continuously.</strong>
                    <span>You will be guided through 3 prompts. The first creates a current comparison point, followed by challenge and hopeful prompts.</span>
                    <ul className={styles.promptList}>
                      {GUIDED_SCAN_QUESTIONS.map((question) => (
                        <li key={question.id}>{question.prompt}</li>
                      ))}
                    </ul>
                  </li>
                </ol>
              </section>

              <div className={styles.actions}>
                <button
                  type="button"
                  className={[
                    styles.primaryButton,
                    contextReady ? styles.primaryButtonReady : styles.primaryButtonWaiting,
                  ].join(" ")}
                  disabled={!contextReady}
                  aria-describedby="scan-confirmation-help"
                  onClick={startScan}
                >
                  {buttonLabel}
                </button>
              </div>
              <p id="scan-confirmation-help" className={styles.actionHelp}>
                {!contextReady
                  ? "Preparing your account."
                  : !signedIn
                    ? "An account keeps your Reference Signature private and connected to you."
                    : !referenceReady
                      ? "Your first step is a one-time 30-second calibration recording."
                      : "Your Reference Signature is ready. Your scan will begin with the current comparison prompt."}
              </p>

              <section className={styles.privacySummary} aria-labelledby="scan-permissions-title">
                <h2 id="scan-permissions-title">Privacy</h2>
                <p>Microphone access is required. Camera access is optional where supported. Your browser asks before access is allowed.</p>
                <Link href="/#privacy" className={styles.privacyLink}>Read privacy overview</Link>
              </section>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
