import { getSoulScopeNoteColor } from "../lib/noteSystem";
import { getResonanceSystemLabel } from "../lib/resonanceLanguage";
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
        <p className={styles.eyebrow}>Core Resonance Reference</p>
        <h2 className={styles.title}>
          {getResonanceSystemLabel(note)}
        </h2>
        <p className={styles.lead}>
          The note remains visible as an internal organizing marker, while the human-system meaning
          stays primary. This signal may indicate which pattern is most available in the current
          Resonance Profile.
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
          <span className={styles.metaPill}>Core Resonance {getResonanceSystemLabel(note)}</span>
          <span className={styles.metaPill}>Internal note marker {noteWithOctave}</span>
          <span className={styles.metaPill}>Octave {octave}</span>
        </div>
      </div>
    </section>
  );
}
