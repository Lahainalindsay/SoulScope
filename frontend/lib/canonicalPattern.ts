import type { PatternPresentation } from "./patternKnowledge";
import type { PatternExpression } from "./patternPersonalization";
import type { PatternMatch } from "./resonancePatterns";
import type { DynamicPatternResult, EvidenceEntry, PatternFamily, StateVector } from "./patternInterpretation";
import type { AtlasInput, AtlasResult, AtlasSubpatternId } from "./patternAtlas";
import type { ScanCompleteness } from "./partialScan";

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

const SINGLE_NAMES: Record<PatternFamily, string> = {
  overextended: "The Overextended Steward",
  activated: "The Coherent Accelerator",
  protective: "The Contained Communicator",
  adaptive: "The Adaptive Builder",
  recovering: "The Emerging Restorer",
  grounded: "The Grounded Navigator",
  expressive: "The Open Integrator",
  purposeful: "The Focused Creator",
  reflective: "The Quiet Processor",
  reorganizing: "The Reorganizing Explorer",
};

const COMPOSITE_NAMES: Partial<Record<string, string>> = {
  "overextended+protective": "The Guarded Steward",
  "overextended+reflective": "The Quietly Overloaded",
  "activated+protective": "The Pressurized Defender",
  "activated+reorganizing": "The Pressurized Reorganizer",
  "grounded+protective": "The Selective Navigator",
  "grounded+expressive": "The Steady Supporter",
  "grounded+adaptive": "The Steady Supporter",
  "reorganizing+protective": "The Contained Explorer",
  "recovering+reflective": "The Emerging Restorer",
  "reflective+protective": "The Reflective Protector",
};

const CONTENT: Record<string, Pick<CanonicalPatternResult, "summary" | "explanation" | "dailyLife" | "supportLines" | "reflectionQuestion">> = {
  "The Overextended Steward": {
    summary: "Your scan suggests capacity and regulation are carrying more demand than they can easily restore right now.",
    explanation: [
      "The strongest pattern is not grounded steadiness; it is continued functioning while available recovery appears low.",
      "This does not define you. It describes a present pattern where effort may be moving ahead of restoration.",
    ],
    dailyLife: [
      "Continuing to handle what matters while privately feeling the cost.",
      "Finding it easier to keep going than to fully stop.",
      "Appearing capable while needing more room than others can see.",
      "Using direction to keep moving even when capacity is asking for care.",
    ],
    supportLines: [
      "A smaller demand surface.",
      "Recovery that is protected rather than postponed.",
      "Permission to receive support before reaching depletion.",
    ],
    reflectionQuestion: "What could become lighter before your system has to ask more loudly?",
  },
  "The Guarded Steward": {
    summary: "You may still be functioning with composure while keeping more of the strain contained than others can see.",
    explanation: [
      "The primary signal is overextension, with a protective style shaping how much of that demand becomes visible.",
      "The reflection should preserve both parts: capacity appears taxed, and expression may be managing exposure carefully.",
    ],
    dailyLife: [
      "Handling what is necessary while keeping the fuller strain private.",
      "Choosing careful words even when the internal load feels high.",
      "Showing reliability while needing more room to recover.",
      "Protecting others from the full weight of what you are carrying.",
    ],
    supportLines: [
      "Reducing the load before it has to become obvious.",
      "A private place to name what is being carried.",
      "Support that does not require overexplaining.",
    ],
    reflectionQuestion: "What have you been carrying quietly that could be named more plainly?",
  },
  "The Quietly Overloaded": {
    summary: "You may be steadily maintaining while quietly carrying more than your current recovery can comfortably support.",
    explanation: [
      "The scan points toward strain distributed beneath a composed surface, rather than a simple grounded state.",
      "Reflection and effort both appear present, so the useful question is what has been requiring ongoing internal management.",
    ],
    dailyLife: [
      "Getting through the day and only noticing the depletion afterward.",
      "Feeling mentally busy even during downtime.",
      "Becoming more selective with conversation or stimulation.",
      "Managing many small demands that collectively feel heavy.",
    ],
    supportLines: [
      "Fewer simultaneous responsibilities.",
      "Quiet that actually reduces input.",
      "Naming the total load instead of minimizing each piece.",
    ],
    reflectionQuestion: "What has become so familiar that you have stopped noticing its cost?",
  },
  "The Selective Navigator": {
    summary: "Steadiness appears present, but expression is more selective than fully open.",
    explanation: [
      "The grounded signal is meaningful, but the protective component changes the final pattern from plain navigation to selective navigation.",
      "This suggests presence and direction alongside careful control over what becomes visible or shared.",
    ],
    dailyLife: [
      "Moving with clarity while choosing what belongs in conversation.",
      "Staying present without making every internal detail available.",
      "Knowing the next step while protecting private context.",
      "Offering enough, while holding some expression in reserve.",
    ],
    supportLines: [
      "Trustworthy pacing.",
      "Boundaries that preserve steadiness.",
      "Conditions where honesty does not require overexposure.",
    ],
    reflectionQuestion: "Where does selectivity feel protective, and where might it be costing connection?",
  },
  "The Pressurized Reorganizer": {
    summary: "Activation appears present while organization is still finding a workable arrangement.",
    explanation: [
      "The scan suggests movement and pressure together, rather than settled groundedness.",
      "The useful signal is not simply intensity; it is how the pattern is reorganizing under that intensity.",
    ],
    dailyLife: [
      "Trying to respond while several parts are still sorting themselves.",
      "Feeling urgency before the structure is fully clear.",
      "Revising what you mean as you say it.",
      "Needing room for the pattern to settle before acting on it.",
    ],
    supportLines: [
      "A pause before commitment.",
      "Fewer simultaneous inputs.",
      "A way to capture the next clear step without forcing the whole answer.",
    ],
    reflectionQuestion: "What needs to settle before the next step becomes clear?",
  },
};

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
    score = vector.activation * 0.32 + highActivation * 0.2 + escalation * 0.18 + fragmentation * 0.12 + (1 - vector.capacity) * 0.1 + atlasContribution;
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

function compositeKey(primary: PatternFamily, secondary: PatternFamily | null) {
  if (!secondary) return primary;
  return `${primary}+${secondary}`;
}

function displayName(primary: PatternFamily, secondary: PatternFamily | null, vector: StateVector) {
  if (primary === "activated" && !secondary && vector.organization < 0.5) return "The Pressurized Reorganizer";
  const key = compositeKey(primary, secondary);
  return COMPOSITE_NAMES[key] ?? COMPOSITE_NAMES[`${secondary}+${primary}`] ?? SINGLE_NAMES[primary];
}

function defaultContent(name: string, primary: PatternFamily, atlasPresentation: PatternPresentation): Pick<CanonicalPatternResult, "summary" | "explanation" | "dailyLife" | "supportLines" | "reflectionQuestion"> {
  const controlled = CONTENT[name];
  if (controlled) return controlled;
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
  const second = candidates.find((candidate) => candidate.family !== top.family && !candidate.disqualified) ?? candidates[1];
  const margin = round(top.score - (second?.score ?? 0));
  const sufficientSecondary = Boolean(second && second.score >= MIN_SECONDARY_SCORE && margin <= COMPOSITE_MARGIN && !second.disqualified);
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
  const name = poorEvidence ? "A Limited Reflection" : displayName(primaryFamily, secondaryFamily, args.dynamicPattern.stateVector);
  const signature = poorEvidence ? "limited:evidence" : buildSignature(primaryFamily, secondaryFamily, args.dynamicPattern);
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
    : defaultContent(name, primaryFamily, atlasPresentation);
  const confidence = round(
    poorEvidence
      ? Math.min(args.dynamicPattern.confidence, 0.42)
      : args.dynamicPattern.confidence * 0.52 + top.score * 0.32 + Math.min(margin, CLEAR_WIN_MARGIN) * 0.9,
  );
  const rejected = candidates
    .filter((candidate) => candidate.family !== primaryFamily && candidate.family !== secondaryFamily)
    .slice(0, 6)
    .map((candidate) => ({
      id: `family:${candidate.family}`,
      name: SINGLE_NAMES[candidate.family],
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
      name: SINGLE_NAMES.grounded,
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
