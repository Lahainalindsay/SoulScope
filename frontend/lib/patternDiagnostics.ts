import type { CanonicalDecisionLedger, CanonicalPatternResult, CanonicalSelectionMode } from "./canonicalPattern";
import type { PatternFamily, StateVector } from "./patternInterpretation";
import type { JsonObject, JsonValue, ScanInterpretationDiagnosticRow } from "./data/v2/types";

export type PatternDiagnosticRecord = {
  scanId: string;
  userId?: string | null;
  canonicalDisplayName: string;
  primaryFamily: PatternFamily | string;
  secondaryFamily: PatternFamily | string | null;
  canonicalFamily?: PatternFamily | string | null;
  resultType: CanonicalSelectionMode | string;
  organizingQuality?: string | null;
  confidence: number;
  confidenceMargin: number;
  stateVector: Partial<StateVector>;
  decisionLedger?: Partial<CanonicalDecisionLedger> | null;
  evidenceLedger?: JsonObject | null;
  dimensionLedger?: JsonObject | null;
  subpatternScores?: Array<{ id: string; score: number }>;
  atlasProfileName?: string | null;
  engineVersion?: string | null;
  namingMatrixVersion?: string | null;
};

export type FrequencyBucket = {
  id: string;
  count: number;
  percentage: number;
};

export type PatternDistributionDiagnostics = {
  totalScans: number;
  primaryFamilyFrequency: FrequencyBucket[];
  secondaryFamilyFrequency: FrequencyBucket[];
  compositeResultFrequency: number;
  compositeResultPercentage: number;
  canonicalDisplayNameFrequency: FrequencyBucket[];
  atlasProfileFrequency: FrequencyBucket[];
  subpatternFrequency: FrequencyBucket[];
  dimensionStateFrequency: FrequencyBucket[];
  averageConfidence: number;
  averageWinningMargin: number;
  lowConfidencePercentage: number;
  fallbackResultPercentage: number;
  missingCameraEvidencePercentage: number;
  missingBaselineEvidencePercentage: number;
  contradictionGateChangedWinnerPercentage: number;
  closeTopTwoCandidatePercentage: number;
  lowCapacityGroundedPercentage: number;
  strainedRegulationGroundedPercentage: number;
  repeatedSameFamilyByUser: FrequencyBucket[];
  repeatedSameDisplayNameByUser: FrequencyBucket[];
  candidateDiagnostics: Array<{
    scanId: string;
    topCandidateScore: number | null;
    secondCandidateScore: number | null;
    scoreMargin: number;
    secondaryFamilyIncorporated: boolean;
    gatesFired: string[];
    requiredConditionsFailed: string[];
    influentialDimensions: string[];
    influentialEvidence: string[];
    nameSource: string;
  }>;
};

function round(value: number) {
  return Number((Number.isFinite(value) ? value : 0).toFixed(3));
}

function percentage(count: number, total: number) {
  return total ? round((count / total) * 100) : 0;
}

function frequency(values: Array<string | null | undefined>, total: number): FrequencyBucket[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    const key = value || "none";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([id, count]) => ({ id, count, percentage: percentage(count, total) }))
    .sort((left, right) => right.count - left.count || left.id.localeCompare(right.id));
}

function isObject(value: JsonValue | unknown): value is JsonObject {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : null;
}

function parseStateVector(value: JsonObject | null | undefined): Partial<StateVector> {
  if (!value) return {};
  return {
    activation: numberValue(value.activation) ?? undefined,
    organization: numberValue(value.organization) ?? undefined,
    regulation: numberValue(value.regulation) ?? undefined,
    expression: numberValue(value.expression) ?? undefined,
    relationalOrientation: numberValue(value.relationalOrientation) ?? undefined,
    direction: numberValue(value.direction) ?? undefined,
    capacity: numberValue(value.capacity) ?? undefined,
  };
}

function parseDecisionLedger(value: JsonObject | null | undefined): Partial<CanonicalDecisionLedger> | null {
  return value as Partial<CanonicalDecisionLedger> | null;
}

function parseSubpatterns(value: JsonValue | undefined): Array<{ id: string; score: number }> {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!isObject(item)) return [];
    const id = stringValue(item.id);
    const score = numberValue(item.score);
    return id && score !== null ? [{ id, score }] : [];
  });
}

export function diagnosticRecordFromCanonical(
  canonical: CanonicalPatternResult,
  scanId: string,
  userId?: string | null,
): PatternDiagnosticRecord {
  return {
    scanId,
    userId,
    canonicalDisplayName: canonical.canonicalDisplayName,
    primaryFamily: canonical.primaryFamily,
    secondaryFamily: canonical.secondaryFamily,
    canonicalFamily: canonical.canonicalFamily,
    resultType: canonical.resultType,
    organizingQuality: canonical.organizingQuality,
    confidence: canonical.confidence,
    confidenceMargin: canonical.confidenceMargin,
    stateVector: canonical.stateVector,
    decisionLedger: canonical.decisionLedger,
    evidenceLedger: canonical.evidenceLedger as unknown as JsonObject,
    dimensionLedger: canonical.dimensionLedger as unknown as JsonObject,
    atlasProfileName: canonical.reflectionSource.atlasProfileName,
    engineVersion: canonical.engineVersion,
    namingMatrixVersion: canonical.namingMatrixVersion,
  };
}

export function diagnosticRecordFromRow(row: ScanInterpretationDiagnosticRow): PatternDiagnosticRecord {
  const decisionLedger = parseDecisionLedger(row.decision_ledger);
  const selected = decisionLedger?.selected;
  return {
    scanId: row.scan_id,
    userId: row.user_id,
    canonicalDisplayName: row.canonical_display_name ?? row.display_name ?? "Unknown",
    primaryFamily: row.primary_family ?? row.canonical_family ?? row.family ?? "unknown",
    secondaryFamily: row.secondary_family ?? null,
    canonicalFamily: row.canonical_family ?? row.family,
    resultType: row.result_type ?? selected?.mode ?? "single",
    organizingQuality: row.organizing_quality ?? selected?.organizingQuality ?? null,
    confidence: row.confidence ?? 0,
    confidenceMargin: row.confidence_margin ?? selected?.confidenceMargin ?? 0,
    stateVector: parseStateVector(row.state_vector),
    decisionLedger,
    evidenceLedger: row.evidence_ledger,
    dimensionLedger: row.dimension_ledger,
    subpatternScores: parseSubpatterns(row.subpattern_scores),
    atlasProfileName: isObject(row.reflection_source) ? stringValue(row.reflection_source.atlasProfileName) : null,
    engineVersion: row.engine_version,
    namingMatrixVersion: row.naming_matrix_version ?? selected?.namingMatrixVersion ?? null,
  };
}

function missingEvidenceIds(record: PatternDiagnosticRecord) {
  const ledgerMissing = record.decisionLedger?.missingEvidence;
  if (Array.isArray(ledgerMissing)) return ledgerMissing.filter((item): item is string => typeof item === "string");
  const evidenceLedger = record.evidenceLedger;
  const missing = evidenceLedger?.missing;
  if (!Array.isArray(missing)) return [];
  return missing.flatMap((item) => isObject(item) && typeof item.id === "string" ? [item.id] : []);
}

function dimensionStates(record: PatternDiagnosticRecord) {
  const ledger = record.dimensionLedger;
  if (!ledger) return [];
  return Object.entries(ledger).flatMap(([key, value]) => {
    if (!isObject(value)) return [];
    const state = stringValue(value.state);
    return state ? [`${key}:${state}`] : [];
  });
}

function candidateScores(record: PatternDiagnosticRecord) {
  const alternatives = record.decisionLedger?.alternatives;
  if (!Array.isArray(alternatives)) return [];
  return alternatives
    .flatMap((candidate) => {
      if (!candidate || typeof candidate !== "object") return [];
      const family = "family" in candidate && typeof candidate.family === "string" ? candidate.family : "unknown";
      const score = "score" in candidate ? numberValue(candidate.score) : null;
      const rawScore = "rawScore" in candidate ? numberValue(candidate.rawScore) : null;
      const gates = "gates" in candidate && Array.isArray(candidate.gates) ? candidate.gates.filter((item): item is string => typeof item === "string") : [];
      const disqualified = "disqualified" in candidate && candidate.disqualified === true;
      return score === null ? [] : [{ family, score, rawScore: rawScore ?? score, gates, disqualified }];
    })
    .sort((left, right) => right.score - left.score);
}

function candidateDiagnostics(record: PatternDiagnosticRecord): PatternDistributionDiagnostics["candidateDiagnostics"][number] {
  const candidates = candidateScores(record);
  const selected = record.decisionLedger?.selected;
  const selectedFamily = selected?.primaryFamily ?? record.primaryFamily;
  const gatesFired = candidates.flatMap((candidate) => candidate.gates);
  const rawTop = [...candidates].sort((left, right) => right.rawScore - left.rawScore)[0];
  const top = candidates[0];
  const second = candidates.find((candidate) => candidate.family !== top?.family);
  const influentialDimensions = Object.entries(record.stateVector)
    .filter(([, value]) => typeof value === "number" && (value <= 0.34 || value >= 0.66))
    .map(([key]) => key);
  return {
    scanId: record.scanId,
    topCandidateScore: top?.score ?? null,
    secondCandidateScore: second?.score ?? null,
    scoreMargin: record.confidenceMargin,
    secondaryFamilyIncorporated: Boolean(record.secondaryFamily),
    gatesFired,
    requiredConditionsFailed: record.decisionLedger?.rejected?.flatMap((item) => item.reasons).filter((reason) => /required|below|cannot|too low|requires/i.test(reason)) ?? [],
    influentialDimensions,
    influentialEvidence: record.decisionLedger?.supportingEvidence ?? [],
    nameSource: selected?.nameSource ?? "unknown",
  };
}

export function analyzePatternDistribution(records: PatternDiagnosticRecord[]): PatternDistributionDiagnostics {
  const totalScans = records.length;
  const confidenceValues = records.map((record) => record.confidence);
  const marginValues = records.map((record) => record.confidenceMargin);
  const diagnostics = records.map(candidateDiagnostics);
  const missingEvidence = records.map(missingEvidenceIds);
  const lowCapacity = records.filter((record) => (record.stateVector.capacity ?? 1) < 0.34);
  const strainedRegulation = records.filter((record) => (record.stateVector.regulation ?? 1) < 0.34);
  const repeatedFamilyKeys = records.map((record) => record.userId ? `${record.userId}:${record.primaryFamily}` : null).filter(Boolean);
  const repeatedNameKeys = records.map((record) => record.userId ? `${record.userId}:${record.canonicalDisplayName}` : null).filter(Boolean);

  return {
    totalScans,
    primaryFamilyFrequency: frequency(records.map((record) => String(record.primaryFamily)), totalScans),
    secondaryFamilyFrequency: frequency(records.map((record) => record.secondaryFamily ? String(record.secondaryFamily) : null), totalScans),
    compositeResultFrequency: records.filter((record) => record.resultType === "composite").length,
    compositeResultPercentage: percentage(records.filter((record) => record.resultType === "composite").length, totalScans),
    canonicalDisplayNameFrequency: frequency(records.map((record) => record.canonicalDisplayName), totalScans),
    atlasProfileFrequency: frequency(records.map((record) => record.atlasProfileName), totalScans),
    subpatternFrequency: frequency(records.flatMap((record) => record.subpatternScores?.filter((item) => item.score >= 0.45).map((item) => item.id) ?? []), totalScans),
    dimensionStateFrequency: frequency(records.flatMap(dimensionStates), totalScans),
    averageConfidence: round(confidenceValues.reduce((sum, value) => sum + value, 0) / Math.max(1, totalScans)),
    averageWinningMargin: round(marginValues.reduce((sum, value) => sum + value, 0) / Math.max(1, totalScans)),
    lowConfidencePercentage: percentage(records.filter((record) => record.confidence < 0.48).length, totalScans),
    fallbackResultPercentage: percentage(records.filter((record) => record.resultType === "insufficient-evidence" || record.decisionLedger?.selected?.nameSource === "fallback").length, totalScans),
    missingCameraEvidencePercentage: percentage(missingEvidence.filter((ids) => ids.some((id) => /camera|facial|vocal-facial|face/i.test(id))).length, totalScans),
    missingBaselineEvidencePercentage: percentage(missingEvidence.filter((ids) => ids.some((id) => /baseline|returning|longitudinal|recovery-evidence/i.test(id))).length, totalScans),
    contradictionGateChangedWinnerPercentage: percentage(records.filter((record) => {
      const candidates = candidateScores(record);
      const rawTop = [...candidates].sort((left, right) => right.rawScore - left.rawScore)[0];
      return Boolean(rawTop && rawTop.family !== record.primaryFamily && rawTop.gates.length);
    }).length, totalScans),
    closeTopTwoCandidatePercentage: percentage(records.filter((record) => record.confidenceMargin <= 0.18).length, totalScans),
    lowCapacityGroundedPercentage: percentage(lowCapacity.filter((record) => record.primaryFamily === "grounded").length, Math.max(1, lowCapacity.length)),
    strainedRegulationGroundedPercentage: percentage(strainedRegulation.filter((record) => record.primaryFamily === "grounded").length, Math.max(1, strainedRegulation.length)),
    repeatedSameFamilyByUser: frequency(repeatedFamilyKeys, repeatedFamilyKeys.length).filter((bucket) => bucket.count > 1),
    repeatedSameDisplayNameByUser: frequency(repeatedNameKeys, repeatedNameKeys.length).filter((bucket) => bucket.count > 1),
    candidateDiagnostics: diagnostics,
  };
}
