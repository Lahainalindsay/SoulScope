import { type NoteEnergyResult } from "../lib/voiceSpectrum";
import { NOTE_ORDER, getSoulScopeNoteColor } from "../lib/noteSystem";
import styles from "./NoteAuraMap.module.css";

type NoteAuraMapProps = {
  noteEnergies: NoteEnergyResult[];
  title?: string;
  subtitle?: string;
};

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const angle = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

export default function NoteAuraMap({
  noteEnergies,
  title = "Your Voice Mandala",
  subtitle = "The composite score totals 360. A perfectly balanced voice would land at 30 points per note, with shorter rays for underactive notes and longer rays for overloaded ones.",
}: NoteAuraMapProps) {
  if (!noteEnergies.length) return null;

  const orderedEnergies = [...noteEnergies].sort(
    (a, b) => NOTE_ORDER.indexOf(a.note as (typeof NOTE_ORDER)[number]) - NOTE_ORDER.indexOf(b.note as (typeof NOTE_ORDER)[number])
  );
  const maxScore = Math.max(...noteEnergies.map((entry) => entry.score), 30);
  const size = 620;
  const center = size / 2;
  const innerRadius = 112;
  const targetRadius = 108;
  const maxBarLength = 164;
  const rotationOffset = 180;

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Primary Healing Visual</p>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
      </div>

      <div className={styles.frame}>
        <div className={styles.visualShell}>
          <div className={styles.imageGlow} />
          <div className={styles.imageLayer} />
          <svg viewBox={`0 0 ${size} ${size}`} className={styles.svg} aria-hidden="true">
            <circle cx={center} cy={center} r={150} className={styles.outerRing} />
            <circle cx={center} cy={center} r={112} className={styles.midRing} />
            <circle cx={center} cy={center} r={innerRadius + targetRadius} className={styles.targetRing} />

            {orderedEnergies.map((entry, index) => {
              const angle = rotationOffset + (360 / noteEnergies.length) * index;
              const barLength = Math.max(18, (entry.score / maxScore) * maxBarLength);
              const start = polarToCartesian(center, center, innerRadius, angle);
              const end = polarToCartesian(center, center, innerRadius + barLength, angle);
              const labelPoint = polarToCartesian(center, center, innerRadius + barLength + 22, angle);
              const noteColor =
                entry.note === "B"
                  ? "#ffffff"
                  : entry.note === "A#"
                  ? "#c084fc"
                  : getSoulScopeNoteColor(entry.note);

              return (
                <g key={entry.note}>
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke={noteColor}
                    strokeOpacity="0.24"
                    strokeWidth={(entry.status === "overactive" ? 12 : entry.status === "underactive" ? 6 : 8) + 8}
                    strokeLinecap="round"
                    className={styles.barGlow}
                  />
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke={noteColor}
                    strokeWidth={entry.status === "overactive" ? 12 : entry.status === "underactive" ? 6 : 8}
                    strokeLinecap="round"
                    className={styles.bar}
                  />
                  <circle
                    cx={end.x}
                    cy={end.y}
                    r={entry.status === "overactive" ? 5 : 3.5}
                    fill={noteColor}
                  />
                  <text
                    x={labelPoint.x}
                    y={labelPoint.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className={styles.noteLabel}
                    fill={noteColor}
                  >
                    {entry.note}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </section>
  );
}
