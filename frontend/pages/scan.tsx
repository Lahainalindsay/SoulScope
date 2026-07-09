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
        <title>Observe | SoulScope</title>
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
              <p className={styles.eyebrow}>Observe</p>
              <h1 className={styles.title}>Start with your voice.</h1>
              <p className={styles.lead}>
                Find a quiet space, face the camera, and answer naturally. Voice is the first lens.
              </p>
              <div className={styles.instructionsCard}>
                <p className={styles.instructionsTitle}>What to expect</p>
                <div className={styles.protocolBody}>
                  <p className={styles.protocolLine}>You will have 3 seconds to read each prompt before recording begins.</p>
                  <p className={styles.protocolLine}>You will then have 10 seconds to respond out loud.</p>
                  <p className={styles.protocolLine}>On the first question, hold still while the camera captures a short baseline.</p>
                  <p className={styles.protocolLine}>Speak naturally. There is no right or wrong answer.</p>
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
                  Start Scan
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
