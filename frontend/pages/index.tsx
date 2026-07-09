import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useUser } from "@supabase/auth-helpers-react";
import { useEffect, useState } from "react";
import BetaFeedbackForm from "../components/BetaFeedbackForm";
import { getLocalDevSession } from "../lib/localSession";
import styles from "./Home.module.css";

export default function Home() {
  const user = useUser();
  const router = useRouter();
  const [hasLocalSession, setHasLocalSession] = useState(false);

  useEffect(() => {
    setHasLocalSession(Boolean(getLocalDevSession()));
  }, []);

  useEffect(() => {
    if (user || hasLocalSession) {
      void router.replace("/dashboard");
    }
  }, [hasLocalSession, router, user]);

  const canScan = Boolean(user) || hasLocalSession;

  return (
    <>
      <Head>
        <title>SoulScope - A New Way to Observe Yourself</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={styles.page}>
        <div className={styles.gridOverlay} />

        <div className={styles.shell}>
          <section className={styles.hero}>
            <div className={styles.heroMain}>
              <p className={styles.eyebrow}>Private Self-Observation</p>
              <h1 className={styles.wordmark}>SOULSCOPE</h1>
              <p className={styles.headline}>
                See what your inner world may be expressing.
              </p>
              <p className={styles.heroCopy}>
                SoulScope helps make subtle internal patterns more visible. Your voice is the first
                lens: a natural signal translated into clear, personal observation.
              </p>

              <div className={styles.resonanceStage} aria-hidden="true" />

              <div className={styles.heroActions}>
                {canScan ? (
                  <Link href="/scan" className={styles.primaryButton}>
                    Start New Scan
                  </Link>
                ) : (
                  <Link href="/auth/login" className={styles.primaryButton}>
                    Start New Scan
                  </Link>
                )}
                <Link href="/how-it-works" className={styles.secondaryButton}>
                  See How It Works
                </Link>
              </div>

              <p className={styles.disclaimer}>
                Observation, not diagnosis. The goal is to make the pattern visible, not reduce you to a score.
              </p>

              <div className={styles.heroMeta}>
                <span className={styles.metaPill}>About 60 seconds</span>
                <span className={styles.metaPill}>Private</span>
                <span className={styles.metaPill}>No downloads</span>
              </div>
            </div>
          </section>

          <section className={styles.heroSupport}>
            <div className={styles.heroSupportCard}>
              <div className={`${styles.sideCard} ${styles.spectrumCard}`}>
                <div className={styles.glow} />
                <p className={styles.sideLabel}>First lens</p>
                <h2 className={styles.sideTitle}>Your voice carries more than words.</h2>
                <p className={styles.sideText}>
                  SoulScope starts with voice because it can carry timing, pressure, steadiness,
                  recovery, and expression in one natural signal.
                </p>
              </div>
            </div>

            <div className={styles.heroSupportCard}>
              <div className={styles.sideCard}>
                <p className={styles.sideLabel}>Your insight</p>
                <p className={styles.sideText}>
                  Your insight shows what appears steady, what may be carrying load, and what deserves
                  attention first.
                </p>
              </div>
            </div>
          </section>

          <div className={styles.sections}>
            <section className={styles.section}>
              <p className={styles.eyebrow}>What you get</p>
              <h2 className={styles.sectionTitle}>A private observation that makes the pattern visible.</h2>
              <p className={styles.sectionCopy}>
                Most people can sense when something is shifting, but struggle to name where it is coming
                from. SoulScope helps surface the patterns that may be shaping your current state across
                clarity, load, recovery, expression, support, and direction.
              </p>
              <div className={styles.featureGrid}>
                <div className={styles.featureCard}>
                  <h3 className={styles.featureTitle}>1. Your Latest Pattern</h3>
                </div>
                <div className={styles.featureCard}>
                  <h3 className={styles.featureTitle}>2. What Is Supporting You</h3>
                </div>
                <div className={styles.featureCard}>
                  <h3 className={styles.featureTitle}>3. What May Be Carrying Load</h3>
                </div>
                <div className={styles.featureCard}>
                  <h3 className={styles.featureTitle}>4. Your Signal Map</h3>
                </div>
                <div className={styles.featureCard}>
                  <h3 className={styles.featureTitle}>5. What This Often Feels Like</h3>
                </div>
                <div className={styles.featureCard}>
                  <h3 className={styles.featureTitle}>6. What Deserves Attention First</h3>
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <p className={styles.eyebrow}>Framework</p>
              <h2 className={styles.sectionTitle}>A new way to observe yourself.</h2>
              <p className={styles.sectionCopy}>
                Voice is the first lens, not the whole product. SoulScope is designed as a whole-self
                observation platform: one place to notice how clarity, expression, recovery, load,
                adaptability, and direction are interacting.
              </p>
            </section>

            <section className={styles.section}>
              <p className={styles.eyebrow}>Latest Pattern</p>
              <h2 className={styles.sectionTitle}>What is the strongest pattern your voice is expressing?</h2>
              <p className={styles.sectionCopy}>
                Your latest pattern is not an identity. It is a current-state observation: the theme
                that appears most coherent in this scan.
              </p>
            </section>

            <section className={styles.section}>
              <p className={styles.eyebrow}>How it works</p>
              <h2 className={styles.sectionTitle}>Speak. Observe. Understand.</h2>
              <div className={styles.whatGrid}>
                <div>
                  <ul className={styles.list}>
                    <li className={styles.listItem}>Speak naturally into your phone.</li>
                    <li className={styles.listItem}>SoulScope looks for patterns in voice, timing, and expression.</li>
                    <li className={styles.listItem}>You receive a personal insight translated into clear human language.</li>
                  </ul>
                </div>
              </div>
              <div className={styles.featureGrid}>
                <div className={styles.featureCard}>
                  <h3 className={styles.featureTitle}>Mental State</h3>
                  <p className={styles.featureText}>Clarity, focus, overload, and reflection.</p>
                </div>
                <div className={styles.featureCard}>
                  <h3 className={styles.featureTitle}>Emotional State</h3>
                  <p className={styles.featureText}>Expression, resilience, suppression, and emotional range.</p>
                </div>
                <div className={styles.featureCard}>
                  <h3 className={styles.featureTitle}>Physical and Behavioral State</h3>
                  <p className={styles.featureText}>Tension, recovery, motivation, engagement, and adaptability.</p>
                </div>
              </div>
              <p className={styles.disclaimer}>Insight, not diagnosis. Observation, not prediction.</p>
            </section>

            <section className={styles.section}>
              <p className={styles.eyebrow}>Trust</p>
              <h2 className={styles.sectionTitle}>Private, careful, and designed to stay credible.</h2>
              <p className={styles.sectionCopy}>
                SoulScope is designed to help you observe patterns that may be associated with your
                current state. It is not a medical, psychological, or diagnostic assessment, and it
                does not need overstated claims to feel useful.
              </p>
              <p className={styles.disclaimer}>
                Quiet room. Natural voice. No performance. Better capture creates better interpretation.
              </p>
            </section>

            <BetaFeedbackForm page="home" />
          </div>

          <footer className={styles.footer}>
            <p>
              <Link href="/how-it-works" className={styles.footerLink}>
                How SoulScope works
              </Link>
            </p>
          </footer>
        </div>
      </div>
    </>
  );
}
