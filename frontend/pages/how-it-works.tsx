"use client";

import Head from "next/head";
import Link from "next/link";
import { VALIDATION_NOTE } from "../lib/scanProtocol";
import styles from "./HowItWorks.module.css";

const steps = [
  {
    title: "Speak",
    description: "Answer a few prompts out loud.",
  },
  {
    title: "Observe",
    description: "SoulScope reads timing, steadiness, expression, and response patterns.",
  },
  {
    title: "Reflect",
    description: "Receive a current pattern, resonance map, and clear next step.",
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
            <h1 className={styles.title}>A clearer way to notice change.</h1>
            <p className={styles.lead}>Your voice carries subtle shifts in load, recovery, clarity, and expression. SoulScope turns them into a current-state reflection.</p>
            <div className={styles.actions}>
              <Link href="/scan" className={styles.primaryButton}>Start Scan</Link>
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
            <p className={styles.frameText}>SoulScope reflects patterns in a scan. It doesn&apos;t diagnose or define you.</p>
          </section>

          <section className={styles.researchCard}>
            <p className={styles.sectionEyebrow}>Evidence</p>
            <h2 className={styles.sectionTitle}>Careful by design.</h2>
            <p className={styles.validationNote}>{VALIDATION_NOTE}</p>
          </section>
        </main>
      </div>
    </>
  );
}
