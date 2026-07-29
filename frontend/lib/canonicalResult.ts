import type { AtlasSignatureModel } from "./atlasSignature";
import { buildContinuousConstellationGeometry, type ContinuousConstellationGeometry } from "./canonicalConstellationEngine";
import { buildCanonicalDimensions, CANONICAL_DIMENSION_ENGINE_VERSION, DIMENSION_REGISTRY_VERSION, type CanonicalDimensionRecord } from "./canonicalDimensionEngine";
import { buildCrossConstellationInteractions, INTERACTION_ENGINE_VERSION, type CrossConstellationInteraction } from "./canonicalInteractionEngine";
import { buildMeaningObjects, MEANING_ENGINE_VERSION, type MeaningObject } from "./canonicalMeaningEngine";
import type { CanonicalPatternResult } from "./canonicalPattern";
import { buildCanonicalResonanceSignature, CANONICAL_SIGNATURE_ENGINE_VERSION } from "./canonicalResonanceSignature";
import type { ResonanceNarrative } from "./resonanceNarrativeEngineV3";
import type { VoiceAnalysisResult } from "./voiceSpectrum";

export const CANONICAL_RESULT_SCHEMA_VERSION = "soulscope-result-v1";
export const CONSTELLATION_GEOMETRY_VERSION = "constellation-geometry-v1";
export const DECISION_LEDGER_VERSION = "decision-ledger-v2";
export const PHASE_B_CANONICAL_VERSION = "phase-b-canonical-v1";

export type CanonicalEvidenceRecord = {
  evidenceId: string;
  featureId: string;
  measuredValue: number | null;
  units: string | null;
  confidence: number;
  uncertainty: number;
  quality: string;
  missingEvidence: boolean;
  rejectionReason: string | null;
  provenance: {
    captureId: string;
    captureKind: string;
    segmentStartMs: number;
    segmentEndMs: number;
    method: string;
    extractor: string;
  };
  extractorVersion: string;
  featureVersion: string;
  timestamp: string;
};

export type CanonicalDecisionRecord = {
  decisionId: string;
  outcome: "canonical_state" | "boundary_blend" | "unresolved";
  selectedResult: string | null;
  supportingEvidence: string[];
  contradictoryEvidence: string[];
  missingEvidence: string[];
  confounds: string[];
  candidateStates: Array<{
    id: string;
    name: string;
    confidence: number;
    evidence: string[];
    reason: string;
  }>;
  rejectedAlternatives: Array<{
    id: string;
    name: string;
    reasons: string[];
  }>;
  winningRule: string;
  publicationReason: string;
  ruleVersions: string[];
  extractorVersions: string[];
  modelVersions: string[];
};

export type CanonicalSoulScopeResult = {
  schemaVersion: string;
  scanId: string;
  createdAt: string;
  evidenceLedger: {
    immutable: true;
    records: CanonicalEvidenceRecord[];
  };
  dimensionVector: CanonicalPatternResult["dimensions"];
  phaseBDimensions: {
    immutable: true;
    version: string;
    registryVersion: string;
    records: CanonicalDimensionRecord[];
  };
  constellationGeometry: {
    version: string;
    stateVector: CanonicalPatternResult["stateVector"];
    confidence: number;
    confidenceMargin: number;
    outcome: CanonicalDecisionRecord["outcome"];
  };
  phaseBConstellation: {
    immutable: true;
    geometry: ContinuousConstellationGeometry;
  };
  phaseBInteractions: {
    immutable: true;
    version: string;
    records: CrossConstellationInteraction[];
  };
  meaningObjects: {
    immutable: true;
    version: string;
    records: MeaningObject[];
  };
  pattern: {
    id: string | null;
    displayName: string;
    family: CanonicalPatternResult["canonicalFamily"] | null;
    secondaryFamily: CanonicalPatternResult["secondaryFamily"];
    resultType: CanonicalPatternResult["resultType"];
    sourceMeaningIds: string[];
  };
  decisionLedger: {
    immutable: true;
    record: CanonicalDecisionRecord;
  };
  narrative: ResonanceNarrative;
  resonanceSignature: AtlasSignatureModel;
  versions: {
    canonicalResult: string;
    geometry: string;
    patternEngine: string;
    namingMatrix: string;
    decisionLedger: string;
    phaseB: string;
    dimensionEngine: string;
    dimensionRegistry: string;
    interactionEngine: string;
    meaningEngine: string;
    resonanceSignature: string;
  };
};

function clamp(value: number) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value as Record<string, unknown>)) {
    deepFreeze(child);
  }
  return Object.freeze(value);
}

function acousticEvidence(scan: VoiceAnalysisResult): CanonicalEvidenceRecord[] {
  const promptAnalyses = scan.analysisDebug?.promptAnalyses ?? [];
  const acoustics = promptAnalyses.length
    ? promptAnalyses.map((prompt) => prompt.canonicalAcoustic).filter(Boolean)
    : scan.canonicalAcoustic
      ? [scan.canonicalAcoustic]
      : [];

  return acoustics.flatMap((analysis) => analysis!.measurements.map((measurement) => {
    const missingEvidence = measurement.value === null || Boolean(measurement.rejection_reason);
    return {
      evidenceId: `${measurement.source_capture_id}:${measurement.feature_id}:${measurement.feature_version}`,
      featureId: measurement.feature_id,
      measuredValue: measurement.value,
      units: measurement.unit,
      confidence: clamp(measurement.confidence),
      uncertainty: Number((1 - clamp(measurement.confidence)).toFixed(3)),
      quality: measurement.quality,
      missingEvidence,
      rejectionReason: measurement.rejection_reason,
      provenance: {
        captureId: measurement.source_capture_id,
        captureKind: measurement.capture_kind,
        segmentStartMs: measurement.segment_start_ms,
        segmentEndMs: measurement.segment_end_ms,
        method: measurement.method,
        extractor: measurement.extractor,
      },
      extractorVersion: measurement.extractor_version,
      featureVersion: measurement.feature_version,
      timestamp: measurement.created_at,
    };
  }));
}

function outcomeFor(
  evidence: CanonicalEvidenceRecord[],
  phaseBConstellation: ContinuousConstellationGeometry,
  phaseBInteractions: CrossConstellationInteraction[],
): CanonicalDecisionRecord["outcome"] {
  if (!evidence.length || evidence.every((record) => record.missingEvidence)) return "unresolved";
  if (phaseBInteractions.some((interaction) => interaction.interactionId === "INT-008")) return "unresolved";
  if (phaseBConstellation.boundaryBlend) return "boundary_blend";
  return "canonical_state";
}

function patternNameFor(primaryMeaning: MeaningObject | undefined, outcome: CanonicalDecisionRecord["outcome"]) {
  if (outcome === "unresolved") return "Unresolved";
  if (!primaryMeaning) return "Supported local observations";
  return primaryMeaning.primary_theme;
}

function patternResultTypeFor(outcome: CanonicalDecisionRecord["outcome"]): CanonicalPatternResult["resultType"] {
  if (outcome === "unresolved") return "insufficient-evidence";
  if (outcome === "boundary_blend") return "composite";
  return "single";
}

function phaseBCandidates(meaningObjects: MeaningObject[]) {
  return meaningObjects.map((meaning) => ({
    id: meaning.meaning_id,
    name: meaning.primary_theme,
    confidence: meaning.confidence,
    evidence: meaning.evidence_references,
    reason: meaning.reflection_direction,
  }));
}

function phaseBRejected(meaningObjects: MeaningObject[]) {
  return meaningObjects.flatMap((meaning) => meaning.alternatives.map((alternative) => ({
    id: alternative.meaning_id,
    name: alternative.meaning_id,
    reasons: [alternative.reason],
  })));
}

function narrativeFromMeaning(
  narrative: ResonanceNarrative,
  primaryMeaning: MeaningObject | undefined,
  outcome: CanonicalDecisionRecord["outcome"],
  publicationReason: string,
  dimensions: CanonicalDimensionRecord[],
): ResonanceNarrative {
  if (outcome === "unresolved") {
    const dimensionValues = new Map<string, number>(dimensions.map((dimension) => [dimension.dimensionId, dimension.value]));
    const localDimensions = primaryMeaning?.supporting_dimensions.length
      ? ` Supported local dimensions: ${primaryMeaning.supporting_dimensions.map((id) => `${id}=${dimensionValues.get(id)?.toFixed(3) ?? "unresolved"}`).join(", ")}.`
      : "";
    const globalSuppressed = publicationReason.startsWith("Global pattern naming was suppressed");
    return {
      ...narrative,
      introduction: globalSuppressed
        ? "The available evidence supports local observations, but not a reliable global pattern conclusion."
        : "The available evidence does not support a reliable pattern conclusion for this scan.",
      beneathTheSurface: publicationReason,
      howThisOftenFeels: [],
      whatOthersMayNotice: [],
      strengthToday: "No unsupported strength claim was published.",
      worthNoticing: `A clearer recording or stronger calibration is needed before global interpretation.${localDimensions}`.trim(),
      relationships: [],
      pairStates: [],
      higherOrderStates: [],
      meaningGraph: {
        ...narrative.meaningGraph,
        nodes: [],
        dominantNodeId: null,
      },
      generatedPattern: {
        ...narrative.generatedPattern,
        title: "Unresolved",
        dominantState: "Insufficient evidence",
        supportingQuality: "Abstention preserved",
        ruleId: "canonical-abstention-rule",
      },
    };
  }

  const theme = primaryMeaning?.primary_theme ?? "Supported local observations";
  const secondary = primaryMeaning?.secondary_theme
    ? `The strongest interaction is ${primaryMeaning.secondary_theme.replaceAll("_", " ")}.`
    : "The result summarizes the strongest supported geometry without adding unsupported certainty.";
  const alternatives = primaryMeaning?.alternatives.length
    ? `Alternatives remain recorded: ${primaryMeaning.alternatives.slice(0, 2).map((item) => item.meaning_id).join(", ")}.`
    : "No stronger alternative cleared the canonical decision path.";

  return {
    ...narrative,
    introduction: theme,
    beneathTheSurface: secondary,
    strengthToday: primaryMeaning?.reflection_direction ?? "Summarize the supported geometry without adding unsupported certainty.",
    worthNoticing: alternatives,
    generatedPattern: {
      ...narrative.generatedPattern,
      title: theme,
      dominantState: theme,
      supportingQuality: secondary,
      ruleId: primaryMeaning?.rule_version ?? MEANING_ENGINE_VERSION,
    },
  };
}

export function buildCanonicalSoulScopeResult(args: {
  scanId: string;
  scan: VoiceAnalysisResult;
  canonical: CanonicalPatternResult;
  narrative: ResonanceNarrative;
  resonanceSignature: AtlasSignatureModel;
}): CanonicalSoulScopeResult {
  const evidenceLedger = acousticEvidence(args.scan);
  const phaseBDimensions = buildCanonicalDimensions(evidenceLedger);
  const phaseBConstellation = buildContinuousConstellationGeometry(phaseBDimensions);
  const phaseBInteractions = buildCrossConstellationInteractions(phaseBDimensions, phaseBConstellation);
  const meaningObjects = buildMeaningObjects(phaseBDimensions, phaseBConstellation, phaseBInteractions);
  const outcome = outcomeFor(evidenceLedger, phaseBConstellation, phaseBInteractions);
  const primaryMeaning = meaningObjects[0];
  const extractorVersions = Array.from(new Set(evidenceLedger.map((record) => record.extractorVersion)));
  const confounds = Array.from(new Set([
    ...args.canonical.interpretationLimits,
    ...evidenceLedger.map((record) => record.rejectionReason).filter((reason): reason is string => Boolean(reason)),
  ]));
  const unresolved = outcome === "unresolved";
  const allEvidenceMissing = !evidenceLedger.length || evidenceLedger.every((record) => record.missingEvidence);
  const publicationReason = unresolved
    ? !allEvidenceMissing && phaseBInteractions.some((interaction) => interaction.interactionId === "INT-008")
      ? "Global pattern naming was suppressed because at least two constellations remained unresolved."
      : "Evidence quality, completeness, or calibration was insufficient for a supported state."
    : outcome === "boundary_blend"
      ? "Two adjacent supported states remained materially plausible, so their boundary blend was preserved."
      : "A Meaning Object produced from Phase B dimensions and interactions cleared the canonical evidence path.";
  const decision: CanonicalDecisionRecord = {
    decisionId: `${args.scanId}:canonical-decision`,
    outcome,
    selectedResult: unresolved ? null : primaryMeaning?.meaning_id ?? null,
    supportingEvidence: Array.from(new Set([
      ...(primaryMeaning?.evidence_references ?? []),
      ...phaseBDimensions.flatMap((dimension) => dimension.supportingEvidence),
      ...phaseBInteractions.flatMap((interaction) => interaction.evidenceReferences),
    ])).sort(),
    contradictoryEvidence: Array.from(new Set(phaseBDimensions.flatMap((dimension) => dimension.contradictoryEvidence))).sort(),
    missingEvidence: [
      ...phaseBDimensions.flatMap((dimension) => dimension.missingEvidence),
      ...evidenceLedger.filter((record) => record.missingEvidence).map((record) => record.evidenceId),
    ],
    confounds,
    candidateStates: phaseBCandidates(meaningObjects),
    rejectedAlternatives: [
      ...phaseBRejected(meaningObjects),
      {
        id: `compatibility:${args.canonical.canonicalPatternSignature}`,
        name: args.canonical.canonicalDisplayName,
        reasons: ["Compatibility pattern result is retained for old data surfaces only and cannot determine published output."],
      },
    ],
    winningRule: unresolved ? "abstention-rule" : primaryMeaning?.rule_version ?? MEANING_ENGINE_VERSION,
    publicationReason,
    ruleVersions: [
      args.canonical.namingMatrixVersion,
      DECISION_LEDGER_VERSION,
      CANONICAL_DIMENSION_ENGINE_VERSION,
      phaseBConstellation.version,
      INTERACTION_ENGINE_VERSION,
      MEANING_ENGINE_VERSION,
    ],
    extractorVersions,
    modelVersions: [args.canonical.engineVersion, args.narrative.engineVersion, PHASE_B_CANONICAL_VERSION],
  };
  const narrative = narrativeFromMeaning(args.narrative, primaryMeaning, outcome, publicationReason, phaseBDimensions);

  const resonanceSignature = buildCanonicalResonanceSignature({
    dimensions: phaseBDimensions,
    geometry: phaseBConstellation,
    interactions: phaseBInteractions,
    meaningObjects,
  });

  return deepFreeze({
    schemaVersion: CANONICAL_RESULT_SCHEMA_VERSION,
    scanId: args.scanId,
    createdAt: args.scan.scanMeta?.completedAt ?? new Date().toISOString(),
    evidenceLedger: { immutable: true, records: evidenceLedger },
    dimensionVector: args.canonical.dimensions,
    phaseBDimensions: {
      immutable: true,
      version: CANONICAL_DIMENSION_ENGINE_VERSION,
      registryVersion: DIMENSION_REGISTRY_VERSION,
      records: phaseBDimensions,
    },
    constellationGeometry: {
      version: CONSTELLATION_GEOMETRY_VERSION,
      stateVector: args.canonical.stateVector,
      confidence: args.canonical.confidence,
      confidenceMargin: args.canonical.confidenceMargin,
      outcome,
    },
    phaseBConstellation: { immutable: true, geometry: phaseBConstellation },
    phaseBInteractions: {
      immutable: true,
      version: INTERACTION_ENGINE_VERSION,
      records: phaseBInteractions,
    },
    meaningObjects: {
      immutable: true,
      version: MEANING_ENGINE_VERSION,
      records: meaningObjects,
    },
    pattern: {
      id: unresolved ? null : primaryMeaning?.meaning_id ?? null,
      displayName: patternNameFor(primaryMeaning, outcome),
      family: null,
      secondaryFamily: null,
      resultType: patternResultTypeFor(outcome),
      sourceMeaningIds: meaningObjects.map((meaning) => meaning.meaning_id),
    },
    decisionLedger: { immutable: true, record: decision },
    narrative,
    resonanceSignature,
    versions: {
      canonicalResult: CANONICAL_RESULT_SCHEMA_VERSION,
      geometry: CONSTELLATION_GEOMETRY_VERSION,
      patternEngine: args.canonical.engineVersion,
      namingMatrix: args.canonical.namingMatrixVersion,
      decisionLedger: DECISION_LEDGER_VERSION,
      phaseB: PHASE_B_CANONICAL_VERSION,
      dimensionEngine: CANONICAL_DIMENSION_ENGINE_VERSION,
      dimensionRegistry: DIMENSION_REGISTRY_VERSION,
      interactionEngine: INTERACTION_ENGINE_VERSION,
      meaningEngine: MEANING_ENGINE_VERSION,
      resonanceSignature: CANONICAL_SIGNATURE_ENGINE_VERSION,
    },
  }) as CanonicalSoulScopeResult;
}
