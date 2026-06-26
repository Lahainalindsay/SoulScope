"use client";

import Head from "next/head";
import Link from "next/link";
import { RESEARCH_REFERENCES, VALIDATION_NOTE } from "../lib/scanProtocol";
import styles from "./HowItWorks.module.css";

const steps = [
  {
    title: "Guided Whole-Self Capture",
    description: "A short guided voice reflection creates a natural sample for analysis.",
    details: [
      "Prompts are merged into one Resonance Profile",
      "The protocol samples baseline speech, emotional expression, and reflective language",
      "You speak naturally; there is no performance standard",
    ],
  },
  {
    title: "Pattern Measurement",
    description: "Voice characteristics are measured and organized into broader pattern groups.",
    details: [
      "The voice remains the sensing mechanism, not the product",
      "Musical notes are kept internally as a stable organizing model",
      "The interface translates those notes into human systems and observed tendencies",
    ],
  },
  {
    title: "Whole-Self Interpretation",
    description:
      "Observed patterns are translated into practical insights across mental, emotional, physical, and behavioral systems.",
    details: [
      "Some patterns may indicate where more support, recovery, or expression is needed",
      "Patterns with higher load may indicate pressure, compensation, or sustained strain",
      "Language is framed as tendencies and correlations, not diagnosis",
    ],
  },
  {
    title: "Rebalancing Guidance",
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
            <h1 className={styles.title}>Voice analysis translated into whole-self insight.</h1>
            <p className={styles.lead}>
              SoulScope treats the voice as a sensing mechanism for patterns that may correlate with
              mental clarity, emotional expression, physical load, recovery, and behavioral momentum.
            </p>
            <div className={styles.actions}>
              <Link href="/scan" className={styles.primaryButton}>
                Start Resonance Scan
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
            <h2 className={styles.sectionTitle}>Observed patterns first. Human meaning second.</h2>
            <p className={styles.frameText}>
              The Resonance Report starts with observed voice patterns. Those patterns are then translated
              through the SoulScope system into human themes such as clarity, expression, tension,
              recovery, motivation, and adaptability.
            </p>
          </section>

          <section className={styles.researchCard}>
            <p className={styles.sectionEyebrow}>Research Context</p>
            <h2 className={styles.sectionTitle}>The evidence base behind the framing.</h2>
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
