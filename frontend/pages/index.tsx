import Head from "next/head";
import Link from "next/link";
import styles from "../styles/Home.module.css";

export default function HomePage() {
  return (
    <>
      <Head>
        <title>SoulScope - Observe Your Inner World</title>
        <meta
          name="description"
          content="SoulScope organizes naturally occurring patterns in your voice into meaningful reflections, helping you better understand what your inner world is already expressing."
        />
      </Head>

      <main className={styles.page}>
        <section className={styles.heroWrap}>
          <div className={styles.heroPanel}>
            <div className={styles.heroCopy}>
              <h1 className={styles.heroHeadline}>OBSERVE YOUR INNER WORLD</h1>
              <p className={styles.heroLead}>Your voice naturally changes as your mind and body adapt to life.</p>
              <p className={styles.heroBody}>
                SoulScope is an instrument designed to observe those subtle patterns and organize them into meaningful reflections, helping you better understand what your inner world is already expressing.
              </p>
              <div className={styles.heroActions}>
                <Link href="/auth/login" className={styles.primaryCta}>Begin Resonance Scan</Link>
                <Link href="/how-it-works" className={styles.secondaryCta}>How It Works</Link>
              </div>
              <p className={styles.heroMeta}>About 60 seconds • Private by design • Built for self-understanding</p>
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
            <p className={styles.sectionEyebrow}>What SoulScope Observes</p>
            <h2 className={styles.sectionTitle}>The patterns are already there.</h2>
            <p className={styles.sectionIntro}>Every day, your inner world influences the way you naturally express yourself.</p>
            <div className={styles.editorialBlock}>
              <p>Stress may change rhythm.</p>
              <p>Recovery may change steadiness.</p>
              <p>Confidence may change tone.</p>
              <p>Emotion may change expression.</p>
              <p>Focus may change pacing.</p>
              <p>Most of these changes happen outside conscious awareness.</p>
              <p>SoulScope organizes these naturally occurring patterns into meaningful reflections, giving you a clearer perspective on your current state.</p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionInnerNarrow}>
            <p className={styles.sectionEyebrow}>A Different Kind of Self-Reflection</p>
            <h2 className={styles.sectionTitle}>SoulScope begins by listening.</h2>
            <div className={styles.editorialBlock}>
              <p>Most self-assessments ask you to describe yourself.</p>
              <p>Instead of asking you to rate your stress, choose your mood, or explain how you&apos;re feeling, a Resonance Scan starts with a signal your body is already expressing.</p>
              <p>The goal isn&apos;t to tell you who you are.</p>
              <p>The goal is to help you better understand what your inner world is already expressing.</p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionInner}>
            <p className={styles.sectionEyebrow}>What You Receive</p>
            <h2 className={styles.sectionTitle}>Every Resonance Scan becomes a new perspective.</h2>
            <div className={styles.editorialBlock}>
              <h3>Your Reflection</h3>
              <p>A simple explanation of the patterns most present in your scan.</p>

              <h3>Your Resonance Map</h3>
              <p>A visual representation of how those patterns relate to one another.</p>

              <h3>Your Resonance Timeline</h3>
              <p>As you continue scanning, SoulScope helps you recognize how your patterns naturally change over time.</p>

              <p><strong>One scan reveals a moment.</strong></p>
              <p><strong>Many scans reveal a story.</strong></p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionInnerNarrow}>
            <p className={styles.sectionEyebrow}>Why Return?</p>
            <h2 className={styles.sectionTitle}>Your inner world is always changing.</h2>
            <div className={styles.editorialBlock}>
              <p>Some days bring more clarity.</p>
              <p>Some bring more recovery.</p>
              <p>Others bring stress, excitement, uncertainty, or growth.</p>
              <p>As life changes, your Resonance Timeline becomes a living record of those shifts, helping you recognize patterns that may have otherwise gone unnoticed.</p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionInner}>
            <p className={styles.sectionEyebrow}>Built to Grow With You</p>
            <h2 className={styles.sectionTitle}>Voice is only the first lens.</h2>
            <div className={styles.editorialBlock}>
              <p>SoulScope begins with your voice because it naturally reflects subtle changes in how your mind and body adapt to life.</p>
              <p>As the platform evolves, additional forms of observation—including facial expression, movement, breathing, and other natural signals—will contribute to an even richer understanding of your inner world.</p>
              <p>The technology may evolve.</p>
              <p>The purpose remains the same.</p>
              <p><strong>To help you understand yourself more clearly.</strong></p>
            </div>
          </div>
        </section>

        <section className={styles.finalSection}>
          <div className={styles.finalInner}>
            <h2 className={styles.finalTitle}>Begin Your First Resonance Scan.</h2>
            <p className={styles.finalLine}>One conversation.</p>
            <p className={styles.finalLine}>One reflection.</p>
            <p className={styles.finalLine}>A clearer understanding of what your inner world may already be expressing.</p>
            <div className={styles.finalActions}>
              <Link href="/auth/login" className={styles.primaryCta}>Begin Resonance Scan</Link>
            </div>
            <p className={styles.heroMeta}>SoulScope is designed for personal reflection and self-understanding. It does not diagnose medical or psychological conditions.</p>
          </div>
        </section>
      </main>
    </>
  );
}
