import { getSoulScopeNoteColor } from "../lib/noteSystem";
import { getNoteDiscoveryProfile, getUniqueDiscoveryProfiles } from "../lib/noteDiscovery";
import styles from "./NoteDiscoveryGuide.module.css";

type NoteDiscoveryGuideProps = {
  coreNote?: string | null;
  underactiveNotes: string[];
  overactiveNotes: string[];
};

function DiscoveryCard({
  note,
  variant,
}: {
  note: string;
  variant: "underactive" | "overactive";
}) {
  const profile = getNoteDiscoveryProfile(note);
  const accent = getSoulScopeNoteColor(note);
  const physical = variant === "underactive" ? profile.underactivePhysical : profile.overactivePhysical;
  const emotional = variant === "underactive" ? profile.underactiveEmotional : profile.overactiveEmotional;

  return (
    <article className={styles.noteCard}>
      <div className={styles.noteHeader}>
        <span className={styles.miniBadge} style={{ background: accent }}>
          {note}
        </span>
        <div>
          <p className={styles.cardEyebrow}>{variant === "underactive" ? "Underused note" : "Overused note"}</p>
          <h3 className={styles.cardTitle}>{profile.chakra}</h3>
        </div>
      </div>
      <p className={styles.cardSub}>
        Organs: {profile.internalOrgans.join(", ")}. Senses: {profile.senseOrgans.join(", ")}.
      </p>
      <div className={styles.lists}>
        <div>
          <p className={styles.groupLabel}>Physical Effects</p>
          <ul className={styles.list}>
            {physical.map((item) => (
              <li key={`${note}-physical-${item}`}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className={styles.groupLabel}>Emotional Effects</p>
          <ul className={styles.list}>
            {emotional.map((item) => (
              <li key={`${note}-emotional-${item}`}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}

export default function NoteDiscoveryGuide({
  coreNote,
  underactiveNotes,
  overactiveNotes,
}: NoteDiscoveryGuideProps) {
  if (!coreNote) {
    return null;
  }

  const core = getNoteDiscoveryProfile(coreNote);
  const accent = getSoulScopeNoteColor(coreNote);
  const underactive = getUniqueDiscoveryProfiles(underactiveNotes).slice(0, 2);
  const overactive = getUniqueDiscoveryProfiles(overactiveNotes).slice(0, 2);

  return (
    <section className={styles.section}>
      <p className={styles.eyebrow}>Self Discovery</p>
      <h2 className={styles.title}>Your core note, body signals, and emotional patterning.</h2>
      <p className={styles.lead}>
        This section turns the scan into a human-readable note map: your core note, the organs and
        senses tied to it, and the physical and emotional effects that can show up when neighboring
        notes are underused or overused.
      </p>

      <article className={styles.coreCard}>
        <div className={styles.coreTop}>
          <div>
            <span className={styles.noteBadge} style={{ background: accent }}>
              {core.note}
            </span>
            <h3 className={styles.coreNoteTitle}>
              Core note {core.note}: {core.chakra}
            </h3>
            <p className={styles.theme}>{core.emotionalTheme}</p>
          </div>
          <div className={styles.chipRow}>
            <span className={styles.chip}>{core.colorName}</span>
            {core.internalOrgans.map((item) => (
              <span key={`${core.note}-organ-${item}`} className={styles.chip}>
                {item}
              </span>
            ))}
            {core.senseOrgans.map((item) => (
              <span key={`${core.note}-sense-${item}`} className={styles.chip}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </article>

      <div className={styles.grid}>
        {underactive.map((item) => (
          <DiscoveryCard key={`under-${item.note}`} note={item.note} variant="underactive" />
        ))}
        {overactive.map((item) => (
          <DiscoveryCard key={`over-${item.note}`} note={item.note} variant="overactive" />
        ))}
      </div>
    </section>
  );
}
