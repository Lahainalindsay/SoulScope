import Head from "next/head";
import Link from "next/link";
import styles from "../styles/Home.module.css";

const START_SCAN_LOGIN = { pathname: "/auth/login", query: { next: "/scan" } };

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
                <Link href={START_SCAN_LOGIN} className={styles.primaryCta}>Start Scan</Link>
                <Link href="/how-it-works" className={styles.secondaryCta}>How It Works</Link>
              </div>
              <p className={styles.heroMeta}>About 60 seconds • Private by design • Built for self-understanding</p>
            </div>
          </div>
        </section>

        <section className="dictionarySection" aria-labelledby="soulscope-definition-title">
          <div className="dictionaryInner">
            <div className="dictionaryPair">
              <article className="dictionaryEntry">
                <div className="dictionaryHeading">
                  <h2>SOUL</h2>
                  <span>noun</span>
                </div>
                <p>“The inner world of a person — their feelings, awareness, identity, and lived experience.”</p>
              </article>

              <div className="dictionaryLight" aria-hidden="true" />

              <article className="dictionaryEntry">
                <div className="dictionaryHeading">
                  <h2>SCOPE</h2>
                  <span>noun</span>
                </div>
                <p>“An instrument used to observe, examine, and bring what is difficult to see into clearer view.”</p>
              </article>
            </div>

            <div className="dictionaryCombined">
              <h2 id="soulscope-definition-title">SOULSCOPE</h2>
              <p className="dictionaryStatement">“A private instrument for seeing more clearly within.”</p>
              <p className="dictionarySupport">
                “SoulScope observes patterns in your voice and expression and transforms them into a personal Resonance Signature and Reflection — helping you recognize what may be present beneath the surface.”
              </p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionInner}>
            <p className={styles.sectionEyebrow}>What SoulScope Observes</p>
            <h2 className={styles.sectionTitle}>The patterns are already there.</h2>
            <p className={styles.sectionIntro}>Every day, your inner world influences the way you naturally express yourself.</p>
            <div className={styles.editorialBlock}>
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
              <p>Instead of asking you to rate your stress, choose your mood, or explain how you&apos;re feeling, a Resonance Scan starts with a signal your body is already expressing.</p>
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

              <h3>Your Resonance Signature</h3>
              <p>A visual expression of how those patterns relate to one another.</p>

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
              <Link href={START_SCAN_LOGIN} className={styles.primaryCta}>Start Scan</Link>
            </div>
            <p className={styles.heroMeta}>SoulScope is designed for personal reflection and self-understanding. It does not diagnose medical or psychological conditions.</p>
          </div>
        </section>
      </main>

      <style jsx>{`
        .dictionarySection {
          width: 100%;
          padding: clamp(42px, 6vw, 72px) clamp(16px, 4vw, 24px);
        }

        .dictionaryInner {
          width: min(100%, 980px);
          margin: 0 auto;
        }

        .dictionaryPair {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(90px, 0.22fr) minmax(0, 1fr);
          align-items: start;
          gap: clamp(20px, 4vw, 44px);
        }

        .dictionaryEntry {
          min-width: 0;
          text-align: left;
        }

        .dictionaryHeading {
          display: flex;
          align-items: baseline;
          gap: 10px;
          padding-bottom: 9px;
          border-bottom: 1px solid rgba(222, 211, 176, 0.18);
        }

        .dictionaryHeading h2,
        .dictionaryCombined h2 {
          margin: 0;
          font-family: Georgia, "Times New Roman", serif;
          font-weight: 500;
          color: #f3f1e8;
        }

        .dictionaryHeading h2 {
          font-size: clamp(1.45rem, 2.2vw, 2rem);
          line-height: 1;
          letter-spacing: 0.01em;
        }

        .dictionaryHeading span {
          font-family: Inter, ui-sans-serif, system-ui, sans-serif;
          font-size: 0.68rem;
          font-style: italic;
          letter-spacing: 0.04em;
          text-transform: lowercase;
          color: rgba(210, 203, 184, 0.66);
        }

        .dictionaryEntry p {
          margin: 13px 0 0;
          max-width: 27rem;
          font-family: Inter, ui-sans-serif, system-ui, sans-serif;
          font-size: clamp(0.84rem, 1.15vw, 0.94rem);
          line-height: 1.72;
          color: rgba(205, 216, 230, 0.82);
        }

        .dictionaryLight {
          align-self: center;
          width: 100%;
          height: 1px;
          margin-top: 8px;
          background: linear-gradient(90deg, transparent, rgba(255, 244, 196, 0.2), rgba(255, 235, 155, 0.92), rgba(255, 249, 222, 0.98), rgba(255, 235, 155, 0.92), rgba(255, 244, 196, 0.2), transparent);
          box-shadow: 0 0 8px rgba(255, 230, 145, 0.42), 0 0 20px rgba(255, 239, 188, 0.18);
        }

        .dictionaryCombined {
          width: min(100%, 720px);
          margin: clamp(34px, 5vw, 54px) auto 0;
          text-align: center;
        }

        .dictionaryCombined h2 {
          font-size: clamp(1.9rem, 3.6vw, 3rem);
          line-height: 1;
          letter-spacing: 0.015em;
        }

        .dictionaryStatement {
          margin: 14px auto 0;
          font-family: Inter, ui-sans-serif, system-ui, sans-serif;
          font-size: clamp(0.94rem, 1.4vw, 1.04rem);
          line-height: 1.65;
          color: rgba(238, 240, 244, 0.92);
        }

        .dictionarySupport {
          margin: 20px auto 0;
          max-width: 44rem;
          font-family: Inter, ui-sans-serif, system-ui, sans-serif;
          font-size: clamp(0.84rem, 1.15vw, 0.94rem);
          line-height: 1.78;
          color: rgba(194, 208, 224, 0.78);
        }

        @media (max-width: 700px) {
          .dictionaryPair {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .dictionaryLight {
            width: min(70%, 220px);
            margin: 0 auto;
          }

          .dictionaryEntry {
            width: min(100%, 440px);
            margin: 0 auto;
          }
        }
      `}</style>
    </>
  );
}
