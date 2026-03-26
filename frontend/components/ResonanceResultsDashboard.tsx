import NoteAuraMap from "./NoteAuraMap";
import TonePlayer from "./TonePlayer";
import { getSoulScopeNoteColor, getSoulScopeNoteProfile } from "../lib/noteSystem";
import { getNoteBandConfig } from "../lib/noteBands";
import { type NoteEnergyResult } from "../lib/voiceSpectrum";
import styles from "./ResonanceResultsDashboard.module.css";

type ResonanceResultsDashboardProps = {
  soulTone?: string | null;
  frequencyHz?: number | null;
  medianMidi?: number | null;
  noteEnergies?: NoteEnergyResult[];
};

type NoteSummary = {
  note: string;
  center: string;
  theme: string;
  interpretation: string;
};

const NOTE_SUMMARIES: NoteSummary[] = [
  {
    note: "C",
    center: "Root / Foundation",
    theme: "Stability, safety, grounding",
    interpretation: "This note reflects how steadily you hold yourself when life asks for presence and follow-through.",
  },
  {
    note: "C#",
    center: "Root / Sacral Bridge",
    theme: "Embodiment, sensitivity, responsiveness",
    interpretation: "This note speaks to how easily you stay connected to your body while remaining emotionally open.",
  },
  {
    note: "D",
    center: "Sacral",
    theme: "Movement, desire, momentum",
    interpretation: "This note reflects how naturally energy turns into action, creativity, and emotional flow.",
  },
  {
    note: "D#",
    center: "Sacral / Solar Bridge",
    theme: "Adaptability, breath, transition",
    interpretation: "This note shows how flexibly you move through change without tightening or losing your center.",
  },
  {
    note: "E",
    center: "Solar Plexus",
    theme: "Will, direction, self-trust",
    interpretation: "This note reflects how clearly your voice carries intention, agency, and personal direction.",
  },
  {
    note: "F",
    center: "Heart",
    theme: "Care, openness, emotional steadiness",
    interpretation: "This note points to how easily warmth, care, and emotional presence move through your expression.",
  },
  {
    note: "F#",
    center: "Heart / Throat Bridge",
    theme: "Alignment, truth, grounded clarity",
    interpretation: "This note suggests a voice that wants to align what you feel with what you say, without strain.",
  },
  {
    note: "G",
    center: "Throat",
    theme: "Communication, expression, release",
    interpretation: "This note reflects how directly and cleanly your voice expresses what matters.",
  },
  {
    note: "G#",
    center: "Throat / Insight Bridge",
    theme: "Inner pressure, expression, emotional release",
    interpretation: "This note often shows whether your expression feels free, held back, or pushed too hard.",
  },
  {
    note: "A",
    center: "Insight",
    theme: "Vision, intuition, perspective",
    interpretation: "This note reflects how your voice carries imagination, perspective, and future orientation.",
  },
  {
    note: "A#",
    center: "Insight / Crown Bridge",
    theme: "Meaning, integration, reflection",
    interpretation: "This note points to how experiences are processed into understanding and clear self-expression.",
  },
  {
    note: "B",
    center: "Crown",
    theme: "Awareness, perspective, completion",
    interpretation: "This note reflects spaciousness, synthesis, and how easily your voice lands with calm completion.",
  },
];

const MOCK_NOTE_ENERGIES: NoteEnergyResult[] = [
  { note: "C", score: 27.4, relativeEnergy: 0.274, status: "balanced" },
  { note: "C#", score: 23.1, relativeEnergy: 0.231, status: "underactive" },
  { note: "D", score: 28.3, relativeEnergy: 0.283, status: "balanced" },
  { note: "D#", score: 25.2, relativeEnergy: 0.252, status: "underactive" },
  { note: "E", score: 31.4, relativeEnergy: 0.314, status: "balanced" },
  { note: "F", score: 32.1, relativeEnergy: 0.321, status: "balanced" },
  { note: "F#", score: 36.8, relativeEnergy: 0.368, status: "overactive" },
  { note: "G", score: 29.6, relativeEnergy: 0.296, status: "balanced" },
  { note: "G#", score: 21.8, relativeEnergy: 0.218, status: "underactive" },
  { note: "A", score: 30.4, relativeEnergy: 0.304, status: "balanced" },
  { note: "A#", score: 26.7, relativeEnergy: 0.267, status: "balanced" },
  { note: "B", score: 24.6, relativeEnergy: 0.246, status: "underactive" },
];

function getExpressionLabel(status: NoteEnergyResult["status"]) {
  if (status === "overactive") return "Under Stress";
  if (status === "underactive") return "Underexpressed";
  return "Balanced";
}

function getExpressionCorrelation(note: string, status: NoteEnergyResult["status"]) {
  const profile = getSoulScopeNoteProfile(note);

  if (status === "underactive") {
    return `Underexpression in this note may correlate with ${profile.emotionUnderactive.replace(/^May correlate with /i, "")}`;
  }

  if (status === "overactive") {
    return `Stress in this note may correlate with ${profile.emotionOveractive.replace(/^May correlate with /i, "")}`;
  }

  return `When balanced, this note tends to support ${profile.emotionBalanced.charAt(0).toLowerCase()}${profile.emotionBalanced.slice(1)}`;
}

const WHITE_NOTES = ["C", "D", "E", "F", "G", "A", "B"];
const BLACK_KEYS = [
  { note: "C#", x: 40 },
  { note: "D#", x: 92 },
  { note: "F#", x: 196 },
  { note: "G#", x: 248 },
  { note: "A#", x: 300 },
];

function noteToOctave(frequencyHz: number) {
  const midi = 69 + 12 * Math.log2(Math.max(frequencyHz, 1e-6) / 440);
  return Math.floor(Math.round(midi) / 12) - 1;
}

export default function ResonanceResultsDashboard({
  soulTone = "F#",
  frequencyHz,
  medianMidi,
  noteEnergies,
}: ResonanceResultsDashboardProps) {
  const energies = noteEnergies?.length ? noteEnergies : MOCK_NOTE_ENERGIES;
  const accent = getSoulScopeNoteColor(soulTone);
  const octave =
    frequencyHz && medianMidi !== null && medianMidi !== undefined
      ? Math.floor(Math.round(medianMidi) / 12) - 1
      : frequencyHz
      ? noteToOctave(frequencyHz)
      : null;
  const toneLabel = octave !== null ? `${soulTone}${octave}` : soulTone;
  const isSharp = soulTone.includes("#");

  return (
    <section className={styles.section}>
      <article className={styles.heroCard} style={{ "--accent": accent } as React.CSSProperties}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Results</p>
          <h2 className={styles.title}>
            Your Soul Tone: {toneLabel}
            {frequencyHz ? ` ${frequencyHz.toFixed(1)} Hz` : ""}
          </h2>
          <p className={styles.lead}>
            Use this tone to help bring your system back toward balance and grounding. Listening to
            singing bowls, crystal bowls, or music centered on this note can help, but humming or
            chanting the tone yourself is often the stronger way to bring your body into resonance with it.
          </p>
          {frequencyHz ? (
            <div className={styles.toneAction}>
              <TonePlayer frequency={frequencyHz} label="Hear Your Soul Tone" />
            </div>
          ) : null}
        </div>

        <div className={styles.keyboardPanel}>
          <div className={styles.keyboardWrap}>
            <svg viewBox="0 0 364 180" className={styles.keyboard} aria-hidden="true">
              {WHITE_NOTES.map((whiteNote, index) => {
                const x = index * 52;
                const active = !isSharp && soulTone === whiteNote;
                return (
                  <g key={whiteNote}>
                    <rect
                      x={x}
                      y={0}
                      width={52}
                      height={180}
                      rx={8}
                      fill={active ? accent : "#f8fafc"}
                      fillOpacity={active ? 0.92 : 1}
                      stroke="#0f172a"
                      strokeWidth={2}
                    />
                    <text
                      x={x + 26}
                      y={150}
                      textAnchor="middle"
                      className={styles.whiteLabel}
                      fill={active ? "#081120" : "#0f172a"}
                    >
                      {whiteNote}
                    </text>
                  </g>
                );
              })}
              {BLACK_KEYS.map((key) => {
                const active = soulTone === key.note;
                return (
                  <g key={key.note}>
                    <rect
                      x={key.x}
                      y={0}
                      width={32}
                      height={108}
                      rx={7}
                      fill={active ? accent : "#020617"}
                      stroke={active ? "#e2e8f0" : "#0f172a"}
                      strokeWidth={2}
                    />
                    <text
                      x={key.x + 16}
                      y={76}
                      textAnchor="middle"
                      className={styles.blackLabel}
                    >
                      {key.note}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </article>

      <section className={styles.mapSection}>
        <div className={styles.mapHeader}>
          <div>
            <p className={styles.eyebrow}>Your Voice Mandala</p>
            <h3 className={styles.mapTitle}>How your notes are being expressed right now.</h3>
          </div>
        </div>

        <div className={styles.mapFrame}>
          <NoteAuraMap
            noteEnergies={energies}
            title="Your Voice Mandala"
            subtitle="The center ring marks the balanced zone. Notes extending past it are carrying extra load; shorter notes may be asking for more support."
          />
        </div>
      </section>

      <section className={styles.notesSection}>
        <div className={styles.notesHeader}>
          <p className={styles.eyebrow}>Note Key</p>
          <h3 className={styles.mapTitle}>A note-by-note view of your profile.</h3>
        </div>

        <div className={styles.noteGrid}>
          {NOTE_SUMMARIES.map((entry) => {
            const energy = energies.find((item) => item.note === entry.note) ?? MOCK_NOTE_ENERGIES[0];
            const accent =
              entry.note === "B"
                ? "#ffffff"
                : entry.note === "A"
                ? "#c084fc"
                : getSoulScopeNoteColor(entry.note);
            const bandConfig = getNoteBandConfig(entry.note);
            return (
              <article key={entry.note} className={styles.noteCard} style={{ "--accent": accent } as React.CSSProperties}>
                <div className={styles.noteTop}>
                  <div>
                    <span className={styles.noteName}>{entry.note}</span>
                    {bandConfig?.frequencyLabel ? (
                      <p className={styles.noteFrequency}>{bandConfig.frequencyLabel}</p>
                    ) : null}
                  </div>
                  <span className={styles.noteStatus}>{getExpressionLabel(energy.status)}</span>
                </div>
                <p className={styles.noteCenter}>{entry.center}</p>
                <p className={styles.noteTheme}>Theme: {entry.theme}</p>
                <p className={styles.noteExpression}>Your Expression: {getExpressionLabel(energy.status)}</p>
                <p className={styles.noteText}>
                  {entry.interpretation} {getExpressionCorrelation(entry.note, energy.status)}.
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <p className={styles.reassurance}>
        These patterns aren&apos;t permanent. They reflect how your system is currently operating and can shift with the right input.
      </p>
    </section>
  );
}
