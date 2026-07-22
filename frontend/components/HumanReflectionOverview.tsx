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
          <p className={styles.eyebrow}>What Stands Out</p>
          <h2>What stood out in this scan</h2>
        </div>
        <div className={styles.topNotesGrid}>
          {presentation.explanation.slice(0, 3).map((line) => (
            <article key={line} className={styles.noteCard}><p>{line}</p></article>
          ))}
        </div>
      </section>

      <section className={styles.notesSection}>
        <div className={styles.notesHeader}>
          <p className={styles.eyebrow}>How This May Show Up</p>
          <h2>How this may show up</h2>
        </div>
        <div className={styles.topNotesGrid}>
          {presentation.dailyLife.slice(0, 4).map((line) => (
            <article key={line} className={styles.noteCard}><p>{line}</p></article>
          ))}
        </div>
      </section>

      <section className={styles.notesSection}>
        <div className={styles.notesHeader}>
          <p className={styles.eyebrow}>A Gentle Next Step</p>
          <h2>Something to try</h2>
        </div>
        <div className={styles.topNotesGrid}>
          {practices.map((practice) => (
            <article key={practice} className={styles.noteCard}><p>{practice}</p></article>
          ))}
        </div>
      </section>

      <section className={styles.notesSection}>
        <div className={styles.notesHeader}>
          <p className={styles.eyebrow}>Something to Notice</p>
          <h2>One question for this moment</h2>
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
          <p className={styles.noteStatus}>What Changed</p>
          <p>{report.baselineComparison?.overallSummary ?? presentation.longitudinalMessage}</p>
        </article>
      </section>
    </>
  );
}
