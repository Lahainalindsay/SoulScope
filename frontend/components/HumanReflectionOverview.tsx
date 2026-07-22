import { useState } from "react";
import type { SoulScopeReport } from "../lib/buildSoulScopeReport";
import styles from "./ResonanceResultsDashboard.module.css";

export default function HumanReflectionOverview({ report }: { report: SoulScopeReport }) {
  const presentation = report.presentation;
  const practices = report.canonicalPattern.supportLines;
  const [reflection, setReflection] = useState("");

  return (
    <>
      <section className={styles.notesSection}>
        <div className={styles.notesHeader}>
          <h2>What this may feel like</h2>
        </div>
        <div className={styles.topNotesGrid}>
          {presentation.explanation.slice(0, 2).map((line) => (
            <article key={line} className={styles.noteCard}><p>{line}</p></article>
          ))}
        </div>
      </section>

      <section className={styles.notesSection}>
        <div className={styles.notesHeader}>
          <h2>How this may show up in daily life</h2>
        </div>
        <div className={styles.topNotesGrid}>
          {presentation.dailyLife.slice(0, 4).map((line) => (
            <article key={line} className={styles.noteCard}><p>{line}</p></article>
          ))}
        </div>
      </section>

      <section className={styles.notesSection}>
        <div className={styles.notesHeader}>
          <h2>Pattern support</h2>
        </div>
        <div className={styles.topNotesGrid}>
          {practices.map((practice) => (
            <article key={practice} className={styles.noteCard}><p>{practice}</p></article>
          ))}
        </div>
      </section>

      <section className={styles.notesSection}>
        <div className={styles.notesHeader}>
          <h2>Pattern reflection</h2>
          <p>{presentation.reflectionQuestion}</p>
        </div>
        <label className={styles.noteCard}>
          <span className={styles.noteStatus}>Optional</span>
          <textarea
            value={reflection}
            onChange={(event) => setReflection(event.target.value)}
            placeholder="Write what comes to mind…"
            rows={5}
            aria-label="Optional pattern reflection"
          />
        </label>
      </section>

      <section className={styles.patternStrip}>
        <article className={styles.patternCard}>
          <p className={styles.noteStatus}>Looking over time</p>
          <p>{report.baselineComparison?.overallSummary ?? presentation.longitudinalMessage}</p>
        </article>
      </section>
    </>
  );
}
