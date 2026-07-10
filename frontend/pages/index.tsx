import Head from "next/head";
import Link from "next/link";
import styles from "../styles/Home.module.css";

type ObservationItem = {
  title: string;
  body: string;
};

const observations: ObservationItem[] = [
  { title: "Recovery and restoration", body: "How recovered or efforted your system may currently be." },
  { title: "Mental load", body: "Whether your system appears spacious, strained, or heavily tasked." },
  { title: "Emotional expression", body: "How readily expression seems available or held back." },
  { title: "Energy and vitality", body: "The overall sense of drive, steadiness, and available lift." },
  { title: "Adaptability", body: "How flexibly your system appears to be responding in the moment." },
  { title: "Communication patterns", body: "How timing, pace, and expression may be shaping how you come across." },
  { title: "Overall regulation", body: "How balanced, efforted, or compressed the whole pattern may be right now." },
];

export default function HomePage() {
  return (
    <>
      <Head>
        <title>SoulScope — Private Self-Observation</title>
        <meta
          name="description"
          content="SoulScope helps make subtle patterns in the voice more visible, offering a private, non-diagnostic way to observe your current state."
        />
      </Head>

      <main className={styles.page}>
        <section className={styles.heroWrap}>
          <div className={styles.heroPanel}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>Private Self-Observation</p>

              <h1 className={styles.heroTitle}>
                Every conversation reveals more than the words you choose.
              </h1>

              <p className={styles.heroLead}>
                Your voice naturally changes with stress, recovery, confidence, emotion, focus, and adaptation.
              </p>

              <p className={styles.heroBody}>
                Most of these changes happen outside conscious awareness.
              </p>

              <p className={styles.heroBody}>
                SoulScope helps make those patterns visible, giving you a new way to observe how your inner world may be expressing itself.
              </p>

              <div className={styles.heroActions}>
                <Link href="/auth/login" className={styles.primaryCta}>
                  Begin Observation
                </Link>
                <Link href="/how-it-works" className={styles.secondaryCta}>
                  How It Works
                </Link>
              </div>

              <p className={styles.heroMeta}>
                Observation, not diagnosis <span>•</span> About 60 seconds <span>•</span> Private by design
              </p>
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
            <h2 className={styles.sectionTitle}>Patterns your voice may already be carrying.</h2>
            <p className={styles.sectionIntro}>
              Your voice naturally changes as your mind and body adapt to life. SoulScope organizes those changes into
              meaningful observations in the present moment.
            </p>

            <div className={styles.observationList}>
              {observations.map((item) => (
                <div key={item.title} className={styles.observationRow}>
                  <h3 className={styles.observationTitle}>{item.title}</h3>
                  <p className={styles.observationBody}>{item.body}</p>
                </div>
              ))}
            </div>

            <div className={styles.closingNote}>
              <p>No labels.</p>
              <p>No personality types.</p>
              <p>Just patterns observed in the present moment.</p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionInnerNarrow}>
            <p className={styles.sectionEyebrow}>Why Voice</p>
            <h2 className={styles.sectionTitle}>We often hear changes before they are explained.</h2>

            <div className={styles.editorialBlock}>
              <p>
                We often notice changes in someone&apos;s voice before they tell us how they&apos;re feeling.
              </p>
              <p>
                Stress, fatigue, confidence, focus, emotion, and recovery can subtly influence how we speak.
              </p>
              <p>
                SoulScope uses these naturally occurring patterns as the first lens for understanding your current state.
              </p>
              <p>Voice is only the beginning.</p>
              <p>
                Future observations will expand to include additional signals that help build a more complete picture of
                the whole self.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionInnerNarrow}>
            <p className={styles.sectionEyebrow}>A Different Kind of Self-Reflection</p>
            <h2 className={styles.sectionTitle}>Most self-assessments ask you to describe yourself. SoulScope begins by listening.</h2>

            <div className={styles.editorialBlock}>
              <p>
                Instead of asking you to rate your stress or guess how you&apos;re feeling, it starts with a signal your
                body is already expressing.
              </p>
              <p>The goal isn&apos;t to tell you who you are.</p>
              <p>The goal is to help you notice what may have been difficult to see on your own.</p>
            </div>
          </div>
        </section>

        <section className={styles.finalSection}>
          <div className={styles.finalInner}>
            <h2 className={styles.finalTitle}>Begin with one observation.</h2>
            <p className={styles.finalLine}>One minute.</p>
            <p className={styles.finalLine}>One conversation.</p>
            <p className={styles.finalLine}>A new perspective on yourself.</p>

            <div className={styles.finalActions}>
              <Link href="/auth/login" className={styles.primaryCta}>
                Begin Observation
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
