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
          content="SoulScope helps you better understand what your body is already expressing through your voice."
        />
      </Head>

      <main className={styles.page}>
        <section className={styles.heroWrap}>
          <div className={styles.heroPanel}>
            <div className={styles.heroCopy}>
              <h1 className={styles.heroHeadline}>OBSERVE YOUR INNER WORLD</h1>
              <p className={styles.heroLead}><em>Your inner world is always expressing itself.</em></p>
              <p className={styles.heroBody}>Your voice naturally changes as your mind and body adapt to life.</p>
              <p className={styles.heroBody}>SoulScope is an instrument designed to detect those subtle patterns and organize them into meaningful reflections—helping you better understand what your body is already expressing.</p>
              <div className={styles.heroActions}>
                <Link href="/auth/login" className={styles.primaryCta}>Begin Resonance Scan</Link>
                <Link href="/how-it-works" className={styles.secondaryCta}>How It Works</Link>
              </div>
              <p className={styles.heroMeta}>One guided conversation. A new perspective on yourself.</p>
            </div>
            <div className={styles.heroVisual}><div className={styles.visualFrame}><img src="/images/resonance-map-hero.png" alt="SoulScope resonance map illustration" className={styles.visualImage} /></div></div>
          </div>
        </section>
      </main>
    </>
  );
}
