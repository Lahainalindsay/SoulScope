import type { AtlasSignatureModel } from "./atlasSignature";
import type { ContinuousConstellationGeometry } from "./canonicalConstellationEngine";
import type { CanonicalDimensionRecord } from "./canonicalDimensionEngine";
import type { CrossConstellationInteraction } from "./canonicalInteractionEngine";
import type { MeaningObject } from "./canonicalMeaningEngine";

export const CANONICAL_SIGNATURE_ENGINE_VERSION = "canonical-resonance-signature-v0.1";

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}

function round(value: number) {
  return Number(clamp(value).toFixed(3));
}

function mean(values: number[]) {
  const valid = values.filter(Number.isFinite);
  return valid.length ? valid.reduce((sum, item) => sum + item, 0) / valid.length : 0;
}

export function buildCanonicalResonanceSignature(args: {
  dimensions: CanonicalDimensionRecord[];
  geometry: ContinuousConstellationGeometry;
  interactions: CrossConstellationInteraction[];
  meaningObjects: MeaningObject[];
}): AtlasSignatureModel {
  const dimensionData = args.dimensions.map((dimension) => ({
    id: `canonical:${dimension.constellation}:point:${dimension.dimensionId}`,
    value: dimension.value,
    weight: round(0.35 + dimension.confidence * 0.65),
  }));
  const constellationData = Object.values(args.geometry.constellations).flatMap((decision) => [
    {
      id: `canonical:${decision.constellation}:winner:${decision.winner}`,
      value: decision.winner === "unresolved" ? 0 : decision.nearestRegions[0]?.compatibility ?? 0,
      weight: decision.confidence,
    },
    {
      id: `canonical:${decision.constellation}:coverage`,
      value: decision.evidenceCoverage,
      weight: 0.82,
    },
    {
      id: `canonical:${decision.constellation}:uncertainty`,
      value: decision.uncertainty,
      weight: 0.72,
    },
  ]);
  const geometryData = [
    { id: "canonical:geometry:x", value: args.geometry.coordinates.x, weight: args.geometry.confidence },
    { id: "canonical:geometry:y", value: args.geometry.coordinates.y, weight: args.geometry.confidence },
    { id: "canonical:geometry:z", value: args.geometry.coordinates.z, weight: args.geometry.confidence },
    { id: "canonical:geometry:activation", value: args.geometry.coordinates.activation, weight: args.geometry.confidence },
    { id: "canonical:geometry:uncertainty", value: args.geometry.uncertainty, weight: 0.72 },
  ];
  const interactionData = args.interactions.slice(0, 6).map((interaction) => ({
    id: `canonical:${interaction.interactionId}`,
    value: interaction.strength,
    weight: round(0.3 + interaction.confidence * 0.7),
  }));
  const meaningData = args.meaningObjects.slice(0, 4).map((meaning) => ({
    id: `canonical:${meaning.meaning_id}`,
    value: meaning.confidence,
    weight: round(0.3 + (1 - meaning.uncertainty) * 0.7),
  }));
  const confidence = mean(args.dimensions.map((item) => item.confidence));
  const interactionStrength = mean(args.interactions.map((item) => item.strength));

  return {
    data: [...dimensionData, ...constellationData, ...geometryData, ...interactionData, ...meaningData],
    seedKey: [
      CANONICAL_SIGNATURE_ENGINE_VERSION,
      args.geometry.nearestRegions[0]?.region ?? "unresolved",
      args.geometry.boundaryBlend?.blendId ?? "no-blend",
      args.meaningObjects[0]?.meaning_id ?? "no-meaning",
    ].join(":"),
    visualState: {
      density: round(0.22 + args.geometry.coordinates.activation * 0.42 + interactionStrength * 0.24),
      coherence: round(args.geometry.coordinates.x * 0.42 + args.geometry.coordinates.y * 0.38 + confidence * 0.2),
      asymmetry: round(args.geometry.uncertainty * 0.48 + (args.geometry.boundaryBlend?.transition ?? 0) * 0.36),
      expansion: round(args.geometry.coordinates.z * 0.52 + args.geometry.coordinates.activation * 0.22 + confidence * 0.16),
      centerCalm: round(args.geometry.coordinates.y * 0.52 + (1 - args.geometry.coordinates.activation) * 0.28 + confidence * 0.2),
    },
  };
}
