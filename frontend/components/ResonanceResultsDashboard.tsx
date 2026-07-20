import HumanReflectionOverview from "./HumanReflectionOverview";
import ResonanceSignature, { type ResonanceSignatureDatum } from "./ResonanceSignature";
import { type SoulScopeReport } from "../lib/buildSoulScopeReport";
import { orderStoryCandidates, type NarrativePreference } from "../lib/patternPersonalization";
import styles from "./ResonanceResultsDashboard.module.css";

type ResonanceResultsDashboardProps = {
  report: SoulScopeReport;
  hiddenNotes?: string[];
  onSelectStory?: (style: "Direct" | "Supportive" | "Insight") => void;
  selectedStoryStyle?: "Direct" | "Supportive" | "Insight" | null;
  narrativePreference?: NarrativePreference | null;
  displayName?: string | null;
};

function signatureData(report: SoulScopeReport, hiddenNotes: string[]): ResonanceSignatureDatum[] {
  const noteSignals = (report.evidence.noteEnergies ?? [])
    .filter((entry) => !hiddenNotes.includes(entry.note))
    .map((entry) => ({
      id: `resonance:${entry.note}`,
      value: Math.max(0, Math.min(1, entry.score / 100)),
      weight: entry.status === "balanced" ? 0.72 : 1,
    }));

  const domainSignals = (report.domainResults ?? []).map((domain) => ({
    id: `domain:${domain.title}`,
    value: Math.max(0, Math.min(1, domain.score / 100)),
    weight: 0.86,
  }));

  const patternSignals = (report.patternExpression?.matchedSignals ?? []).map((signal, index) => ({
    id: `pattern:${signal}`,
    value: 0.58 + ((index * 17) % 31) / 100,
    weight: 0.64,
  }));

  return [...noteSignals, ...domainSignals, ...patternSignals];
}

export default function ResonanceResultsDashboard({
  report,
  hiddenNotes = [],
  onSelectStory,
  selectedStoryStyle = null,
  narrativePreference = null,
  displayName = null,
}: ResonanceResultsDashboardProps) {
  const orderedCandidates = orderStoryCandidates(report.storyCandidates, narrativePreference);
  const data = signatureData(report, hiddenNotes);
  const confidence = Math.round(Math.max(0, Math.min(1, report.primaryPattern.confidence ?? 0)) * 100);

  return (
    <section className={styles.section}>
      <header className={styles.greeting}>
        <p className={styles.eyebrow}>Your current state</p>
        <h1>{displayName ? `Welcome back, ${displayName}` : "Your Resonance Signature"}</h1>
      </header>

      <section className={styles.signatureHero}>
        <div className={styles.signatureFrame}>
          <ResonanceSignature data={data} label="Your current Resonance Signature" />
        </div>
        <div className={styles.patternCopy}>
          <p className={styles.eyebrow}>Current Pattern</p>
          <h2 className={styles.patternName}>{report.primaryPattern.name}</h2>
          <p className={styles.patternTheme}>{report.primaryPattern.theme}</p>
          <p className={styles.reflection}>{report.presentation.summary}</p>
          <div className={styles.confidenceRow}>
            <span>Interpretation confidence</span>
            <strong>{confidence}%</strong>
          </div>
          <div className={styles.confidenceTrack} aria-hidden="true">
            <span style={{ width: `${confidence}%` }} />
          </div>
        </div>
      </section>

      <HumanReflectionOverview report={report} />

      {(report.supportingPattern || report.emergingPattern) ? (
        <section className={styles.patternStrip} aria-label="Additional pattern context">
          {report.supportingPattern ? (
            <article className={styles.patternCard}>
              <p className={styles.noteStatus}>Also present</p>
              <h3>{report.supportingPattern.name}</h3>
              <p>{report.supportingPattern.theme}</p>
            </article>
          ) : null}
          {report.emergingPattern ? (
            <article className={styles.patternCard}>
              <p className={styles.noteStatus}>Beginning to appear</p>
              <h3>{report.emergingPattern.name}</h3>
              <p>{report.emergingPattern.theme}</p>
            </article>
          ) : null}
        </section>
      ) : null}

      <section className={styles.notesSection}>
        <div className={styles.notesHeader}>
          <p className={styles.eyebrow}>Reflection style</p>
          <h2>Choose what reads clearest</h2>
          <p>Each version reflects the same deterministic scan interpretation.</p>
        </div>
        <div className={styles.topNotesGrid}>
          {orderedCandidates.map((candidate) => {
            const isSelected = candidate.style === selectedStoryStyle;
            const usuallyPreferred = narrativePreference?.established && narrativePreference.preferredStyle === candidate.style;
            return (
              <article key={candidate.style} className={styles.noteCard}>
                <div className={styles.noteTop}>
                  <p className={styles.noteStatus}>{candidate.style}{usuallyPreferred ? " · Usually preferred" : ""}</p>
                  <button type="button" className={styles.selectButton} onClick={() => onSelectStory?.(candidate.style)} aria-pressed={isSelected}>{isSelected ? "Selected" : "Select"}</button>
                </div>
                <h3>{candidate.title}</h3>
                <p>{candidate.summary}</p>
              </article>
            );
          })}
        </div>
      </section>

      <details className={styles.technicalDetails}>
        <summary>Technical details</summary>
        <div className={styles.technicalGrid}>
          <article>
            <h3>Pattern evidence</h3>
            <ul>{report.patternExpression.matchedSignals.map((signal) => <li key={signal}>{signal}</li>)}</ul>
          </article>
          <article>
            <h3>Domain signals</h3>
            <ul>{report.domainResults.map((domain) => <li key={domain.title}>{domain.title}: {Math.round(domain.score)} · {domain.functionalState}</li>)}</ul>
          </article>
        </div>
      </details>
    </section>
  );
}
