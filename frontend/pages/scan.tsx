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
    if (!scanSubject) return;
    setGuidedScanSubject(scanSubject);
    void router.push("/scan/question/1");
  };

  const canBegin = Boolean(scanSubject);

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
                    <strong>Be in a quiet location.</strong>
                    <span>All background noise can limit results.</span>
                  </li>
                  <li>
                    <strong>Speak naturally and continuously.</strong>
                    <span>You will be guided through 3 prompts. You have 30 seconds to answer each one. Please speak for the entire 30 seconds available.</span>
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
                {canBegin ? "Your scan will begin with the first voice prompt." : "Preparing your scan."}
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
