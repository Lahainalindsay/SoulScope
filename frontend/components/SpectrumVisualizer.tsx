import { type SpectrumBandResult } from "../lib/voiceSpectrum";
import styles from "./SpectrumVisualizer.module.css";

type SpectrumVisualizerProps = {
  bands: SpectrumBandResult[];
  title?: string;
  subtitle?: string;
};

function getBandMeta(status: SpectrumBandResult["status"]) {
  if (status === "underrepresented") {
    return {
      label: "Deficient",
      badgeClass: styles.badgeDeficient,
      fillClass: styles.fillDeficient,
      cardClass: styles.bandDeficient,
    };
  }

  if (status === "overrepresented") {
    return {
      label: "Excess",
      badgeClass: styles.badgeExcess,
      fillClass: styles.fillExcess,
      cardClass: styles.bandExcess,
    };
  }

  if (status === "dominant") {
    return {
      label: "Primary",
      badgeClass: styles.badgePrimary,
      fillClass: styles.fillPrimary,
      cardClass: styles.bandPrimary,
    };
  }

  return {
    label: "Balanced",
    badgeClass: styles.badgeBalanced,
    fillClass: styles.fillBalanced,
    cardClass: styles.bandBalanced,
  };
}

export default function SpectrumVisualizer({
  bands,
  title = "Voice spectrum map",
  subtitle = "Measured energy distribution across the 12 equal-tempered note classes in the speaking range.",
}: SpectrumVisualizerProps) {
  if (!bands.length) return null;

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Primary Visual</p>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>

        <div className={styles.legend}>
          <span className={`${styles.legendPill} ${styles.badgePrimary}`}>Primary</span>
          <span className={`${styles.legendPill} ${styles.badgeBalanced}`}>Balanced</span>
          <span className={`${styles.legendPill} ${styles.badgeDeficient}`}>Deficient</span>
          <span className={`${styles.legendPill} ${styles.badgeExcess}`}>Excess</span>
        </div>
      </div>

      <div className={styles.bandList}>
        {bands.map((band) => {
          const meta = getBandMeta(band.status);
          const pct = Math.max(8, Math.round(band.relativeEnergy * 100));

          return (
            <article key={band.key} className={`${styles.bandCard} ${meta.cardClass}`}>
              <div className={styles.bandTop}>
                <div>
                  <h3 className={styles.bandTitle}>{band.label}</h3>
                  <p className={styles.bandRange}>
                    {band.frequencyLabel ?? `${band.rangeHz[0]}-${band.rangeHz[1]} Hz`}
                  </p>
                </div>
                <div className={styles.bandMeta}>
                  <span className={styles.bandPercent}>{pct}%</span>
                  <span className={`${styles.bandBadge} ${meta.badgeClass}`}>{meta.label}</span>
                </div>
              </div>

              <div className={styles.barTrack}>
                <div className={`${styles.barFill} ${meta.fillClass}`} style={{ width: `${pct}%` }} />
              </div>

              <div className={styles.bandBody}>
                <p className={styles.bandText}>{band.note}</p>
                {band.interpretiveChakra ? (
                  <p className={styles.bandHint}>
                    <strong>Chakra overlay:</strong> {band.interpretiveChakra}
                  </p>
                ) : null}
                <p className={styles.bandHint}>
                  <strong>Practice:</strong> {band.practice}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
