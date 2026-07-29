import type { ContinuousConstellationGeometry } from "./canonicalConstellationEngine";
import type { CanonicalDimensionRecord } from "./canonicalDimensionEngine";
import type { CrossConstellationInteraction } from "./canonicalInteractionEngine";

export const MEANING_ENGINE_VERSION = "canonical-meaning-engine-v0.1";

export type MeaningObject = {
  meaning_id: string;
  primary_theme: string;
  secondary_theme: string | null;
  supporting_dimensions: string[];
  supporting_interactions: string[];
  confidence: number;
  uncertainty: number;
  evidence_references: string[];
  alternatives: Array<{
    meaning_id: string;
    reason: string;
    confidence: number;
  }>;
  reflection_direction: string;
  rule_version: string;
};

function round(value: number) {
  return Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));
}

function topDimensions(dimensions: CanonicalDimensionRecord[]) {
  return [...dimensions]
    .sort((left, right) => Math.abs(right.value - 0.5) * right.confidence - Math.abs(left.value - 0.5) * left.confidence)
    .slice(0, 3);
}

function evidenceFor(dimensions: CanonicalDimensionRecord[], interactions: CrossConstellationInteraction[]) {
  return Array.from(new Set([
    ...dimensions.flatMap((item) => item.supportingEvidence),
    ...interactions.flatMap((item) => item.evidenceReferences),
  ])).sort();
}

function themeFromGeometry(geometry: ContinuousConstellationGeometry) {
  if (geometry.boundaryBlend) return "Boundary transition";
  const resolved = Object.values(geometry.constellations)
    .filter((decision) => decision.winner !== "unresolved")
    .map((decision) => `${decision.constellation}:${decision.winner}`);
  return resolved.length >= 3 ? "Cross-constellation pattern candidate" : "Supported local observations";
}

export function buildMeaningObjects(
  dimensions: CanonicalDimensionRecord[],
  geometry: ContinuousConstellationGeometry,
  interactions: CrossConstellationInteraction[],
): MeaningObject[] {
  const strongestDimensions = topDimensions(dimensions);
  const strongestInteractions = interactions.slice(0, 3);
  const suppressGlobal = interactions.some((item) => item.interactionId === "INT-008");
  const confidence = round((geometry.confidence + strongestDimensions.reduce((sum, item) => sum + item.confidence, 0) / Math.max(1, strongestDimensions.length)) / 2);
  const primaryTheme = suppressGlobal ? "Global pattern suppressed" : themeFromGeometry(geometry);
  const secondaryTheme = strongestInteractions[0]?.kind ?? null;
  const alternatives = Object.values(geometry.constellations).flatMap((decision) => decision.nearestRegions.slice(1, 3).map((region) => ({
    meaning_id: `meaning:${decision.constellation}:${region.region}`,
    reason: `${decision.constellation} candidate compatibility ${region.compatibility.toFixed(3)} remained below the selected candidate.`,
    confidence: region.compatibility,
  }))).slice(0, 8);

  const primary: MeaningObject = {
    meaning_id: suppressGlobal
      ? "meaning:global-pattern-suppressed"
      : geometry.boundaryBlend
        ? `meaning:${geometry.boundaryBlend.primaryRegion}:${geometry.boundaryBlend.secondaryRegion}:blend`
        : `meaning:${Object.values(geometry.constellations).map((decision) => `${decision.constellation}-${decision.winner}`).join(":")}`,
    primary_theme: primaryTheme,
    secondary_theme: secondaryTheme,
    supporting_dimensions: strongestDimensions.map((item) => item.dimensionId),
    supporting_interactions: strongestInteractions.map((item) => item.interactionId),
    confidence,
    uncertainty: round(1 - confidence),
    evidence_references: evidenceFor(strongestDimensions, strongestInteractions),
    alternatives,
    reflection_direction: suppressGlobal
      ? "Report supported local observations only; do not create a global pattern name."
      : geometry.boundaryBlend
      ? "Preserve the transition instead of forcing one interpretation."
      : "Summarize the strongest supported geometry without adding unsupported certainty.",
    rule_version: MEANING_ENGINE_VERSION,
  };

  const interactionMeanings = strongestInteractions.map((item) => ({
    meaning_id: `meaning:${item.interactionId}`,
    primary_theme: item.kind,
    secondary_theme: item.dimensions.join(" + "),
    supporting_dimensions: item.dimensions,
    supporting_interactions: [item.interactionId],
    confidence: item.confidence,
    uncertainty: item.uncertainty,
    evidence_references: item.evidenceReferences,
    alternatives: [],
    reflection_direction: item.rationale,
    rule_version: MEANING_ENGINE_VERSION,
  }));

  return [primary, ...interactionMeanings];
}
