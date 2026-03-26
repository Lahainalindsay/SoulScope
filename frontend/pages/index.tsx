import Head from "next/head";
import Link from "next/link";
import { useUser } from "@supabase/auth-helpers-react";
import { useEffect, useState } from "react";
import CymaticSigil from "../components/CymaticSigil";
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
        <title>SoulScope – Voice-Based Whole-System Insight</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={styles.page}>
        <div className={styles.gridOverlay} />

        <div className={styles.shell}>
          <section className={styles.hero}>
            <div className={styles.heroMain}>
              <p className={styles.eyebrow}>Voice-Based Whole-System Insight</p>
              <h1 className={styles.wordmark}>SOULSCOPE</h1>
              <p className={styles.headline}>
                See what your body&apos;s been trying to <span className={styles.headlineAccent}>tell you</span>.
              </p>
              <p className={styles.heroCopy}>
                What you&apos;ve lived through shapes your voice. We translate those patterns into
                something you can see, and shift.
              </p>

              <div className={styles.resonanceStage}>
                <div className={styles.resonanceGlow} />
                <div className={styles.resonanceOrb}>
                  <CymaticSigil amplitude={0.4} className={styles.resonanceSigil} />
                </div>
              </div>

              <div className={styles.heroActions}>
                {canScan ? (
                  <Link href="/scan" className={styles.primaryButton}>
                    Begin Your Scan
                  </Link>
                ) : (
                  <Link href="/auth/login" className={styles.primaryButton}>
                    Begin Your Scan
                  </Link>
                )}
              </div>

              <p className={styles.disclaimer}>Your voice carries patterns shaped by your experiences, most of which you never consciously notice.</p>

              <div className={styles.heroMeta}>
                <span className={styles.metaPill}>Takes about 60 seconds</span>
                <span className={styles.metaPill}>Private</span>
                <span className={styles.metaPill}>No downloads</span>
              </div>

              <div className={styles.scanInfo}>
                <div className={styles.metric}>
                  <p className={styles.sideLabel}>Core tone</p>
                  <div className={styles.metricValue}>Ease</div>
                  <p className={styles.sideText}>Where your voice sounds most natural, efficient, and supported.</p>
                </div>
                <div className={styles.metric}>
                  <p className={styles.sideLabel}>Overused ranges</p>
                  <div className={styles.metricValue}>Load</div>
                  <p className={styles.sideText}>Where your voice may be compensating or carrying excess stress.</p>
                </div>
                <div className={styles.metric}>
                  <p className={styles.sideLabel}>Underused ranges</p>
                  <div className={styles.metricValue}>Gaps</div>
                  <p className={styles.sideText}>Where support, clarity, or energy may be reduced.</p>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.heroSupport}>
            <div className={styles.heroSupportCard}>
              <div className={`${styles.sideCard} ${styles.spectrumCard}`}>
                <div className={styles.glow} />
                <p className={styles.sideLabel}>Why it matters</p>
                <h2 className={styles.sideTitle}>Your voice carries patterns shaped by your experiences.</h2>
                <p className={styles.sideText}>
                  Most of those patterns sit below conscious awareness. SoulScope makes them visible in a
                  way that feels simple, human, and clear.
                </p>
                <div className={styles.orb}>
                  <CymaticSigil amplitude={0.36} className={styles.orbSvg} />
                </div>
              </div>
            </div>

            <div className={styles.heroSupportCard}>
              <div className={styles.sideCard}>
                <p className={styles.sideLabel}>Balance profile</p>
                <p className={styles.sideText}>
                  Your balance profile shows how your voice is distributing energy, where it may be under
                  strain, and where simple support may help.
                </p>
              </div>
            </div>
          </section>

          <div className={styles.sections}>
            <section className={styles.section}>
              <p className={styles.eyebrow}>What you get</p>
              <h2 className={styles.sectionTitle}>Your voice is telling you about your inner state.</h2>
              <div className={styles.featureGrid}>
                <div className={styles.featureCard}>
                  <h3 className={styles.featureTitle}>1. Your core tone</h3>
                </div>
                <div className={styles.featureCard}>
                  <h3 className={styles.featureTitle}>2. Stressed / overused notes</h3>
                </div>
                <div className={styles.featureCard}>
                  <h3 className={styles.featureTitle}>3. Underused / repressed notes</h3>
                </div>
                <div className={styles.featureCard}>
                  <h3 className={styles.featureTitle}>4. Physical results of expressed notes</h3>
                </div>
                <div className={styles.featureCard}>
                  <h3 className={styles.featureTitle}>5. Emotional results of expressed notes</h3>
                </div>
                <div className={styles.featureCard}>
                  <h3 className={styles.featureTitle}>6. Balancing techniques designed for you</h3>
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <p className={styles.eyebrow}>Bridge</p>
              <h2 className={styles.sectionTitle}>Soulscope makes patterns visible.</h2>
              <p className={styles.sectionCopy}>
                Your voice carries patterns shaped by your experiences, most of which you don&apos;t consciously notice.
                Soulscope makes them visible.
              </p>
            </section>

            <section className={styles.section}>
              <p className={styles.eyebrow}>Soul tone</p>
              <h2 className={styles.sectionTitle}>Your soul tone is the note your system naturally vibrates at.</h2>
              <p className={styles.sectionCopy}>
                Using sound healing in this tone can be extremely beneficial to your system because it
                helps guide you back toward balance.
              </p>
            </section>

            <section className={styles.section}>
              <p className={styles.eyebrow}>How it works</p>
              <h2 className={styles.sectionTitle}>Speak. Analyze. See.</h2>
              <div className={styles.whatGrid}>
                <div>
                  <ul className={styles.list}>
                    <li className={styles.listItem}>Speak naturally into your phone.</li>
                    <li className={styles.listItem}>We analyze your vocal patterns.</li>
                    <li className={styles.listItem}>You see your core resonance and how it&apos;s expressed.</li>
                  </ul>
                </div>
              </div>
              <div className={styles.featureGrid}>
                <div className={styles.featureCard}>
                  <h3 className={styles.featureTitle}>Core tone</h3>
                  <p className={styles.featureText}>Your most stable and naturally supported voice pattern.</p>
                </div>
                <div className={styles.featureCard}>
                  <h3 className={styles.featureTitle}>Overload</h3>
                  <p className={styles.featureText}>Where your voice may be working harder than it should.</p>
                </div>
                <div className={styles.featureCard}>
                  <h3 className={styles.featureTitle}>Under-support</h3>
                  <p className={styles.featureText}>Where energy, support, or expression may drop off.</p>
                </div>
              </div>
              <p className={styles.disclaimer}>No guesswork. Just your voice.</p>
            </section>

            <section className={styles.section}>
              <p className={styles.eyebrow}>Insight, not diagnosis</p>
              <h2 className={styles.sectionTitle}>Clear patterns. Clean guardrails.</h2>
              <p className={styles.sectionCopy}>
                SoulScope is designed to help you understand patterns in your voice. It is not a medical
                diagnosis. It is wellness insight you can use.
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
