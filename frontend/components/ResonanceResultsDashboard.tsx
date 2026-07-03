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

type RecommendationGroup = {
  title: string;
  intro: string;
  items: string[];
};

function safeLines(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function formatList(items: string[], fallback = "the available signals") {
  if (!items.length) return fallback;
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

function getDomain(domains: UserResultDomain[], title: UserResultDomain["title"]) {
  return domains.find((domain) => domain.title === title);
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

  const highestText = formatList(highest.map((domain) => domain.title), "the clearest signals in this scan");
  const lowestText = formatList(lowest.map((domain) => domain.title), "the quieter signals in this scan");
  const workingText = formatList(working.map((domain) => domain.title), "the areas carrying the most effort");
  const supportText = formatList(support.map((domain) => domain.title), "the areas asking for support");
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

function buildBalancingRecommendations(domains: UserResultDomain[]): RecommendationGroup[] {
  const recovery = getDomain(domains, "Recovery & Restoration");
  const focus = getDomain(domains, "Focus & Mental Load");
  const adaptability = getDomain(domains, "Direction & Adaptability");
  const emotional = getDomain(domains, "Emotional Expression");
  const communication = getDomain(domains, "Communication & Clarity");
  const connection = getDomain(domains, "Connection & Support");
  const energy = getDomain(domains, "Energy & Vitality");
  const regulation = getDomain(domains, "Regulation");

  const groups: RecommendationGroup[] = [];
  const recoveryNeedsSupport = recovery && recovery.score < 48;
  const mentalLoadHigh = focus && focus.score > 62;
  const adaptabilityHigh = adaptability && adaptability.score > 62;
  const emotionalHigh = emotional && emotional.score > 62;
  const communicationWorking = communication && ["Working Hard", "Under Pressure"].includes(communication.functionalState);
  const connectionLow = connection && connection.score < 48;
  const energyLow = energy && energy.score < 48;
  const regulationLow = regulation && regulation.score < 48;

  if (recoveryNeedsSupport && (mentalLoadHigh || adaptabilityHigh)) {
    groups.push({
      title: "Today's Focus",
      intro: "Protect recovery without abandoning momentum. The goal is not to do nothing; it is to stop making every part of you work at the same time.",
      items: [
        "Choose one task to complete or consciously postpone so your mind has fewer open loops.",
        "Create one 20-minute block with no phone, no input, and no problem-solving.",
        "Let your next step be smaller than your ambition. Sustainable movement beats heroic overextension today.",
      ],
    });
  } else if (recoveryNeedsSupport) {
    groups.push({
      title: "Recovery First",
      intro: "Restoration appears to be asking for more support. This does not mean weakness; it means your system may need more refill than push right now.",
      items: [
        "Give yourself one clear recovery window before adding another obligation.",
        "Reduce sensory input for a short period: dim lights, quiet room, slower pace.",
        "Choose sleep consistency or quiet rest over squeezing in one more task.",
      ],
    });
  }

  if (mentalLoadHigh) {
    groups.push({
      title: "Mind",
      intro: "Mental load appears active. Balance here comes from closing loops, externalizing thoughts, and reducing decision friction.",
      items: [
        "Do a five-minute brain dump and circle only the next real action.",
        "Avoid starting three new things before finishing one small thing.",
        "Give yourself permission to answer slower. Clarity often improves when the nervous system stops rushing the words.",
      ],
    });
  }

  if (emotionalHigh || communicationWorking) {
    groups.push({
      title: "Expression",
      intro: "Your expression channel appears active. That can be creativity, truth, sensitivity, or pressure trying to find a clean path out.",
      items: [
        "Write the uncensored version privately before trying to explain it perfectly to someone else.",
        "Name the feeling in plain language before solving it: mad, tired, hopeful, scared, tender, overloaded.",
        "Use one honest sentence instead of a full courtroom presentation. Tiny truth still counts.",
      ],
    });
  }

  if (connectionLow) {
    groups.push({
      title: "Connection",
      intro: "The support layer may be quieter than the output layer. Balance may come from safer connection, not more performance.",
      items: [
        "Reach for one low-pressure contact: a voice note, simple text, or short check-in.",
        "Ask for practical support instead of trying to explain the whole emotional universe at once.",
        "Notice where you are giving support that you are not receiving back.",
      ],
    });
  }

  if (energyLow || regulationLow) {
    groups.push({
      title: "Body & Nervous System",
      intro: "The body layer may need grounding before more insight. Regulation is often rebuilt through simple repeatable signals of safety.",
      items: [
        "Take a slow walk, stretch your hips and shoulders, or step outside for natural light.",
        "Try longer exhales for two minutes: inhale normally, exhale slowly, repeat without forcing it.",
        "Eat, hydrate, and reduce avoidable stimulation before judging your mood or motivation.",
      ],
    });
  }

  if (!groups.length) {
    groups.push({
      title: "Maintain What Is Working",
      intro: "Your scan shows enough available capacity to focus on maintenance rather than emergency repair.",
      items: [
        "Keep the rhythm that is already supporting you instead of adding unnecessary intensity.",
        "Choose one grounding habit you can repeat tomorrow.",
        "Notice what helped your voice feel clearer today and protect more of that.",
      ],
    });
  }

  groups.push({
    title: "Your Next Step",
    intro: "Choose one action. The point is not to fix your whole life from one scan. The point is to respond to the clearest signal.",
    items: ["Pick the recommendation that feels easiest to actually do today, then make it almost embarrassingly small."],
  });

  return groups.slice(0, 5);
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
  const recommendations = buildBalancingRecommendations(domains);

  return (
    <section className={styles.section}>
      <section className={styles.heroCard}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Your Current Story</p>
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
            <p className={styles.eyebrow}>Help Us Build SoulScope</p>
            <h2 className={styles.mapTitle}>Choose the description that feels most like you</h2>
            <p className={styles.lead}>Thanks for testing the app. Please choose your favorite description out of the three energy narratives below. Your choice helps us develop a more accurate, personal, and premium experience for future users.</p>
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
                <p className={styles.noteExpression}>Most expressed: {formatList(safeLines(candidate.strongestResources), "not enough signal yet")}</p>
                <p className={styles.noteExpression}>Working hardest: {formatList(safeLines(candidate.areasWorkingHard), "no clear pressure point identified")}</p>
                <p className={styles.noteExpression}>Needs support: {formatList(safeLines(candidate.areasAskingForSupport), "no single support area stands out")}</p>
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

      <section className={styles.notesSection}>
        <div className={styles.notesHeader}>
          <div>
            <p className={styles.eyebrow}>Balancing Recommendations</p>
            <h2 className={styles.mapTitle}>What may help bring the pattern into balance</h2>
            <p className={styles.lead}>These are based on the relationship between your most expressed areas, the areas working hardest, and the parts of your system asking for support.</p>
          </div>
        </div>
        <div className={styles.storyGrid}>
          {recommendations.map((group) => (
            <article key={group.title} className={styles.storyCard}>
              <p className={styles.noteStatus}>{group.title}</p>
              <p className={styles.noteText}>{group.intro}</p>
              <ul className={styles.storyList}>{group.items.map((item) => <li key={item} className={styles.storyItem}>{item}</li>)}</ul>
            </article>
          ))}
        </div>
      </section>

      {report.supportingPattern || report.emergingPattern ? (
        <section className={styles.patternStrip}>
          {report.supportingPattern ? <article className={styles.patternCard}><p className={styles.noteStatus}>Secondary Influence</p><h3 className={styles.patternTitle}>{report.supportingPattern.name}</h3><p className={styles.patternTheme}>{report.supportingPattern.theme}</p></article> : null}
          {report.emergingPattern ? <article className={styles.patternCard}><p className={styles.noteStatus}>Emerging Influence</p><h3 className={styles.patternTitle}>{report.emergingPattern.name}</h3><p className={styles.patternTheme}>{report.emergingPattern.theme}</p></article> : null}
        </section>
      ) : null}

      <section className={styles.notesSection}>
        <div className={styles.notesHeader}><div><p className={styles.eyebrow}>Your Resonance Story</p><h2 className={styles.mapTitle}>How the different parts of the scan connect</h2><p className={styles.lead}>These cards are pieces of the same pattern: where your system is resourced, where it is spending energy, and where it may need support.</p></div></div>
        <div className={styles.domainGrid}>
          {domains.map((domain) => {
            const couldExpressAs = safeLines(domain.thisCouldExpressAs);
            const alsoShowUpAs = safeLines(domain.itCanAlsoShowUpAs);
            return (
              <article key={domain.title} className={styles.domainCard}>
                <div className={styles.noteTop}><div><p className={styles.noteStatus}>{domain.title}</p><h3 className={styles.domainState}>{domain.functionalState}</h3></div><span className={styles.domainActivity}>{domain.activityLevel}</span></div>
                <p className={styles.domainPattern}>{domainMeaning(domain)}</p>
                {couldExpressAs.length > 0 ? <div className={styles.domainSection}><p className={styles.domainSectionLabel}>May show up as</p><ul className={styles.domainList}>{couldExpressAs.map((line) => <li key={line} className={styles.domainListItem}>{line}</li>)}</ul></div> : null}
                {alsoShowUpAs.length > 0 ? <div className={styles.domainSection}><p className={styles.domainSectionLabel}>Can also feel like</p><ul className={styles.domainList}>{alsoShowUpAs.map((line) => <li key={line} className={styles.domainListItem}>{line}</li>)}</ul></div> : null}
                <p className={styles.domainReframe}>{domain.supportiveReframe}</p>
              </article>
            );
          })}
        </div>
      </section>

      <details className={styles.technicalDetails}>
        <summary className={styles.technicalSummary}>View Technical Analysis</summary>
        <div className={styles.technicalBody}><p className={styles.technicalIntro}>For power users. The technical layer stays collapsed so the report remains centered on your experience.</p></div>
      </details>
    </section>
  );
}
