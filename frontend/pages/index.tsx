import Head from "next/head";
import Link from "next/link";
import styles from "../styles/Home.module.css";

const START_SCAN_LOGIN = { pathname: "/auth/login", query: { next: "/scan" } };

export default function HomePage() {
  return (
    <>
      <Head>
        <title>SoulScope — A private instrument for self-awareness</title>
        <meta
          name="description"
          content="SoulScope is a private instrument for self-awareness."
        />
      </Head>

      <main className={styles.page}>
        <section className={styles.productIntro}>
          <div className={styles.productIntroInner}>
            <p className={styles.heroEyebrow}>A new instrument for self-reflection</p>
            <div className={styles.heroIdentity} aria-label="SoulScope definition">
              <div className={styles.dictionaryTerm}>
                <span>Soul</span>
                <small>noun</small>
              </div>
              <h1 className={styles.heroHeadline}>SoulScope</h1>
              <div className={styles.dictionaryTerm}>
                <span>Scope</span>
                <small>noun</small>
              </div>
            </div>
            <p className={styles.heroBody}>A private instrument for self-awareness.</p>
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
