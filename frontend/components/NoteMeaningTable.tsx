import styles from "./NoteMeaningTable.module.css";
import { SOULSCOPE_NOTE_SYSTEM } from "../lib/noteSystem";

function LabeledList({
  label,
  items,
}: {
  label: string;
  items?: string[];
}) {
  if (!items?.length) return null;

  return (
    <div className={styles.group}>
      <p className={styles.groupLabel}>{label}</p>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={`${label}-${item}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default function NoteMeaningTable() {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Interpretive Overlay</p>
          <h2 className={styles.title}>Note meanings, body links, and compensatory patterns.</h2>
          <p className={styles.subtitle}>
            These are interpretive correlations used as a reflective layer on top of the measured voice
            data. They are not diagnostic facts. The table below combines emotional tone, physical
            correlates, and the physical-to-emotional compensation notes in the current SoulScope model.
          </p>
        </div>
      </div>

      <div className={styles.introCard}>
        <h3 className={styles.introTitle}>How are my emotions and sound related?</h3>
        <p className={styles.introText}>
          In the SoulScope model, every organ system and every emotion carries its own keynote frequency.
          Passing emotions and chronic emotional identities can both share energy with related body parts.
        </p>
        <p className={styles.introText}>
          When emotional function becomes inflamed or exaggerated, the related physical areas may also
          become inflamed or depressed because the energy flow is no longer balanced. When a person resists
          feeling, the related body area may compensate for that emotional absence.
        </p>
        <p className={styles.introText}>
          The reverse can also happen: when the physical aspect of a note is underactive, the emotional
          part of that same note may fuel it, temporarily keeping the system going while creating stress
          in the emotional layer.
        </p>
        <p className={styles.introText}>
          In some cases, physical distress in an organ or body part is effectively fueled by emotion. That
          physical-to-emotional and emotional-to-physical relationship is what the note table below is meant
          to highlight.
        </p>
      </div>

      <div className={styles.tableShell}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Note</th>
              <th>Balanced</th>
              <th>Underactive</th>
              <th>Overactive</th>
              <th>Physical correlates</th>
              <th>Support</th>
              <th>Case notes</th>
            </tr>
          </thead>
          <tbody>
            {SOULSCOPE_NOTE_SYSTEM.map((row) => (
              <tr key={row.note}>
                <td>{row.note}</td>
                <td>{row.emotionBalanced}</td>
                <td>{row.emotionUnderactive}</td>
                <td>{row.emotionOveractive}</td>
                <td>
                  <ul className={styles.list}>
                    {row.physicalCorrelates.map((item) => (
                      <li key={`${row.note}-physical-${item}`}>{item}</li>
                    ))}
                  </ul>
                </td>
                <td>{row.support}</td>
                <td>
                  <LabeledList label="Progression" items={row.progression} />
                  <LabeledList label="Notes" items={row.notes} />
                  <LabeledList label="Music" items={row.recommendedMusic} />
                  <LabeledList label="Nutrients" items={row.nutrients} />
                  <LabeledList label="Lifestyle" items={row.lifestyleSuggestions} />
                  <LabeledList label="Essential oils" items={row.essentialOils} />
                  <LabeledList label="Flower essences" items={row.flowerEssences} />
                  <LabeledList label="Foods" items={row.foods} />
                  <LabeledList label="Juices" items={row.juices} />
                  <LabeledList label="Overabundant / missing patterns" items={row.abundancePatterns} />
                  <LabeledList label="Symptoms" items={row.symptomPatterns} />
                  <LabeledList label="References" items={row.referenceLinks} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
