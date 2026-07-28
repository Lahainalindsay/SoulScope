import Head from "next/head";
import Link from "next/link";
import styles from "../styles/Home.module.css";

const START_SCAN_LOGIN = { pathname: "/auth/login", query: { next: "/scan" } };

export default function HomePage() {
  return (
    <>
      <Head>
        <title>SoulScope — Clarity Comes From Within</title>
        <meta
          name="description"
          content="SoulScope organizes subtle patterns in your voice and expression into a clear reflection of your present inner world."
        />
      </Head>

      <main className={styles.page}>
        <section className={styles.productIntro}>
          <div className={styles.productIntroInner}>
            <h1
              className={styles.heroHeadline}
              style={{
                fontSize: "clamp(1.35rem, 5vw, 4.2rem)",
                lineHeight: 1,
                whiteSpace: "nowrap",
              }}
            >
              Clarity comes from within
            </h1>
            <p className={styles.heroBody}>
              The way you express yourself naturally changes as you move through life.
            </p>
            <p className={styles.heroBody}>
              SoulScope organizes subtle patterns in your voice and expression into a clear Reflection of your present inner world, creating a unique Resonance Signature for every scan.
            </p>
            <p className={styles.heroBody}>
              Every scan becomes part of your personal Resonance Timeline, helping you recognize what changes, what returns, and how your inner world evolves.
            </p>
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
