import { EVIDENCE_DEFINITIONS } from "./evidenceDefinitions";
import type { CaptureQuality, ConfidenceLevel, EvidenceSignal, RawFeatureMeasurement } from "./types";

const QUALITY_RANK: Record<CaptureQuality, number> = { poor: 0, limited: 1, good: 2, high: 3 };

function confidence(featureCount: number, expectedCount: number, quality: CaptureQuality, strength: number): ConfidenceLevel {
  if (quality === "poor") return "exploratory";
  const coverage = featureCount / Math.max(expectedCount, 1);
  if (featureCount >= 4 && coverage >= 0.7 && QUALITY_RANK[quality] >= 2 && strength >= 0.18) return "high";
  if (featureCount >= 3 && coverage >= 0.5 && QUALITY_RANK[quality] >= 1) return "moderate";
  return "exploratory";
}

export function buildEvidenceSignals(rawFeatures: RawFeatureMeasurement[]): EvidenceSignal[] {
  const byId = new Map(rawFeatures.map((feature) => [feature.featureId, feature]));
  const quality = rawFeatures.reduce<CaptureQuality>((lowest, feature) => QUALITY_RANK[feature.quality] < QUALITY_RANK[lowest] ? feature.quality : lowest, "high");

  return EVIDENCE_DEFINITIONS.flatMap((definition) => {
    if (QUALITY_RANK[quality] < QUALITY_RANK[definition.minimumCaptureQuality]) return [];
    if (definition.requiredFeatures.some((id) => !byId.has(id))) return [];
    const result = definition.calculate(byId);
    if (!result) return [];
    const contributing = result.contributingFeatureIds.filter((id) => byId.has(id));
    const sourceCaptureIds = Array.from(new Set(contributing.flatMap((id) => byId.get(id)?.captureIds ?? [])));
    const expectedCount = Math.max(definition.requiredFeatures.length + definition.optionalFeatures.length, contributing.length);
    const captureConfidence = quality === "high" || quality === "good" ? "high" : quality === "limited" ? "moderate" : "exploratory";
    const evidenceConfidence = confidence(contributing.length, expectedCount, quality, result.strength);
    return [{
      id: `evidence:${definition.id}`,
      evidenceId: definition.id,
      label: definition.label,
      direction: result.direction,
      strength: Math.max(0, Math.min(1, result.strength)),
      contributingFeatureIds: contributing,
      sourceCaptureIds,
      captureConfidence,
      evidenceConfidence,
      validityLevel: definition.validityLevel,
      ruleVersion: definition.version,
      notes: result.notes,
    }];
  });
}