import { type SoulScopeReport } from "../lib/buildSoulScopeReport";
import { type PatternSynthesis } from "../lib/patternSynthesis";
import styles from "./ResonanceResultsDashboard.module.css";

type ResonanceResultsDashboardProps = {
  report: SoulScopeReport;
  synthesis: PatternSynthesis;
  onSelectStory?: (style: SoulScopeReport["storyCandidates"][number]["style"]) => void;
  selectedStoryStyle?: SoulScopeReport["storyCandidates"][number]["style"] | null;
};

function safeLines(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

export default function ResonanceResultsDashboard({
  report,
  synthesis,
  onSelectStory,
  selectedStoryStyle = null,
}: ResonanceResultsDashboardProps) {
  return (
    <section className={styles.section}>
      <section className={styles.heroCard}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Main Pattern Right Now</p>
          <h2 className={styles.title}>{synthesis.mainTitle}</h2>
          <p className={styles.lead}>{synthesis.primaryPattern.theme}</p>
          <p className={styles.noteText}>{synthesis.integratedSummary}</p>
        </div>
      </section>

      {synthesis.secondaryPattern || synthesis.optionalEmergingPattern ? (
        <section className={styles.patternStrip}>
          {synthesis.secondaryPattern ? (
            <article className={styles.patternCard}>
              <p className={styles.noteStatus}>Secondary Pattern</p>
              <h3 className={styles.patternTitle}>{synthesis.secondaryPattern.name}</h3>
              <p className={styles.patternTheme}>{synthesis.secondaryPattern.theme}</p>
            </article>
          ) : null}

          {synthesis.optionalEmergingPattern ? (
            <article className={styles.patternCard}>
              <p className={styles.noteStatus}>Emerging Pattern</p>
              <h3 className={styles.patternTitle}>{synthesis.optionalEmergingPattern.name}</h3>
              <p className={styles.patternTheme}>{synthesis.optionalEmergingPattern.theme}</p>
            </article>
          ) : null}
        </section>
      ) : null}

      <section className={styles.notesSection}>
        <div className={styles.notesHeader}>
          <div>
            <p className={styles.eyebrow}>Preference Learning</p>
            <h2 className={styles.mapTitle}>Choose the summary that feels most accurate</h2>
            <p className={styles.lead}>
              All options are built from the same scan. Your selection helps SoulScope learn which
              style of explanation feels most true to you.
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
                  Strongest available resources: {safeLines(candidate.strongestResources).join(" • ")}
                </p>
                <p className={styles.noteExpression}>
                  Areas working hardest: {safeLines(candidate.areasWorkingHard).join(" • ")}
                </p>
                <p className={styles.noteExpression}>
                  Areas asking for support: {safeLines(candidate.areasAskingForSupport).join(" • ")}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.notesSection}>
        <div className={styles.notesHeader}>
          <div>
            <p className={styles.eyebrow}>Pattern Context</p>
            <h2 className={styles.mapTitle}>This may explain why…</h2>
            <p className={styles.lead}>
              Your voice pattern suggests this pattern may show up in concrete, lived ways.
            </p>
          </div>
        </div>

        <div className={styles.storyGrid}>
          <article className={styles.storyCard}>
            <p className={styles.noteStatus}>What this may feel like</p>
            <ul className={styles.storyList}>
              {safeLines(synthesis.likelyExperiences).map((item) => (
                <li key={item} className={styles.storyItem}>
                  {item}
                </li>
              ))}
            </ul>
          </article>

          <article className={styles.storyCard}>
            <p className={styles.noteStatus}>What is still working for you</p>
            <ul className={styles.storyList}>
              {safeLines(synthesis.protectiveFactors).map((item) => (
                <li key={item} className={styles.storyItem}>
                  {item}
                </li>
              ))}
            </ul>
          </article>

          <article className={styles.storyCard}>
            <p className={styles.noteStatus}>What may be happening underneath</p>
            <ul className={styles.storyList}>
              {safeLines(synthesis.primaryDrivers).map((item) => (
                <li key={item} className={styles.storyItem}>
                  {item}
                </li>
              ))}
            </ul>
          </article>

          <article className={styles.storyCard}>
            <p className={styles.noteStatus}>What deserves attention first</p>
            <p className={styles.noteText}>{synthesis.suggestedFocus}</p>
          </article>
        </div>
      </section>

      <section className={styles.notesSection}>
        <div className={styles.notesHeader}>
          <div>
            <p className={styles.eyebrow}>Human-Centered Domains</p>
            <h2 className={styles.mapTitle}>What this means in daily life</h2>
          </div>
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
        <summary className={styles.technicalSummary}>View Technical Analysis</summary>
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

            <article className={styles.technicalCard}>
              <p className={styles.sectionLabel}>Voice Dynamics</p>
              <ul className={styles.technicalList}>
                <li>Jitter: {report.evidence.voiceDynamics?.jitterLocalPct ?? "n/a"}</li>
                <li>Shimmer: {report.evidence.voiceDynamics?.shimmerLocalPct ?? "n/a"}</li>
                <li>HNR: {report.evidence.voiceDynamics?.harmonicToNoiseRatioDb ?? "n/a"}</li>
                <li>Spectral centroid: {Math.round(report.evidence.spectralCentroidHz)} Hz</li>
                <li>Pitch stability: {report.evidence.voiceDynamics?.pitchStability ?? "n/a"}</li>
                <li>Voiced frame ratio: {report.evidence.voiceDynamics?.voicedFrameRatio ?? "n/a"}</li>
                <li>Harmonic richness: {report.evidence.voiceDynamics?.harmonicRichness ?? "n/a"}</li>
                <li>
                  Frequency details: {report.evidence.voiceDynamics?.lowPitchHz ?? "n/a"}–{report.evidence.voiceDynamics?.highPitchHz ?? "n/a"} Hz
                </li>
              </ul>
            </article>
          </div>
        </div>
      </details>

    </section>
  );
}
