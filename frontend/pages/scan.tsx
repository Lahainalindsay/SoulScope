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
              <p className={styles.lead}>Let&apos;s take a look at what it&apos;s revealing.</p>
              <div className={styles.agentStub}>
                <button type="button" className={styles.agentPlay} aria-label="Agent voice playback preview">
                  <span className={styles.agentPlayIcon} />
                </button>
                <div className={styles.agentWave}>
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
                <span className={styles.agentLabel}>Agent intro</span>
              </div>
              <div className={styles.protocolBody}>
                <p className={styles.protocolLine}>Find a quiet space.</p>
                <p className={styles.protocolLine}>Speak naturally when prompted.</p>
                <p className={styles.protocolLine}>All responses are spoken.</p>
                <p className={styles.protocolLine}>This takes less than a minute.</p>
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
                Just speak naturally. There&apos;s no right or wrong way to answer.
              </p>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
