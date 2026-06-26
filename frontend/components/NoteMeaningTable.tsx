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
          <h2 className={styles.title}>Experience meanings, body links, and compensatory patterns.</h2>
          <p className={styles.subtitle}>
            These correlations are a support layer on top of the measured voice data. They are not
            diagnostic facts. The table below keeps the note source visible, but the lived experience is
            the primary language.
          </p>
        </div>
      </div>

      <div className={styles.introCard}>
        <h3 className={styles.introTitle}>How does this show up in daily life?</h3>
        <p className={styles.introText}>
          In the SoulScope model, certain voice patterns may correlate with how people feel, function, and
          recover in everyday life.
        </p>
        <p className={styles.introText}>
          When pressure builds, the related physical and emotional themes may feel more demanding.
          When support is missing, the system may compensate in other areas.
        </p>
        <p className={styles.introText}>
          The reverse can also happen: a system may keep moving by borrowing energy from somewhere else,
          which can look productive on the outside while feeling costly underneath.
        </p>
        <p className={styles.introText}>
          The table below is meant to highlight those experience patterns, with the note source visible as
          supporting information.
        </p>
      </div>

      <div className={styles.tableShell}>
        <table className={styles.table}>
          <thead>
              <tr>
                <th>Note</th>
                <th>Current observation</th>
                <th>What this often looks like</th>
                <th>Supporting evidence</th>
                <th>What may help</th>
              </tr>
            </thead>
            <tbody>
              {SOULSCOPE_NOTE_SYSTEM.map((row) => (
                <tr key={row.note}>
                <td>
                  <div className={styles.noteCell}>
                    <span className={styles.noteBadge}>{row.note}</span>
                  </div>
                </td>
                <td>
                  <div className={styles.group}>
                    <p className={styles.groupLabel}>When this is balanced</p>
                    <p className={styles.copy}>{row.emotionBalanced}</p>
                  </div>
                  <div className={styles.group}>
                    <p className={styles.groupLabel}>Needs More Support</p>
                    <p className={styles.copy}>{row.emotionUnderactive}</p>
                  </div>
                  <div className={styles.group}>
                    <p className={styles.groupLabel}>Under Greater Demand</p>
                    <p className={styles.copy}>{row.emotionOveractive}</p>
                  </div>
                </td>
                <td>
                  <LabeledList label="Current body links" items={row.physicalCorrelates} />
                  <LabeledList label="Pattern progression" items={row.progression} />
                </td>
                <td>
                  <LabeledList label="Common lived experiences" items={row.symptomPatterns} />
                  <LabeledList label="Pattern clues" items={row.abundancePatterns} />
                </td>
                <td>
                  <p className={styles.copy}>{row.support}</p>
                  <LabeledList label="Pattern progression" items={row.progression} />
                  <LabeledList label="Notes" items={row.notes} />
                  <LabeledList label="Music" items={row.recommendedMusic} />
                  <LabeledList label="Nutrients" items={row.nutrients} />
                  <LabeledList label="Lifestyle" items={row.lifestyleSuggestions} />
                  <LabeledList label="Essential oils" items={row.essentialOils} />
                  <LabeledList label="Flower essences" items={row.flowerEssences} />
                  <LabeledList label="Foods" items={row.foods} />
                  <LabeledList label="Juices" items={row.juices} />
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
