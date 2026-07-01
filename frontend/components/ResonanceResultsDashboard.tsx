import NoteAuraMap from "./NoteAuraMap";
import { type SoulScopeReport } from "../lib/buildSoulScopeReport";
import { type UserResultDomain } from "../lib/systemDimensions";
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

function formatList(items: string[]) {
  if (!items.length) return "the scan";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function domainMeaning(domain: UserResultDomain) {
  const base: Record<string, string> = {
    "Energy & Vitality": "This is the body-energy layer: stamina, activation, and available fuel for daily life.",
    "Recovery & Restoration": "This shows whether restoration is keeping pace with what the system is spending.",
    "Communication & Clarity": "This reflects how easily words, expression, and meaning are coming through.",
    "Emotional Expression": "This is the emotional-output channel: how close feelings are to the surface and how much effort it takes to stay composed.",
    "Connection & Support": "This reflects the relational layer: support, trust, and how safe connection feels right now.",
    "Focus & Mental Load": "This is the mental-tabs-open layer: processing, planning, replaying, and pattern recognition.",
    "Direction & Adaptability": "This shows forward motion, flexibility, and how quickly the system is orienting toward what comes next.",
    Regulation: "This reflects return-to-balance: how easily the system settles after stimulation, stress, or emotional charge.",
  };

  if (["Working Hard", "Under Pressure"].includes(domain.functionalState)) {
    return `${base[domain.title]} Here, it looks active but effortful, so the key question is how much energy it takes to keep this part of you online.`;
  }

  if (["Asking for Support", "Less Accessible", "Recovering"].includes(domain.functionalState)) {
    return `${base[domain.title]} Here, it looks less available or in recovery, which means this area may need more space, pacing, or support before it feels natural again.`;
  }

  return `${base[domain.title]} Here, it looks available enough to act as a resource while the higher-load areas settle.`;
}

function buildWholeScanSummary(domains: UserResultDomain[], report: SoulScopeReport) {
  const highest = [...domains].sort((a, b) => b.score - a.score).slice(0, 2);
  const lowest = [...domains].sort((a, b) => a.score - b.score).slice(0, 2);
  const working = domains
    .filter((domain) => ["Working Hard", "Under Pressure"].includes(domain.functionalState))
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);
  const support = domains
    .filter((domain) => ["Asking for Support", "Less Accessible", "Recovering"].includes(domain.functionalState))
    .sort((a, b) => a.score - b.score)
    .slice(0, 2);

  const highestText = formatList(highest.map((domain) => domain.title));
  const lowestText = formatList(lowest.map((domain) => domain.title));
  const workingText = formatList(working.map((domain) => domain.title));
  const supportText = formatList(support.map((domain) => domain.title));
  const tension = working[0] && support[0]
    ? `${working[0].title} is spending energy while ${support[0].title} needs support`
    : `${highestText} is more expressed than ${lowestText}`;

  return [
    `Your scan reads as a whole-system pattern: ${report.primaryPattern.name}. ${report.primaryPattern.theme}`,
    `The most expressed areas are ${highestText}. The least expressed or least available areas are ${lowestText}. This contrast suggests the system may be relying on ${workingText} while ${supportText} needs more room to restore or come back online.`,
    `In daily life, this may feel like being capable in one area while another part of you is asking to slow down. You may still be functioning, planning, communicating, supporting others, or moving forward, but the deeper story is how output and recovery are interacting.`,
    `The main tension appears to be: ${tension}. This is where the scan becomes more personal, because it points to the cost of keeping everything coordinated right now.`,
  ];
}

export default function ResonanceResultsDashboard({
  report,
  hiddenNotes = [],
  onSelectStory,
  selectedStoryStyle = null,
}: ResonanceResultsDashboardProps) {
  const visibleEnergies = (report.evidence.noteEnergies ?? []).filter((entry) => !hiddenNotes.includes(entry.note));
  const domains = report.domainResults ?? [];
  const wholeScanSummary = buildWholeScanSummary(domains, report);

  return (
    <section className={styles.section}>
      <section className={styles.heroCard}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Primary Pattern</p>
          <h2 className={styles.title}>{report.primaryPattern.name}</h2>
          <p className={styles.lead}>{report.primaryPattern.theme}</p>
          <p className={styles.noteText}>{report.primaryPattern.explanation}</p>
        </div>
      </section>

      <section className={styles.mapSection}>
        <div className={styles.mapFrame}>
          <NoteAuraMap noteEnergies={visibleEnergies} title="Your Resonance Map" />
        </div>
      </section>

      <section className={styles.notesSection}>
        <div className={styles.notesHeader}>
          <div>
            <p className={styles.eyebrow}>Your Scan Description</p>
            <h2 className={styles.mapTitle}>Choose the wording that feels most accurate</h2>
            <p className={styles.lead}>These are three human-language readings of the same scan. Pick the one that sounds most like your lived experience.</p>
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
                <p className={styles.noteExpression}>Most expressed: {formatList(safeLines(candidate.strongestResources))}</p>
                <p className={styles.noteExpression}>Working hardest: {formatList(safeLines(candidate.areasWorkingHard))}</p>
                <p className={styles.noteExpression}>Needs support: {formatList(safeLines(candidate.areasAskingForSupport))}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.heroCard}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Whole Scan Summary</p>
          <h2 className={styles.mapTitle}>What the full pattern may mean</h2>
          {wholeScanSummary.map((line) => (
            <p key={line} className={styles.noteText}>{line}</p>
          ))}
        </div>
      </section>

      {report.supportingPattern || report.emergingPattern ? (
        <section className={styles.patternStrip}>
          {report.supportingPattern ? (
            <article className={styles.patternCard}>
              <p className={styles.noteStatus}>Secondary Influence</p>
              <h3 className={styles.patternTitle}>{report.supportingPattern.name}</h3>
              <p className={styles.patternTheme}>{report.supportingPattern.theme}</p>
            </article>
          ) : null}
          {report.emergingPattern ? (
            <article className={styles.patternCard}>
              <p className={styles.noteStatus}>Emerging Influence</p>
              <h3 className={styles.patternTitle}>{report.emergingPattern.name}</h3>
              <p className={styles.patternTheme}>{report.emergingPattern.theme}</p>
            </article>
          ) : null}
        </section>
      ) : null}

      <section className={styles.notesSection}>
        <div className={styles.notesHeader}>
          <div>
            <p className={styles.eyebrow}>Daily-Life Translation</p>
            <h2 className={styles.mapTitle}>What each area represents</h2>
            <p className={styles.lead}>These cards are pieces of the same pattern: where your system is resourced, where it is spending energy, and where it may need support.</p>
          </div>
        </div>

        <div className={styles.domainGrid}>
          {domains.map((domain) => {
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
                <p className={styles.domainPattern}>{domainMeaning(domain)}</p>
                {couldExpressAs.length > 0 ? (
                  <div className={styles.domainSection}>
                    <p className={styles.domainSectionLabel}>May show up as</p>
                    <ul className={styles.domainList}>{couldExpressAs.map((line) => <li key={line} className={styles.domainListItem}>{line}</li>)}</ul>
                  </div>
                ) : null}
                {alsoShowUpAs.length > 0 ? (
                  <div className={styles.domainSection}>
                    <p className={styles.domainSectionLabel}>Can also feel like</p>
                    <ul className={styles.domainList}>{alsoShowUpAs.map((line) => <li key={line} className={styles.domainListItem}>{line}</li>)}</ul>
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
          <p className={styles.technicalIntro}>For power users. The technical layer stays collapsed so the report remains centered on your experience.</p>
          <div className={styles.technicalGrid}>
            <article className={styles.technicalCard}>
              <p className={styles.sectionLabel}>What Influenced This Observation</p>
              <ul className={styles.technicalList}>
                {(report.evidence.topNotes ?? []).length ? report.evidence.topNotes.map((entry) => <li key={`${entry.note}-${entry.score}`}>{entry.note} {entry.score}% ({entry.system})</li>) : <li>No strong technical signals were available for this scan.</li>}
              </ul>
            </article>
            <article className={styles.technicalCard}>
              <p className={styles.sectionLabel}>Evidence</p>
              <ul className={styles.technicalList}>
                {(report.evidence.dimensions ?? []).length ? report.evidence.dimensions.map((dimension) => <li key={dimension.name}>{dimension.name} - {dimension.band} - {dimension.interpretation}</li>) : <li>No technical evidence available for this scan.</li>}
              </ul>
            </article>
          </div>
        </div>
      </details>
    </section>
  );
}
