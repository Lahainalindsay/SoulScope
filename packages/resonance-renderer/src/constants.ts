import type { ConstellationId } from "./types";

export const RENDERER_VERSION = "soulscope-deterministic-resonance-renderer-f1";
export const VIEWBOX_SIZE = 1200;
export const GRID_SIZE = 112;
export const CENTER = VIEWBOX_SIZE / 2;
export const FIELD_RADIUS = 500;
export const CONTOUR_LEVELS = [0.16, 0.23, 0.3, 0.37, 0.44, 0.51, 0.58, 0.65, 0.72] as const;
export const CONSTELLATIONS: readonly ConstellationId[] = ["COG", "REG", "EXP", "CAP"];

export const ANCHORS: Record<ConstellationId, { x: number; y: number; angle: number }> = {
  COG: { x: 390, y: 390, angle: -135 },
  REG: { x: 810, y: 390, angle: -45 },
  EXP: { x: 390, y: 810, angle: 135 },
  CAP: { x: 810, y: 810, angle: 45 },
};

export const COLORS: Record<ConstellationId | "CENTER" | "INTERACTION" | "BACKGROUND", string> = {
  COG: "#123f91",
  REG: "#16d7f2",
  CAP: "#ecfff8",
  EXP: "#8f5cff",
  CENTER: "#ffffff",
  INTERACTION: "#dffcff",
  BACKGROUND: "#030712",
};

export const DIMENSION_ORDER: Record<ConstellationId, readonly string[]> = {
  COG: ["COG-P1", "COG-P2", "COG-P3", "COG-P4"],
  REG: ["REG-P1", "REG-P2", "REG-P3", "REG-P4"],
  EXP: ["EXP-P1", "EXP-P2", "EXP-P3", "EXP-P4"],
  CAP: ["CAP-P1", "CAP-P2", "CAP-P3", "CAP-P4"],
};
