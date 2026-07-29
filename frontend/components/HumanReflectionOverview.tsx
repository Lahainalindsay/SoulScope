import { useState } from "react";
import type { SoulScopeReport } from "../lib/buildSoulScopeReport";
import styles from "./ResonanceResultsDashboard.module.css";

export default function HumanReflectionOverview({ report }: { report: SoulScopeReport }) {
  const presentation = report.presentation;
  const narrative = report.canonicalNarrative;
  const practices = [narrative.gentleNextStep];
  const [reflection, setReflection] = useState("");
  const reflectionLines = [narrative.reflection];

  return (
    <>
      <section className={styles.notesSection}>
        <div className={styles.notesHeader}>
          <p className={styles.eyebrow}>Your Reflection</p>
        </div>
        <div className={styles.topNotesGrid}>
          {reflectionLines.map((line) => (
            <article key={line} className={styles.noteCard}><p>{line}</p></article>
          ))}
        </div>
      </section>

      <section className={styles.notesSection}>
        <div className={styles.notesHeader}>
          <p className={styles.eyebrow}>How This May Show Up</p>
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
        </div>
        <div className={styles.topNotesGrid}>
          {practices.map((practice) => (
            <article key={practice} className={styles.noteCard}><p>{practice}</p></article>
          ))}
        </div>
      </section>

      <section className={styles.notesSection}>
        <div className={styles.notesHeader}>
          <p className={styles.eyebrow}>Add a Note or Journal Entry</p>
        </div>
        <textarea
          value={reflection}
          onChange={(event) => setReflection(event.target.value)}
          placeholder="Write what comes to mind…"
          rows={5}
          aria-label="Add a note or journal entry"
        />
      </section>

      <section className={styles.patternStrip}>
        <article className={styles.patternCard}>
          <p className={styles.noteStatus}>Worth Noticing</p>
          <p>{narrative.worthNoticing}</p>
        </article>
      </section>
    </>
  );
}
