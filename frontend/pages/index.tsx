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
  const scanHref = canScan ? "/scan" : "/auth/login";

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
              <div className={styles.heroCopyBlock}>
                <p className={styles.eyebrow}>PRIVATE SELF-OBSERVATION</p>
                <h1 className={styles.wordmark}>SOULSCOPE</h1>
                <p className={styles.headline}>Every conversation reveals more than the words you choose.</p>
                <div className={styles.heroText}>
                  <p>Your voice naturally changes with stress, recovery, confidence, emotion, focus, and adaptation.</p>
                  <p>Most of these changes happen outside conscious awareness.</p>
                  <p>SoulScope helps make those patterns visible, giving you a new way to observe how your inner world may be expressing itself.</p>
                </div>

                <div className={styles.heroActions}>
                  <Link href={scanHref} className={styles.primaryButton}>
                    Begin Observation
                  </Link>
                  <Link href="/how-it-works" className={styles.secondaryButton}>
                    How It Works
                  </Link>
                </div>

                <p className={styles.heroMetaLine}>Observation, not diagnosis • About 60 seconds • Private by design</p>
              </div>
              <div className={styles.resonanceStage} aria-hidden="true" />
            </div>
          </section>

          <main className={styles.sections}>
            <section className={styles.editorialSection}>
              <h2 className={styles.sectionTitle}>What SoulScope Observes</h2>
              <p className={styles.sectionCopy}>Your voice naturally changes as your mind and body adapt to life.</p>
              <p className={styles.sectionCopy}>SoulScope organizes these changes into meaningful observations, including:</p>
              <ul className={styles.observationList}>
                <li>Recovery and restoration</li>
                <li>Mental load</li>
                <li>Emotional expression</li>
                <li>Energy and vitality</li>
                <li>Adaptability</li>
                <li>Communication patterns</li>
                <li>Overall regulation</li>
              </ul>
              <p className={styles.sectionCopy}>No labels.<br />No personality types.<br />Just patterns observed in the present moment.</p>
            </section>

            <section className={styles.editorialSection}>
              <h2 className={styles.sectionTitle}>Why Voice?</h2>
              <p className={styles.sectionCopy}>We often notice changes in someone&apos;s voice before they tell us how they&apos;re feeling.</p>
              <p className={styles.sectionCopy}>Stress, fatigue, confidence, focus, emotion, and recovery can subtly influence how we speak.</p>
              <p className={styles.sectionCopy}>SoulScope uses these naturally occurring patterns as the first lens for understanding your current state.</p>
              <p className={styles.sectionCopy}>Voice is only the beginning.</p>
              <p className={styles.sectionCopy}>
                Future observations will expand to include additional signals that help build a more complete picture of the whole self.
              </p>
            </section>

            <section className={styles.editorialSection}>
              <h2 className={styles.sectionTitle}>A Different Kind of Self-Reflection</h2>
              <p className={styles.sectionCopy}>Most self-assessments ask you to describe yourself.</p>
              <p className={styles.sectionCopy}>SoulScope begins by listening.</p>
              <p className={styles.sectionCopy}>Instead of asking you to rate your stress or guess how you&apos;re feeling, it starts with a signal your body is already expressing.</p>
              <p className={styles.sectionCopy}>The goal isn&apos;t to tell you who you are.</p>
              <p className={styles.sectionCopy}>The goal is to help you notice what may have been difficult to see on your own.</p>
            </section>

            <section className={styles.finalCta}>
              <h2 className={styles.sectionTitle}>Begin with one observation.</h2>
              <p className={styles.closingLine}>One minute.</p>
              <p className={styles.closingLine}>One conversation.</p>
              <p className={styles.closingLine}>A new perspective on yourself.</p>
              <div className={styles.heroActions}>
                <Link href={scanHref} className={styles.primaryButton}>
                  Begin Observation
                </Link>
              </div>
            </section>
          </main>

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
