import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { resetGuidedScanSession } from "../lib/guidedScanSession";
import styles from "./scan/ScanIntro.module.css";

export default function ScanIntroPage() {
  const router = useRouter();
  const [introReady, setIntroReady] = useState(false);

  useEffect(() => {
    resetGuidedScanSession();
    const timer = window.setTimeout(() => {
      setIntroReady(true);
    }, 2400);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      <Head>
        <title>Start Scan | SoulScope</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={styles.page}>
        <div className={styles.gridOverlay} />
        <main className={styles.shell}>
          <section className={styles.introStage}>
            <Link href="/scan/question/1" className={styles.skipLink}>
              Skip
            </Link>

            <div className={styles.heroPanel}>
              <p className={styles.eyebrow}>Resonance Scan</p>
              <h1 className={styles.title}>Before you begin your Resonance Scan.</h1>
              <p className={styles.lead}>Find a quiet place. Face the camera and speak naturally.</p>

              <div className={styles.instructionsCard}>
                <p className={styles.instructionsTitle}>For best results</p>
                <div className={styles.protocolBody}>
                  <p className={styles.protocolLine}>You will be guided through five short prompts, with up to 10 seconds to answer each one.</p>
                  <p className={styles.protocolLine}>Do your best to give a spoken response to every prompt. Even “I don’t know” or “I don’t have an answer” gives SoulScope more usable vocal information than silence.</p>
                  <p className={styles.protocolLine}>Your words are not being judged. SoulScope listens to how your voice and expression respond during the scan.</p>
                </div>
              </div>

              <div className={styles.instructionsCard}>
                <p className={styles.instructionsTitle}>Microphone and camera privacy</p>
                <div className={styles.protocolBody}>
                  <p className={styles.protocolLine}>Microphone access is required to complete the scan.</p>
                  <p className={styles.protocolLine}>For the most complete result, allow camera access as well. Camera input adds facial timing and movement context to the voice measurements.</p>
                  <p className={styles.protocolLine}>Your browser controls these permissions. You can cancel before recording begins or change access later in your device or browser settings.</p>
                </div>
              </div>

              <div className={styles.actions}>
                <button
                  type="button"
                  className={[
                    styles.primaryButton,
                    introReady ? styles.primaryButtonReady : styles.primaryButtonWaiting,
                  ].join(" ")}
                  disabled={!introReady}
                  onClick={() => router.push("/scan/question/1")}
                >
                  Begin Scan
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}