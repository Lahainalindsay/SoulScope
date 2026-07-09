"use client";

import Head from "next/head";
import Link from "next/link";
import { VALIDATION_NOTE } from "../lib/scanProtocol";
import styles from "./HowItWorks.module.css";

const steps = [
  {
    title: "What SoulScope observes",
    description: "Voice, timing, steadiness, expression, and response patterns from a short guided scan.",
  },
  {
    title: "How a scan works",
    description: "You answer a few prompts out loud. SoulScope combines those signals into one current-state reading.",
  },
  {
    title: "What you receive",
    description: "A primary pattern, a resonance map, three summary styles, and a clear next step to consider.",
  },
];

export default function HowItWorks() {
  return (
    <>
      <Head>
        <title>How SoulScope Works</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={styles.page}>
        <div className={styles.gridOverlay} />
        <main className={styles.shell}>
          <section className={styles.hero}>
            <p className={styles.eyebrow}>How It Works</p>
            <h1 className={styles.title}>A new way to observe yourself.</h1>
            <p className={styles.lead}>
              SoulScope starts with the voice as a natural signal, then translates subtle patterns into
              observations about clarity, expression, load, recovery, and direction.
            </p>
            <div className={styles.actions}>
              <Link href="/scan" className={styles.primaryButton}>
                Start New Scan
              </Link>
            </div>
          </section>

          <section className={styles.stepGrid}>
            {steps.map((step) => (
              <article key={step.title} className={styles.stepCard}>
                <h2 className={styles.stepTitle}>{step.title}</h2>
                <p className={styles.stepDescription}>{step.description}</p>
              </article>
            ))}
          </section>

          <section className={styles.frameCard}>
            <p className={styles.sectionEyebrow}>Framing</p>
            <h2 className={styles.sectionTitle}>Observation, not diagnosis.</h2>
            <p className={styles.frameText}>
              SoulScope describes patterns that may be present in a scan. It does not diagnose, predict,
              or define who you are.
            </p>
          </section>

          <section className={styles.researchCard}>
            <p className={styles.sectionEyebrow}>Evidence Context</p>
            <h2 className={styles.sectionTitle}>Built to stay careful.</h2>
            <p className={styles.validationNote}>{VALIDATION_NOTE}</p>
            <p className={styles.disclaimer}>
              Research references are used as context for cautious framing, not as a claim that SoulScope
              can diagnose mental or physical conditions.
            </p>
          </section>
        </main>
      </div>
    </>
  );
}
