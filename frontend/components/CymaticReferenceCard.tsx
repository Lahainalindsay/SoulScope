import Image from "next/image";
import { type CymaticReference } from "../lib/cymatics";
import { getSoulScopeNoteColor, getSoulScopeNoteProfile } from "../lib/noteSystem";
import styles from "./CymaticReferenceCard.module.css";

type CymaticReferenceCardProps = {
  reference?: CymaticReference | null;
};

export default function CymaticReferenceCard({ reference }: CymaticReferenceCardProps) {
  if (!reference) {
    return null;
  }

  const hasImage = Boolean(reference.imagePath);
  const isMapped = reference.status === "mapped" && hasImage;
  const isMasterChart = reference.status === "master-chart" && hasImage;
  const profile = getSoulScopeNoteProfile(reference.note);
  const accentColor = getSoulScopeNoteColor(reference.note);
  const descriptor = isMapped
    ? "Note-specific cymatic geometry"
    : isMasterChart
    ? "Master chart reference"
    : "Saved cymatic placeholder";

  return (
    <section className={styles.card} style={{ "--accent": accentColor } as React.CSSProperties}>
      <div className={styles.glow} />
      <div className={styles.grid}>
        <div className={styles.copyCol}>
          <p className={styles.eyebrow}>Cymatic Signature</p>
          <h2 className={styles.title}>{reference.note} resonance geometry</h2>
          <p className={styles.lead}>
            {isMapped
              ? `This result is now linked to a dedicated cymatic image for ${reference.note}, so the tonal readout and the visual geometry are aligned in the same note family.`
              : isMasterChart
              ? `This result is using the clean master cymatic chart as its visual reference. A standalone cymatic capture for ${reference.note} is not locked yet, so the app avoids showing a synthetic split image.`
              : "The dominant note has been saved for cymatic linking, but the visual asset still needs a final mapping pass."}
          </p>

          <div className={styles.noteRow}>
            <div className={styles.notePill}>{reference.note}</div>
            <div className={styles.noteMeta}>
              <span className={styles.metaLabel}>{descriptor}</span>
              <strong className={styles.metaValue}>Opposite note {profile.opposite}</strong>
            </div>
          </div>

          <div className={styles.chips}>
            <span className={styles.chip}>{profile.activatingOrCalming}</span>
            <span className={styles.chip}>{reference.availableSourceAssetCount} source captures archived</span>
          </div>

          <p className={styles.support}>
            {profile.support}
          </p>
        </div>

        <div className={styles.visualCol}>
          <div className={styles.visualFrame}>
            {hasImage ? (
              <div className={styles.imageWrap}>
                <Image
                  src={reference.imagePath!}
                  alt={
                    isMasterChart
                      ? `${reference.note} cymatic master note chart`
                      : `${reference.note} cymatic reference`
                  }
                  width={720}
                  height={720}
                  className={styles.image}
                />
              </div>
            ) : null}
            <div className={styles.visualCaption}>
              <span className={styles.captionLabel}>Visual anchor</span>
              <strong className={styles.captionValue}>{reference.note}</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
