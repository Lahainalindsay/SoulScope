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

function domainPhrase(domain?: UserResultDomain) {
  if (!domain) return "one part of your system";
  return domain.title.toLowerCase();
}

function signalTone(note?: string) {
  switch (note) {
    case "C": return "grounding and basic steadiness";
    case "C#": return "subtle pressure around change or transition";
    case "D": return "drive, emotion, and outward movement";
    case "D#": return "adaptation and quick internal adjustment";
    case "E": return "body energy and available expression";
    case "F": return "relational sensitivity and the need for safety";
    case "F#": return "future focus and planning energy";
    case "G": return "voice, connection, and expression";
    case "G#": return "restoration and recovery signals";
    case "A": return "momentum and forward orientation";
    case "A#": return "mental load and emotional intensity";
    case "B": return "cognitive processing and meaning-making";
    default: return "the strongest available voice signal";
  }
}

function scoreLanguage(score?: number) {
  if (typeof score !== "number") return "present";
  if (score >= 78) return "very pronounced";
  if (score >= 65) return "clearly active";
  if (score >= 45) return "moderately available";
  if (score >= 34) return "quieter and recovering";
  return "asking for support";
}

function buildCameraInsight(report: SoulScopeReport) {
  const camera = report.evidence.camera;
  if (!camera) return null;

  const baseline = report.evidence.cameraBaseline;
  const details: string[] = [];

  if (camera.trackingConfidence < 0.45) {
    details.push("camera tracking was limited, so the visual layer should be treated as a soft signal");
  }
  if (camera.facialTension >= 0.58) {
    details.push("facial tension appeared elevated while you were answering");
  } else if (camera.facialTension <= 0.32) {
    details.push("facial tension stayed relatively soft during the scan");
  }
  if (camera.blinkRatePerMin >= 24) {
    details.push("blink rate was more active than average during the scan");
  } else if (camera.blinkRatePerMin <= 10) {
    details.push("blink rate stayed low, which can happen with focused attention");
  }
  if (camera.eyeOpenness <= 0.4) {
    details.push("eye openness appeared lower during parts of the scan");
  }

  if (baseline && camera.trackingConfidence >= 0.45) {
    const tensionDelta = Math.round((camera.facialTension - baseline.facialTension) * 100);
    const blinkDelta = Math.round(camera.blinkRatePerMin - baseline.blinkRatePerMin);
    if (Math.abs(tensionDelta) >= 6) {
      details.push(`facial tension ${tensionDelta > 0 ? "rose" : "softened"} by ${Math.abs(tensionDelta)}% compared with baseline`);
    }
    if (Math.abs(blinkDelta) >= 4) {
      details.push(`blink rate ${blinkDelta > 0 ? "increased" : "settled"} by ${Math.abs(blinkDelta)} per minute compared with baseline`);
    }
  }

  if (!details.length) return "The camera layer was available but did not add a strong visible tension signal beyond the voice pattern.";
  return `The camera layer adds this extra context: ${details.join("; ")}. This is not diagnostic, but it helps make the reading more specific to how your body showed up during this scan.`;
}

function buildHiddenPatternTitle(domains: UserResultDomain[], report: SoulScopeReport) {
  const communication = getDomain(domains, "Communication & Clarity");
  const connection = getDomain(domains, "Connection & Support");
  const recovery = getDomain(domains, "Recovery & Restoration");
  const focus = getDomain(domains, "Focus & Mental Load");
  const emotional = getDomain(domains, "Emotional Expression");
  const adaptability = getDomain(domains, "Direction & Adaptability");
  const topNote = report.evidence.topNotes[0]?.note;

  if (needsSupport(connection) && isWorking(communication)) return "Needing Support While Trying to Explain";
  if (needsSupport(recovery) && isWorking(focus)) return "Functioning While Running Full";
  if (needsSupport(connection) && isWorking(emotional)) return "Wanting Safety Before Vulnerability";
  if (isWorking(adaptability) && needsSupport(recovery)) return "Adapting Faster Than You Can Restore";
  if (topNote === "B" || topNote === "A#") return "Living Mostly in Your Head";
  if (topNote === "F" || topNote === "G") return "Wanting to Be Met More Clearly";
  if (topNote === "C" || topNote === "G#") return "Trying to Rebuild Inner Ground";
  if (isWorking(communication)) return "Finding the Cleanest Way to Be Understood";
  if (isWorking(focus)) return "Carrying More Than You Show";
  return "Holding the Story Beneath the Surface";
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
  const topNote = report.evidence.topNotes[0];
  const secondNote = report.evidence.topNotes[1];
  const cameraInsight = buildCameraInsight(report);
  const pauseCount = report.evidence.pauseCount ?? 0;
  const primarySignal = topNote ? `${topNote.note} (${topNote.system})` : report.primaryPattern.name;

  const connectionNeedsSupport = needsSupport(connection) || (connection?.score ?? 100) < 50;
  const communicationWorking = isWorking(communication) || (communication?.score ?? 0) > 62;
  const recoveryNeedsSupport = needsSupport(recovery) || (recovery?.score ?? 100) < 50;
  const mentalLoadHigh = isWorking(focus) || (focus?.score ?? 0) > 62;
  const emotionalHigh = isWorking(emotional) || (emotional?.score ?? 0) > 62;
  const adaptabilityHigh = isWorking(adaptability) || (adaptability?.score ?? 0) > 62;
  const regulationNeedsSupport = needsSupport(regulation) || (regulation?.score ?? 100) < 50;
  const energyNeedsSupport = needsSupport(energy) || (energy?.score ?? 100) < 50;

  const opening = recoveryNeedsSupport || mentalLoadHigh
    ? `On the surface, you may appear to be functioning, but below the surface your system seems to be carrying more than it is showing. The strongest voice signal in this scan leaned toward ${signalTone(topNote?.note)}, while ${domainPhrase(low)} came through as ${scoreLanguage(low?.score)}. That combination makes this reading different from a simple stress report: it suggests where effort is being spent and where support may be missing.`
    : `On the surface, there is enough steadiness here to keep moving, but the deeper pattern is still personal. The clearest voice signal leaned toward ${signalTone(topNote?.note)}, with ${domainPhrase(top)} appearing ${scoreLanguage(top?.score)} and ${domainPhrase(low)} appearing ${scoreLanguage(low?.score)}. That contrast is the fingerprint of this scan.`;

  const supportAndVoice = connectionNeedsSupport && communicationWorking
    ? `Your voice points toward a need for safer connection and clearer support. Communication may feel harder than it should, not because you lack words, but because ${domainPhrase(connection)} is quieter while ${domainPhrase(communication)} is active. This can show up as over-explaining, choosing your words carefully, or feeling frustrated when people miss the deeper need underneath what you are saying.`
    : communicationWorking
      ? `Communication appears to be using extra energy. You may find yourself organizing your thoughts while you speak, repeating yourself, or working hard to make your meaning land clearly. The scan does not suggest that you need more words as much as a cleaner path for the words you already have.`
      : connectionNeedsSupport
        ? `The support layer appears quieter than the output layer. You may want closeness or help, but still feel guarded about asking directly. This can make you seem independent while part of you is actually waiting for a safer place to soften.`
        : `Your expression and support patterns are not telling a simple story of strength or weakness. They suggest a person balancing ${domainPhrase(top)} with a quieter need around ${domainPhrase(low)}.`;

  const emotionAndLoad = emotionalHigh || mentalLoadHigh || regulationNeedsSupport
    ? `Emotionally, there may be more sensitivity under the surface than people realize. ${pauseCount >= 3 ? `The pause pattern also suggests your system took extra moments to organize responses,` : `The pause pattern did not dominate the reading,`} while the ${primarySignal} signal points toward ${signalTone(topNote?.note)}. You may feel more reactive, tender, mentally full, or easily affected than you are letting on.`
    : `Emotionally, this scan looks less like a dramatic spike and more like quiet processing. The ${primarySignal} signal points toward ${signalTone(topNote?.note)}, and the second signal${secondNote ? `, ${secondNote.note}, adds ${signalTone(secondNote.note)}` : " adds a softer supporting layer"}.`;

  const recoveryAndBody = recoveryNeedsSupport || energyNeedsSupport
    ? `Your system appears to need restoration, not another demand. If you push harder from here, clarity may actually get thinner. If you create recovery first, the parts connected to ${domainPhrase(communication)} and ${domainPhrase(regulation)} may have more room to come back online naturally.`
    : `There is usable energy in this scan, but the invitation is to use it wisely. The goal is not to spend every available resource proving that you are fine; the goal is to protect the parts of you that are helping you stay coherent.`;

  const hiddenPatternTitle = buildHiddenPatternTitle(domains, report);

  const hiddenPattern = connectionNeedsSupport && communicationWorking
    ? `The hidden pattern is protected expression. You may want to be seen and supported, but part of you is still checking whether it is safe to be fully honest. The quieter ${domainPhrase(connection)} signal is important here.`
    : recoveryNeedsSupport && mentalLoadHigh
      ? `The hidden pattern is endurance. ${domainPhrase(focus)} is taking up space while ${domainPhrase(recovery)} is asking for support, which means functioning may be happening through mental effort rather than true restoration.`
      : adaptabilityHigh && recoveryNeedsSupport
        ? `The hidden pattern is rapid adaptation without enough refill. ${domainPhrase(adaptability)} can help you keep moving, but ${domainPhrase(recovery)} needs to become part of the strategy instead of something you reach for only after depletion.`
        : `The hidden pattern centers around ${report.primaryPattern.name.toLowerCase()}, shaped most strongly by ${primarySignal}. The visible behavior is only part of the story; the deeper movement is how your system is trying to stay organized while asking for something more specific.`;

  const feelsLike = connectionNeedsSupport || communicationWorking
    ? `In daily life, this may feel like wanting to be understood but not wanting to expose too much, explaining yourself more than you planned, replaying conversations afterward, or feeling emotionally tired from trying to make your needs sound reasonable.`
    : mentalLoadHigh
      ? `In daily life, this may feel like too many mental tabs open at once, difficulty resting because your mind keeps organizing the next step, or feeling capable on the outside while internally crowded.`
      : `In daily life, this may feel like being mostly okay but still aware that something in you wants a cleaner rhythm, clearer expression, or a more honest kind of support.`;

  const strength = top
    ? `The strength here is ${domainPhrase(top)}. Even if other parts of the scan show effort, that area remains ${scoreLanguage(top.score)}, which means your system has not gone offline; it is still trying to adapt, understand, communicate, or move toward balance.`
    : `The strength here is that the system is still communicating. Even when the pattern is not easy, your voice is giving information that can be used for awareness and repair.`;

  const balancePoint = connectionNeedsSupport && communicationWorking
    ? `Your balance point is direct expression with less defense. Today, practice naming one need clearly without building a full case for why it is valid. Let the sentence be simple enough that your nervous system does not have to perform while asking for support.`
    : recoveryNeedsSupport && mentalLoadHigh
      ? `Your balance point is reducing cognitive load before asking yourself to do more. Choose one unfinished loop to close, postpone, or write down so your mind does not have to keep carrying it in the background.`
      : emotionalHigh
        ? `Your balance point is emotional honesty without escalation. Name what you feel before trying to solve it, explain it, or make it acceptable to someone else.`
        : `Your balance point is choosing one small action that supports ${domainPhrase(low)}. Do not turn the recommendation into another performance. Let one clear step be enough.`;

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
