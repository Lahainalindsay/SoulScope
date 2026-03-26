import { getSoulScopeNoteColor } from "../lib/noteSystem";
import styles from "./PitchReferenceCard.module.css";

type PitchReferenceCardProps = {
  note?: string | null;
  frequencyHz?: number | null;
  medianMidi?: number | null;
};

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

function nextOctaveFrequency(frequencyHz: number) {
  return Math.round(frequencyHz * 2 * 100) / 100;
}

export default function PitchReferenceCard({
  note,
  frequencyHz,
  medianMidi,
}: PitchReferenceCardProps) {
  if (!note || !frequencyHz) {
    return null;
  }

  const octave = medianMidi !== null && medianMidi !== undefined
    ? Math.floor(Math.round(medianMidi) / 12) - 1
    : noteToOctave(frequencyHz);
  const noteWithOctave = `${note}${octave}`;
  const accent = getSoulScopeNoteColor(note);
  const highlightedWhiteIndex = WHITE_NOTES.indexOf(note.replace("#", ""));
  const isSharp = note.includes("#");

  return (
    <section className={styles.card} style={{ "--accent": accent } as React.CSSProperties}>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>Pitch Reference</p>
        <h2 className={styles.title}>
          {noteWithOctave} at {frequencyHz.toFixed(1)} Hz
        </h2>
        <p className={styles.lead}>
          The letter tells you the note family. The number tells you the octave or register. Each
          time the octave number goes up, the frequency doubles. So if your center is {noteWithOctave} at{" "}
          {frequencyHz.toFixed(1)} Hz, the same note one octave up would be about{" "}
          {nextOctaveFrequency(frequencyHz).toFixed(2)} Hz.
        </p>
      </div>

      <div className={styles.visual}>
        <div className={styles.keyboardWrap}>
          <svg viewBox="0 0 364 180" className={styles.keyboard} aria-hidden="true">
            {WHITE_NOTES.map((whiteNote, index) => {
              const x = index * 52;
              const active = !isSharp && note === whiteNote;
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
              const active = note === key.note;
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

        <div className={styles.meta}>
          <span className={styles.metaPill}>Core note {noteWithOctave}</span>
          <span className={styles.metaPill}>Measured center {frequencyHz.toFixed(1)} Hz</span>
          <span className={styles.metaPill}>Octave {octave}</span>
        </div>
      </div>
    </section>
  );
}
