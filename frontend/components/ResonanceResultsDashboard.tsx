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

type CameraSignal = NonNullable<SoulScopeReport["evidence"]["camera"]>;

function formatCameraPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatCameraShift(value: number, unit = "") {
  if (Math.abs(value) < 0.01) return `held near baseline${unit ? ` ${unit}` : ""}`;
  return `${value > 0 ? "rose" : "softened"} by ${Math.abs(value).toFixed(unit ? 1 : 0)}${unit}`;
}

function buildCameraInsight(report: SoulScopeReport) {
  const camera = report.evidence.camera;
  if (!camera) return null;

  const baseline = report.evidence.cameraBaseline;
  const details: string[] = [];

  if (camera.trackingConfidence < 0.45) {
    details.push("camera tracking confidence was limited, so this visual layer should be treated as directional");
  }
  if (camera.facialTension >= 0.58) {
    details.push("facial tension appeared elevated during the scan");
  }
  if (camera.blinkRatePerMin >= 24) {
    details.push("blink rate shifted upward while you were answering");
  }
  if (camera.eyeOpenness <= 0.4) {
    details.push("eye openness appeared lower during parts of the scan");
  }
  if (camera.eyeDilationProxy >= 0.62) {
    details.push("the eye dilation proxy appeared more activated");
  }

  if (baseline && camera.trackingConfidence >= 0.45) {
    const tensionDelta = (camera.facialTension - baseline.facialTension) * 100;
    const blinkDelta = camera.blinkRatePerMin - baseline.blinkRatePerMin;
    if (Math.abs(tensionDelta) >= 6 || Math.abs(blinkDelta) >= 4) {
      details.push(
        `relative to your opening baseline, facial tension ${formatCameraShift(tensionDelta)} and blink rate ${formatCameraShift(blinkDelta, " per minute")}`
      );
    }
  }

  if (!details.length) return "The camera layer was available and did not add a strong visible tension signal beyond the voice pattern.";

  return `The camera layer adds a cautious signal: ${details.join("; ")}. This is not diagnostic, but it can help explain how the pattern may have shown up physically while you were speaking.`;
}

function buildHiddenPatternTitle(domains: UserResultDomain[]) {
  const communication = getDomain(domains, "Communication & Clarity");
  const connection = getDomain(domains, "Connection & Support");
  const recovery = getDomain(domains, "Recovery & Restoration");
  const focus = getDomain(domains, "Focus & Mental Load");
  const emotional = getDomain(domains, "Emotional Expression");
  const adaptability = getDomain(domains, "Direction & Adaptability");

  if (needsSupport(connection) && isWorking(communication)) return "Needing Support While Trying to Explain";
  if (needsSupport(recovery) && isWorking(focus)) return "Functioning While Running Full";
  if (needsSupport(connection) && isWorking(emotional)) return "Wanting Safety Before Vulnerability";
  if (isWorking(adaptability) && needsSupport(recovery)) return "Adapting Faster Than You Can Restore";
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
  const cameraInsight = buildCameraInsight(report);

  const connectionNeedsSupport = needsSupport(connection) || (connection?.score ?? 100) < 50;
  const communicationWorking = isWorking(communication) || (communication?.score ?? 0) > 62;
  const recoveryNeedsSupport = needsSupport(recovery) || (recovery?.score ?? 100) < 50;
  const mentalLoadHigh = isWorking(focus) || (focus?.score ?? 0) > 62;
  const emotionalHigh = isWorking(emotional) || (emotional?.score ?? 0) > 62;
  const adaptabilityHigh = isWorking(adaptability) || (adaptability?.score ?? 0) > 62;
  const regulationNeedsSupport = needsSupport(regulation) || (regulation?.score ?? 100) < 50;
  const energyNeedsSupport = needsSupport(energy) || (energy?.score ?? 100) < 50;

  const opening = recoveryNeedsSupport || mentalLoadHigh
    ? "On the surface, you may appear to be functioning, but below the surface your system seems to be carrying more than it is showing. There is still movement, awareness, and capability here, but the scan suggests that some of that capability may be coming from effort rather than ease."
    : "On the surface, there is enough steadiness here to keep moving, but the deeper pattern is more nuanced than simply being okay. Your voice suggests that some parts of you are available and expressive while other parts are asking for more honesty, support, or recovery."

  const supportAndVoice = connectionNeedsSupport && communicationWorking
    ? "Your voice points toward a need for safer connection and clearer support. Communication may feel harder than it should, not because you lack words, but because part of you may be trying to protect what is vulnerable while still trying to be understood. This can show up as over-explaining, choosing your words carefully, or feeling frustrated when people miss the deeper need underneath what you are saying."
    : communicationWorking
      ? "Communication appears to be using extra energy. You may find yourself trying to organize your thoughts while you speak, repeating yourself, or working hard to make your meaning land clearly. The deeper need is not to say more; it may be to say the truer thing with less self-protection around it."
      : connectionNeedsSupport
        ? "The support layer appears quieter than the output layer. You may want closeness or help, but still feel guarded about asking directly. This pattern can make you seem independent while part of you is actually waiting for a safer place to soften."
        : "Your expression and support patterns are not telling a simple story of strength or weakness. They suggest a person who is still trying to find the right balance between being self-contained and being honestly met by others."

  const emotionAndLoad = emotionalHigh || mentalLoadHigh || regulationNeedsSupport
    ? "Emotionally, there may be more sensitivity under the surface than people realize. You might feel more reactive, tender, or easily affected than usual, while still trying to stay composed. If your mind has been busy, it may be because it is trying to translate feelings into something manageable before you let anyone else see them."
    : "Emotionally, the scan suggests that you may be processing more quietly than dramatically. The important part is not intensity; it is whether your inner experience has enough room to move instead of being managed in the background."

  const recoveryAndBody = recoveryNeedsSupport || energyNeedsSupport
    ? "Your system appears to need restoration, not another demand. This is the kind of pattern where pushing harder may create less clarity, while creating space to recover may actually make your communication, focus, and emotional steadiness come back online more naturally."
    : "There is still usable energy in this scan, but the invitation is to use it wisely. The goal is not to spend every available resource proving that you are fine; the goal is to protect the parts of you that are helping you stay coherent."

  const hiddenPatternTitle = buildHiddenPatternTitle(domains);

  const hiddenPattern = connectionNeedsSupport && communicationWorking
    ? "The hidden pattern is not silence; it is protected expression. Something in you may want to be seen and supported, while another part is still checking whether it is safe to be fully honest."
    : recoveryNeedsSupport && mentalLoadHigh
      ? "The hidden pattern is endurance. You may be staying functional by keeping your mind active, but the system underneath is asking for fewer open loops and more restoration."
      : adaptabilityHigh && recoveryNeedsSupport
        ? "The hidden pattern is rapid adaptation without enough refill. You can keep adjusting, but your recovery needs to become part of the strategy instead of something you only reach for after depletion."
        : `The hidden pattern centers around ${report.primaryPattern.name.toLowerCase()}. The scan suggests that the visible behavior is only part of the story; the deeper movement is how your system is trying to stay organized while asking for more support.`;

  const feelsLike = connectionNeedsSupport || communicationWorking
    ? "In daily life, this may feel like wanting to be understood but not wanting to expose too much, explaining yourself more than you planned, replaying conversations afterward, or feeling emotionally tired from trying to make your needs sound reasonable."
    : mentalLoadHigh
      ? "In daily life, this may feel like too many mental tabs open at once, difficulty resting because your mind keeps organizing the next step, or feeling capable on the outside while internally crowded."
      : "In daily life, this may feel like being mostly okay but still aware that something in you wants a cleaner rhythm, clearer expression, or a more honest kind of support.";

  const strength = adaptabilityHigh || top
    ? "The strength here is that you are still responding. Even where the scan shows effort, your system has not shut down; it is still trying to adapt, understand, communicate, and move toward balance."
    : "The strength here is that the system is still communicating. Even when the pattern is not easy, your voice is still giving information that can be used for awareness and repair.";

  const balancePoint = connectionNeedsSupport && communicationWorking
    ? "Your balance point is direct expression with less defense. Today, practice naming one need clearly without building a full case for why it is valid. Let the sentence be simple enough that your nervous system does not have to perform while asking for support."
    : recoveryNeedsSupport && mentalLoadHigh
      ? "Your balance point is reducing cognitive load before asking yourself to do more. Choose one unfinished loop to close, postpone, or write down so your mind does not have to keep carrying it in the background."
      : emotionalHigh
        ? "Your balance point is emotional honesty without escalation. Name what you feel before trying to solve it, explain it, or make it acceptable to someone else."
        : "Your balance point is choosing the smallest action that creates more honesty or ease. Do not turn the recommendation into another performance. Let one clear step be enough.";

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
