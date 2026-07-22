import Head from "next/head";
import Link from "next/link";
import ResonanceSignature, { type ResonanceSignatureDatum } from "../components/ResonanceSignature";
import styles from "../styles/Home.module.css";

const START_SCAN_LOGIN = { pathname: "/auth/login", query: { next: "/scan" } };

const DEMO_SIGNATURE_DATA: ResonanceSignatureDatum[] = [
  { id: "illustrative:timing", value: 0.64, weight: 0.86 },
  { id: "illustrative:steadiness", value: 0.58, weight: 0.78 },
  { id: "illustrative:rhythm", value: 0.72, weight: 0.82 },
  { id: "illustrative:energy", value: 0.49, weight: 0.7 },
  { id: "illustrative:expression", value: 0.68, weight: 0.74 },
  { id: "illustrative:recovery", value: 0.42, weight: 0.62 },
];

export default function HomePage() {
  return (
    <>
      <Head>
        <title>SoulScope — Clarity Comes From Within</title>
        <meta
          name="description"
          content="SoulScope is a private instrument for self-awareness that organizes subtle patterns in your voice and expression into a personal Resonance Signature and Reflection."
        />
      </Head>

      <main className={styles.page}>
        <section className={styles.heroWrap}>
          <div className={styles.heroPanel}>
            <div className={styles.heroCopy}>
              <p className={styles.heroEyebrow}>A private instrument for self-awareness</p>
              <h1 className={styles.heroHeadline}>Clarity comes from within.</h1>
              <p className={styles.heroBody}>
                Your voice carries subtle patterns shaped by the way you are responding to life. SoulScope organizes
                those patterns into a personal Resonance Signature and Reflection, helping you see what may be difficult
                to notice on your own.
              </p>
              <div className={styles.heroActions}>
                <Link href={START_SCAN_LOGIN} className={styles.primaryCta}>Begin Your Resonance Scan</Link>
                <Link href="/how-it-works" className={styles.secondaryCta}>How SoulScope Works</Link>
              </div>
              <p className={styles.heroMeta}>Private by design · About 60 seconds · No diagnosis</p>
            </div>

            <figure className={styles.heroVisual}>
              <div className={styles.signatureFrame}>
                <ResonanceSignature
                  data={DEMO_SIGNATURE_DATA}
                  size={520}
                  label="Illustrative SoulScope Resonance Signature showing how scan patterns may become a visual signature."
                />
              </div>
              <figcaption className={styles.illustrativeLabel}>
                Illustrative SoulScope signature. Your personal signature is created after a Resonance Scan.
              </figcaption>
            </figure>
          </div>
        </section>

        <section className={styles.definitionSection} aria-labelledby="soulscope-definition-title">
          <div className={styles.definitionInner}>
            <div className={styles.definitionPair}>
              <article className={styles.dictionaryEntry}>
                <h2>SOUL</h2>
                <p>The inner world of a person — their feelings, awareness, identity, and lived experience.</p>
              </article>

              <div className={styles.dictionaryLight} aria-hidden="true" />

              <article className={styles.dictionaryEntry}>
                <h2>SCOPE</h2>
                <p>An instrument used to observe, examine, and bring what is difficult to see into clearer view.</p>
              </article>
            </div>

            <div className={styles.dictionaryCombined}>
              <h2 id="soulscope-definition-title">SOULSCOPE</h2>
              <p className={styles.dictionaryStatement}>A private instrument for seeing more clearly within.</p>
              <p className={styles.dictionarySupport}>
                SoulScope observes patterns in your voice and expression and transforms them into a personal Resonance
                Signature and Reflection — helping you recognize what may be present beneath the surface.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionInnerNarrow}>
            <p className={styles.sectionEyebrow}>A different kind of self-reflection</p>
            <h2 className={styles.sectionTitle}>SoulScope begins by listening.</h2>
            <div className={styles.editorialBlock}>
              <p>
                Most self-reflection tools begin by asking you to describe yourself. A Resonance Scan begins with
                patterns already present in the way you speak.
              </p>
              <p>
                Your answers provide context. Your voice provides the signal. Together, they create a clearer view of
                this moment.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.section} id="how-it-works">
          <div className={styles.sectionInner}>
            <p className={styles.sectionEyebrow}>How it works</p>
            <h2 className={styles.sectionTitle}>Speak. Observe. Reflect.</h2>
            <div className={styles.steps}>
              <article className={styles.step}>
                <span>1</span>
                <h3>Speak</h3>
                <p>Respond naturally to a short series of guided prompts.</p>
              </article>
              <article className={styles.step}>
                <span>2</span>
                <h3>Observe</h3>
                <p>SoulScope organizes patterns in timing, steadiness, rhythm, energy, and expression.</p>
              </article>
              <article className={styles.step}>
                <span>3</span>
                <h3>Reflect</h3>
                <p>Receive a Resonance Signature, a clear Reflection, and something meaningful to notice.</p>
              </article>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.receiveLayout}>
            <div>
              <p className={styles.sectionEyebrow}>What you receive</p>
              <h2 className={styles.sectionTitle}>One scan reveals a moment. Many scans reveal a story.</h2>
            </div>
            <div className={styles.receiveList}>
              <article>
                <h3>Your Resonance Signature</h3>
                <p>A visual expression shaped by the patterns present in your scan.</p>
              </article>
              <article>
                <h3>Your Reflection</h3>
                <p>A clear, human explanation of what stood out and how those patterns may relate.</p>
              </article>
              <article>
                <h3>Your Resonance Timeline</h3>
                <p>A private record of how your patterns shift, return, and evolve over time.</p>
              </article>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionInnerNarrow}>
            <p className={styles.sectionEyebrow}>Why return</p>
            <h2 className={styles.sectionTitle}>Your inner world is always moving.</h2>
            <div className={styles.editorialBlock}>
              <p>
                A single scan offers a view of the present. Over time, SoulScope can help you recognize what is
                temporary, what tends to return, and what may be changing.
              </p>
              <p>Scan when you want to pause, check in, prepare, reflect, or compare.</p>
            </div>
            <ul className={styles.returnList}>
              <li>At the beginning or end of the day</li>
              <li>Before or after an important conversation</li>
              <li>During a demanding week</li>
              <li>When something feels different</li>
              <li>When you want to notice progress</li>
            </ul>
          </div>
        </section>

        <section className={styles.section} id="privacy">
          <div className={styles.sectionInner}>
            <p className={styles.sectionEyebrow}>Privacy</p>
            <h2 className={styles.sectionTitle}>Your inner world should remain yours.</h2>
            <div className={styles.privacyGrid}>
              <p>
                A Resonance Scan asks for microphone access to record your responses. Camera access is optional where
                supported and may be used to observe broad changes in facial movement.
              </p>
              <p>
                SoulScope saves derived scan measurements, your Resonance Signature, Reflection, and history with your
                account. The saved scan record is built from measurements and interpretation data, not a public profile
                or advertisement target.
              </p>
              <p>
                This application does not include advertising or data-sale flows in the user experience. You can delete
                saved scan records from Settings.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.pairedGrid}>
            <article>
              <h2>SoulScope is</h2>
              <ul>
                <li>A reflection instrument</li>
                <li>A way to observe patterns</li>
                <li>A private record of change over time</li>
                <li>A starting point for self-awareness</li>
              </ul>
            </article>
            <article>
              <h2>SoulScope is not</h2>
              <ul>
                <li>A diagnosis</li>
                <li>A medical test</li>
                <li>A definition of who you are</li>
                <li>A replacement for professional care</li>
              </ul>
            </article>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionInnerNarrow}>
            <p className={styles.sectionEyebrow}>Founding 500</p>
            <h2 className={styles.sectionTitle}>Become one of the Founding 500.</h2>
            <div className={styles.editorialBlock}>
              <p>
                Help shape SoulScope from the beginning. Founding members receive full access for the first year and
                will be invited to share brief feedback as the experience evolves.
              </p>
            </div>
            <div className={styles.heroActions}>
              <Link href={START_SCAN_LOGIN} className={styles.primaryCta}>Join the Founding 500</Link>
            </div>
          </div>
        </section>

        <section className={styles.finalSection}>
          <div className={styles.finalInner}>
            <h2 className={styles.finalTitle}>See what this moment may be expressing.</h2>
            <p className={styles.finalLine}>Your first Reflection begins with your voice.</p>
            <div className={styles.finalActions}>
              <Link href={START_SCAN_LOGIN} className={styles.primaryCta}>Begin Your Resonance Scan</Link>
            </div>
            <p className={styles.heroMeta}>
              SoulScope is designed for personal reflection and self-understanding. It does not diagnose medical or
              psychological conditions.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
