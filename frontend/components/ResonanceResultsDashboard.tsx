import NoteAuraMap from "./NoteAuraMap";
import { type SoulScopeReport } from "../lib/buildSoulScopeReport";
import { buildCustomSoulScopeReport } from "../lib/customReportEngine";
import { type VoiceAnalysisResult } from "../lib/voiceSpectrum";
import styles from "./ResonanceResultsDashboard.module.css";

type ResonanceResultsDashboardProps = {
  report: SoulScopeReport;
  scan: VoiceAnalysisResult;
  hiddenNotes?: string[];
  onSelectStory?: (style: "Direct" | "Supportive" | "Insight") => void;
  selectedStoryStyle?: "Direct" | "Supportive" | "Insight" | null;
};

export default function ResonanceResultsDashboard({
  report,
  scan,
  hiddenNotes = [],
  onSelectStory,
  selectedStoryStyle = null,
}: ResonanceResultsDashboardProps) {
  const visibleEnergies = (report.evidence.noteEnergies ?? []).filter((entry) => !hiddenNotes.includes(entry.note));
  const domains = report.domainResults ?? [];
  const narrative = buildCustomSoulScopeReport(scan, report);

  return (
    <section className={styles.section}>
      <section className={styles.mapSection}>
        <div className={styles.mapFrame}>
          <NoteAuraMap noteEnergies={visibleEnergies} title="Your Resonance Map" />
        </div>
      </section>

      <section className={styles.notesSection}>
        <div className={styles.notesHeader}>
          <div>
            <p className={styles.eyebrow}>Help Us Build SoulScope</p>
            <h2 className={styles.mapTitle}>Choose the description that feels most like you</h2>
            <p className={styles.lead}>Thanks for testing the app. Please choose the energy narrative that feels most accurate. Your choice helps us make SoulScope more personal, clear, and premium.</p>
          </div>
        </div>

        <div className={styles.topNotesGrid}>
          {report.storyCandidates.map((candidate) => {
            const isSelected = candidate.style === selectedStoryStyle;
            return (
              <article key={candidate.style} className={styles.noteCard}>
                <div className={styles.noteTop}>
                  <p className={styles.noteStatus}>{candidate.style}</p>
                  <button type="button" className={styles.breakdownButton} onClick={() => onSelectStory?.(candidate.style)} aria-pressed={isSelected}>
                    {isSelected ? "Selected" : "This feels most accurate"}
                  </button>
                </div>
                <h3 className={styles.noteName}>{candidate.title}</h3>
                <p className={styles.noteTheme}>{candidate.summary}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.heroCard}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Your Resonance Story</p>
          {narrative.story.map((line) => (
            <p key={line} className={styles.noteText}>{line}</p>
          ))}
          {narrative.cameraInsight ? <p className={styles.noteText}>{narrative.cameraInsight}</p> : null}
        </div>
      </section>

      <section className={styles.patternStrip}>
        <article className={styles.patternCard}>
          <p className={styles.noteStatus}>Hidden Pattern</p>
          <h3 className={styles.patternTitle}>{narrative.hiddenPatternTitle}</h3>
          <p className={styles.patternTheme}>{narrative.hiddenPattern}</p>
        </article>
        <article className={styles.patternCard}>
          <p className={styles.noteStatus}>What This May Feel Like</p>
          <p className={styles.patternTheme}>{narrative.feelsLike}</p>
        </article>
      </section>

      <section className={styles.patternStrip}>
        <article className={styles.patternCard}>
          <p className={styles.noteStatus}>Your Strength</p>
          <p className={styles.patternTheme}>{narrative.strength}</p>
        </article>
        <article className={styles.patternCard}>
          <p className={styles.noteStatus}>Your Balance Point</p>
          <p className={styles.patternTheme}>{narrative.balancePoint}</p>
        </article>
      </section>

      <details className={styles.technicalDetails}>
        <summary className={styles.technicalSummary}>View Technical Analysis</summary>
        <div className={styles.technicalBody}>
          <p className={styles.technicalIntro}>The technical layer stays collapsed so the report remains centered on your lived experience.</p>
          <div className={styles.technicalGrid}>
            <article className={styles.technicalCard}>
              <p className={styles.sectionLabel}>Primary Pattern</p>
              <p className={styles.domainPattern}>{report.primaryPattern.name}</p>
              <p className={styles.domainPattern}>Confidence {Math.round(report.primaryPattern.confidence * 100)}%</p>
            </article>
            <article className={styles.technicalCard}>
              <p className={styles.sectionLabel}>Domain Model</p>
              <ul className={styles.technicalList}>
                {domains.map((domain) => (
                  <li key={domain.title}>{domain.title}: {Math.round(domain.score)} ({domain.functionalState})</li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </details>
    </section>
  );
}
