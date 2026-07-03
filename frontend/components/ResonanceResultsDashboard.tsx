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

type NarrativeProfile = {
  story: string[];
  hiddenPatternTitle: string;
  hiddenPattern: string;
  feelsLike: string;
  strength: string;
  balancePoint: string;
  cameraInsight: string | null;
};

function getDomain(domains: UserResultDomain[], title: UserResultDomain["title"]) {
  return domains.find((domain) => domain.title === title);
}

function isWorking(domain?: UserResultDomain) {
  return Boolean(domain && ["Working Hard", "Under Pressure"].includes(domain.functionalState));
}

function needsSupport(domain?: UserResultDomain) {
  return Boolean(domain && ["Asking for Support", "Less Accessible", "Recovering"].includes(domain.functionalState));
}

function strongest(domains: UserResultDomain[]) {
  return [...domains].sort((a, b) => b.score - a.score)[0];
}

function quietest(domains: UserResultDomain[]) {
  return [...domains].sort((a, b) => a.score - b.score)[0];
}

function formatCameraPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function softAreaName(domain?: UserResultDomain) {
  if (!domain) return "one part of you";
  switch (domain.title) {
    case "Energy & Vitality":
      return "your energy";
    case "Recovery & Restoration":
      return "your ability to restore";
    case "Communication & Clarity":
      return "your ability to say what you mean";
    case "Emotional Expression":
      return "your emotional expression";
    case "Connection & Support":
      return "your need for connection and support";
    case "Focus & Mental Load":
      return "your mental space";
    case "Direction & Adaptability":
      return "your ability to adapt and keep moving";
    case "Regulation":
      return "your ability to settle";
    default:
      return "one part of you";
  }
}

function visibleState(score?: number) {
  if (typeof score !== "number") return "present";
  if (score >= 78) return "very active";
  if (score >= 65) return "strongly active";
  if (score >= 45) return "available, but not unlimited";
  if (score >= 34) return "quieter than usual";
  return "asking for support";
}

function buildCameraInsight(report: SoulScopeReport) {
  const camera = report.evidence.camera;
  if (!camera || camera.trackingConfidence < 0.45) return null;

  const baseline = report.evidence.cameraBaseline;
  const details: string[] = [];

  if (camera.facialTension >= 0.62) {
    details.push("your face appeared to hold more tension while answering");
  } else if (camera.facialTension <= 0.28) {
    details.push("your face appeared relatively soft while answering");
  }

  if (camera.blinkRatePerMin >= 24 && camera.blinkRatePerMin <= 80) {
    details.push("your blink rate appeared more active during the scan");
  } else if (camera.blinkRatePerMin > 0 && camera.blinkRatePerMin <= 10) {
    details.push("your blink rate stayed low, which can happen during focused attention");
  }

  if (baseline) {
    const tensionDelta = Math.round((camera.facialTension - baseline.facialTension) * 100);
    const blinkDelta = Math.round(camera.blinkRatePerMin - baseline.blinkRatePerMin);

    if (Number.isFinite(tensionDelta) && Math.abs(tensionDelta) >= 8 && Math.abs(tensionDelta) <= 45) {
      details.push(`facial tension ${tensionDelta > 0 ? "rose" : "softened"} compared with your opening baseline`);
    }

    if (Number.isFinite(blinkDelta) && Math.abs(blinkDelta) >= 4 && Math.abs(blinkDelta) <= 45) {
      details.push(`blink rate ${blinkDelta > 0 ? "increased" : "settled"} compared with your opening baseline`);
    }
  }

  if (!details.length) return null;
  return `The camera layer gently supported the reading too: ${details.join("; ")}. This is only a soft body-language signal, not a diagnosis.`;
}

function buildHiddenPatternTitle(domains: UserResultDomain[]) {
  const communication = getDomain(domains, "Communication & Clarity");
  const connection = getDomain(domains, "Connection & Support");
  const recovery = getDomain(domains, "Recovery & Restoration");
  const focus = getDomain(domains, "Focus & Mental Load");
  const emotional = getDomain(domains, "Emotional Expression");
  const adaptability = getDomain(domains, "Direction & Adaptability");

  if (needsSupport(connection) && isWorking(communication)) return "Needing Support While Trying to Explain";
  if (needsSupport(recovery) && isWorking(focus)) return "Running on Effort Instead of Rest";
  if (needsSupport(connection) && isWorking(emotional)) return "Wanting Safety Before Vulnerability";
  if (isWorking(adaptability) && needsSupport(recovery)) return "Adapting Faster Than You Can Restore";
  if (isWorking(communication)) return "Trying to Be Understood Clearly";
  if (isWorking(focus)) return "Carrying More Than You Show";
  return "Holding More Than You Say";
}

function buildNarrativeProfile(domains: UserResultDomain[], report: SoulScopeReport): NarrativeProfile {
  const communication = getDomain(domains, "Communication & Clarity");
  const connection = getDomain(domains, "Connection & Support");
  const recovery = getDomain(domains, "Recovery & Restoration");
  const focus = getDomain(domains, "Focus & Mental Load");
  const emotional = getDomain(domains, "Emotional Expression");
  const adaptability = getDomain(domains, "Direction & Adaptability");
  const energy = getDomain(domains, "Energy & Vitality");
  const regulation = getDomain(domains, "Regulation");
  const top = strongest(domains);
  const low = quietest(domains);
  const cameraInsight = buildCameraInsight(report);
  const pauseCount = report.evidence.pauseCount ?? 0;

  const connectionNeedsSupport = needsSupport(connection) || (connection?.score ?? 100) < 50;
  const communicationWorking = isWorking(communication) || (communication?.score ?? 0) > 62;
  const recoveryNeedsSupport = needsSupport(recovery) || (recovery?.score ?? 100) < 50;
  const mentalLoadHigh = isWorking(focus) || (focus?.score ?? 0) > 62;
  const emotionalHigh = isWorking(emotional) || (emotional?.score ?? 0) > 62;
  const adaptabilityHigh = isWorking(adaptability) || (adaptability?.score ?? 0) > 62;
  const regulationNeedsSupport = needsSupport(regulation) || (regulation?.score ?? 100) < 50;
  const energyNeedsSupport = needsSupport(energy) || (energy?.score ?? 100) < 50;

  const opening = recoveryNeedsSupport || mentalLoadHigh
    ? `On the surface, you may be getting through things, but underneath it looks like you are carrying more than you are showing. ${softAreaName(top)} seems ${visibleState(top?.score)}, while ${softAreaName(low)} seems ${visibleState(low?.score)}. That combination suggests you are still functioning, but not necessarily from a place of ease.`
    : `On the surface, there is enough steadiness here to keep moving, but the deeper story is more personal than simply being “fine.” ${softAreaName(top)} seems ${visibleState(top?.score)}, while ${softAreaName(low)} seems ${visibleState(low?.score)}. This suggests one part of you is available, while another part is asking to be cared for more honestly.`;

  const supportAndVoice = connectionNeedsSupport && communicationWorking
    ? `You may be wanting support, closeness, or understanding, but still feel guarded about asking directly. Communication may feel harder than it should, not because you lack words, but because part of you may be trying to protect what is vulnerable while still trying to be understood.`
    : communicationWorking
      ? `You may be working harder than usual to explain yourself clearly. This can show up as repeating yourself, organizing your thoughts while you speak, or feeling like people are not quite catching the real point underneath your words.`
      : connectionNeedsSupport
        ? `You may want connection or support, but still feel cautious about leaning on anyone too directly. This can make you appear more independent than you actually feel inside.`
        : `You appear to be balancing what is available in you with what still needs care. This does not read as one simple problem; it reads like a person trying to stay honest while still staying protected.`;

  const emotionAndLoad = emotionalHigh || mentalLoadHigh || regulationNeedsSupport
    ? `Emotionally, there may be more sensitivity under the surface than people realize. ${pauseCount >= 3 ? "You may need extra time to organize what you feel before you can say it clearly." : "You may be feeling more than you are showing."} This can feel like being tender, mentally full, reactive, or easily affected while still trying to stay composed.`
    : `Emotionally, this looks more like quiet processing than dramatic overwhelm. You may not feel visibly overloaded, but something in you still seems to want more room to breathe, speak, or settle.`;

  const recoveryAndBody = recoveryNeedsSupport || energyNeedsSupport
    ? `What your system appears to need most is restoration, not another demand. Pushing harder may make clarity thinner. Giving yourself space to recover may help your voice, your focus, and your emotional steadiness come back online more naturally.`
    : `There is usable energy here, but it needs to be protected. The goal is not to spend every available resource proving that you are okay. The goal is to notice what is working and stop draining it unnecessarily.`;

  const hiddenPatternTitle = buildHiddenPatternTitle(domains);

  const hiddenPattern = connectionNeedsSupport && communicationWorking
    ? `The hidden pattern is protected expression. You may want to be seen and supported, while another part of you is still checking whether it is safe to be fully honest.`
    : recoveryNeedsSupport && mentalLoadHigh
      ? `The hidden pattern is endurance. You may be staying functional by keeping your mind active, but the system underneath is asking for fewer open loops and more restoration.`
      : adaptabilityHigh && recoveryNeedsSupport
        ? `The hidden pattern is rapid adaptation without enough refill. You can keep adjusting, but your recovery needs to become part of the strategy instead of something you reach for only after depletion.`
        : `The hidden pattern is that the visible version of you may not be showing the whole story. Some parts of you are still organized and capable, while another part is asking for something more specific, honest, or supportive.`;

  const feelsLike = connectionNeedsSupport || communicationWorking
    ? `In daily life, this may feel like wanting to be understood but not wanting to expose too much, explaining yourself more than you planned, replaying conversations afterward, or feeling emotionally tired from trying to make your needs sound reasonable.`
    : mentalLoadHigh
      ? `In daily life, this may feel like too many mental tabs open at once, difficulty resting because your mind keeps organizing the next step, or feeling capable on the outside while internally crowded.`
      : `In daily life, this may feel like being mostly okay but still aware that something in you wants a cleaner rhythm, clearer expression, or a more honest kind of support.`;

  const strength = top
    ? `Your strength in this scan is that ${softAreaName(top)} is still available. Even if other parts of you are tired or guarded, you have not shut down. There is still awareness, responsiveness, and a real ability to move toward balance.`
    : `Your strength is that your system is still communicating. Even when the pattern is not easy, there is information here that can be used for awareness and repair.`;

  const balancePoint = connectionNeedsSupport && communicationWorking
    ? `Your balance point is direct expression with less defense. Today, practice naming one need clearly without building a full case for why it is valid. Let the sentence be simple enough that your nervous system does not have to perform while asking for support.`
    : recoveryNeedsSupport && mentalLoadHigh
      ? `Your balance point is reducing cognitive load before asking yourself to do more. Choose one unfinished loop to close, postpone, or write down so your mind does not have to keep carrying it in the background.`
      : emotionalHigh
        ? `Your balance point is emotional honesty without escalation. Name what you feel before trying to solve it, explain it, or make it acceptable to someone else.`
        : `Your balance point is choosing one small action that supports ${softAreaName(low)}. Do not turn the recommendation into another performance. Let one clear step be enough.`;

  return {
    story: [opening, supportAndVoice, emotionAndLoad, recoveryAndBody],
    hiddenPatternTitle,
    hiddenPattern,
    feelsLike,
    strength,
    balancePoint,
    cameraInsight,
  };
}

export default function ResonanceResultsDashboard({
  report,
  hiddenNotes = [],
  onSelectStory,
  selectedStoryStyle = null,
}: ResonanceResultsDashboardProps) {
  const visibleEnergies = (report.evidence.noteEnergies ?? []).filter((entry) => !hiddenNotes.includes(entry.note));
  const domains = report.domainResults ?? [];
  const narrative = buildNarrativeProfile(domains, report);

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
              <p className={styles.sectionLabel}>Voice Signals</p>
              <ul className={styles.technicalList}>
                {report.evidence.topNotes.map((note) => (
                  <li key={note.note}>{note.note}: {note.system}, {Math.round(note.score)} ({note.status})</li>
                ))}
              </ul>
            </article>
            <article className={styles.technicalCard}>
              <p className={styles.sectionLabel}>Domain Model</p>
              <ul className={styles.technicalList}>
                {domains.map((domain) => (
                  <li key={domain.title}>{domain.title}: {Math.round(domain.score)} ({domain.functionalState})</li>
                ))}
              </ul>
            </article>
            <article className={styles.technicalCard}>
              <p className={styles.sectionLabel}>Camera Layer</p>
              {report.evidence.camera ? (
                <ul className={styles.technicalList}>
                  <li>Blink rate: {report.evidence.camera.blinkRatePerMin}/min</li>
                  <li>Facial tension: {formatCameraPercent(report.evidence.camera.facialTension)}</li>
                  <li>Eye dilation proxy: {formatCameraPercent(report.evidence.camera.eyeDilationProxy)}</li>
                  <li>Tracking confidence: {formatCameraPercent(report.evidence.camera.trackingConfidence)}</li>
                  <li>Frames analyzed: {report.evidence.camera.framesAnalyzed}</li>
                </ul>
              ) : (
                <p className={styles.domainPattern}>No camera data was available, so this report is based on voice signals.</p>
              )}
            </article>
          </div>
        </div>
      </details>
    </section>
  );
}
