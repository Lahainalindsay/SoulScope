import Head from "next/head";
import Link from "next/link";
import styles from "../styles/Home.module.css";

const START_SCAN_LOGIN = { pathname: "/auth/login", query: { next: "/scan" } };

export default function HomePage() {
  return (
    <>
      <Head>
        <title>SoulScope — Observe Your Inner World</title>
        <meta
          name="description"
          content="SoulScope is an instrument designed to notice subtle patterns in your voice and expression and organize them into a clear reflection."
        />
      </Head>

      <main className={styles.page}>
        <section className={styles.productIntro}>
          <div className={styles.productIntroInner}>
            <h1 className={styles.heroHeadline}>OBSERVE YOUR INNER WORLD</h1>
            <p className={styles.heroBody}>The way you express yourself changes as you move through life.</p>
            <p className={styles.heroBody}>
              SoulScope is an instrument designed to notice the subtle patterns in your voice and expression, then organize them into a clear reflection of what may be present within you in that moment.
            </p>
            <p className={styles.heroEyebrow}>Your voice. Your pattern. Your signature.</p>
            <div className={styles.heroActions}>
              <Link href={START_SCAN_LOGIN} className={styles.primaryCta}>Begin Your Resonance Scan</Link>
              <Link href="/how-it-works" className={styles.secondaryCta}>How SoulScope Works</Link>
            </div>
          </div>
        </section>

        <footer className={styles.footer} id="privacy">
          <p>Private by design.</p>
          <span>Your scan data remains securely associated with your account.</span>
        </footer>
      </main>
    </>
  );
}
