"use client";

import Head from "next/head";
import Link from "next/link";
import { RESEARCH_REFERENCES, VALIDATION_NOTE } from "../lib/scanProtocol";
import styles from "./HowItWorks.module.css";

const steps = [
  {
    title: "Composite voice capture",
    description:
      "You complete three guided prompts. SoulScope captures spontaneous, structured, and reflective speech so the readout is based on more than one speaking mode.",
    details: [
      "Three prompts are merged into one composite result",
      "The protocol samples baseline speech, sequencing, and emotional inflection",
      "You control when to move forward, so the recording is not rushed",
    ],
  },
  {
    title: "Spectrum measurement",
    description:
      "Each response is processed with on-device speech spectrum analysis to measure how energy is distributed across 12 equal-tempered note classes in the speaking range.",
    details: [
      "FFT-based note-class energy mapping from C through B",
      "Centroid, flatness, RMS, zero-crossing, and note-class energy add tone context",
      "The system flags low-support and overloaded regions across the full sample",
    ],
  },
  {
    title: "Pattern interpretation",
    description:
      "Measured voice patterns are translated into a practical readout centered on support, clarity, projection, fatigue, tension, and vocal load, then interpreted through the SoulScope note model.",
    details: [
      "Low note energy can suggest reduced support, damping, or vocal reserve",
      "High-load note energy can suggest compensation, pressure, or overuse",
      "The measured layer stays separate from the proprietary note-meaning and chakra overlays",
    ],
  },
  {
    title: "Rebalancing guidance",
    description:
      "The result is paired with simple next steps that target the weak regions and calm the overloaded ones.",
    details: [
      "Listening tone suggestions and reference tone playback",
      "Breath, resonance, projection, and recovery drills",
      "Retesting helps you track whether the spectrum becomes more even over time",
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
            <h1 className={styles.title}>Measured voice analysis with a clear wellness frame.</h1>
            <p className={styles.lead}>
              SoulScope treats the voice as a measurable signal. The product experience is atmospheric,
              but the scan itself is built around speech spectrum analysis, note-region energy, tone
              quality features, and guided speech tasks.
            </p>
            <div className={styles.actions}>
              <Link href="/scan" className={styles.primaryButton}>
                Start Scan
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
            <h2 className={styles.sectionTitle}>Measured pattern first. Meaning second.</h2>
            <p className={styles.frameText}>
              The report starts with measured voice data: spectrum balance, note-region emphasis,
              resonance behavior, and energy distribution. That measured layer is then interpreted through
              the SoulScope proprietary note system, which connects note patterns to emotional themes,
              physical correlates, and rebalancing practices.
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
              SoulScope is not a medical device. It is for education and self-observation and should not
              replace professional evaluation or treatment.
            </p>
          </section>
        </main>
      </div>
    </>
  );
}
