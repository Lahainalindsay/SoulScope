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
        <title>SoulScope - Private Pattern Intelligence</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={styles.page}>
        <div className={styles.gridOverlay} />

        <div className={styles.shell}>
          <section className={styles.hero}>
            <div className={styles.heroMain}>
              <p className={styles.eyebrow}>Private Pattern Intelligence</p>
              <h1 className={styles.wordmark}>SOULSCOPE</h1>
              <p className={styles.headline}>
                Your voice may be saying more than you realize.
              </p>
              <p className={styles.heroCopy}>
                SoulScope listens for patterns beneath speech, translating what your voice may be
                revealing right now into clear, personal insight.
              </p>

              <div className={styles.resonanceStage} aria-hidden="true" />

              <div className={styles.heroActions}>
                {canScan ? (
                  <Link href="/scan" className={styles.primaryButton}>
                    Begin Resonance Scan
                  </Link>
                ) : (
                  <Link href="/auth/login" className={styles.primaryButton}>
                    Begin Resonance Scan
                  </Link>
                )}
                <Link href="/how-it-works" className={styles.secondaryButton}>
                  See How It Works
                </Link>
              </div>

              <p className={styles.disclaimer}>
                Recognition, not diagnosis. The goal is to make the pattern visible, not to reduce you to a score.
              </p>

              <div className={styles.heroMeta}>
                <span className={styles.metaPill}>Takes about 60 seconds</span>
                <span className={styles.metaPill}>Private</span>
                <span className={styles.metaPill}>No downloads</span>
              </div>
            </div>
          </section>

          <section className={styles.heroSupport}>
            <div className={styles.heroSupportCard}>
              <div className={`${styles.sideCard} ${styles.spectrumCard}`}>
                <div className={styles.glow} />
                <p className={styles.sideLabel}>Why it matters</p>
                <h2 className={styles.sideTitle}>The voice carries more than words.</h2>
                <p className={styles.sideText}>
                  SoulScope helps reveal how you may be showing up, feeling, and functioning right now
                  by translating voice patterns into a coherent human reading.
                </p>
              </div>
            </div>

            <div className={styles.heroSupportCard}>
              <div className={styles.sideCard}>
                <p className={styles.sideLabel}>Your reading</p>
                <p className={styles.sideText}>
                  Your reading shows what appears steady, what may be carrying load, and what may be
                  asking for more support.
                </p>
              </div>
            </div>
          </section>

          <div className={styles.sections}>
            <section className={styles.section}>
              <p className={styles.eyebrow}>What you get</p>
              <h2 className={styles.sectionTitle}>A private reading that makes the pattern visible.</h2>
              <p className={styles.sectionCopy}>
                Most people can sense when something is shifting, but struggle to name where it is coming
                from. SoulScope helps surface the patterns that may be shaping your current state across
                clarity, load, recovery, connection, and direction.
              </p>
              <div className={styles.featureGrid}>
                <div className={styles.featureCard}>
                  <h3 className={styles.featureTitle}>1. Your Current Story</h3>
                </div>
                <div className={styles.featureCard}>
                  <h3 className={styles.featureTitle}>2. What Is Working</h3>
                </div>
                <div className={styles.featureCard}>
                  <h3 className={styles.featureTitle}>3. What May Be Carrying Load</h3>
                </div>
                <div className={styles.featureCard}>
                  <h3 className={styles.featureTitle}>4. Your Resonance Map</h3>
                </div>
                <div className={styles.featureCard}>
                  <h3 className={styles.featureTitle}>5. What This Often Feels Like</h3>
                </div>
                <div className={styles.featureCard}>
                  <h3 className={styles.featureTitle}>6. Suggested Rebalancing</h3>
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <p className={styles.eyebrow}>Framework</p>
              <h2 className={styles.sectionTitle}>A single view of the patterns beneath speech.</h2>
              <p className={styles.sectionCopy}>
                Voice patterns may reflect how clarity, focus, emotional range, recovery, stress load,
                motivation, adaptability, and direction are interacting. SoulScope organizes those signals
                into one coherent interpretation.
              </p>
            </section>

            <section className={styles.section}>
              <p className={styles.eyebrow}>Core Resonance</p>
              <h2 className={styles.sectionTitle}>What is the strongest pattern your voice is expressing?</h2>
              <p className={styles.sectionCopy}>
                Core Resonance is the dominant pattern your scan brings forward. It does not define you;
                it reflects the themes that appear most coherent right now.
              </p>
            </section>

            <section className={styles.section}>
              <p className={styles.eyebrow}>How it works</p>
              <h2 className={styles.sectionTitle}>Speak. Map. Recognize.</h2>
              <div className={styles.whatGrid}>
                <div>
                  <ul className={styles.list}>
                    <li className={styles.listItem}>Speak naturally into your phone.</li>
                    <li className={styles.listItem}>SoulScope looks for patterns in voice, timing, and resonance.</li>
                    <li className={styles.listItem}>You receive a personal reading translated into clear human language.</li>
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
              <p className={styles.disclaimer}>Insight, not diagnosis. Pattern recognition, not prediction.</p>
            </section>

            <section className={styles.section}>
              <p className={styles.eyebrow}>Trust</p>
              <h2 className={styles.sectionTitle}>Private, careful, and designed to stay credible.</h2>
              <p className={styles.sectionCopy}>
                SoulScope is designed to help you understand patterns that may be associated with your
                current state. It is not a medical, psychological, or diagnostic assessment, and it does
                not need overstated claims to feel useful.
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
