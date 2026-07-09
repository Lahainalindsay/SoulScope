import { type PatternSynthesis } from "../lib/patternSynthesis";
import { type SoulScopeReport } from "../lib/resonancePatterns";
import styles from "./PremiumResultsDashboard.module.css";
import NoteAuraMap from "./NoteAuraMap";

type PremiumResultsDashboardProps = {
  report: SoulScopeReport;
  synthesis: PatternSynthesis;
  hiddenNotes?: string[];
  onSelectStory?: (style: "Direct" | "Supportive" | "Insight") => void;
  selectedStoryStyle?: "Direct" | "Supportive" | "Insight" | null;
};

function safeLines(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function formatBulletList(items: string[]): string {
  return items.filter(Boolean).join(" • ");
}

export default function PremiumResultsDashboard({
  report,
  synthesis,
  hiddenNotes = [],
  onSelectStory,
  selectedStoryStyle = null,
}: PremiumResultsDashboardProps) {
  const visibleEnergies = (report.evidence.noteEnergies ?? []).filter(
    (entry) => !hiddenNotes.includes(entry.note)
  );

  return (
    <section className={styles.section}>
      {/* Hero Section: Main Pattern */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Latest Pattern</p>
            <h1 className={styles.heroTitle}>{synthesis.primaryPattern.name}</h1>
            <p className={styles.heroTheme}>{synthesis.primaryPattern.theme}</p>
            <p className={styles.heroExplanation}>{synthesis.primaryPattern.explanation}</p>
            <div className={styles.confidenceBar}>
              <div
                className={styles.confidenceFill}
                style={{ width: `${synthesis.confidence * 100}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* What This Pattern May Reflect */}
      <section className={styles.meaningSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>What This May Feel Like</h2>
          <p className={styles.sectionLead}>
            These are observational descriptions of how this pattern may feel day to day.
          </p>
        </div>

        <div className={styles.experiencesGrid}>
          {synthesis.likelyExperiences.map((experience, idx) => (
            <article key={idx} className={styles.experienceCard}>
              <p className={styles.experienceText}>{experience}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Pattern Drivers */}
      <section className={styles.driversSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>What May Be Creating This Pattern</h2>
          <p className={styles.sectionLead}>
            The strongest drivers in your current state:
          </p>
        </div>

        <div className={styles.driversList}>
          {synthesis.primaryDrivers.map((driver, idx) => (
            <article key={idx} className={styles.driverCard}>
              <div className={styles.driverNumber}>{idx + 1}</div>
              <p className={styles.driverText}>{driver}</p>
            </article>
          ))}
        </div>
      </section>

      {/* What Is Supporting The System */}
      <section className={styles.protectiveSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>What Is Supporting The System</h2>
          <p className={styles.sectionLead}>
            Even in this pattern, several signals appear supportive:
          </p>
        </div>

        <div className={styles.protectiveGrid}>
          {synthesis.protectiveFactors.map((factor, idx) => (
            <article key={idx} className={styles.protectiveCard}>
              <p className={styles.protectiveText}>{factor}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Suggested Focus */}
      <section className={styles.focusSection}>
        <article className={styles.focusCard}>
          <p className={styles.focusEyebrow}>Where to Start</p>
          <h3 className={styles.focusTitle}>What deserves attention first</h3>
          <p className={styles.focusText}>{synthesis.suggestedFocus}</p>
        </article>
      </section>

      {/* Signal Map */}
      <section className={styles.mapSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Signal Map</h2>
          <p className={styles.sectionLead}>
            A visual layer for the underlying scan signals:
          </p>
        </div>
        <div className={styles.mapFrame}>
          <NoteAuraMap noteEnergies={visibleEnergies} title="Signal Map" />
        </div>
      </section>

      {/* Pattern Variants: Supporting & Emerging */}
      {(synthesis.secondaryPattern || synthesis.emergingPattern) ? (
        <section className={styles.variantSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Pattern Dimensions</h2>
            <p className={styles.sectionLead}>
              Secondary and emerging patterns that also show up in this scan:
            </p>
          </div>

          <div className={styles.variantGrid}>
            {synthesis.secondaryPattern ? (
              <article className={styles.variantCard}>
                <p className={styles.variantLabel}>Secondary Pattern</p>
                <h3 className={styles.variantName}>{synthesis.secondaryPattern.name}</h3>
                <p className={styles.variantTheme}>{synthesis.secondaryPattern.theme}</p>
              </article>
            ) : null}

            {synthesis.emergingPattern ? (
              <article className={styles.variantCard}>
                <p className={styles.variantLabel}>Emerging Pattern</p>
                <h3 className={styles.variantName}>{synthesis.emergingPattern.name}</h3>
                <p className={styles.variantTheme}>{synthesis.emergingPattern.theme}</p>
              </article>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Preference Learning: Story Selection */}
      <section className={styles.notesSection}>
        <div className={styles.notesHeader}>
          <p className={styles.eyebrow}>Summary Style</p>
          <h2 className={styles.mapTitle}>Which version feels clearest?</h2>
          <p className={styles.lead}>
            All three options come from the same scan data. Your selection helps SoulScope learn which communication style is most useful for you.
          </p>
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
                    {isSelected ? "Selected" : "Select Version"}
                  </button>
                </div>
                <h3 className={styles.noteName}>{candidate.title}</h3>
                <p className={styles.noteTheme}>{candidate.summary}</p>
                <p className={styles.noteExpression}>
                  Strongest resources: {formatBulletList(safeLines(candidate.strongestResources))}
                </p>
                <p className={styles.noteExpression}>
                  Areas working hardest: {formatBulletList(safeLines(candidate.areasWorkingHard))}
                </p>
                <p className={styles.noteExpression}>
                  Areas asking for support: {formatBulletList(safeLines(candidate.areasAskingForSupport))}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* Human-Centered Domains */}
      <section className={styles.notesSection}>
        <div className={styles.notesHeader}>
          <p className={styles.eyebrow}>Human Signals</p>
          <h2 className={styles.mapTitle}>What this means in daily life</h2>
          <p className={styles.lead}>
            Each of these seven domains represents something you experience every day. How is each one showing up right now?
          </p>
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

      {/* Technical Details (Collapsed) */}
      <details className={styles.technicalDetails}>
        <summary className={styles.technicalSummary}>View Signal Details</summary>
        <div className={styles.technicalBody}>
          <p className={styles.technicalIntro}>
            The technical layer stays collapsed so the insight remains centered on the human pattern.
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
    </section>
  );
}
