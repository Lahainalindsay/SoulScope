"use client";

import Head from "next/head";
import Link from "next/link";
import { VALIDATION_NOTE } from "../lib/scanProtocol";
import styles from "./HowItWorks.module.css";

const steps = [
  {
    title: "Speak",
    description: "Respond naturally to a short series of guided prompts.",
  },
  {
    title: "Observe",
    description: "SoulScope organizes patterns in timing, steadiness, rhythm, energy, and expression.",
  },
  {
    title: "Reflect",
    description: "Receive a Resonance Signature, a clear Reflection, and something meaningful to notice.",
  },
];

export default function HowItWorks() {
  return (
    <>
      <Head>
        <title>How SoulScope Works — Voice, Reflection and Resonance</title>
        <meta
          name="description"
          content="Learn how SoulScope organizes subtle patterns in your voice and expression into a Resonance Signature and Reflection without diagnosis."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={styles.page}>
        <div className={styles.gridOverlay} />
        <main className={styles.shell}>
          <section className={styles.hero}>
            <p className={styles.eyebrow}>How It Works</p>
            <h1 className={styles.title}>A clearer way to notice change.</h1>
            <p className={styles.lead}>SoulScope listens for subtle patterns in your voice and expression and organizes them into a personal Resonance Signature and Reflection.</p>
            <div className={styles.actions}>
              <Link href="/scan" className={styles.primaryButton}>Begin Your Resonance Scan</Link>
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
            <p className={styles.sectionEyebrow}>What SoulScope listens for</p>
            <h2 className={styles.sectionTitle}>The scan begins with patterns already present.</h2>
            <p className={styles.frameText}>Your answers provide context. Your voice provides measurable rhythm, timing, steadiness, and expression signals.</p>
          </section>

          <section className={styles.frameCard}>
            <p className={styles.sectionEyebrow}>Resonance Signature</p>
            <h2 className={styles.sectionTitle}>How the Resonance Signature is formed.</h2>
            <p className={styles.frameText}>SoulScope organizes the strongest supported relationships in a scan into one visual signature and one Reflection for this moment.</p>
          </section>

          <section className={styles.frameCard}>
            <p className={styles.sectionEyebrow}>Observation, not diagnosis</p>
            <h2 className={styles.sectionTitle}>SoulScope does not define you.</h2>
            <p className={styles.frameText}>SoulScope reflects patterns in a scan. It does not diagnose, assess, or replace professional care.</p>
          </section>

          <section className={styles.researchCard}>
            <p className={styles.sectionEyebrow}>Privacy</p>
            <h2 className={styles.sectionTitle}>Your inner world should remain yours.</h2>
            <p className={styles.validationNote}>{VALIDATION_NOTE}</p>
            <div className={styles.actions}>
              <Link href="/scan" className={styles.primaryButton}>Begin Scan</Link>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
