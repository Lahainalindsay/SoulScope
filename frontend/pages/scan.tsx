import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import CymaticSigil from "../components/CymaticSigil";
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
        <title>SoulScope Scan Protocol</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={styles.page}>
        <div className={styles.gridOverlay} />
        <main className={styles.shell}>
          <section className={styles.introStage}>
            <Link href="/scan/question/1" className={styles.skipLink}>
              Skip
            </Link>

            <div className={styles.visualHalo} />
            <div className={styles.introVisualWrap}>
              <div className={styles.visualOrb}>
                <CymaticSigil amplitude={0.42} />
              </div>
            </div>

            <div className={styles.heroPanel}>
              <p className={styles.eyebrow}>SoulScope Guided Scan</p>
              <h1 className={styles.title}>Your voice carries more than words.</h1>
              <p className={styles.lead}>
                Find a quiet space, face the camera, and answer each prompt out loud.
              </p>
              <div className={styles.instructionsCard}>
                <p className={styles.instructionsTitle}>Before you begin</p>
                <div className={styles.protocolBody}>
                  <p className={styles.protocolLine}>You will have 3 seconds to read each question before recording begins.</p>
                  <p className={styles.protocolLine}>You will then have 10 seconds to answer each question out loud.</p>
                  <p className={styles.protocolLine}>On the first question, hold still while the camera captures a short baseline read.</p>
                  <p className={styles.protocolLine}>Speak naturally. There is no right or wrong way to answer.</p>
                </div>
              </div>
              <div className={styles.protocolBody}>
                <p className={styles.protocolLine}>Find a quiet space.</p>
                <p className={styles.protocolLine}>Speak naturally when prompted.</p>
                <p className={styles.protocolLine}>All responses are spoken.</p>
                <p className={styles.protocolLine}>Keep your face visible to the camera during the scan.</p>
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
                  Continue
                </button>
              </div>
              <p className={styles.actionNote}>
                Each prompt starts after a short reading pause, then records for 10 seconds.
              </p>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
