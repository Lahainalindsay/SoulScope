import Head from "next/head";
import Link from "next/link";
import styles from "../styles/Home.module.css";

export default function HomePage() {
  return (
    <>
      <Head>
        <title>SoulScope - See What Your Voice Is Expressing</title>
        <meta
          name="description"
          content="SoulScope helps make patterns in your voice visible, giving you a clearer view of how you may be responding, adapting, and feeling today."
        />
      </Head>

      <main className={styles.page}>
        <section className={styles.heroWrap}>
          <div className={styles.heroPanel}>
            <div className={styles.heroCopy}>
              <h1 className={styles.heroHeadline}>Every conversation reveals more than the words you choose.</h1>

              <p className={styles.heroLead}>
                Your voice naturally changes with stress, recovery, confidence, emotion, focus, and adaptation.
              </p>

              <p className={styles.heroBody}>
                SoulScope helps make those patterns visible, giving you a clearer view of how you may be responding,
                adapting, and feeling today.
              </p>

              <div className={styles.heroActions}>
                <Link href="/auth/login" className={styles.primaryCta}>Start Your Scan</Link>
                <Link href="/how-it-works" className={styles.secondaryCta}>See How It Works</Link>
              </div>

              <p className={styles.heroMeta}>About 60 seconds • Private by design • Observation, not diagnosis</p>
            </div>

            <div className={styles.heroVisual}>
              <div className={styles.visualFrame}>
                <img
                  src="/images/resonance-map-hero.png"
                  alt="SoulScope resonance map illustration"
                  className={styles.visualImage}
                />
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionInner}>
            <p className={styles.sectionEyebrow}>Introduction</p>
            <h2 className={styles.sectionTitle}>A new instrument for self-understanding</h2>
            <p className={styles.sectionIntro}>The patterns are already there. SoulScope helps you see them.</p>

            <div className={styles.editorialBlock}>
              <p>Every experience leaves subtle traces in the way you speak.</p>
              <p>
                Stress can change your rhythm. Emotion can shape your tone. Fatigue, confidence, uncertainty, focus, and
                recovery can influence the way your voice moves and responds.
              </p>
              <p>Most of these changes happen outside conscious awareness.</p>
              <p>
                SoulScope listens beyond your words, identifying patterns within your natural expression and translating
                them into a clearer view of your current inner state.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionInnerNarrow}>
            <p className={styles.sectionEyebrow}>A Different Kind of Self-Reflection</p>
            <h2 className={styles.sectionTitle}>SoulScope begins by listening</h2>

            <div className={styles.editorialBlock}>
              <p>Most self-assessments ask you to describe yourself.</p>
              <p>SoulScope begins with a signal your body is already expressing.</p>
              <p>
                Instead of asking you to rate your stress, define your mood, or decide how well you are doing, a
                Resonance Scan listens for subtle changes within your voice.
              </p>
              <p>
                Those changes are organized into meaningful observations that may help you recognize patterns you have
                felt&mdash;but have not yet been able to see clearly.
              </p>
              <p>The goal is not to tell you who you are.</p>
              <p>It is to help you better understand what your body is already expressing.</p>
            </div>
          </div>
        </section>

        <section className={styles.finalSection}>
          <div className={styles.finalInner}>
            <h2 className={styles.finalTitle}>Begin your Resonance Scan.</h2>
            <p className={styles.finalLine}>One guided conversation.</p>
            <p className={styles.finalLine}>A new perspective on yourself.</p>
            <div className={styles.finalActions}>
              <Link href="/auth/login" className={styles.primaryCta}>Start Your Scan</Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
