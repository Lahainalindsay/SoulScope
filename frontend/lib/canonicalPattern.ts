import type { PatternPresentation } from "./patternKnowledge";
import type { PatternExpression } from "./patternPersonalization";
import type { PatternMatch } from "./resonancePatterns";
import type { DynamicPatternResult, EvidenceEntry, PatternFamily, StateVector } from "./patternInterpretation";
import type { AtlasInput, AtlasResult, AtlasSubpatternId } from "./patternAtlas";
import type { ScanCompleteness } from "./partialScan";
import {
  CANONICAL_NAMING_MATRIX_VERSION,
  fallbackDisplayName,
  familyDisplayName,
  resolveNamingMatrixEntry,
  type CanonicalContent,
  type OrganizingQuality,
} from "./canonicalNamingMatrix";

export const CANONICAL_PATTERN_ENGINE_VERSION = "canonical-pattern-v1";

const CLEAR_WIN_MARGIN = 0.14;
const COMPOSITE_MARGIN = 0.18;
const AMBIGUOUS_MARGIN = 0.04;
const MIN_SECONDARY_SCORE = 0.46;
const GROUNDED_MIN_CAPACITY = 0.52;
const GROUNDED_MIN_REGULATION = 0.52;
const PURPOSEFUL_MIN_CAPACITY = 0.35;
const RESTORING_MIN_RETURNING_CAPACITY = 0.45;

export type CanonicalSelectionMode = "single" | "composite" | "ambiguous" | "insufficient-evidence";

export type CanonicalFamilyCandidate = {
  family: PatternFamily;
  score: number;
  rawScore: number;
  supportingEvidence: string[];
  contradictoryEvidence: string[];
  missingEvidence: string[];
  gates: string[];
  disqualified: boolean;
};

export type CanonicalDecisionLedger = {
  selected: {
    displayName: string;
    signature: string;
    mode: CanonicalSelectionMode;
    primaryFamily: PatternFamily;
    secondaryFamily: PatternFamily | null;
    confidence: number;
    confidenceMargin: number;
    organizingQuality: OrganizingQuality;
    namingMatrixVersion: string;
    nameSource: "naming-matrix" | "limited-evidence" | "fallback";
  };
  thresholds: {
    clearWinMargin: number;
    compositeMargin: number;
    ambiguousMargin: number;
    minSecondaryScore: number;
    groundedMinCapacity: number;
    groundedMinRegulation: number;
  };
  supportingEvidence: string[];
  contradictoryEvidence: string[];
  missingEvidence: string[];
  alternatives: CanonicalFamilyCandidate[];
  rejected: Array<{
    id: string;
    name: string;
    reasons: string[];
  }>;
  notes: string[];
};

export type CanonicalPatternResult = {
  canonicalPatternSignature: string;
  canonicalDisplayName: string;
  canonicalFamily: PatternFamily;
  primaryFamily: PatternFamily;
  secondaryFamily: PatternFamily | null;
  stateVector: StateVector;
  dimensions: DynamicPatternResult["dimensions"];
  confidence: number;
  confidenceMargin: number;
  organizingQuality: OrganizingQuality;
  resultType: CanonicalSelectionMode;
  namingMatrixVersion: string;
  evidenceLedger: DynamicPatternResult["evidenceLedger"];
  dimensionLedger: DynamicPatternResult["dimensions"];
  decisionLedger: CanonicalDecisionLedger;
  interpretationLimits: string[];
  reflectionSource: {
    dynamicDisplayName: string;
    dynamicFamily: PatternFamily;
    atlasProfileId: string;
    atlasProfileName: string;
    atlasScore: number;
    legacyPrimaryId: string;
    legacyPrimaryName: string;
  };
  engineVersion: string;
  summary: string;
  explanation: [string, string];
  dailyLife: [string, string, string, string];
  supportLines: [string, string, string];
  reflectionQuestion: string;
};

type ResolveCanonicalPatternArgs = {
  dynamicPattern: DynamicPatternResult;
  atlasInput: AtlasInput;
  atlasResult: AtlasResult;
  primaryPattern: PatternMatch;
  supportingPattern?: PatternMatch;
  emergingPattern?: PatternMatch;
  completeness?: ScanCompleteness;
};

const FAMILY_ORDER: PatternFamily[] = [
  "overextended",
  "activated",
  "protective",
  "reorganizing",
  "reflective",
  "recovering",
  "grounded",
  "expressive",
  "purposeful",
  "adaptive",
];

function clamp(value: number, min = 0, max = 1) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function round(value: number) {
  return Number(clamp(value).toFixed(3));
}

function evidenceValue(entries: EvidenceEntry[], id: string) {
  return entries.find((entry) => entry.id === id)?.value ?? 0;
}

function atlasSubpattern(result: AtlasResult, id: AtlasSubpatternId) {
  return result.subpatterns.find((entry) => entry.id === id)?.score ?? 0;
}

function atlasFamilyScore(result: AtlasResult, family: PatternFamily) {
  const all = [{ profile: result.profile, score: result.score }, ...result.supporting];
  return all
    .filter((entry) => entry.profile.family === family)
    .reduce((score, entry) => Math.max(score, entry.score), 0);
}

function entriesByIds(entries: EvidenceEntry[], ids: string[]) {
  return entries.filter((entry) => ids.includes(entry.id)).map((entry) => entry.id);
}

function hasMaterialSecondarySupport(candidate: CanonicalFamilyCandidate | undefined, atlasResult: AtlasResult, dynamic: DynamicPatternResult) {
  if (!candidate || candidate.disqualified || candidate.score < MIN_SECONDARY_SCORE) return false;
  const supporting = dynamic.evidenceLedger.supporting;
  if (candidate.family === "protective") {
    return atlasSubpattern(atlasResult, "protective-expression") >= 0.72 || evidenceValue(supporting, "vocal-facial-divergence") >= 0.45;
  }
  if (candidate.family === "purposeful") {
    return atlasSubpattern(atlasResult, "focused-direction") >= 0.74 && dynamic.stateVector.capacity <= 0.52;
  }
  if (candidate.family === "overextended") {
    return atlasSubpattern(atlasResult, "recovery-gap") >= 0.58 || atlasSubpattern(atlasResult, "quiet-overload") >= 0.58;
  }
  if (candidate.family === "reorganizing") {
    return atlasSubpattern(atlasResult, "reorganizing-capacity") >= 0.65 || evidenceValue(supporting, "activation-with-fragmentation") >= 0.6;
  }
  if (candidate.family === "reflective") {
    return atlasSubpattern(atlasResult, "internal-processing") >= 0.58;
  }
  if (candidate.family === "adaptive") {
    return atlasSubpattern(atlasResult, "adaptive-regulation") >= 0.7;
  }
  if (candidate.family === "expressive") {
    return atlasSubpattern(atlasResult, "emotional-fluidity") >= 0.74;
  }
  return false;
}

function buildCandidate(
  family: PatternFamily,
  dynamic: DynamicPatternResult,
  atlasInput: AtlasInput,
  atlasResult: AtlasResult,
  completeness?: ScanCompleteness,
): CanonicalFamilyCandidate {
  const vector = dynamic.stateVector;
  const supporting = dynamic.evidenceLedger.supporting;
  const missing = dynamic.evidenceLedger.missing.map((entry) => entry.id);
  const poorCapture = !dynamic.evidenceLedger.quality.usable || completeness?.status === "failed";
  const lowCapture = poorCapture || completeness?.qualityLevel === "limited";
  const highActivation = evidenceValue(supporting, "high-activation");
  const fragmentation = evidenceValue(supporting, "activation-with-fragmentation");
  const coherence = evidenceValue(supporting, "activation-with-coherence");
  const escalation = evidenceValue(supporting, "cross-prompt-escalation");
  const slowRecovery = evidenceValue(supporting, "slow-recovery");
  const divergence = evidenceValue(supporting, "vocal-facial-divergence");
  const recoveryGap = atlasSubpattern(atlasResult, "recovery-gap");
  const quietOverload = atlasSubpattern(atlasResult, "quiet-overload");
  const protectiveExpression = atlasSubpattern(atlasResult, "protective-expression");
  const settledPresence = atlasSubpattern(atlasResult, "settled-presence");
  const returningCapacity = atlasInput["returning-capacity"] ?? 0;
  const atlasContribution = atlasFamilyScore(atlasResult, family) * 0.1;
  const gates: string[] = [];
  const supportIds: string[] = [];
  const contradictionIds: string[] = [];

  let score = 0.42;
  if (family === "overextended") {
    score = (1 - vector.capacity) * 0.34 + (1 - vector.regulation) * 0.22 + recoveryGap * 0.18 + quietOverload * 0.16 + slowRecovery * 0.08 + atlasContribution;
    supportIds.push("reduced-recovery", "slow-recovery", "activation-with-fragmentation");
    if (vector.capacity > 0.62) contradictionIds.push("capacity");
  } else if (family === "grounded") {
    score = vector.capacity * 0.28 + vector.regulation * 0.28 + vector.organization * 0.18 + vector.direction * 0.12 + settledPresence * 0.12 + coherence * 0.06 + atlasContribution
      - fragmentation * 0.2 - slowRecovery * 0.18 - quietOverload * 0.16 - recoveryGap * 0.12;
    supportIds.push("activation-with-coherence", "vocal-facial-congruence");
    if (vector.capacity < GROUNDED_MIN_CAPACITY) gates.push(`Capacity ${vector.capacity.toFixed(2)} is below the grounded minimum ${GROUNDED_MIN_CAPACITY}.`);
    if (vector.regulation < GROUNDED_MIN_REGULATION) gates.push(`Regulation ${vector.regulation.toFixed(2)} is below the grounded minimum ${GROUNDED_MIN_REGULATION}.`);
    if (recoveryGap >= 0.58) gates.push("Recovery gap is too pronounced for a plain grounded result.");
    if (quietOverload >= 0.58) gates.push("Quiet overload contradicts a plain grounded result.");
    if (slowRecovery >= 0.55) gates.push("Slow recovery contradicts a plain grounded result.");
    if (fragmentation >= 0.55) gates.push("Fragmentation materially contradicts grounded coherence.");
    contradictionIds.push("high-activation", "activation-with-fragmentation", "cross-prompt-escalation", "slow-recovery");
  } else if (family === "protective") {
    score = (1 - vector.relationalOrientation) * 0.26 + (1 - vector.expression) * 0.12 + protectiveExpression * 0.38 + divergence * 0.18 + (1 - vector.capacity) * 0.1 + atlasContribution;
    supportIds.push("vocal-facial-divergence", "slow-recovery");
    if (lowCapture && protectiveExpression < 0.5 && divergence < 0.24) gates.push("Protective expression cannot be inferred from limited capture alone.");
  } else if (family === "activated") {
    score = vector.activation * 0.32 + highActivation * 0.2 + escalation * 0.18 + fragmentation * 0.12 + coherence * 0.16 + (1 - vector.capacity) * 0.1 + atlasContribution;
    supportIds.push("high-activation", "cross-prompt-escalation");
  } else if (family === "reorganizing") {
    score = (1 - vector.organization) * 0.28 + fragmentation * 0.26 + escalation * 0.12 + atlasSubpattern(atlasResult, "reorganizing-capacity") * 0.2 + atlasContribution;
    supportIds.push("activation-with-fragmentation", "cross-prompt-escalation");
    if (lowCapture && fragmentation < 0.5) gates.push("Reorganizing evidence is limited by capture quality.");
  } else if (family === "recovering") {
    score = returningCapacity * 0.36 + atlasSubpattern(atlasResult, "emerging-restoration") * 0.2 + vector.capacity * 0.16 + vector.regulation * 0.12 + atlasContribution;
    supportIds.push("returning-capacity");
    if (!dynamic.baseline.comparisonAvailable || returningCapacity < RESTORING_MIN_RETURNING_CAPACITY) {
      gates.push("Returning capacity requires eligible longitudinal evidence.");
    }
  } else if (family === "purposeful") {
    score = vector.direction * 0.34 + atlasSubpattern(atlasResult, "focused-direction") * 0.24 + vector.organization * 0.14 + vector.capacity * 0.12 + atlasContribution;
    supportIds.push("cross-prompt-escalation");
    if (vector.capacity < PURPOSEFUL_MIN_CAPACITY) gates.push(`Capacity ${vector.capacity.toFixed(2)} is too low for a plain purposeful result.`);
  } else if (family === "expressive") {
    score = vector.expression * 0.34 + atlasSubpattern(atlasResult, "emotional-fluidity") * 0.24 + vector.relationalOrientation * 0.12 + coherence * 0.08 + atlasContribution - protectiveExpression * 0.12;
    supportIds.push("high-activation", "vocal-facial-congruence");
    if (protectiveExpression >= 0.62) gates.push("Protective restraint must be preserved rather than overwritten by an open expression name.");
  } else if (family === "reflective") {
    score = atlasSubpattern(atlasResult, "internal-processing") * 0.32 + (atlasInput["cognitive-searching"] ?? 0) * 0.18 + (1 - vector.direction) * 0.1 + (1 - vector.organization) * 0.1 + atlasContribution;
    supportIds.push("activation-with-fragmentation", "cross-prompt-escalation");
  } else {
    score = vector.organization * 0.2 + vector.regulation * 0.18 + vector.direction * 0.18 + vector.expression * 0.14 + atlasSubpattern(atlasResult, "adaptive-regulation") * 0.18 + atlasContribution;
  }

  const disqualified = gates.some((reason) => reason.includes("requires") || reason.includes("cannot") || reason.includes("below") || reason.includes("too low"));
  const gatedScore = disqualified ? Math.min(score, 0.34) : score;
  return {
    family,
    score: round(gatedScore),
    rawScore: round(score),
    supportingEvidence: entriesByIds(supporting, supportIds),
    contradictoryEvidence: entriesByIds(supporting, contradictionIds),
    missingEvidence: missing,
    gates,
    disqualified,
  };
}

function defaultContent(_name: string, _primary: PatternFamily, atlasPresentation: PatternPresentation): CanonicalContent {
  return {
    summary: atlasPresentation.summary,
    explanation: atlasPresentation.explanation,
    dailyLife: atlasPresentation.dailyLife,
    supportLines: [
      "A little more space around the strongest demand.",
      "A pace that lets the pattern become clearer.",
      "Attention to what feels current rather than fixed.",
    ],
    reflectionQuestion: atlasPresentation.reflectionQuestion,
  };
}

function buildSignature(primary: PatternFamily, secondary: PatternFamily | null, dynamic: DynamicPatternResult) {
  return [
    `family:${primary}`,
    secondary ? `secondary:${secondary}` : null,
    dynamic.patternSignature,
  ].filter(Boolean).join("+");
}

export function resolveCanonicalPattern(
  args: ResolveCanonicalPatternArgs,
  atlasPresentation: PatternPresentation,
): CanonicalPatternResult {
  const candidates = FAMILY_ORDER
    .map((family) => buildCandidate(family, args.dynamicPattern, args.atlasInput, args.atlasResult, args.completeness))
    .sort((left, right) => right.score - left.score || FAMILY_ORDER.indexOf(left.family) - FAMILY_ORDER.indexOf(right.family));
  const top = candidates[0];
  const viableSecondaries = candidates.filter((candidate) => candidate.family !== top.family && !candidate.disqualified);
  const second = viableSecondaries.find((candidate) =>
    candidate.score >= MIN_SECONDARY_SCORE &&
    (round(top.score - candidate.score) <= COMPOSITE_MARGIN || hasMaterialSecondarySupport(candidate, args.atlasResult, args.dynamicPattern)),
  ) ?? viableSecondaries[0] ?? candidates[1];
  const margin = round(top.score - (second?.score ?? 0));
  const sufficientSecondary = Boolean(
    second &&
    second.score >= MIN_SECONDARY_SCORE &&
    !second.disqualified &&
    (margin <= COMPOSITE_MARGIN || hasMaterialSecondarySupport(second, args.atlasResult, args.dynamicPattern)),
  );
  const poorEvidence =
    !args.dynamicPattern.evidenceLedger.quality.usable ||
    args.completeness?.status === "failed" ||
    args.completeness?.qualityLevel === "limited";
  const mode: CanonicalSelectionMode = poorEvidence
    ? "insufficient-evidence"
    : sufficientSecondary
    ? "composite"
    : margin <= AMBIGUOUS_MARGIN
    ? "ambiguous"
    : "single";
  let primaryFamily = top.family;
  let secondaryFamily = mode === "composite" && second ? second.family : null;
  if (
    mode === "composite" &&
    ((top.family === "grounded" && second?.family === "protective") ||
      (top.family === "protective" && second?.family === "grounded")) &&
    !candidates.find((candidate) => candidate.family === "grounded")?.disqualified
  ) {
    primaryFamily = "grounded";
    secondaryFamily = "protective";
  }
  const confidence = round(
    poorEvidence
      ? Math.min(args.dynamicPattern.confidence, 0.42)
      : args.dynamicPattern.confidence * 0.52 + top.score * 0.32 + Math.min(margin, CLEAR_WIN_MARGIN) * 0.9,
  );
  const matrixResolution = resolveNamingMatrixEntry({
    primaryFamily,
    secondaryFamily,
    mode,
    vector: args.dynamicPattern.stateVector,
    dynamicPattern: args.dynamicPattern,
    atlasInput: args.atlasInput,
    atlasResult: args.atlasResult,
    confidence,
    margin,
    secondaryScore: second?.score ?? null,
    poorEvidence,
  });
  const organizingQuality = matrixResolution.organizingQuality;
  const nameSource = poorEvidence ? "limited-evidence" : matrixResolution.entry ? "naming-matrix" : "fallback";
  const name = poorEvidence
    ? "A Limited Reflection"
    : matrixResolution.entry?.displayName ?? fallbackDisplayName(primaryFamily, secondaryFamily, args.dynamicPattern);
  const signature = poorEvidence
    ? "limited:evidence"
    : matrixResolution.entry?.signature ?? buildSignature(primaryFamily, secondaryFamily, args.dynamicPattern);
  const content = poorEvidence
    ? {
        summary: "This reflection is intentionally broad because the captured signals were not strong enough for a precise pattern name.",
        explanation: [
          "Capture quality limits how specifically SoulScope can describe this scan.",
          "The result remains bounded to what was measurable and does not infer a stable identity.",
        ] as [string, string],
        dailyLife: [
          "The scan may need another recording before the pattern becomes clear.",
          "Some signals were present, but the available evidence was limited.",
          "A quieter environment may improve the next scan.",
          "The current result should be read as broad context only.",
        ] as [string, string, string, string],
        supportLines: [
          "Try again when recording conditions are clearer.",
          "Pause before treating this result as precise.",
          "Use only the broad reflection that fits your own context.",
        ] as [string, string, string],
        reflectionQuestion: "What feels most worth noticing before you scan again?",
      }
    : matrixResolution.entry?.content ?? defaultContent(name, primaryFamily, atlasPresentation);
  const rejected = candidates
    .filter((candidate) => candidate.family !== primaryFamily && candidate.family !== secondaryFamily)
    .slice(0, 6)
    .map((candidate) => ({
      id: `family:${candidate.family}`,
      name: familyDisplayName(candidate.family),
      reasons: [
        ...candidate.gates,
        candidate.contradictoryEvidence.length ? `Contradicted by ${candidate.contradictoryEvidence.join(", ")}.` : "",
        candidate.score < top.score ? `Compatibility ${candidate.score.toFixed(3)} did not exceed selected score ${top.score.toFixed(3)}.` : "",
      ].filter(Boolean),
    }));
  const grounded = candidates.find((candidate) => candidate.family === "grounded");
  if (grounded && grounded.family !== primaryFamily && grounded.family !== secondaryFamily && !rejected.some((item) => item.id === "family:grounded")) {
    rejected.push({
      id: "family:grounded",
      name: familyDisplayName("grounded"),
      reasons: [
        ...grounded.gates,
        grounded.contradictoryEvidence.length ? `Contradicted by ${grounded.contradictoryEvidence.join(", ")}.` : "",
        `Compatibility ${grounded.score.toFixed(3)} did not exceed selected score ${top.score.toFixed(3)}.`,
      ].filter(Boolean),
    });
  }
  const supportingEvidence = Array.from(new Set([...(top.supportingEvidence ?? []), ...(second?.supportingEvidence ?? [])])).slice(0, 6);
  const contradictoryEvidence = Array.from(new Set([...(top.contradictoryEvidence ?? []), ...top.gates]));
  const missingEvidence = Array.from(new Set([...args.dynamicPattern.evidenceLedger.missing.map((entry) => entry.id), ...top.missingEvidence])).slice(0, 8);

  return {
    canonicalPatternSignature: signature,
    canonicalDisplayName: name,
    canonicalFamily: primaryFamily,
    primaryFamily,
    secondaryFamily,
    stateVector: args.dynamicPattern.stateVector,
    dimensions: args.dynamicPattern.dimensions,
    confidence,
    confidenceMargin: margin,
    organizingQuality,
    resultType: mode,
    namingMatrixVersion: CANONICAL_NAMING_MATRIX_VERSION,
    evidenceLedger: args.dynamicPattern.evidenceLedger,
    dimensionLedger: args.dynamicPattern.dimensions,
    decisionLedger: {
      selected: {
        displayName: name,
        signature,
        mode,
        primaryFamily,
        secondaryFamily,
        confidence,
        confidenceMargin: margin,
        organizingQuality,
        namingMatrixVersion: CANONICAL_NAMING_MATRIX_VERSION,
        nameSource,
      },
      thresholds: {
        clearWinMargin: CLEAR_WIN_MARGIN,
        compositeMargin: COMPOSITE_MARGIN,
        ambiguousMargin: AMBIGUOUS_MARGIN,
        minSecondaryScore: MIN_SECONDARY_SCORE,
        groundedMinCapacity: GROUNDED_MIN_CAPACITY,
        groundedMinRegulation: GROUNDED_MIN_REGULATION,
      },
      supportingEvidence,
      contradictoryEvidence,
      missingEvidence,
      alternatives: candidates,
      rejected: [
        ...rejected,
        {
          id: `atlas:${args.atlasResult.profile.id}`,
          name: args.atlasResult.profile.name,
          reasons: [`Atlas profile score ${args.atlasResult.score.toFixed(3)} contributes content and diagnostics only; it cannot overwrite the canonical result.`],
        },
        {
          id: `legacy:${args.primaryPattern.id}`,
          name: args.primaryPattern.name,
          reasons: [`Legacy primary pattern score ${args.primaryPattern.confidence.toFixed(3)} is retained for transition comparison only.`],
        },
      ],
      notes: [
        mode === "composite"
          ? `Secondary family ${secondaryFamily} was incorporated because the margin ${margin.toFixed(3)} was within ${COMPOSITE_MARGIN}.`
          : `A single-family result was used because the winning margin ${margin.toFixed(3)} exceeded composite conditions or the secondary candidate was not sufficiently supported.`,
        matrixResolution.entry
          ? `Naming matrix entry ${matrixResolution.entry.signature} selected the display name.`
          : `No approved naming matrix entry matched; ${nameSource} naming was used.`,
      ],
    },
    interpretationLimits: [
      ...args.dynamicPattern.interpretationLimits,
      "The canonical name is determined from the state vector and decision ledger; Atlas and legacy names remain diagnostic inputs.",
    ],
    reflectionSource: {
      dynamicDisplayName: args.dynamicPattern.displayName,
      dynamicFamily: args.dynamicPattern.family,
      atlasProfileId: args.atlasResult.profile.id,
      atlasProfileName: args.atlasResult.profile.name,
      atlasScore: round(args.atlasResult.score),
      legacyPrimaryId: args.primaryPattern.id,
      legacyPrimaryName: args.primaryPattern.name,
    },
    engineVersion: CANONICAL_PATTERN_ENGINE_VERSION,
    ...content,
  };
}

export function canonicalPatternExpression(
  canonical: CanonicalPatternResult,
  atlasEvidenceLabels: string[],
): PatternExpression {
  const limited = canonical.decisionLedger.selected.mode === "insufficient-evidence";
  return {
    id: limited ? "signals-still-resolving" : canonical.canonicalPatternSignature,
    title: canonical.canonicalDisplayName,
    summary: canonical.summary,
    matchedSignals: Array.from(new Set([
      ...canonical.decisionLedger.supportingEvidence.map((id) => id.replaceAll("-", " ")),
      ...atlasEvidenceLabels,
    ])).slice(0, 6),
  };
}

export function canonicalPresentation(
  canonical: CanonicalPatternResult,
  atlasPresentation: PatternPresentation,
): PatternPresentation {
  return {
    ...atlasPresentation,
    summary: canonical.summary,
    explanation: canonical.explanation,
    dailyLife: canonical.dailyLife,
    reflectionQuestion: canonical.reflectionQuestion,
  };
}
