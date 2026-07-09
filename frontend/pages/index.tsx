import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useUser } from "@supabase/auth-helpers-react";
import { useEffect, useState } from "react";
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

          <div className={styles.sections}>
            <section className={styles.statementSection}>
              <p className={styles.eyebrow}>What SoulScope Does</p>
              <h2 className={styles.sectionTitle}>A private read on the patterns your voice may be carrying.</h2>
              <p className={styles.sectionCopy}>
                Speak naturally for about a minute. SoulScope looks at voice, timing, and expression,
                then returns a clear pattern insight across clarity, load, recovery, support, and direction.
              </p>
            </section>

            <section className={styles.statementSection}>
              <p className={styles.eyebrow}>Trust</p>
              <h2 className={styles.sectionTitle}>Careful by design.</h2>
              <p className={styles.sectionCopy}>
                SoulScope is not a medical, psychological, or diagnostic assessment. It is built for
                private self-observation: clear language, restrained claims, and patterns you can revisit over time.
              </p>
            </section>

            <section className={styles.finalCta}>
              <p className={styles.eyebrow}>Begin</p>
              <h2 className={styles.sectionTitle}>Start with one scan.</h2>
              <div className={styles.heroActions}>
                <Link href={canScan ? "/scan" : "/auth/login"} className={styles.primaryButton}>
                  Start New Scan
                </Link>
                <Link href="/how-it-works" className={styles.secondaryButton}>
                  See How It Works
                </Link>
              </div>
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
