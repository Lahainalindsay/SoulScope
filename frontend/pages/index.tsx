import Head from "next/head";
import Link from "next/link";
import { useSession } from "@supabase/auth-helpers-react";
import styles from "../styles/Home.module.css";

const START_SCAN_LOGIN = { pathname: "/auth/login", query: { next: "/scan" } };

export default function HomePage() {
  const session = useSession();
  const startScanHref = session ? "/scan" : START_SCAN_LOGIN;

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
          <div
            className={styles.productIntroInner}
            style={{
              boxSizing: "border-box",
              paddingLeft: "clamp(24px, 6vw, 72px)",
              paddingRight: "clamp(24px, 6vw, 72px)",
            }}
          >
            <h1
              className={styles.heroHeadline}
              style={{
                fontSize: "clamp(1.0125rem, 3.75vw, 3.15rem)",
                lineHeight: 1.08,
                maxWidth: "15ch",
                whiteSpace: "normal",
                overflowWrap: "normal",
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
              <Link href={startScanHref} className={styles.primaryCta}>Begin Your Resonance Scan</Link>
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
