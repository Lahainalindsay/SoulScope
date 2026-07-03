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
        <title>SoulScope - Whole-Self Resonance Analysis</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={styles.page}>
        <div className={styles.gridOverlay} />

        <div className={styles.shell}>
          <section className={styles.hero}>
            <div className={styles.heroMain}>
              <p className={styles.eyebrow}>Whole-Self Resonance Analysis</p>
              <h1 className={styles.wordmark}>SOULSCOPE</h1>
              <p className={styles.headline}>Every voice tells a story.</p>
              <p className={styles.heroCopy}>
                The words are only part of it. Beneath every conversation is a unique pattern shaped by your
                thoughts, emotions, experiences, and the way your inner world responds to life. SoulScope
                interprets those patterns into a personalized reflection that helps you better understand yourself.
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
                  How It Works
                </Link>
              </div>

              <p className={styles.disclaimer}>Insight, not diagnosis. Patterns, not claims.</p>

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
                <h2 className={styles.sideTitle}>The voice is the sensing mechanism. You are the focus.</h2>
                <p className={styles.sideText}>
                  SoulScope is designed to turn subtle voice patterns into a clear, human reflection of how
                  you may be showing up in this moment.
                </p>
              </div>
            </div>
          </section>

          <div className={styles.sections}>
            <section className={styles.section}>
              <p className={styles.eyebrow}>What you get</p>
              <h2 className={styles.sectionTitle}>Complex voice patterns, translated into self-awareness.</h2>
              <p className={styles.sectionCopy}>
                Most people can feel when something is off, but struggle to identify where the strain is coming
                from. SoulScope helps surface patterns that may be associated with mental load, emotional expression,
                recovery, resilience, adaptability, and the way your inner world is organizing itself right now.
              </p>
              <div className={styles.featureGrid}>
                <div className={styles.featureCard}><h3 className={styles.featureTitle}>1. Your Current Story</h3></div>
                <div className={styles.featureCard}><h3 className={styles.featureTitle}>2. Current Strengths</h3></div>
                <div className={styles.featureCard}><h3 className={styles.featureTitle}>3. What You May Be Carrying</h3></div>
                <div className={styles.featureCard}><h3 className={styles.featureTitle}>4. Your Resonance Map</h3></div>
                <div className={styles.featureCard}><h3 className={styles.featureTitle}>5. What This Often Feels Like</h3></div>
                <div className={styles.featureCard}><h3 className={styles.featureTitle}>6. Suggested Rebalancing</h3></div>
              </div>
            </section>

            <section className={styles.section}>
              <p className={styles.eyebrow}>How it works</p>
              <h2 className={styles.sectionTitle}>Your voice is more than speech.</h2>
              <p className={styles.sectionCopy}>Your voice resonates with the landscape of your inner self.</p>
              <p className={styles.sectionCopy}>
                SoulScope guides you through a series of short questions that you answer naturally, speaking out loud.
                As you speak, our software analyzes the relationships between frequencies, resonance, rhythm,
                stability, variability, and other subtle acoustic characteristics within your voice.
              </p>
              <p className={styles.sectionCopy}>
                Rather than focusing on what you say, SoulScope listens to how your voice naturally expresses itself.
                These acoustic relationships are combined into a Whole-Self Resonance Profile that reflects the unique
                patterns present in your voice during this moment.
              </p>
              <p className={styles.sectionCopy}>
                Because your voice naturally changes over time, every scan becomes a snapshot of your current state,
                allowing you to observe how your patterns evolve as your life evolves.
              </p>
            </section>

            <section className={styles.section}>
              <p className={styles.eyebrow}>Insight, not diagnosis</p>
              <h2 className={styles.sectionTitle}>Clear patterns. Clean guardrails.</h2>
              <p className={styles.sectionCopy}>
                SoulScope is designed to help you understand patterns that may be associated with your current state.
                It is not a medical, psychological, or diagnostic assessment.
              </p>
              <p className={styles.disclaimer}>Quiet room. Natural voice. No performance. Better capture creates better interpretation.</p>
            </section>

            <BetaFeedbackForm page="home" />
          </div>

          <footer className={styles.footer}>
            <p>
              <Link href="/how-it-works" className={styles.footerLink}>How SoulScope works</Link>
            </p>
          </footer>
        </div>
      </div>
    </>
  );
}
