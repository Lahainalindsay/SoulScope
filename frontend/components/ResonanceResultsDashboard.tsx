import NoteAuraMap from "./NoteAuraMap";
import { type SoulScopeReport } from "../lib/buildSoulScopeReport";
import {
  orderStoryCandidates,
  type NarrativePreference,
} from "../lib/patternPersonalization";
import styles from "./ResonanceResultsDashboard.module.css";

type ResonanceResultsDashboardProps = {
  report: SoulScopeReport;
  hiddenNotes?: string[];
  onSelectStory?: (style: "Direct" | "Supportive" | "Insight") => void;
  selectedStoryStyle?: "Direct" | "Supportive" | "Insight" | null;
  narrativePreference?: NarrativePreference | null;
};

function strongest(report: SoulScopeReport) {
  return [...(report.domainResults ?? [])].sort((a, b) => b.score - a.score)[0];
}

function workingHardest(report: SoulScopeReport) {
  return (report.domainResults ?? [])
    .filter((domain) => ["Working Hard", "Under Pressure"].includes(domain.functionalState))
    .sort((a, b) => b.score - a.score)[0];
}

function supportDomain(report: SoulScopeReport) {
  return (report.domainResults ?? [])
    .filter((domain) => ["Asking for Support", "Recovering", "Less Accessible"].includes(domain.functionalState))
    .sort((a, b) => a.score - b.score)[0];
}

export default function ResonanceResultsDashboard({
  report,
  hiddenNotes = [],
  onSelectStory,
  selectedStoryStyle = null,
  narrativePreference = null,
}: ResonanceResultsDashboardProps) {
  const visibleEnergies = (report.evidence.noteEnergies ?? []).filter((entry) => !hiddenNotes.includes(entry.note));
  const orderedCandidates = orderStoryCandidates(report.storyCandidates, narrativePreference);
  const strongestDomain = strongest(report);
  const hardestDomain = workingHardest(report);
  const needsSupport = supportDomain(report);

  return (
    <section className={styles.section}>
      <section className={styles.heroCard}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Today&apos;s Reflection</p>
          <h1 className={styles.title}>{report.primaryPattern.name}</h1>
          <p className={styles.noteText}>{report.primaryPattern.theme}</p>
        </div>
      </section>

      <section className={styles.mapSection}>
        <div className={styles.mapFrame}>
          <NoteAuraMap noteEnergies={visibleEnergies} title="Resonance Map" />
        </div>
      </section>

      <section className={styles.heroCard}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Pattern Expression</p>
          <h2 className={styles.mapTitle}>{report.patternExpression.title}</h2>
          <p className={styles.noteText}>{report.patternExpression.summary}</p>
          {report.supportingPattern ? <p className={styles.noteText}><strong>Supporting:</strong> {report.supportingPattern.name}</p> : null}
          {report.emergingPattern ? <p className={styles.noteText}><strong>Emerging:</strong> {report.emergingPattern.name}</p> : null}
        </div>
      </section>

      <section className={styles.patternStrip}>
        <article className={styles.patternCard}>
          <p className={styles.noteStatus}>Most Available</p>
          <h3 className={styles.patternTitle}>{strongestDomain?.title ?? "Available capacity"}</h3>
          <p className={styles.patternTheme}>{strongestDomain ? `${strongestDomain.title} is most available in this scan.` : "No clear supporting area was available."}</p>
        </article>
        <article className={styles.patternCard}>
          <p className={styles.noteStatus}>Needs Support</p>
          <h3 className={styles.patternTitle}>{hardestDomain?.title ?? needsSupport?.title ?? "Distributed load"}</h3>
          <p className={styles.patternTheme}>{hardestDomain ? `${hardestDomain.title} is working hardest.` : needsSupport ? `${needsSupport.title} needs more support.` : "Effort appears spread across several areas."}</p>
        </article>
      </section>

      {report.modifiers.length ? (
        <section className={styles.heroCard}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Current Modifiers</p>
            <ul className={styles.technicalList}>{report.modifiers.map((modifier) => <li key={modifier.id}>{modifier.label}</li>)}</ul>
          </div>
        </section>
      ) : null}

      <section className={styles.heroCard}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Change From Your Baseline</p>
          <p className={styles.noteText}>{report.baselineComparison.available ? report.baselineComparison.overallSummary : "Complete a few more scans to see changes from your baseline."}</p>
          {report.baselineComparison.available ? <ul className={styles.technicalList}>{report.baselineComparison.changes.slice(0, 3).map((change) => <li key={change.dimension}>{change.userFacingSummary}</li>)}</ul> : null}
        </div>
      </section>

      <section className={styles.notesSection}>
        <div className={styles.notesHeader}>
          <div>
            <p className={styles.eyebrow}>Summary Style</p>
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
