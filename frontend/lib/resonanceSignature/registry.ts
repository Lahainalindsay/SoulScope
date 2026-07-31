import type { SignatureConstellationId } from "./types";

export const RENDERER_VERSION = "soulscope-signature-renderer-v1.0.0";
export const VIEWBOX_SIZE = 1200;
export const CENTER = 600;
export const MAX_FIELD_RADIUS = 500;
export const SAFE_VISUAL_RADIUS = 455;
export const SCALAR_GRID_SIZE = 96;
export const CONTOUR_THRESHOLDS = [0.18, 0.26, 0.34, 0.42, 0.5, 0.58, 0.66] as const;

export type DimensionVisualRegistryEntry = Readonly<{
  dimensionId: string;
  constellationId: SignatureConstellationId;
  amplitudeInfluence: number;
  radialBand: readonly [number, number];
  harmonicOrderRange: readonly [number, number];
  angularBias: number;
  phaseBehavior: number;
  contourContribution: number;
  textureContribution: number;
  interactionBehavior: number;
}>;

export const CONSTELLATION_ANCHORS: Record<SignatureConstellationId, number> = {
  COG: 315,
  REG: 45,
  CAP: 225,
  EXP: 135,
};

const ids = {
  COG: ["COG-P1", "COG-P2", "COG-P3", "COG-P4"],
  REG: ["REG-P1", "REG-P2", "REG-P3", "REG-P4"],
  CAP: ["CAP-P1", "CAP-P2", "CAP-P3", "CAP-P4"],
  EXP: ["EXP-P1", "EXP-P2", "EXP-P3", "EXP-P4"],
} as const;

const RADIAL_BANDS = [[0.3, 0.62], [0.42, 0.78], [0.2, 0.54], [0.56, 0.94]] as const;
const HARMONIC_RANGES = [[3, 7], [4, 9], [5, 10], [6, 12]] as const;

export const DIMENSION_VISUAL_REGISTRY: Record<string, DimensionVisualRegistryEntry> = Object.fromEntries(
  (Object.entries(ids) as Array<[SignatureConstellationId, readonly string[]]>).flatMap(([constellationId, dimensionIds]) =>
    dimensionIds.map((dimensionId, index) => [
      dimensionId,
      {
        dimensionId,
        constellationId,
        amplitudeInfluence: [0.9, 0.72, 0.82, 1][index],
        radialBand: RADIAL_BANDS[index],
        harmonicOrderRange: HARMONIC_RANGES[index],
        angularBias: [-0.24, -0.08, 0.1, 0.26][index],
        phaseBehavior: [0.19, 0.31, 0.43, 0.57][index],
        contourContribution: [1, 0.86, 0.92, 1.08][index],
        textureContribution: [0.32, 0.44, 0.36, 0.52][index],
        interactionBehavior: [0.48, 0.62, 0.55, 0.72][index],
      },
    ]),
  ),
) as Record<string, DimensionVisualRegistryEntry>;
