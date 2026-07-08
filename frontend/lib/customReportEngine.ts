import { type SoulScopeReport } from "./buildSoulScopeReport";
import { type NoteEnergyResult, type VoiceAnalysisResult } from "./voiceSpectrum";

export type CustomSoulScopeReport = {
  story: string[];
  hiddenPatternTitle: string;
  hiddenPattern: string;
  feelsLike: string;
  strength: string;
  balancePoint: string;
  cameraInsight: string | null;
};

type Domain = SoulScopeReport["domainResults"][number];

type PromptAnalysis = NonNullable<VoiceAnalysisResult["analysisDebug"]>["promptAnalyses"] extends Array<infer T> ? T : never;

function sortNotes(notes: NoteEnergyResult[] = []) {
  return notes.slice().sort((a, b) => b.score - a.score);
}

function topNote(scan: VoiceAnalysisResult) {
  return sortNotes(scan.noteEnergies)[0] ?? null;
}

function secondNote(scan: VoiceAnalysisResult) {
  return sortNotes(scan.noteEnergies)[1] ?? null;
}

function noteSpread(notes: NoteEnergyResult[] = []) {
  if (!notes.length) return 0;
  const values = notes.map((note) => note.relativeEnergy);
  const max = Math.max(...values);
  const min = Math.min(...values);
  return max - min;
}

function topConcentration(notes: NoteEnergyResult[] = []) {
  return sortNotes(notes).slice(0, 2).reduce((sum, note) => sum + note.relativeEnergy, 0);
}

function getDomain(domains: Domain[], title: Domain["title"]) {
  return domains.find((domain) => domain.title === title);
}

function strongest(domains: Domain[]) {
  return domains.slice().sort((a, b) => b.score - a.score)[0];
}

function quietest(domains: Domain[]) {
  return domains.slice().sort((a, b) => a.score - b.score)[0];
}

function softDomainName(title?: string) {
  if (!title) return "one part of you";
  if (title === "Energy & Vitality") return "your energy";
  if (title === "Recovery & Restoration") return "your ability to restore";
  if (title === "Communication & Clarity") return "your ability to say what you mean";
  if (title === "Emotional Expression") return "your emotional expression";
  if (title === "Connection & Support") return "your need for connection and support";
  if (title === "Focus & Mental Load") return "your mental space";
  if (title === "Direction & Adaptability") return "your ability to adapt and keep moving";
  if (title === "Regulation") return "your ability to settle";
  return title.toLowerCase();
}

function noteMeaning(note?: string) {
  if (note === "C") return "grounding and basic steadiness";
  if (note === "C#") return "transition, change, and adjustment";
  if (note === "D") return "drive, emotion, and outward movement";
  if (note === "D#") return "adaptation and quick internal adjustment";
  if (note === "E") return "body energy and active expression";
  if (note === "F") return "relational sensitivity and the need for safety";
  if (note === "F#") return "future focus and planning energy";
  if (note === "G") return "voice, connection, and expression";
  if (note === "G#") return "release, recovery, and restoration";
  if (note === "A") return "momentum and forward orientation";
  if (note === "A#") return "mental pressure and emotional intensity";
  if (note === "B") return "cognitive processing and meaning-making";
  return "the strongest available voice signal";
}

function promptShifts(scan: VoiceAnalysisResult) {
  const prompts = scan.analysisDebug?.promptAnalyses ?? [];
  const valid = prompts.filter((prompt) => prompt.dominantBandLabel);
  const labels = valid.map((prompt) => prompt.dominantBandLabel);
  const unique = new Set(labels);
  const resonanceValues = valid.map((prompt) => prompt.resonanceScore).filter((value) => typeof value === "number");
  const pitchRanges = valid.map((prompt) => prompt.voiceDynamics?.pitchRangeSemitones ?? 0);
  const maxPitchRange = Math.max(0, ...pitchRanges);
  const minPitchRange = Math.min(...pitchRanges, maxPitchRange);
  const resonanceSpread = resonanceValues.length ? Math.max(...resonanceValues) - Math.min(...resonanceValues) : 0;
  return { prompts: valid, uniqueCount: unique.size, labels, resonanceSpread, maxPitchRange, minPitchRange };
}

function isCameraSane(scan: VoiceAnalysisResult) {
  const camera = scan.protocolNotes?.camera;
  if (!camera) return false;
  if (camera.trackingConfidence < 0.45) return false;
  if (camera.blinkRatePerMin < 0 || camera.blinkRatePerMin > 80) return false;
  return true;
}

function cameraSentence(scan: VoiceAnalysisResult) {
  const camera = scan.protocolNotes?.camera;
  if (!camera || !isCameraSane(scan)) return null;
  const details: string[] = [];
  if (camera.facialTension >= 0.62) details.push("your face appeared to hold visible tension while answering");
  if (camera.facialTension <= 0.28) details.push("your face appeared relatively soft while answering");
  if (camera.blinkRatePerMin >= 24) details.push("your blink rate was more active during the scan");
  if (camera.blinkRatePerMin > 0 && camera.blinkRatePerMin <= 10) details.push("your blink rate stayed low, which can happen with focused attention");
  if (!details.length) return null;
  return `The camera layer added a soft body signal too: ${details.join("; ")}.`;
}

function qualityWarnings(scan: VoiceAnalysisResult) {
  const warnings: string[] = [];
  const dynamics = scan.voiceDynamics;
  if (dynamics?.captureQuality === "poor") warnings.push("The audio quality was limited, so this reading should be treated as lower confidence.");
  if ((dynamics?.clippingFrameRatio ?? 0) > 0.18) warnings.push("Some audio clipping was detected, which can make the signal sound more intense than it really is.");
  if (scan.protocolNotes?.camera && !isCameraSane(scan)) warnings.push("Camera metrics were not used in the main reading because the visual signal was outside a reliable range.");
  if (scan.analysisDebug?.usedBroadSpectrumFallback) warnings.push("The engine used a broad-spectrum fallback for part of the analysis, so the voice detail is less precise.");
  return warnings;
}

export function buildCustomSoulScopeReport(scan: VoiceAnalysisResult, report: SoulScopeReport): CustomSoulScopeReport {
  const domains = report.domainResults ?? [];
  const top = strongest(domains);
  const low = quietest(domains);
  const communication = getDomain(domains, "Communication & Clarity");
  const connection = getDomain(domains, "Connection & Support");
  const recovery = getDomain(domains, "Recovery & Restoration");
  const focus = getDomain(domains, "Focus & Mental Load");
  const emotional = getDomain(domains, "Emotional Expression");
  const regulation = getDomain(domains, "Regulation");
  const primary = topNote(scan);
  const secondary = secondNote(scan);
  const dynamics = scan.voiceDynamics;
  const spread = noteSpread(scan.noteEnergies);
  const concentration = topConcentration(scan.noteEnergies);
  const shifts = promptShifts(scan);
  const warnings = qualityWarnings(scan);
  const resonance = scan.resonanceScore ?? 0;

  const distributionSentence = concentration >= 0.45
    ? `The signal was concentrated, with the strongest energy gathering around ${noteMeaning(primary?.note)}${secondary ? ` and a secondary layer of ${noteMeaning(secondary.note)}` : ""}. That kind of concentration usually reads less like an evenly relaxed system and more like certain parts of you are carrying the scan.`
    : spread <= 0.11
      ? "Your vocal energy was more evenly spread across the spectrum, which can suggest a more balanced or less narrowly loaded expression during this scan."
      : `Your vocal energy was not completely even, but it also was not locked into one narrow channel. The scan suggests a mixed state: some parts active, some quieter, and some still organizing themselves.`;

  const stabilitySentence = dynamics
    ? dynamics.pitchRangeSemitones <= 2 && dynamics.pitchStability >= 0.8
      ? "Your pitch stayed controlled and relatively narrow, which can suggest held expression, focus, or a system trying to keep things contained rather than letting everything spill out."
      : dynamics.pitchRangeSemitones >= 6 || dynamics.pitchStability < 0.55
        ? "Your pitch moved more widely and less steadily, which can suggest strain, emotional variability, or a system that changes tone when different material comes forward."
        : "Your pitch showed moderate movement: not flat, not chaotic, but responsive enough to suggest the scan was tracking real shifts rather than one static state."
    : "The voice-dynamics layer was limited, so the report leans more heavily on frequency distribution and domain results.";

  const harmonySentence = dynamics
    ? (dynamics.harmonicToNoiseRatioDb ?? 99) < 6 || (dynamics.spectralFlatness ?? 0) > 0.38
      ? "The harmonic layer was a little noisier, which can point to strain, fatigue, mixed signal quality, or less organized vocal resonance in parts of the scan."
      : (dynamics.harmonicToNoiseRatioDb ?? 0) >= 10 && (dynamics.spectralFlatness ?? 1) < 0.28
        ? "The harmonic layer was fairly organized, which gives the reading more confidence that your voice had a coherent signal underneath the emotional content."
        : "The harmonic layer was usable but not perfectly clean, so the report reads the overall pattern rather than over-weighting one technical metric."
    : "";

  const promptSentence = shifts.prompts.length >= 2
    ? shifts.uniqueCount >= 4 || shifts.resonanceSpread > 0.18
      ? "Your scan changed meaningfully from prompt to prompt, which matters. It suggests your system does not respond the same way to every question; different topics appear to activate different parts of your voice."
      : "Your prompt responses stayed fairly consistent, which suggests the reading is describing a stable state rather than one question throwing the whole scan in a different direction."
    : "";

  const opening = `On the surface, this scan shows ${softDomainName(top?.title)} as the most available area, while ${softDomainName(low?.title)} is asking for the most support. ${distributionSentence}`;

  const body = `${stabilitySentence} ${harmonySentence} ${promptSentence}`.trim();

  const relationshipSentence = (connection?.score ?? 100) < 45 || (communication?.score ?? 100) < 45
    ? "In real life, this may show up as wanting to be understood while still filtering what you say, needing support but not wanting to ask too directly, or feeling like your inner experience is bigger than what you can comfortably explain."
    : (communication?.score ?? 0) > 62
      ? "In real life, this may show up as a strong need to clarify, explain, speak, or make meaning, especially if you feel something important is not landing correctly."
      : "In real life, this may show up less as a communication problem and more as a need to protect the rhythm that helps you feel steady.";

  const loadSentence = (recovery?.score ?? 100) < 40 && ((focus?.score ?? 0) > 55 || (regulation?.score ?? 100) < 45)
    ? "The load pattern points toward restoration being more important than output right now. The scan does not read as laziness or lack of capacity; it reads like a system that may need recovery before it can access clearer focus and steadier expression."
    : (emotional?.score ?? 0) > 62
      ? "The emotional layer appears active, which may make small things feel more charged than usual. The useful move is not to suppress that sensitivity, but to give it language before it turns into pressure."
      : "The stress layer is not the whole story here. The more accurate read is that your system is balancing available strengths with one or two quieter areas that need more care.";

  const camera = cameraSentence(scan);
  const hiddenPatternTitle = concentration >= 0.45
    ? "Concentrated Signal, Uneven Support"
    : shifts.uniqueCount >= 4
      ? "Different Questions, Different Responses"
      : (recovery?.score ?? 100) < 40
        ? "Functioning While Needing Restoration"
        : "A Mixed System Looking for Coherence";

  const hiddenPattern = concentration >= 0.45
    ? "The hidden pattern is that one part of your system is speaking louder than the rest. That does not make it wrong; it means the report should pay attention to what is dominating and what is being pushed into the background."
    : shifts.uniqueCount >= 4
      ? "The hidden pattern is responsiveness. Your voice did not behave like one flat state; it shifted as the scan moved, which suggests the questions touched different layers of your system."
      : "The hidden pattern is not a fixed label. It is the relationship between what is active, what is quiet, and how much effort your voice used to stay organized.";

  const feelsLike = relationshipSentence;

  const strength = top
    ? `Your strength in this scan is ${softDomainName(top.title)}. That area remained the most available signal, which means the report is not only seeing what is depleted; it is also seeing where you still have access, movement, and capacity.`
    : "Your strength is that the scan produced a readable signal. Even when the pattern is mixed, your voice still gave enough information to work with.";

  const balancePoint = (low?.title === "Recovery & Restoration" || (recovery?.score ?? 100) < 40)
    ? "Your balance point is restoration before more output. Choose one small way to reduce background load before asking yourself to push harder."
    : (low?.title === "Connection & Support" || (connection?.score ?? 100) < 45)
      ? "Your balance point is asking for support with less explanation. Name one need clearly and let it be valid without a full defense."
      : (low?.title === "Communication & Clarity" || (communication?.score ?? 100) < 45)
        ? "Your balance point is simpler expression. Say the truest sentence first, before you try to make it sound perfect."
        : `Your balance point is supporting ${softDomainName(low?.title)} with one clear, small action instead of turning self-care into another performance.`;

  return {
    story: [opening, body, loadSentence, ...warnings],
    hiddenPatternTitle,
    hiddenPattern,
    feelsLike,
    strength,
    balancePoint,
    cameraInsight: camera,
  };
}
