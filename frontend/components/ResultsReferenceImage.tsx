import Image from "next/image";
import { type SpectrumBandResult } from "../lib/voiceSpectrum";
import styles from "./ResultsReferenceImage.module.css";

type ResultsReferenceImageProps = {
  bands: SpectrumBandResult[];
  title?: string;
  subtitle?: string;
};

function hzToNoteName(hz: number) {
  if (!hz || hz <= 0) return "";
  const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const midi = Math.round(69 + 12 * Math.log2(hz / 440));
  const note = noteNames[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${note}${octave}`;
}

function getToneClass(status: SpectrumBandResult["status"]) {
  if (status === "dominant") return styles.primary;
  if (status === "underrepresented") return styles.deficient;
  if (status === "overrepresented") return styles.excess;
  return styles.balanced;
}

export default function ResultsReferenceImage({
  bands,
  title = "Frequency note reference",
  subtitle = "Measured bands are mapped here against their approximate musical note regions.",
}: ResultsReferenceImageProps) {
  if (!bands.length) return null;

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Reference Visual</p>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
      </div>

      <div className={styles.frame}>
        <div className={styles.imageShell}>
          <Image
            src="/soulscopetonevisual.png"
            alt="SoulScope frequency and tone reference visual"
            width={1200}
            height={1200}
            className={styles.image}
          />
          <div className={styles.imageOverlay} />
        </div>

        <div className={styles.bandRail}>
          {bands.map((band) => (
            <article key={band.key} className={`${styles.bandCard} ${getToneClass(band.status)}`}>
              <div className={styles.bandTop}>
                <h3 className={styles.bandTitle}>{band.label}</h3>
                <span className={styles.bandStatus}>{band.status.replace("represented", "").replace("under", "deficient").replace("over", "excess")}</span>
              </div>
              <p className={styles.bandMeta}>
                {band.frequencyLabel ?? `${band.rangeHz[0]}-${band.rangeHz[1]} Hz`}
              </p>
              <p className={styles.bandMeta}>
                {hzToNoteName(band.rangeHz[0])} to {hzToNoteName(band.rangeHz[1])}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
