import {
  displayNameForCanonicalRegion,
  type BoundaryBlend,
  type CanonicalConstellationRegion,
} from "./canonicalConstellationEngine";
import type { CrossConstellationInteraction, InteractionKind } from "./canonicalInteractionEngine";
import type { CanonicalSoulScopeResult } from "./canonicalResult";

export type CanonicalNarrative = {
  patternTitle: string;
  patternSubtitle?: string;
  reflection: string;
  howThisMayShowUp: string;
  worthNoticing: string;
  gentleNextStep: string;
  confidenceLabel: "Developing" | "Moderate" | "Strong";
  uncertaintyNote?: string;
};

const INTERNAL_TOKEN_PATTERN = /\b(?:COG|REG|CAP|EXP)-\d{3}\b|\bINT-\d{3}\b|meaning:[^\s]+|boundary[_ -]?blend|boundary transition|ambiguous state|unresolved geometry|candidate collision|strongest interaction|publicationReason|rule version|decision ledger/i;

const INTERACTION_LANGUAGE: Record<InteractionKind, string> = {
  reinforces: "Several parts of the scan point toward the same overall pattern.",
  buffers: "One area of strength appears to be helping steady another area that is under more demand.",
  amplifies: "Several signals are reinforcing the same overall tendency.",
  masks: "One steady-looking part of the pattern may be making the effort underneath less obvious.",
  compensates: "One part of the pattern appears to be carrying more of the load while another is less available.",
  constrains: "One strong tendency may be limiting how fully another tendency is expressed.",
  protects: "A boundary in the pattern may be helping protect steadiness while demand is present.",
  redirects: "Energy in the scan may be moving into one channel more than another.",
  destabilizes: "The scan contains signals pointing in different directions, so the result is being held more broadly.",
  integrates: "Several parts of the scan appear to be working together with manageable tension.",
  reveals: "One part of the scan helps clarify what another part may mean.",
  shifts: "The scan suggests movement rather than one fixed state.",
  suppresses_global_pattern: "The scan supports local observations, but not a single overall pattern name.",
};

function confidenceLabel(confidence: number): CanonicalNarrative["confidenceLabel"] {
  if (confidence >= 0.72) return "Strong";
  if (confidence >= 0.48) return "Moderate";
  return "Developing";
}

function averageEvidenceConfidence(result: CanonicalSoulScopeResult) {
  const usable = result.evidenceLedger.records.filter((record) => !record.missingEvidence);
  return usable.length ? usable.reduce((sum, record) => sum + record.confidence, 0) / usable.length : 0;
}

function evidenceQualityUsable(result: CanonicalSoulScopeResult) {
  const records = result.evidenceLedger.records;
  if (!records.length || records.every((record) => record.missingEvidence)) return false;
  if (averageEvidenceConfidence(result) < 0.5) return false;
  return !records.every((record) => /poor|failed|unusable/i.test(record.quality));
}

function strongestDimensions(result: CanonicalSoulScopeResult) {
  return [...result.phaseBDimensions.records]
    .filter((dimension) => dimension.evidenceCoverage > 0)
    .sort((left, right) => Math.abs(right.value - 0.5) * right.confidence - Math.abs(left.value - 0.5) * left.confidence)
    .slice(0, 3);
}

function topInteraction(result: CanonicalSoulScopeResult): CrossConstellationInteraction | undefined {
  return result.phaseBInteractions.records
    .filter((interaction) => interaction.interactionId !== "INT-008")
    .sort((left, right) => right.confidence - left.confidence)[0];
}

function displayName(region: CanonicalConstellationRegion | null | undefined) {
  return region ? displayNameForCanonicalRegion(region) : null;
}

function titleFromBlend(blend: BoundaryBlend | null | undefined) {
  const primary = displayName(blend?.primaryRegion);
  const secondary = displayName(blend?.secondaryRegion);
  if (primary && secondary) {
    const balanced = blend ? Math.abs(0.5 - blend.blend) <= 0.08 : false;
    return {
      title: balanced ? `Between ${primary} and ${secondary}` : `Emerging ${primary}`,
      subtitle: "Your scan currently sits between two closely related patterns.",
      primary,
      secondary,
    };
  }
  if (primary) {
    return {
      title: `Emerging ${primary}`,
      subtitle: "Your scan currently sits near a neighboring pattern.",
      primary,
      secondary: null,
    };
  }
  return {
    title: "An Emerging Pattern",
    subtitle: "Your scan currently sits between two closely related patterns.",
    primary: null,
    secondary: null,
  };
}

function titleFromWinner(result: CanonicalSoulScopeResult) {
  const resolved = Object.values(result.phaseBConstellation.geometry.constellations)
    .filter((decision) => decision.winner !== "unresolved")
    .sort((left, right) => right.confidence - left.confidence);
  const winner = displayName(resolved[0]?.winner);
  return winner ?? "A Developing Pattern";
}

function uncertaintyNote(result: CanonicalSoulScopeResult) {
  if (result.decisionLedger.record.outcome === "boundary_blend") {
    return "Two closely related patterns were both supported in this scan.";
  }
  if (result.decisionLedger.record.outcome === "unresolved") {
    return evidenceQualityUsable(result)
      ? "The scan supports local observations, but not a single overall pattern name yet."
      : "The available evidence was not strong enough for a reliable pattern conclusion.";
  }
  if (result.phaseBConstellation.geometry.uncertainty >= 0.4) {
    return "A neighboring pattern also remains plausible.";
  }
  return undefined;
}

function sanitize(value: string) {
  return value
    .replace(INTERNAL_TOKEN_PATTERN, "")
    .replace(/\s+/g, " ")
    .trim();
}

function ensureClean(value: string, fallback: string) {
  const cleaned = sanitize(value);
  return cleaned && !INTERNAL_TOKEN_PATTERN.test(cleaned) ? cleaned : fallback;
}

export function buildCanonicalNarrative(result: CanonicalSoulScopeResult): CanonicalNarrative {
  const isBoundary = result.decisionLedger.record.outcome === "boundary_blend" || Boolean(result.phaseBConstellation.geometry.boundaryBlend);
  const blendTitle = isBoundary ? titleFromBlend(result.phaseBConstellation.geometry.boundaryBlend) : null;
  const patternTitle = result.decisionLedger.record.outcome === "unresolved"
    ? "A Developing Pattern"
    : blendTitle?.title ?? titleFromWinner(result);
  const strongest = strongestDimensions(result);
  const strongestLabel = strongest[0]?.label.toLowerCase() ?? "one supported tendency";
  const secondLabel = strongest[1]?.label.toLowerCase() ?? "a neighboring tendency";
  const interactionSentence = topInteraction(result)
    ? INTERACTION_LANGUAGE[topInteraction(result)!.kind]
    : "Several parts of the scan are being held together cautiously.";
  const confidence = result.meaningObjects.records[0]?.confidence ?? result.phaseBConstellation.geometry.confidence;
  const usableQuality = evidenceQualityUsable(result);

  const reflection = isBoundary
    ? `Your voice showed ${strongestLabel} while also carrying signs of ${secondLabel}. Two neighboring patterns were similarly supported, so this reflection is being held broadly rather than reduced to one exact label. ${interactionSentence} The clearest signal was ${strongestLabel}; what remains less certain is how stable this arrangement is in this moment.`
    : result.decisionLedger.record.outcome === "unresolved"
      ? usableQuality
        ? `Your scan shows some supported local signals, especially around ${strongestLabel}. The broader pattern is being held open because the evidence does not yet support one clear overall reflection. ${interactionSentence}`
        : "The available voice evidence was limited, so SoulScope is not assigning a pattern from this scan. A clearer sample can make the reflection more reliable without turning missing evidence into a conclusion."
      : `Your scan most strongly points toward ${patternTitle}. The clearest support appears around ${strongestLabel}, with ${secondLabel} adding context. ${interactionSentence}`;

  const howThisMayShowUp = isBoundary
    ? "You may find yourself moving carefully between planning and adapting, especially when several demands are active at once. You may appear steady on the outside while still revising your approach internally."
    : result.decisionLedger.record.outcome === "unresolved"
      ? "You might notice parts of the pattern showing up in small ways without feeling like one clear theme fully describes the moment."
      : "This may show up as a recognizable way of organizing your attention, energy, and expression. It could feel clear in some moments and more effortful in others, depending on what the situation is asking of you.";

  const worthNoticing = isBoundary
    ? "Two closely related patterns were supported. That may reflect a genuinely flexible state rather than an incomplete result."
    : result.decisionLedger.record.outcome === "unresolved"
      ? usableQuality
        ? "The meaningful signal is local rather than global right now. A neighboring pattern may become clearer as more comparable scans are collected."
        : "The main thing to notice is the evidence boundary itself: SoulScope is leaving unknowns unknown instead of filling them in."
      : "A neighboring pattern also remains plausible, so the reflection should stay open to context rather than becoming a fixed label.";

  const gentleNextStep = usableQuality
    ? isBoundary
      ? "Notice where you are currently balancing structure with adaptation. A future scan under similar conditions can help show whether this is a stable pattern or a momentary transition."
      : "Notice where this pattern feels useful and where it may be asking for more room. A future scan under similar conditions can help show whether it repeats."
    : "Try another scan when the recording conditions feel clear and you can speak continuously for the prompts.";

  return {
    patternTitle: ensureClean(patternTitle, "An Emerging Pattern"),
    patternSubtitle: blendTitle?.subtitle ? ensureClean(blendTitle.subtitle, "Your scan currently sits between two closely related patterns.") : undefined,
    reflection: ensureClean(reflection, "Your scan supports a broad reflection while preserving uncertainty where the evidence is less settled."),
    howThisMayShowUp: ensureClean(howThisMayShowUp, "This may show up differently depending on context, energy, and the demands of the moment."),
    worthNoticing: ensureClean(worthNoticing, "A neighboring pattern also remains plausible."),
    gentleNextStep: ensureClean(gentleNextStep, "Notice what feels most true in this reflection and compare it with a future scan under similar conditions."),
    confidenceLabel: confidenceLabel(confidence),
    uncertaintyNote: uncertaintyNote(result),
  };
}
