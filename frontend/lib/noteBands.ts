import { NOTE_ORDER, getSoulScopeNoteColor, getSoulScopeNoteProfile } from "./noteSystem";

export type NoteBandConfig = {
  key: string;
  label: string;
  note: string;
  frequencyRefs: number[];
  frequencyLabel: string;
  interpretiveChakra: string;
  color: string;
};

const INTERPRETIVE_CHAKRA_BY_NOTE: Record<string, string> = {
  C: "Root",
  "C#": "Root/Sacral bridge",
  D: "Sacral",
  "D#": "Sacral/Solar bridge",
  E: "Solar Plexus",
  F: "Heart",
  "F#": "Heart/Throat bridge",
  G: "Throat",
  "G#": "Throat/Third Eye bridge",
  A: "Third Eye",
  "A#": "Third Eye/Crown bridge",
  B: "Crown",
};

function midiToHz(midi: number) {
  return 440 * 2 ** ((midi - 69) / 12);
}

export function getNoteReferenceFrequencies(note: string, minHz = 85, maxHz = 1200) {
  const noteIndex = NOTE_ORDER.indexOf(note as (typeof NOTE_ORDER)[number]);

  if (noteIndex === -1) {
    return [];
  }

  const refs: number[] = [];

  for (let octave = 0; octave <= 8; octave += 1) {
    const midi = 12 * (octave + 1) + noteIndex;
    const hz = midiToHz(midi);

    if (hz >= minHz && hz <= maxHz) {
      refs.push(Math.round(hz * 100) / 100);
    }
  }

  return refs;
}

export function formatFrequencyRefs(refs: number[]) {
  return refs.map((hz) => `${hz.toFixed(2)} Hz`).join(" • ");
}

export const NOTE_BAND_CONFIG: NoteBandConfig[] = NOTE_ORDER.map((note) => {
  const refs = getNoteReferenceFrequencies(note);

  return {
    key: note.toLowerCase().replace("#", "sharp"),
    label: note,
    note,
    frequencyRefs: refs,
    frequencyLabel: formatFrequencyRefs(refs),
    interpretiveChakra: INTERPRETIVE_CHAKRA_BY_NOTE[note],
    color: getSoulScopeNoteColor(note),
  };
});

export function getNoteBandConfig(note: string) {
  return NOTE_BAND_CONFIG.find((entry) => entry.note === note);
}

export function getNoteBandInterpretiveSummary(note: string) {
  const profile = getSoulScopeNoteProfile(note);
  const config = getNoteBandConfig(note);

  return {
    correlates: `Equal-tempered ${note} pitch-class energy tracked across octave centers in the measured voice range. Interpretive chakra overlay: ${config?.interpretiveChakra ?? "none"}.`,
    balanced: profile.emotionBalanced,
    underactive: profile.emotionUnderactive,
    overactive: profile.emotionOveractive,
    practice: profile.support,
  };
}
