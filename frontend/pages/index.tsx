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
              <p className={styles.heroLead}>Your voice changes with stress, recovery, confidence, emotion, focus, and adaptation.</p>
              <p className={styles.heroBody}>SoulScope makes those patterns visible, offering a clearer view of how you may be feeling today.</p>
              <div className={styles.heroActions}>
                <Link href="/auth/login" className={styles.primaryCta}>Start Scan</Link>
                <Link href="/how-it-works" className={styles.secondaryCta}>How It Works</Link>
              </div>
              <p className={styles.heroMeta}>About 60 seconds • Private by design • Observation, not diagnosis</p>
            </div>

            <div className={styles.heroVisual}>
              <div className={styles.visualFrame}>
                <img src="/images/resonance-map-hero.png" alt="SoulScope resonance map illustration" className={styles.visualImage} />
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionInner}>
            <p className={styles.sectionEyebrow}>Introduction</p>
            <h2 className={styles.sectionTitle}>A clearer view of your current state</h2>
            <p className={styles.sectionIntro}>Your voice changes as you move through life. SoulScope turns those patterns into clear observations.</p>
            <div className={styles.editorialBlock}>
              <p>Stress can change rhythm. Emotion can shape tone. Recovery can soften both.</p>
              <p>Most of these shifts happen outside conscious awareness.</p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionInnerNarrow}>
            <p className={styles.sectionEyebrow}>A Different Kind of Reflection</p>
            <h2 className={styles.sectionTitle}>SoulScope begins by listening</h2>
            <div className={styles.editorialBlock}>
              <p>You answer a few prompts out loud. SoulScope listens for changes in timing, tone, steadiness, and expression.</p>
              <p>It doesn&apos;t define you. It reflects what may be present today.</p>
            </div>
          </div>
        </section>

        <section className={styles.finalSection}>
          <div className={styles.finalInner}>
            <h2 className={styles.finalTitle}>Begin your Resonance Scan.</h2>
            <p className={styles.finalLine}>One guided conversation. One clear reflection.</p>
            <div className={styles.finalActions}>
              <Link href="/auth/login" className={styles.primaryCta}>Start Scan</Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
