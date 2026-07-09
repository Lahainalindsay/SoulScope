"use client";

import Head from "next/head";
import Link from "next/link";
import { RESEARCH_REFERENCES, VALIDATION_NOTE } from "../lib/scanProtocol";
import styles from "./HowItWorks.module.css";

const steps = [
  {
    title: "Guided Capture",
    description: "A short guided reflection creates a natural first signal.",
    details: [
      "Prompts are combined into one pattern view",
      "The protocol samples baseline speech, emotional expression, and reflective language",
      "You speak naturally; there is no performance standard",
    ],
  },
  {
    title: "Pattern Measurement",
    description: "Voice characteristics are measured and organized into broader human patterns.",
    details: [
      "Voice is the first sensing lens, not the whole product",
      "Musical notes are kept internally as a stable organizing model",
      "The interface translates those notes into human systems and observed tendencies",
    ],
  },
  {
    title: "Whole-Self Observation",
    description:
      "Observed patterns are translated into practical insights across mental, emotional, physical, and behavioral systems.",
    details: [
      "Some patterns may indicate where more support, recovery, or expression is needed",
      "Patterns with higher load may indicate pressure, compensation, or sustained strain",
      "Language is framed as tendencies and correlations, not diagnosis",
    ],
  },
  {
    title: "Practical Next Step",
    description:
      "Insights are paired with supportive actions designed to encourage balance, recovery, and adaptability.",
    details: [
      "Breath, reflection, expression, movement, and recovery practices",
      "Suggested actions are practical and non-diagnostic",
      "Retesting helps you track whether patterns shift over time",
    ],
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
            {steps.map((step, index) => (
              <article key={step.title} className={styles.stepCard}>
                <span className={styles.stepNumber}>0{index + 1}</span>
                <h2 className={styles.stepTitle}>{step.title}</h2>
                <p className={styles.stepDescription}>{step.description}</p>
                <ul className={styles.detailList}>
                  {step.details.map((detail) => (
                    <li key={detail} className={styles.detailItem}>
                      {detail}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </section>

          <section className={styles.frameCard}>
            <p className={styles.sectionEyebrow}>How the result is framed</p>
            <h2 className={styles.sectionTitle}>Observed signals first. Human meaning second.</h2>
            <p className={styles.frameText}>
              The insight starts with observed signal patterns. Those patterns are then translated through
              the SoulScope system into human themes such as clarity, expression, tension, recovery,
              motivation, and adaptability.
            </p>
          </section>

          <section className={styles.researchCard}>
            <p className={styles.sectionEyebrow}>Research Context</p>
            <h2 className={styles.sectionTitle}>The evidence context behind the framing.</h2>
            <p className={styles.validationNote}>{VALIDATION_NOTE}</p>
            <div className={styles.referenceGrid}>
              {RESEARCH_REFERENCES.map((reference) => (
                <a
                  key={reference.url}
                  href={reference.url}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.referenceCard}
                >
                  <span className={styles.referenceType}>{reference.type}</span>
                  <h3 className={styles.referenceTitle}>{reference.title}</h3>
                  <p className={styles.referenceNote}>{reference.note}</p>
                </a>
              ))}
            </div>
            <p className={styles.disclaimer}>
              SoulScope is not a medical device and does not diagnose mental or physical conditions. It is
              for education, reflection, and self-observation.
            </p>
          </section>
        </main>
      </div>
    </>
  );
}
