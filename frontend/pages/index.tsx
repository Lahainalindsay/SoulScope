import Head from "next/head";
import Link from "next/link";
import { useUser } from "@supabase/auth-helpers-react";
import { useEffect, useState } from "react";
import { getLocalDevSession } from "../lib/localSession";
import styles from "./Home.module.css";

export default function Home() {
  const user = useUser();
  const [hasLocalSession, setHasLocalSession] = useState(false);

  useEffect(() => {
    setHasLocalSession(Boolean(getLocalDevSession()));
  }, []);

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
              <p className={styles.headline}>
                Your voice reveals more than emotion. It reveals <span className={styles.headlineAccent}>patterns</span>.
              </p>
              <p className={styles.heroCopy}>
                A guided Resonance Scan maps patterns across your mental, emotional, physical, and
                behavioral systems, helping you understand where you&apos;re balanced, carrying load,
                recovering, or adapting.
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

              <p className={styles.disclaimer}>
                The voice expresses what is happening in the inner world. SoulScope helps make those patterns visible.
              </p>

              <div className={styles.heroMeta}>
                <span className={styles.metaPill}>Takes about 60 seconds</span>
                <span className={styles.metaPill}>Private</span>
                <span className={styles.metaPill}>No downloads</span>
              </div>

              <div className={styles.scanInfo}>
                <div className={styles.metric}>
                  <p className={styles.sideLabel}>Clarity</p>
                  <div className={styles.metricValue}>Clarity</div>
                  <p className={styles.sideText}>Understand where attention, focus, and mental energy are currently being directed.</p>
                </div>
                <div className={styles.metric}>
                  <p className={styles.sideLabel}>Load</p>
                  <div className={styles.metricValue}>Load</div>
                  <p className={styles.sideText}>Discover patterns associated with pressure, tension, and recovery demands.</p>
                </div>
                <div className={styles.metric}>
                  <p className={styles.sideLabel}>Support</p>
                  <div className={styles.metricValue}>Support</div>
                  <p className={styles.sideText}>Identify strengths, resources, and adaptive capacities already present within your system.</p>
                </div>
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
                  Voice patterns may reflect how mental, emotional, physical, and behavioral systems are
                  interacting in real time. SoulScope translates those patterns into meaningful
                  self-awareness—not technical measurements.
                </p>
              </div>
            </div>

            <div className={styles.heroSupportCard}>
              <div className={styles.sideCard}>
                <p className={styles.sideLabel}>Resonance Profile</p>
                <p className={styles.sideText}>
                  Your Resonance Profile shows what appears balanced, what may be carrying excess load,
                  and what may be asking for more support.
                </p>
              </div>
            </div>
          </section>

          <div className={styles.sections}>
            <section className={styles.section}>
              <p className={styles.eyebrow}>What you get</p>
              <h2 className={styles.sectionTitle}>Complex voice patterns, translated into self-awareness.</h2>
              <p className={styles.sectionCopy}>
                Most people can feel when something is off, but struggle to identify where the strain is
                coming from. SoulScope helps surface patterns that may be associated with mental load,
                emotional expression, physical tension, resilience, adaptability, and future
                orientation—providing a clearer view of your current state.
              </p>
              <div className={styles.featureGrid}>
                <div className={styles.featureCard}>
                  <h3 className={styles.featureTitle}>1. Your Current Story</h3>
                </div>
                <div className={styles.featureCard}>
                  <h3 className={styles.featureTitle}>2. Current Strengths</h3>
                </div>
                <div className={styles.featureCard}>
                  <h3 className={styles.featureTitle}>3. What You May Be Carrying</h3>
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
              <h2 className={styles.sectionTitle}>Mental, emotional, physical, and behavioral signals in one view.</h2>
              <p className={styles.sectionCopy}>
                Voice patterns may correlate with clarity, focus, emotional range, recovery, stress load,
                motivation, adaptability, and future orientation. SoulScope organizes those signals into
                insight you can act on.
              </p>
            </section>

            <section className={styles.section}>
              <p className={styles.eyebrow}>Core Resonance</p>
              <h2 className={styles.sectionTitle}>Core Resonance is the strongest organizing pattern in your Resonance Scan.</h2>
              <p className={styles.sectionCopy}>
                It does not diagnose who you are. It suggests where your system appears most coherent
                right now, and what themes may be shaping your current state.
              </p>
            </section>

            <section className={styles.section}>
              <p className={styles.eyebrow}>How it works</p>
              <h2 className={styles.sectionTitle}>Speak. Map. Understand.</h2>
              <div className={styles.whatGrid}>
                <div>
                  <ul className={styles.list}>
                    <li className={styles.listItem}>Speak naturally into your phone.</li>
                    <li className={styles.listItem}>SoulScope analyzes patterns in your voice.</li>
                    <li className={styles.listItem}>You receive a Resonance Profile translated into human insight.</li>
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
              <p className={styles.disclaimer}>Insight, not diagnosis. Patterns, not claims.</p>
            </section>

            <section className={styles.section}>
              <p className={styles.eyebrow}>Insight, not diagnosis</p>
              <h2 className={styles.sectionTitle}>Clear patterns. Clean guardrails.</h2>
              <p className={styles.sectionCopy}>
                SoulScope is designed to help you understand patterns that may be associated with your
                current state. It is not a medical, psychological, or diagnostic assessment.
              </p>
              <p className={styles.disclaimer}>
                Quiet room. Natural voice. No performance. Better capture creates better interpretation.
              </p>
            </section>
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
