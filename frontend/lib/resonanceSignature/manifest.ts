import { CONTOUR_THRESHOLDS } from "./registry";
import { sha256Hex } from "./seed";
import type { NormalizedResonanceSignature, ResonanceSignatureManifest, VisualMappingEntry } from "./types";

export function buildManifest(input: NormalizedResonanceSignature, seed: string, svg: string, scalarChecksum: string): ResonanceSignatureManifest {
  const visualMappingEntries: VisualMappingEntry[] = [];
  const missingDimensions: string[] = [];
  for (const constellation of Object.values(input.constellations)) {
    for (const dimension of constellation.dimensions) {
      visualMappingEntries.push({
        visualProperty: `${constellation.constellationId}.${dimension.dimensionId}.radialExtent`,
        sourcePath: `constellations.${constellation.constellationId}.dimensions.${dimension.dimensionId}.mean`,
        sourceValue: dimension.mean,
        renderedValue: dimension.radialExtent,
      });
      visualMappingEntries.push({
        visualProperty: `${constellation.constellationId}.${dimension.dimensionId}.contourCount`,
        sourcePath: `constellations.${constellation.constellationId}.dimensions.${dimension.dimensionId}.evidenceCoverage`,
        sourceValue: dimension.evidenceCoverage,
        renderedValue: dimension.contourCount,
      });
      if (dimension.unresolved) missingDimensions.push(dimension.dimensionId);
    }
  }
  const warnings = [
    input.baselineTrust < 0.7 ? "Baseline ghost suppressed because baselineTrust is below 0.70." : "",
    missingDimensions.length ? "Missing dimensions create interrupted arcs and voids." : "",
  ].filter(Boolean);
  return Object.freeze({
    inputContractVersion: input.contractVersion,
    rendererVersion: input.rendererVersion,
    canonicalResultVersion: input.resultVersion,
    seed,
    normalizedParameters: { scalarChecksum, overallCoherence: input.overallCoherence, overallCoverage: input.overallCoverage },
    contourThresholds: CONTOUR_THRESHOLDS,
    visualMappingEntries,
    missingDimensions,
    warnings,
    svgChecksum: sha256Hex(svg).slice(0, 32),
  });
}
