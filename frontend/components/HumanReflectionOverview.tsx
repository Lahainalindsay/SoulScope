import type { SoulScopeReport } from "../lib/buildSoulScopeReport";
import styles from "./ResonanceResultsDashboard.module.css";

export default function HumanReflectionOverview({ report }: { report: SoulScopeReport }) {
  const presentation = report.presentation;
  return (
    <>
      <section className={styles.heroCard}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>What This May Reflect</p>
          <p className={styles.noteText}>{presentation.explanation[0]}</p>
          <p className={styles.noteText}>{presentation.explanation[1]}</p>
        </div>
      </section>
      <section className={styles.heroCard}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>What We Observed</p>
          <ul className={styles.technicalList}>
            {presentation.observedBullets.map((line) => <li key={line}>{line}</li>)}
          </ul>
        </div>
      </section>
      <section className={styles.heroCard}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>What This May Look Like in Daily Life</p>
          <ul className={styles.technicalList}>
            {presentation.dailyLife.map((line) => <li key={line}>{line}</li>)}
          </ul>
        </div>
      </section>
      <section className={styles.patternStrip}>
        <article className={styles.patternCard}>
          <p className={styles.noteStatus}>A Question to Consider</p>
          <p className={styles.patternTheme}>{presentation.reflectionQuestion}</p>
        </article>
        <article className={styles.patternCard}>
          <p className={styles.noteStatus}>Looking Over Time</p>
          <p className={styles.patternTheme}>{presentation.longitudinalMessage}</p>
        </article>
      </section>
    </>
  );
}
