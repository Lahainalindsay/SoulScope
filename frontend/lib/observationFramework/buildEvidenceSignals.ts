import { EVIDENCE_DEFINITIONS } from "./evidenceDefinitions";
import type { CaptureQuality, ConfidenceLevel, EvidenceSignal, RawFeatureMeasurement } from "./types";

const QUALITY_RANK: Record<CaptureQuality, number> = { poor: 0, limited: 1, good: 2, high: 3 };

function confidence(featureCount: number, quality: CaptureQuality): ConfidenceLevel {
  if (quality === "poor") return "exploratory";
  if (featureCount >= 3 && QUALITY_RANK[quality] >= 2) return "high";
  if (featureCount >= 2) return "moderate";
  return "exploratory";
}

export function buildEvidenceSignals(rawFeatures: RawFeatureMeasurement[]): EvidenceSignal[] {
  const byId = new Map(rawFeatures.map((feature) => [feature.featureId, feature]));
  const quality = rawFeatures.reduce<CaptureQuality>((best, feature) => QUALITY_RANK[feature.quality] < QUALITY_RANK[best] ? feature.quality : best, "high");

  return EVIDENCE_DEFINITIONS.flatMap((definition) => {
    if (QUALITY_RANK[quality] < QUALITY_RANK[definition.minimumCaptureQuality]) return [];
    if (definition.requiredFeatures.some((id) => !byId.has(id))) return [];
    const result = definition.calculate(byId);
    if (!result) return [];
    const contributing = result.contributingFeatureIds.filter((id) => byId.has(id));
    const sourceCaptureIds = [...new Set(contributing.flatMap((id) => byId.get(id)?.captureIds ?? []))];
    const captureConfidence = confidence(contributing.length, quality);
    const evidenceConfidence = confidence(contributing.length, quality);
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
