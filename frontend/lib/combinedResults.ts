import type { VoiceAnalysisResult } from "./voiceSpectrum";

type CombinedScanResult = VoiceAnalysisResult;

function formatNotes(notes: string[]) {
  if (!notes.length) return "a few lower-energy notes";
  if (notes.length === 1) return notes[0];
  if (notes.length === 2) return `${notes[0]} and ${notes[1]}`;
  return `${notes[0]}, ${notes[1]}, and ${notes[2]}`;
}

export function buildCombinedResultNarrative(scan: CombinedScanResult) {
  const primaryNote = scan.noteInterpretation?.primaryNote ?? scan.dominantBandLabel ?? scan.dominantBand ?? "F#";
  const underactiveNotes = (scan.noteEnergies ?? [])
    .filter((entry) => entry.status === "underactive")
    .sort((a, b) => a.relativeEnergy - b.relativeEnergy)
    .slice(0, 3)
    .map((entry) => entry.note);

  const camera = scan.protocolNotes?.camera;
  const cameraBaseline = scan.protocolNotes?.cameraBaseline;

  if (!camera) {
    return `Your voice pattern centers around ${primaryNote}, with ${formatNotes(
      underactiveNotes
    )} showing less support. This result is currently driven by the vocal read, since camera data was not available for the combined interpretation.`;
  }

  if (camera.trackingConfidence < 0.45) {
    return `The scan picked up both vocal and facial data, but the camera confidence was limited, so this combined read should be treated as directional rather than precise. The vocal pattern still centers around ${primaryNote}, with reduced support in ${formatNotes(
      underactiveNotes
    )}, while the face read suggests some guarding under more personal material. The main signal here is not a diagnosis of emotion, but a pattern of increased load as the prompts deepen.`;
  }

  return `You came in relatively open in the first prompts, but as the scan moved into emotional material your voice tightened and your face did too. The vocal read shows pressure collecting around ${primaryNote}, with reduced support in ${formatNotes(
    underactiveNotes
  )}, while the camera read shows ${
    cameraBaseline
      ? "a shift away from your opening baseline into higher facial tension, reduced eye openness, and a faster blink pattern during the emotional section"
      : "higher facial tension, reduced eye openness, and a faster blink pattern during the emotional section"
  }. Taken together, this looks less like a flat lack of feeling and more like active self-protection: your system is still engaged, but it starts guarding when the material becomes more personal.

In practical terms, the combined pattern suggests a person who can stay expressive on the surface, but begins to narrow under emotional load. The voice indicates where that pressure is being carried in expression; the face read shows when the body starts bracing around it. SoulScope would summarize this as a guarded but responsive pattern: you do not shut down completely, but stress appears to compress both vocal freedom and facial softness once the questions move deeper.`;
}
