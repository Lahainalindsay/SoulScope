import NoteAuraMap from "./NoteAuraMap";
import { type SoulScopeReport } from "../lib/buildSoulScopeReport";
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

function strongest(report: SoulScopeReport) {
  return [...(report.domainResults ?? [])].sort((a, b) => b.score - a.score)[0];
}

function quietest(report: SoulScopeReport) {
  return [...(report.domainResults ?? [])].sort((a, b) => a.score - b.score)[0];
}

function softName(title?: string) {
  if (!title) return "one part of you";
  if (title === "Energy & Vitality") return "your energy";
  if (title === "Recovery & Restoration") return "your ability to restore";
  if (title === "Communication & Clarity") return "your ability to say what you mean";
  if (title === "Emotional Expression") return "your emotional expression";
  if (title === "Connection & Support") return "your need for connection and support";
  if (title === "Focus & Mental Load") return "your mental space";
  if (title === "Direction & Adaptability") return "your ability to adapt and keep moving";
  if (title === "Regulation") return "your ability to settle";
  return title.toLowerCase();
}

function noteMeaning(note?: string) {
  if (note === "C") return "grounding and steadiness";
  if (note === "C#") return "change and adjustment";
  if (note === "D") return "drive and emotional movement";
  if (note === "D#") return "adaptation";
  if (note === "E") return "body energy and active expression";
  if (note === "F") return "relational sensitivity";
  if (note === "F#") return "future focus";
  if (note === "G") return "voice and connection";
  if (note === "G#") return "release and restoration";
  if (note === "A") return "momentum";
  if (note === "A#") return "mental pressure and intensity";
  if (note === "B") return "meaning-making";
  return "your strongest voice signal";
}

function buildNarrative(report: SoulScopeReport): NarrativeProfile {
  const top = strongest(report);
  const low = quietest(report);
  const notes = [...(report.evidence.noteEnergies ?? [])].sort((a, b) => b.score - a.score);
  const first = notes[0];
  const second = notes[1];
  const topTwo = notes.slice(0, 2).reduce((sum, note) => sum + note.relativeEnergy, 0);
  const concentrated = topTwo >= 0.42;
  const camera = report.evidence.camera;
  const cameraInsight = camera && camera.trackingConfidence >= 0.45 && camera.blinkRatePerMin >= 0 && camera.blinkRatePerMin <= 80
    ? camera.facialTension > 0.62
      ? "The camera layer also suggested more visible tension while answering."
      : camera.facialTension < 0.28
        ? "The camera layer also suggested a softer visible expression while answering."
        : null
    : null;

  const opening = `On the surface, this scan shows ${softName(top?.title)} as the most available area, while ${softName(low?.title)} is asking for the most support.`;
  const signal = concentrated
    ? `Your vocal energy gathered strongly around ${noteMeaning(first?.note)}${second ? ` with a second layer of ${noteMeaning(second.note)}` : ""}. That suggests the scan was not evenly spread; certain parts of your system were speaking louder than others.`
    : `Your vocal energy was more spread out across the scan, which suggests a less narrowly concentrated state and more than one part of you participating in the result.`;
  const meaning = low?.score !== undefined && low.score < 35
    ? `The quieter area matters. When ${softName(low.title)} drops that low, the reading should not only look at what is active; it should also consider what needs care before the system can feel fully steady.`
    : "The report is reading the relationship between what is active, what is steady, and what is asking for more support.";

  return {
    story: [opening, signal, meaning],
    hiddenPatternTitle: concentrated ? "Concentrated Signal, Uneven Support" : "A Mixed System Looking for Coherence",
    hiddenPattern: concentrated
      ? "The hidden pattern is that one part of your system is speaking louder than the rest. The summary should follow that strongest signal while still noticing what is being pushed into the background."
      : "The hidden pattern is not a fixed label. It is the relationship between what is available, what is quieter, and how much support the scan suggests you need.",
    feelsLike: low?.title === "Connection & Support" || low?.title === "Communication & Clarity"
      ? "In daily life, this may feel like wanting to be understood while still filtering what you say, or needing support but not wanting to ask too directly."
      : "In daily life, this may feel like having one area that can keep going while another part of you needs more recovery, clarity, or support.",
    strength: top ? `Your strength in this scan is ${softName(top.title)}. That area remained the most available signal.` : "Your strength is that the scan produced a readable signal.",
    balancePoint: low ? `Your balance point is supporting ${softName(low.title)} with one small, clear action instead of pushing harder from the strongest part of you.` : "Your balance point is one small action that creates more steadiness.",
    cameraInsight,
  };
}

export default function ResonanceResultsDashboard({ report, hiddenNotes = [], onSelectStory, selectedStoryStyle = null }: ResonanceResultsDashboardProps) {
  const visibleEnergies = (report.evidence.noteEnergies ?? []).filter((entry) => !hiddenNotes.includes(entry.note));
  const domains = report.domainResults ?? [];
  const narrative = buildNarrative(report);

  return (
    <section className={styles.section}>
      <section className={styles.mapSection}><div className={styles.mapFrame}><NoteAuraMap noteEnergies={visibleEnergies} title="Your Resonance Map" /></div></section>
      <section className={styles.notesSection}>
        <div className={styles.notesHeader}><div><p className={styles.eyebrow}>Help Us Build SoulScope</p><h2 className={styles.mapTitle}>Choose the description that feels most like you</h2><p className={styles.lead}>Thanks for testing the app. Please choose the energy narrative that feels most accurate. Your choice helps us make SoulScope more personal, clear, and premium.</p></div></div>
        <div className={styles.topNotesGrid}>{report.storyCandidates.map((candidate) => { const isSelected = candidate.style === selectedStoryStyle; return <article key={candidate.style} className={styles.noteCard}><div className={styles.noteTop}><p className={styles.noteStatus}>{candidate.style}</p><button type="button" className={styles.breakdownButton} onClick={() => onSelectStory?.(candidate.style)} aria-pressed={isSelected}>{isSelected ? "Selected" : "This feels most accurate"}</button></div><h3 className={styles.noteName}>{candidate.title}</h3><p className={styles.noteTheme}>{candidate.summary}</p></article>; })}</div>
      </section>
      <section className={styles.heroCard}><div className={styles.heroCopy}><p className={styles.eyebrow}>Your Resonance Story</p>{narrative.story.map((line) => <p key={line} className={styles.noteText}>{line}</p>)}{narrative.cameraInsight ? <p className={styles.noteText}>{narrative.cameraInsight}</p> : null}</div></section>
      <section className={styles.patternStrip}><article className={styles.patternCard}><p className={styles.noteStatus}>Hidden Pattern</p><h3 className={styles.patternTitle}>{narrative.hiddenPatternTitle}</h3><p className={styles.patternTheme}>{narrative.hiddenPattern}</p></article><article className={styles.patternCard}><p className={styles.noteStatus}>What This May Feel Like</p><p className={styles.patternTheme}>{narrative.feelsLike}</p></article></section>
      <section className={styles.patternStrip}><article className={styles.patternCard}><p className={styles.noteStatus}>Your Strength</p><p className={styles.patternTheme}>{narrative.strength}</p></article><article className={styles.patternCard}><p className={styles.noteStatus}>Your Balance Point</p><p className={styles.patternTheme}>{narrative.balancePoint}</p></article></section>
      <details className={styles.technicalDetails}><summary className={styles.technicalSummary}>View Technical Analysis</summary><div className={styles.technicalBody}><p className={styles.technicalIntro}>The technical layer stays collapsed so the report remains centered on your lived experience.</p><div className={styles.technicalGrid}><article className={styles.technicalCard}><p className={styles.sectionLabel}>Primary Pattern</p><p className={styles.domainPattern}>{report.primaryPattern.name}</p><p className={styles.domainPattern}>Confidence {Math.round(report.primaryPattern.confidence * 100)}%</p></article><article className={styles.technicalCard}><p className={styles.sectionLabel}>Domain Model</p><ul className={styles.technicalList}>{domains.map((domain) => <li key={domain.title}>{domain.title}: {Math.round(domain.score)} ({domain.functionalState})</li>)}</ul></article></div></div></details>
    </section>
  );
}
