import Image from "next/image";
import styles from "./NoteFrequencyTable.module.css";

type NoteRow = {
  note: string;
  c3: string;
  c4: string;
  c5: string;
};

type TcmOrganToneRow = {
  organ: string;
  element: string;
  tone: string;
  frequency: string;
  note: string;
};

type BodyResonanceRow = {
  bodyPart: string;
  range: string;
};

type ChakraSenseRow = {
  center: string;
  note: string;
  association: string;
};

type OrganFrequencyRow = {
  organ: string;
  frequency: string;
  note: string;
};

type ChakraHarmonicRow = {
  chakra: string;
  note: string;
  frequency: string;
  gland: string;
};

type ChakraColorRow = {
  note: string;
  color: string;
  center: string;
  association: string;
};

type SingingBowlRow = {
  note: string;
  chakra: string;
  themes: string;
  bodyAreas: string;
  use: string;
};

type BodySoundRow = {
  organAssociation: string;
  musicalNote: string;
  resonantNote: string;
  frequency: string;
};

const NOTE_ROWS: NoteRow[] = [
  { note: "C", c3: "130.81 Hz", c4: "261.63 Hz", c5: "523.25 Hz" },
  { note: "C#", c3: "138.59 Hz", c4: "277.18 Hz", c5: "554.37 Hz" },
  { note: "D", c3: "146.83 Hz", c4: "293.66 Hz", c5: "587.33 Hz" },
  { note: "D#", c3: "155.56 Hz", c4: "311.13 Hz", c5: "622.25 Hz" },
  { note: "E", c3: "164.81 Hz", c4: "329.63 Hz", c5: "659.25 Hz" },
  { note: "F", c3: "174.61 Hz", c4: "349.23 Hz", c5: "698.46 Hz" },
  { note: "F#", c3: "185.00 Hz", c4: "369.99 Hz", c5: "739.99 Hz" },
  { note: "G", c3: "196.00 Hz", c4: "392.00 Hz", c5: "783.99 Hz" },
  { note: "G#", c3: "207.65 Hz", c4: "415.30 Hz", c5: "830.61 Hz" },
  { note: "A", c3: "220.00 Hz", c4: "440.00 Hz", c5: "880.00 Hz" },
  { note: "A#", c3: "233.08 Hz", c4: "466.16 Hz", c5: "932.33 Hz" },
  { note: "B", c3: "246.94 Hz", c4: "493.88 Hz", c5: "987.77 Hz" },
];

const TCM_ORGAN_TONE_ROWS: TcmOrganToneRow[] = [
  { organ: "Spleen", element: "Earth", tone: "Gung", frequency: "261.6 Hz", note: "C" },
  { organ: "Lung", element: "Metal", tone: "Shang", frequency: "293.7 Hz", note: "D" },
  { organ: "Liver", element: "Wood", tone: "Jue / Gak", frequency: "329.6 Hz", note: "E" },
  { organ: "Heart", element: "Fire", tone: "Chi", frequency: "392.0 Hz", note: "G" },
  { organ: "Kidney", element: "Water", tone: "Yu", frequency: "440.0 Hz", note: "A" },
];

const BODY_RESONANCE_ROWS: BodyResonanceRow[] = [
  { bodyPart: "Limbs", range: "2-5 Hz" },
  { bodyPart: "Chest", range: "2-12 Hz" },
  { bodyPart: "Lumbar spine", range: "4-14 Hz" },
  { bodyPart: "Abdominal cavity organs", range: "4-12 Hz" },
  { bodyPart: "Head / skull", range: "8-27 Hz" },
  { bodyPart: "Throat", range: "6-27 Hz" },
];

const CHAKRA_SENSE_ROWS: ChakraSenseRow[] = [
  { center: "Root (base of spine)", note: "C", association: "Grounding" },
  { center: "Sacral (lower abdomen)", note: "D", association: "Sensuality / Emotion" },
  { center: "Solar plexus (upper abdomen)", note: "E", association: "Sight / Willpower" },
  { center: "Heart (chest)", note: "F", association: "Touch" },
  { center: "Throat", note: "G", association: "Hearing" },
  { center: "Third Eye (forehead)", note: "A", association: "Intuition / Sight" },
  { center: "Crown (top of head)", note: "B", association: "Understanding" },
];

const ORGAN_FREQUENCY_ROWS: OrganFrequencyRow[] = [
  { organ: "Blood", frequency: "321.9 Hz", note: "E" },
  { organ: "Adrenals", frequency: "492.8 Hz", note: "B" },
  { organ: "Kidneys", frequency: "319.88 Hz", note: "Eb" },
  { organ: "Liver", frequency: "317.83 Hz", note: "Eb" },
  { organ: "Bladder", frequency: "352 Hz", note: "F" },
  { organ: "Intestines", frequency: "281 Hz", note: "C#" },
  { organ: "Lungs", frequency: "220 Hz", note: "A" },
  { organ: "Colon", frequency: "176 Hz", note: "F" },
  { organ: "Gall bladder", frequency: "164.3 Hz", note: "E" },
  { organ: "Pancreas", frequency: "117.3 Hz", note: "C#" },
  { organ: "Stomach", frequency: "110 Hz", note: "A" },
  { organ: "Brain", frequency: "315.8 Hz", note: "Eb" },
  { organ: "Fat cells", frequency: "295.8 Hz", note: "C#" },
  { organ: "Muscle cells", frequency: "324 Hz", note: "E" },
];

const SWARASAN_HARMONIC_ROWS: ChakraHarmonicRow[] = [
  { chakra: "Root", note: "C", frequency: "256 Hz", gland: "Adrenal" },
  { chakra: "Sacral", note: "D", frequency: "288 Hz", gland: "Gonads" },
  { chakra: "Solar Plexus", note: "E", frequency: "320 Hz", gland: "Pancreas" },
  { chakra: "Heart", note: "F", frequency: "341.3 Hz", gland: "Thymus" },
  { chakra: "Throat", note: "G", frequency: "384 Hz", gland: "Thyroid" },
  { chakra: "3rd Eye", note: "A", frequency: "426.7 Hz", gland: "Pituitary" },
  { chakra: "Crown", note: "B", frequency: "480 Hz", gland: "Pineal" },
];

const CHAKRA_COLOR_ROWS: ChakraColorRow[] = [
  {
    note: "C",
    color: "Red",
    center: "Root chakra",
    association: "Survival, ambition, and grounding physical energy.",
  },
  {
    note: "D",
    color: "Orange",
    center: "Sacral chakra",
    association: "Creativity, sensual and sexual energy, and relationships.",
  },
  {
    note: "E",
    color: "Yellow",
    center: "Solar plexus / fire chakra",
    association: "Physical energy, traveling, personal power, and emotions.",
  },
  {
    note: "F",
    color: "Green",
    center: "Heart chakra",
    association: "Compassion, understanding, love, and healing.",
  },
  {
    note: "G",
    color: "Blue",
    center: "Throat chakra",
    association: "Communication, speaking one's truth, and clairaudience.",
  },
  {
    note: "A",
    color: "Indigo / Purple",
    center: "Brow / third eye chakra",
    association: "Clairvoyance, intuition, understanding, and inner vision.",
  },
  {
    note: "B",
    color: "Violet / White",
    center: "Crown chakra",
    association: "Spirituality, meditation, and cosmic awareness.",
  },
];

const SINGING_BOWL_ROWS: SingingBowlRow[] = [
  {
    note: "C",
    chakra: "Root chakra",
    themes: "Survival, aspiration, grounding, centering, fight-or-flight balancing, Mother Earth attunement, physical existence, culture, birthplace, and past-life influence.",
    bodyAreas: "Base of spine / Root center",
    use: "Used to anchor energy, attune to Mother Earth and Source, and support usable physical energy.",
  },
  {
    note: "D",
    chakra: "Sacral chakra",
    themes: "Life action, creativity, emotional expression, karma, clairsentience, sexuality, creation, empathy, and bliss.",
    bodyAreas: "Digestive tract, intestines, spleen",
    use: "Used to reduce fear around action, activate bliss, and support feeling, creation, and manifestation.",
  },
  {
    note: "D#",
    chakra: "Duality / diaphragm center",
    themes: "Dissolving fear and doubt, full-conscious breathing, and drawing in prana or life energy.",
    bodyAreas: "Diaphragm and breath-related center",
    use: "Used as a breath and prana support note in this source framing.",
  },
  {
    note: "E",
    chakra: "Solar plexus chakra",
    themes: "Intuitive and psychic work, purification of negative emotions, self-esteem, ego, personal power, safety, and release of manipulation or control.",
    bodyAreas: "Stomach, liver",
    use: "Used for purification, intuitive work, and stabilizing personal power.",
  },
  {
    note: "F",
    chakra: "Heart chakra",
    themes: "Pure thought, unconditional love, radiating love, transcendence of self, and revitalization.",
    bodyAreas: "Heart, lungs, chest, circulation, arms, hands",
    use: "Used to heal the heart and increase the love nature.",
  },
  {
    note: "F#",
    chakra: "Thought-form / joy center",
    themes: "Thought-form manifestation, instant karma, direct physical response to thought, joy, and spontaneous laughter.",
    bodyAreas: "Thought-form body / energetic center",
    use: "Used to assist alignment between thought and embodiment and support joy.",
  },
  {
    note: "G",
    chakra: "Throat chakra",
    themes: "Speech, communication, social, verbal, and emotional expression.",
    bodyAreas: "Throat, lungs, bronchial system, voice",
    use: "Used for creative activity and expression.",
  },
  {
    note: "A",
    chakra: "Third eye chakra",
    themes: "Vision, intuition, creativity, artistry, higher wisdom, and internal and external seeing.",
    bodyAreas: "Brain, neural system, eyes, forehead",
    use: "Used to develop seeing, wisdom, and support light and radiation regulation.",
  },
  {
    note: "B",
    chakra: "Crown chakra",
    themes: "Spirituality, intuition, enlightenment, spiritual insight, deep perception, and connection to universal source.",
    bodyAreas: "Brain, neural system, crown / top of head",
    use: "Used to support spiritual insight, akashic interpretation, compassion, and wisdom.",
  },
];

const BODY_SOUND_ROWS: BodySoundRow[] = [
  { organAssociation: "Kidney", musicalNote: "F", resonantNote: "F", frequency: "85hz" },
  { organAssociation: "HypoThalamus", musicalNote: "A", resonantNote: "A", frequency: "216hz" },
  { organAssociation: "Pituitary", musicalNote: "G", resonantNote: "G", frequency: "96hz, 385hz" },
  { organAssociation: "Occipital", musicalNote: "D", resonantNote: "D", frequency: "144hz" },
  { organAssociation: "Cell Energy", musicalNote: "Eb", resonantNote: "Eb", frequency: "152hz" },
  { organAssociation: "Parathyroid", musicalNote: "F", resonantNote: "F", frequency: "171hz" },
  { organAssociation: "Thyroid", musicalNote: "E", resonantNote: "E", frequency: "161hz, 324hz" },
  { organAssociation: "Thymus", musicalNote: "B", resonantNote: "B", frequency: "121hz, 264hz" },
  { organAssociation: "Heart", musicalNote: "C#", resonantNote: "C#", frequency: "135hz, 408hz" },
  { organAssociation: "Small Intestine", musicalNote: "D", resonantNote: "D", frequency: "144hz" },
  { organAssociation: "Large Intestine", musicalNote: "E", resonantNote: "E", frequency: "162hz" },
  { organAssociation: "Stomach", musicalNote: "C", resonantNote: "C", frequency: "128hz" },
  { organAssociation: "Adrenal Gland", musicalNote: "F", resonantNote: "F", frequency: "85hz" },
  { organAssociation: "Spleen", musicalNote: "Db", resonantNote: "Db", frequency: "136hz" },
  { organAssociation: "Pancreas", musicalNote: "A", resonantNote: "A", frequency: "432hz" },
  { organAssociation: "Pancreas", musicalNote: "A", resonantNote: "A", frequency: "108hz" },
  { organAssociation: "Liver", musicalNote: "D", resonantNote: "D", frequency: "72hz" },
  { organAssociation: "GallBladder", musicalNote: "F", resonantNote: "F", frequency: "85hz" },
  { organAssociation: "Reproductive (Uterus)", musicalNote: "D", resonantNote: "D", frequency: "288hz" },
  { organAssociation: "Reproductive (Prostate)", musicalNote: "E", resonantNote: "E", frequency: "81hz" },
  { organAssociation: "Gonades (Ovaries)", musicalNote: "D", resonantNote: "D", frequency: "72hz" },
  { organAssociation: "Gonades (Testes)", musicalNote: "Bb", resonantNote: "Bb", frequency: "457hz" },
  { organAssociation: "Heart", musicalNote: "C", resonantNote: "C", frequency: "256hz" },
  { organAssociation: "Urinary Bladder", musicalNote: "Cb", resonantNote: "Cb", frequency: "495hz" },
  { organAssociation: "Urinary Bladder", musicalNote: "F", resonantNote: "F", frequency: "343hz" },
  { organAssociation: "Circulation", musicalNote: "A", resonantNote: "A", frequency: "108hz" },
  { organAssociation: "Circulation", musicalNote: "Db", resonantNote: "Db", frequency: "270hz" },
  { organAssociation: "Circulation", musicalNote: "A", resonantNote: "A", frequency: "432hz" },
  { organAssociation: "Circulation", musicalNote: "E", resonantNote: "E", frequency: "649hz" },
  { organAssociation: "Lymphatic", musicalNote: "D", resonantNote: "D", frequency: "72hz" },
  { organAssociation: "Lymphatic", musicalNote: "D", resonantNote: "D", frequency: "581hz" },
  { organAssociation: "Lung", musicalNote: "E", resonantNote: "E", frequency: "80hz, 324hz" },
  { organAssociation: "Parotid Gland", musicalNote: "G", resonantNote: "G", frequency: "96hz" },
  { organAssociation: "Sinus (Frontal)", musicalNote: "F", resonantNote: "F", frequency: "343hz" },
  { organAssociation: "Sinus (Maxillary)", musicalNote: "D", resonantNote: "D", frequency: "288hz" },
  { organAssociation: "Sinus (Ethmoid)", musicalNote: "E#", resonantNote: "E#", frequency: "656hz" },
  { organAssociation: "Eyes", musicalNote: "G", resonantNote: "G", frequency: "192hz" },
  { organAssociation: "Deep Sleep", musicalNote: "D", resonantNote: "D", frequency: "288hz" },
  { organAssociation: "Sweat Band", musicalNote: "D", resonantNote: "D", frequency: "288hz" },
  { organAssociation: "Bone", musicalNote: "E", resonantNote: "E", frequency: "323hz" },
  { organAssociation: "Bone", musicalNote: "E", resonantNote: "E", frequency: "647hz" },
  { organAssociation: "Brain", musicalNote: "B", resonantNote: "B", frequency: "242hz" },
  { organAssociation: "Brain", musicalNote: "B", resonantNote: "B", frequency: "90hz, 242hz" },
  { organAssociation: "Brain", musicalNote: "Bb", resonantNote: "Bb", frequency: "228hz" },
  { organAssociation: "Brain", musicalNote: "Bb", resonantNote: "Bb", frequency: "114hz" },
  { organAssociation: "Brain", musicalNote: "Bb", resonantNote: "Bb", frequency: "171hz" },
  { organAssociation: "Brain", musicalNote: "C", resonantNote: "C", frequency: "515hz" },
  { organAssociation: "Brain", musicalNote: "A", resonantNote: "A", frequency: "858hz" },
  { organAssociation: "Brain", musicalNote: "A", resonantNote: "A", frequency: "860hz" },
  { organAssociation: "Brain", musicalNote: "A", resonantNote: "A", frequency: "430hz" },
  { organAssociation: "Brain", musicalNote: "F", resonantNote: "F", frequency: "687hz" },
];

const SWARASAN_METHOD_STEPS = [
  "Stabilizing: begin with 3-4 relaxed deep breaths.",
  "Humming: produce the target note gently from the 'centre of ease' with short stable strokes, first left, then right, then both nostrils.",
  "Meditation on light and sound: close the eyes and imagine universal white light with seven colours while centering on the note.",
  "Aakar: repeat the same practice pattern using the open vowel sound.",
  "Saakar: repeat the same practice pattern again using the full note articulation.",
];

const SWARASAN_REPORTED_RESULTS = [
  "Physical: vibrations reportedly felt first in the face and nasopharyngeal region, then more widely in the body, with improved breathing and heart rate noted.",
  "Mental: better oxygenation in the brain and a qualitative difference in mental well-being were reported.",
  "Psychological and emotional: practitioners reported increased relaxation, calm, bliss, rejuvenation, and reduced stress.",
  "Physiological and musical: better breathing, blood pressure, and note stability were reported after practice.",
];

const SWARASAN_SOURCE_CLAIMS = [
  "The paper presents Swarasan as a convergence of music, yoga, meditation, light, and sound for holistic well-being.",
  "It claims musical sound may stimulate neurotransmitters and lower some stress-related responses.",
  "It also includes broader speculative claims around DNA repair, '12 stranded DNA', and spiritual evolution that should be read as source claims, not app-validated clinical conclusions.",
];

const KEY_FINDINGS = [
  "A significant relationship was reported in studies between the tones of the Yellow Emperor's Nei-Jing and the corresponding organs, especially using sound stimulation.",
  "The heart's electromagnetic field is described here as 600 times greater than the brain's, making it highly sensitive to resonant, rhythmic stimuli.",
  "Vocal resonance shifts with tongue position, moving emphasis from chest to head or from the front of the face to the back of the throat depending on the note sung.",
];

export default function NoteFrequencyTable() {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Data Table</p>
          <h2 className={styles.title}>Frequency and vibration reference by note.</h2>
          <p className={styles.subtitle}>
            Standard equal-tempered tuning reference. Vibration rate is shown in hertz, which means
            cycles per second. The sections below also include the comparative organ, body resonance,
            and chakra-note mappings you added for later reference inside the app.
          </p>
        </div>
      </div>

      <div className={styles.tableShell}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Note</th>
              <th>Lower register</th>
              <th>Center register</th>
              <th>Upper register</th>
              <th>Vibration basis</th>
            </tr>
          </thead>
          <tbody>
            {NOTE_ROWS.map((row) => (
              <tr key={row.note}>
                <td>{row.note}</td>
                <td>{row.c3}</td>
                <td>{row.c4}</td>
                <td>{row.c5}</td>
                <td>{row.c4.replace(" Hz", " cycles/sec")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.sectionBlock}>
        <div className={styles.blockHeader}>
          <p className={styles.blockEyebrow}>Comparative Mapping</p>
          <h3 className={styles.blockTitle}>Five organs and musical tones in TCM.</h3>
          <p className={styles.blockText}>
            According to the Yellow Emperor&apos;s Internal Medicine tradition, the five Zang organs are
            associated with the five pentatonic tones.
          </p>
        </div>

        <div className={styles.tableShell}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Organ</th>
                <th>Element</th>
                <th>Tone</th>
                <th>Approx. frequency</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {TCM_ORGAN_TONE_ROWS.map((row) => (
                <tr key={row.organ}>
                  <td>{row.organ}</td>
                  <td>{row.element}</td>
                  <td>{row.tone}</td>
                  <td>{row.frequency}</td>
                  <td>{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.dualGrid}>
        <div className={styles.infoCard}>
          <p className={styles.blockEyebrow}>Body Resonance</p>
          <h3 className={styles.cardTitle}>Physical resonance ranges.</h3>
          <p className={styles.cardText}>
            These body-part ranges sit much lower than standard musical notes and are included here as a
            separate physical resonance reference.
          </p>
          <div className={styles.tableShell}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Body area</th>
                  <th>Resonant range</th>
                </tr>
              </thead>
              <tbody>
                {BODY_RESONANCE_ROWS.map((row) => (
                  <tr key={row.bodyPart}>
                    <td>{row.bodyPart}</td>
                    <td>{row.range}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.infoCard}>
          <p className={styles.blockEyebrow}>Energy Centers</p>
          <h3 className={styles.cardTitle}>Chakra and sense-note alignment.</h3>
          <p className={styles.cardText}>
            This section captures the chakra-based solfege interpretation you provided as a separate
            Western energetic reference layer.
          </p>
          <div className={styles.tableShell}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Center</th>
                  <th>Note</th>
                  <th>Association</th>
                </tr>
              </thead>
              <tbody>
                {CHAKRA_SENSE_ROWS.map((row) => (
                  <tr key={row.center}>
                    <td>{row.center}</td>
                    <td>{row.note}</td>
                    <td>{row.association}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className={styles.findingsCard}>
        <p className={styles.blockEyebrow}>Key Findings</p>
        <h3 className={styles.blockTitle}>Research notes saved to the table view.</h3>
        <ul className={styles.findingsList}>
          {KEY_FINDINGS.map((finding) => (
            <li key={finding}>{finding}</li>
          ))}
        </ul>
      </div>

      <div className={styles.sectionBlock}>
        <div className={styles.blockHeader}>
          <p className={styles.blockEyebrow}>Added Chart</p>
          <h3 className={styles.blockTitle}>Organ frequencies and associated musical notes.</h3>
          <p className={styles.blockText}>
            This section stores the values visible in the uploaded chart so the app keeps both the
            structured rows and the original chart image together.
          </p>
        </div>

        <div className={styles.organGrid}>
          <div className={styles.infoCard}>
            <div className={styles.tableShell}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Organ</th>
                    <th>Frequency</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {ORGAN_FREQUENCY_ROWS.map((row) => (
                    <tr key={row.organ}>
                      <td>{row.organ}</td>
                      <td>{row.frequency}</td>
                      <td>{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className={styles.chartCard}>
            <div className={styles.chartFrame}>
              <Image
                src="/reference/organ-musical-notes-chart.png"
                alt="Organ frequency and associated musical notes chart"
                width={545}
                height={569}
                className={styles.chartImage}
              />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.sectionBlock}>
        <div className={styles.blockHeader}>
          <p className={styles.blockEyebrow}>Added Paper</p>
          <h3 className={styles.blockTitle}>Swarasan: a yoga of frequencies reference.</h3>
          <p className={styles.blockText}>
            This section stores the practice description and tables you pasted from the 2022
            Swarasan paper as a provided reference layer. It is presented here for comparison and
            future use inside the app, not as validated medical guidance.
          </p>
        </div>

        <div className={styles.dualGrid}>
          <div className={styles.infoCard}>
            <p className={styles.blockEyebrow}>Overview</p>
            <h3 className={styles.cardTitle}>What the paper says Swarasan is.</h3>
            <p className={styles.cardText}>
              Swarasan is described as practicing and meditating on one musical note at a time to
              generate resonance in the body and bio-energy field, with the aim of balancing energy
              centres and supporting holistic well-being.
            </p>
            <p className={styles.cardText}>
              The paper frames the practice as humming or vocalizing stable notes gently, usually
              starting with <em>Sa</em> and lower notes for short durations before extending the
              practice.
            </p>
          </div>

          <div className={styles.infoCard}>
            <p className={styles.blockEyebrow}>Method</p>
            <h3 className={styles.cardTitle}>Practice steps captured from the paper.</h3>
            <ul className={styles.findingsList}>
              {SWARASAN_METHOD_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className={styles.sectionBlock}>
          <div className={styles.tableShell}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Chakra</th>
                  <th>Musical note</th>
                  <th>Frequency</th>
                  <th>Associated gland</th>
                </tr>
              </thead>
              <tbody>
                {SWARASAN_HARMONIC_ROWS.map((row) => (
                  <tr key={row.chakra}>
                    <td>{row.chakra}</td>
                    <td>{row.note}</td>
                    <td>{row.frequency}</td>
                    <td>{row.gland}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.dualGrid}>
          <div className={styles.findingsCard}>
            <p className={styles.blockEyebrow}>Reported Results</p>
            <h3 className={styles.blockTitle}>Outcomes described by the paper.</h3>
            <ul className={styles.findingsList}>
              {SWARASAN_REPORTED_RESULTS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className={styles.cautionCard}>
            <p className={styles.blockEyebrow}>Source Framing</p>
            <h3 className={styles.blockTitle}>Important interpretation note.</h3>
            <ul className={styles.findingsList}>
              {SWARASAN_SOURCE_CLAIMS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className={styles.sectionBlock}>
          <div className={styles.blockHeader}>
            <p className={styles.blockEyebrow}>Music And Energy Centres</p>
            <h3 className={styles.blockTitle}>Note, colour, and chakra correspondence.</h3>
            <p className={styles.blockText}>
              This source passage describes musical notes as resonating with specific colours in the
              visible spectrum and with specific energy centres in the body.
            </p>
          </div>

          <div className={styles.tableShell}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Note</th>
                  <th>Colour</th>
                  <th>Energy centre</th>
                  <th>Associated qualities</th>
                </tr>
              </thead>
              <tbody>
                {CHAKRA_COLOR_ROWS.map((row) => (
                  <tr key={row.note}>
                    <td>{row.note}</td>
                    <td>{row.color}</td>
                    <td>{row.center}</td>
                    <td>{row.association}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.cautionCard}>
            <p className={styles.blockEyebrow}>Source Note</p>
            <h3 className={styles.blockTitle}>How this reference is stored.</h3>
            <p className={styles.cardText}>
              The source also states that these musical notes are increasingly used to activate and
              balance chakras, and that music may contribute to repair and regeneration of tissues or
              cells associated with those centres. That claim is preserved here as reference material,
              not as app-validated clinical guidance.
            </p>
          </div>
        </div>

        <div className={styles.sectionBlock}>
          <div className={styles.blockHeader}>
            <p className={styles.blockEyebrow}>Singing Bowl Mapping</p>
            <h3 className={styles.blockTitle}>Note-by-note chakra and bowl reference.</h3>
            <p className={styles.blockText}>
              This section stores the singing bowl descriptions you provided as another note-to-chakra
              source layer for the app&apos;s research library.
            </p>
          </div>

          <div className={styles.tableShell}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Note</th>
                  <th>Chakra / center</th>
                  <th>Themes</th>
                  <th>Body areas</th>
                  <th>Use</th>
                </tr>
              </thead>
              <tbody>
                {SINGING_BOWL_ROWS.map((row) => (
                  <tr key={row.note}>
                    <td>{row.note}</td>
                    <td>{row.chakra}</td>
                    <td>{row.themes}</td>
                    <td>{row.bodyAreas}</td>
                    <td>{row.use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.sectionBlock}>
          <div className={styles.blockHeader}>
            <p className={styles.blockEyebrow}>Locked Fact Reference</p>
            <h3 className={styles.blockTitle}>Key image logged as locked source data.</h3>
            <p className={styles.blockText}>
              The `body.png` file is now the locked source image for this section. The visible organ,
              musical note, resonant note, and frequency rows have been transcribed below. The track
              column has been intentionally ignored.
            </p>
          </div>

          <div className={styles.chartCard}>
            <div className={styles.lockedBadge}>Locked In</div>
            <div className={styles.chartFrame}>
              <Image
                src="/reference/body.png"
                alt="Body reference image with organ associations, musical notes, and frequencies"
                width={967}
                height={1024}
                className={styles.chartImage}
              />
            </div>
          </div>

          <div className={styles.infoCard}>
            <p className={styles.blockEyebrow}>Organ Table</p>
            <h3 className={styles.cardTitle}>Sound frequencies for the human body.</h3>
            <div className={styles.tableShell}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Organ association</th>
                    <th>Musical note</th>
                    <th>Frequency</th>
                    <th>Resonant note</th>
                  </tr>
                </thead>
                <tbody>
                  {BODY_SOUND_ROWS.map((row, index) => (
                    <tr key={`${row.organAssociation}-${row.musicalNote}-${row.frequency}-${index}`}>
                      <td>{row.organAssociation}</td>
                      <td>{row.musicalNote}</td>
                      <td>{row.frequency}</td>
                      <td>{row.resonantNote}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
