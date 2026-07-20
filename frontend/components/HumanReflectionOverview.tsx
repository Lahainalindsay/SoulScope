import type { SoulScopeReport } from "../lib/buildSoulScopeReport";
import styles from "./ResonanceResultsDashboard.module.css";

export default function HumanReflectionOverview({ report }: { report: SoulScopeReport }) {
  const presentation = report.presentation;
  const profile = report.atlas.result.profile;
  const practices = profile.support;

  return (
    <>
      <section className={styles.notesSection}>
        <div className={styles.notesHeader}><p className={styles.eyebrow}>Personal Reflection</p><h2>What may be happening beneath the surface</h2></div>
        <div className={styles.topNotesGrid}>{presentation.explanation.slice(0, 2).map((line) => <article key={line} className={styles.noteCard}><p>{line}</p></article>)}</div>
      </section>
      <section className={styles.notesSection}>
        <div className={styles.notesHeader}><p className={styles.eyebrow}>What this may look like in daily life</p><h2>Practical ways this pattern may show up</h2></div>
        <div className={styles.topNotesGrid}>{presentation.dailyLife.slice(0, 4).map((line) => <article key={line} className={styles.noteCard}><p>{line}</p></article>)}</div>
      </section>
      <section className={styles.notesSection}>
        <div className={styles.notesHeader}><p className={styles.eyebrow}>What may support this state</p><h2>Gentle ways to work with the current pattern</h2></div>
        <div className={styles.topNotesGrid}>{practices.map((practice) => <article key={practice} className={styles.noteCard}><p>{practice}</p></article>)}</div>
      </section>
      <section className={styles.patternStrip}>
        <article className={styles.patternCard}><p className={styles.noteStatus}>A question to consider</p><p>{presentation.reflectionQuestion}</p></article>
        <article className={styles.patternCard}><p className={styles.noteStatus}>Looking over time</p><p>{report.baselineComparison?.overallSummary ?? presentation.longitudinalMessage}</p></article>
      </section>
    </>
  );
}
