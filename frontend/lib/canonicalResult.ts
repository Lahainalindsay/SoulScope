import type { AtlasSignatureModel } from "./atlasSignature";
import type { CanonicalPatternResult } from "./canonicalPattern";
import type { ResonanceNarrative } from "./resonanceNarrativeEngineV3";
import type { VoiceAnalysisResult } from "./voiceSpectrum";

export const CANONICAL_RESULT_SCHEMA_VERSION = "soulscope-result-v1";
export const CONSTELLATION_GEOMETRY_VERSION = "constellation-geometry-v1";
export const DECISION_LEDGER_VERSION = "decision-ledger-v2";

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
  candidateStates: CanonicalPatternResult["decisionLedger"]["alternatives"];
  rejectedAlternatives: CanonicalPatternResult["decisionLedger"]["rejected"];
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
  constellationGeometry: {
    version: string;
    stateVector: CanonicalPatternResult["stateVector"];
    confidence: number;
    confidenceMargin: number;
    outcome: CanonicalDecisionRecord["outcome"];
  };
  pattern: {
    id: string | null;
    displayName: string;
    family: CanonicalPatternResult["canonicalFamily"] | null;
    secondaryFamily: CanonicalPatternResult["secondaryFamily"];
    resultType: CanonicalPatternResult["resultType"];
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
  canonical: CanonicalPatternResult,
  evidence: CanonicalEvidenceRecord[],
): CanonicalDecisionRecord["outcome"] {
  if (!evidence.length || evidence.every((record) => record.missingEvidence)) return "unresolved";
  if (canonical.resultType === "composite") return "boundary_blend";
  if (canonical.resultType === "single") return "canonical_state";
  return "unresolved";
}

export function buildCanonicalSoulScopeResult(args: {
  scanId: string;
  scan: VoiceAnalysisResult;
  canonical: CanonicalPatternResult;
  narrative: ResonanceNarrative;
  resonanceSignature: AtlasSignatureModel;
}): CanonicalSoulScopeResult {
  const evidenceLedger = acousticEvidence(args.scan);
  const outcome = outcomeFor(args.canonical, evidenceLedger);
  const extractorVersions = Array.from(new Set(evidenceLedger.map((record) => record.extractorVersion)));
  const confounds = Array.from(new Set([
    ...args.canonical.interpretationLimits,
    ...evidenceLedger.map((record) => record.rejectionReason).filter((reason): reason is string => Boolean(reason)),
  ]));
  const unresolved = outcome === "unresolved";
  const publicationReason = unresolved
    ? args.canonical.resultType === "insufficient-evidence"
      ? "Evidence quality, completeness, or calibration was insufficient for a supported state."
      : "Multiple candidate states remained too close to publish a forced winner."
    : outcome === "boundary_blend"
      ? "Two adjacent supported states remained materially plausible, so their boundary blend was preserved."
      : "One supported state cleared the configured evidence and confidence boundaries.";
  const decision: CanonicalDecisionRecord = {
    decisionId: `${args.scanId}:canonical-decision`,
    outcome,
    selectedResult: unresolved ? null : args.canonical.canonicalPatternSignature,
    supportingEvidence: args.canonical.decisionLedger.supportingEvidence,
    contradictoryEvidence: args.canonical.decisionLedger.contradictoryEvidence,
    missingEvidence: [
      ...args.canonical.decisionLedger.missingEvidence,
      ...evidenceLedger.filter((record) => record.missingEvidence).map((record) => record.evidenceId),
    ],
    confounds,
    candidateStates: args.canonical.decisionLedger.alternatives,
    rejectedAlternatives: args.canonical.decisionLedger.rejected,
    winningRule: unresolved ? "abstention-rule" : args.canonical.namingMatrixVersion,
    publicationReason,
    ruleVersions: [args.canonical.namingMatrixVersion, DECISION_LEDGER_VERSION],
    extractorVersions,
    modelVersions: [args.canonical.engineVersion, args.narrative.engineVersion],
  };
  const narrative = unresolved
    ? {
        ...args.narrative,
        introduction: "The available evidence does not support a reliable pattern conclusion for this scan.",
        beneathTheSurface: publicationReason,
        howThisOftenFeels: [],
        whatOthersMayNotice: [],
        strengthToday: "No unsupported strength claim was published.",
        worthNoticing: "A clearer recording or stronger calibration is needed before interpretation.",
        relationships: [],
        pairStates: [],
        higherOrderStates: [],
        meaningGraph: {
          ...args.narrative.meaningGraph,
          nodes: [],
          dominantNodeId: null,
        },
        generatedPattern: {
          ...args.narrative.generatedPattern,
          title: "Unresolved",
          dominantState: "Insufficient evidence",
          supportingQuality: "Abstention preserved",
          ruleId: "canonical-abstention-rule",
        },
      }
    : args.narrative;

  return deepFreeze({
    schemaVersion: CANONICAL_RESULT_SCHEMA_VERSION,
    scanId: args.scanId,
    createdAt: args.scan.scanMeta?.completedAt ?? new Date().toISOString(),
    evidenceLedger: { immutable: true, records: evidenceLedger },
    dimensionVector: args.canonical.dimensions,
    constellationGeometry: {
      version: CONSTELLATION_GEOMETRY_VERSION,
      stateVector: args.canonical.stateVector,
      confidence: args.canonical.confidence,
      confidenceMargin: args.canonical.confidenceMargin,
      outcome,
    },
    pattern: {
      id: unresolved ? null : args.canonical.canonicalPatternSignature,
      displayName: unresolved ? "Unresolved" : args.canonical.canonicalDisplayName,
      family: unresolved ? null : args.canonical.canonicalFamily,
      secondaryFamily: unresolved ? null : args.canonical.secondaryFamily,
      resultType: args.canonical.resultType,
    },
    decisionLedger: { immutable: true, record: decision },
    narrative,
    resonanceSignature: args.resonanceSignature,
    versions: {
      canonicalResult: CANONICAL_RESULT_SCHEMA_VERSION,
      geometry: CONSTELLATION_GEOMETRY_VERSION,
      patternEngine: args.canonical.engineVersion,
      namingMatrix: args.canonical.namingMatrixVersion,
      decisionLedger: DECISION_LEDGER_VERSION,
    },
  }) as CanonicalSoulScopeResult;
}
