import NoteAuraMap from "./NoteAuraMap";
import HumanReflectionOverview from "./HumanReflectionOverview";
import { type SoulScopeReport } from "../lib/buildSoulScopeReport";
import { orderStoryCandidates, type NarrativePreference } from "../lib/patternPersonalization";
import styles from "./ResonanceResultsDashboard.module.css";

type ResonanceResultsDashboardProps = {
  report: SoulScopeReport;
  hiddenNotes?: string[];
  onSelectStory?: (style: "Direct" | "Supportive" | "Insight") => void;
  selectedStoryStyle?: "Direct" | "Supportive" | "Insight" | null;
  narrativePreference?: NarrativePreference | null;
};

export default function ResonanceResultsDashboard({
  report,
  hiddenNotes = [],
  onSelectStory,
  selectedStoryStyle = null,
  narrativePreference = null,
}: ResonanceResultsDashboardProps) {
  const visibleEnergies = (report.evidence.noteEnergies ?? []).filter((entry) => !hiddenNotes.includes(entry.note));
  const orderedCandidates = orderStoryCandidates(report.storyCandidates, narrativePreference);

  return (
    <section className={styles.section}>
      <section className={styles.heroCard}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Pattern</p>
          <h1 className={styles.title}>{report.primaryPattern.name}</h1>
          <p className={styles.noteText}>{report.presentation.summary}</p>
        </div>
      </section>

      <section className={styles.mapSection}>
        <div className={styles.mapFrame}>
          <NoteAuraMap noteEnergies={visibleEnergies} title="Resonance Map" />
        </div>
      </section>

      <HumanReflectionOverview report={report} />

      {(report.supportingPattern || report.emergingPattern) ? (
        <section className={styles.patternStrip}>
          {report.supportingPattern ? (
            <article className={styles.patternCard}>
              <p className={styles.noteStatus}>Also Present</p>
              <h3 className={styles.patternTitle}>{report.supportingPattern.name}</h3>
              <p className={styles.patternTheme}>{report.supportingPattern.theme}</p>
            </article>
          ) : null}
          {report.emergingPattern ? (
            <article className={styles.patternCard}>
              <p className={styles.noteStatus}>Beginning to Appear</p>
              <h3 className={styles.patternTitle}>{report.emergingPattern.name}</h3>
              <p className={styles.patternTheme}>{report.emergingPattern.theme}</p>
            </article>
          ) : null}
        </section>
      ) : null}

      <section className={styles.notesSection}>
        <div className={styles.notesHeader}>
          <div>
            <p className={styles.eyebrow}>Reflection Style</p>
            <h2 className={styles.mapTitle}>Choose what reads clearest</h2>
            <p className={styles.lead}>Each version reflects the same scan.</p>
          </div>
        </div>
        <div className={styles.topNotesGrid}>
          {orderedCandidates.map((candidate) => {
            const isSelected = candidate.style === selectedStoryStyle;
            const usuallyPreferred = narrativePreference?.established && narrativePreference.preferredStyle === candidate.style;
            return (
              <article key={candidate.style} className={styles.noteCard}>
                <div className={styles.noteTop}>
                  <p className={styles.noteStatus}>{candidate.style}{usuallyPreferred ? " · Usually preferred" : ""}</p>
                  <button type="button" className={styles.breakdownButton} onClick={() => onSelectStory?.(candidate.style)} aria-pressed={isSelected}>{isSelected ? "Selected" : "Select"}</button>
                </div>
                <h3 className={styles.noteName}>{candidate.title}</h3>
                <p className={styles.noteTheme}>{candidate.summary}</p>
              </article>
            );
          })}
        </div>
      </section>

      <details className={styles.technicalDetails}>
        <summary className={styles.technicalSummary}>Technical Evidence</summary>
        <div className={styles.technicalBody}>
          <div className={styles.technicalGrid}>
            <article className={styles.technicalCard}>
              <p className={styles.sectionLabel}>Pattern Evidence</p>
              <ul className={styles.technicalList}>{report.patternExpression.matchedSignals.map((signal) => <li key={signal}>{signal}</li>)}</ul>
            </article>
            <article className={styles.technicalCard}>
              <p className={styles.sectionLabel}>Domain Signals</p>
              <ul className={styles.technicalList}>{report.domainResults.map((domain) => <li key={domain.title}>{domain.title}: {Math.round(domain.score)} ({domain.functionalState})</li>)}</ul>
            </article>
          </div>
        </div>
      </details>
    </section>
  );
}
