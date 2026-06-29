import Link from "next/link";
import NoteAuraMap from "./NoteAuraMap";
import { type SoulScopeReport } from "../lib/buildSoulScopeReport";
import styles from "./ResonanceResultsDashboard.module.css";

type ResonanceResultsDashboardProps = {
  report: SoulScopeReport;
  hiddenNotes?: string[];
  onSelectStory?: (style: "Direct" | "Supportive" | "Insight") => void;
  selectedStoryStyle?: "Direct" | "Supportive" | "Insight" | null;
};

function safeLines(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

export default function ResonanceResultsDashboard({
  report,
  hiddenNotes = [],
  onSelectStory,
  selectedStoryStyle = null,
}: ResonanceResultsDashboardProps) {
  const visibleEnergies = (report.evidence.noteEnergies ?? []).filter(
    (entry) => !hiddenNotes.includes(entry.note)
  );

  return (
    <section className={styles.section}>
      <section className={styles.heroCard}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Hero Pattern</p>
          <h1 className={styles.title}>{report.primaryPattern.name}</h1>
          <p className={styles.lead}>{report.primaryPattern.theme}</p>
          <p className={styles.noteText}>{report.primaryPattern.explanation}</p>
        </div>
      </section>

      <section className={styles.notesSection}>
        <div className={styles.notesHeader}>
          <div>
            <p className={styles.eyebrow}>Pattern Summary</p>
            <h2 className={styles.mapTitle}>What this may feel like right now</h2>
          </div>
        </div>

        <div className={styles.storyGrid}>
          <article className={styles.storyCard}>
            <p className={styles.noteStatus}>Lived experience</p>
            <ul className={styles.storyList}>
              {safeLines(report.primaryPattern.whatThisMayFeelLike).map((item) => (
                <li key={item} className={styles.storyItem}>
                  {item}
                </li>
              ))}
            </ul>
          </article>

          <article className={styles.storyCard}>
            <p className={styles.noteStatus}>What deserves attention first</p>
            <p className={styles.noteText}>{report.primaryPattern.whatNeedsAttention}</p>
          </article>
        </div>
      </section>

      <section className={styles.notesSection}>
        <div className={styles.notesHeader}>
          <div>
            <p className={styles.eyebrow}>Choose your favorite summary</p>
            <h2 className={styles.mapTitle}>Which style feels most accurate?</h2>
            <p className={styles.lead}>
              All three options come from the same scan. Your selection helps SoulScope learn which
              explanation style feels most true to you.
            </p>
          </div>
        </div>

        <div className={styles.topNotesGrid}>
          {report.storyCandidates.map((candidate) => {
            const isSelected = candidate.style === selectedStoryStyle;
            return (
              <article key={candidate.style} className={styles.noteCard}>
                <div className={styles.noteTop}>
                  <p className={styles.noteStatus}>{candidate.style}</p>
                  <button
                    type="button"
                    className={styles.breakdownButton}
                    onClick={() => onSelectStory?.(candidate.style)}
                    aria-pressed={isSelected}
                  >
                    {isSelected ? "Selected" : "This feels most accurate"}
                  </button>
                </div>
                <h3 className={styles.noteName}>{candidate.title}</h3>
                <p className={styles.noteTheme}>{candidate.summary}</p>
                <p className={styles.noteExpression}>
                  Strongest resources: {safeLines(candidate.strongestResources).join(" • ")}
                </p>
                <p className={styles.noteExpression}>
                  Working hardest: {safeLines(candidate.areasWorkingHard).join(" • ")}
                </p>
                <p className={styles.noteExpression}>
                  Asking for support: {safeLines(candidate.areasAskingForSupport).join(" • ")}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.notesSection}>
        <div className={styles.notesHeader}>
          <div>
            <p className={styles.eyebrow}>This may explain why</p>
            <h2 className={styles.mapTitle}>What is driving this pattern</h2>
          </div>
        </div>
        <div className={styles.storyGrid}>
          <article className={styles.storyCard}>
            <p className={styles.noteStatus}>What is working hardest</p>
            <ul className={styles.storyList}>
              {safeLines(report.primaryPattern.whatIsWorkingHardest).map((item) => (
                <li key={item} className={styles.storyItem}>
                  {item}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className={styles.notesSection}>
        <div className={styles.notesHeader}>
          <div>
            <p className={styles.eyebrow}>What is working for you</p>
            <h2 className={styles.mapTitle}>Protective factors still present</h2>
          </div>
        </div>
        <div className={styles.storyGrid}>
          <article className={styles.storyCard}>
            <p className={styles.noteStatus}>Strengths in this scan</p>
            <ul className={styles.storyList}>
              {safeLines(report.primaryPattern.supportiveFactors).map((item) => (
                <li key={item} className={styles.storyItem}>
                  {item}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className={styles.mapSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Resonance Map</h2>
          <p className={styles.sectionLead}>A visual layer for your current scan.</p>
        </div>
        <div className={styles.mapFrame}>
          <NoteAuraMap noteEnergies={visibleEnergies} title="Your Resonance Map" />
        </div>
      </section>

      <section className={styles.notesSection}>
        <div className={styles.notesHeader}>
          <p className={styles.eyebrow}>Domain Cards</p>
          <h2 className={styles.mapTitle}>What this means in daily life</h2>
        </div>

        <div className={styles.domainGrid}>
          {(report.domainResults ?? []).map((domain) => {
            const couldExpressAs = safeLines(domain.thisCouldExpressAs);
            const alsoShowUpAs = safeLines(domain.itCanAlsoShowUpAs);

            return (
              <article key={domain.title} className={styles.domainCard}>
                <div className={styles.noteTop}>
                  <div>
                    <p className={styles.noteStatus}>{domain.title}</p>
                    <h3 className={styles.domainState}>{domain.functionalState}</h3>
                  </div>
                  <span className={styles.domainActivity}>{domain.activityLevel}</span>
                </div>

                <p className={styles.domainPattern}>{domain.currentPattern}</p>

                {couldExpressAs.length > 0 ? (
                  <div className={styles.domainSection}>
                    <p className={styles.domainSectionLabel}>This Could Express As</p>
                    <ul className={styles.domainList}>
                      {couldExpressAs.map((line) => (
                        <li key={line} className={styles.domainListItem}>
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {alsoShowUpAs.length > 0 ? (
                  <div className={styles.domainSection}>
                    <p className={styles.domainSectionLabel}>It Can Also Show Up As</p>
                    <ul className={styles.domainList}>
                      {alsoShowUpAs.map((line) => (
                        <li key={line} className={styles.domainListItem}>
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <p className={styles.domainReframe}>{domain.supportiveReframe}</p>
              </article>
            );
          })}
        </div>
      </section>

      <details className={styles.technicalDetails}>
        <summary className={styles.technicalSummary}>Technical Analysis</summary>
        <div className={styles.technicalBody}>
          <p className={styles.technicalIntro}>
            For power users. The technical layer stays collapsed so the report remains centered on your
            experience.
          </p>

          <div className={styles.technicalGrid}>
            <article className={styles.technicalCard}>
              <p className={styles.sectionLabel}>What Influenced This Observation</p>
              <ul className={styles.technicalList}>
                {(report.evidence.topNotes ?? []).length ? (
                  report.evidence.topNotes.map((entry) => (
                    <li key={`${entry.note}-${entry.score}`}>
                      {entry.note} {entry.score}% ({entry.system})
                    </li>
                  ))
                ) : (
                  <li>No strong technical signals were available for this scan.</li>
                )}
              </ul>
            </article>

            <article className={styles.technicalCard}>
              <p className={styles.sectionLabel}>Evidence</p>
              <ul className={styles.technicalList}>
                {(report.evidence.dimensions ?? []).length ? (
                  report.evidence.dimensions.map((dimension) => (
                    <li key={dimension.name}>
                      {dimension.name} - {dimension.band} - {dimension.interpretation}
                    </li>
                  ))
                ) : (
                  <li>No technical evidence available for this scan.</li>
                )}
              </ul>
            </article>
          </div>
        </div>
      </details>

      <section className={styles.scanHistoryFooter}>
        <p className={styles.scanHistoryText}>Want context across time? View your full scan timeline and progression.</p>
        <Link href="/dashboard" className={styles.secondaryButton}>
          Open Scan History
        </Link>
      </section>
    </section>
  );
}
