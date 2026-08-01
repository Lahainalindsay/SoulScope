import { ANCHORS, COLORS, CONSTELLATIONS, CONTOUR_LEVELS, VIEWBOX_SIZE } from "./constants";
import { marchingSquares } from "./marchingSquares";
import { clamp, mean, round } from "./math";
import type { ConstellationId, Contour, RendererInput, ScalarField, StrokeLayer } from "./types";

function pointToSvg(point: readonly [number, number], field: ScalarField) {
  return [
    round((point[0] / (field.width - 1)) * VIEWBOX_SIZE, 3),
    round((point[1] / (field.height - 1)) * VIEWBOX_SIZE, 3),
  ] as const;
}

function segmentPath(a: readonly [number, number], b: readonly [number, number]) {
  return `M ${a[0].toFixed(3)} ${a[1].toFixed(3)} L ${b[0].toFixed(3)} ${b[1].toFixed(3)}`;
}

function nearestSource(x: number, y: number): ConstellationId | "CENTER" {
  const distances = CONSTELLATIONS.map((id) => ({ id, distance: Math.hypot(x - ANCHORS[id].x, y - ANCHORS[id].y) }));
  const sorted = distances.sort((left, right) => left.distance - right.distance);
  return sorted[1].distance - sorted[0].distance < 42 ? "CENTER" : sorted[0].id;
}

export function extractContours(input: RendererInput, field: ScalarField): readonly Contour[] {
  const contours: Contour[] = [];
  for (const [levelIndex, level] of CONTOUR_LEVELS.entries()) {
    const segments = marchingSquares(field.values, field.width, field.height, level);
    const stride = Math.max(1, Math.round(4 - mean(CONSTELLATIONS.map((id) => input.constellations[id].evidenceCoverage)) * 2.5));
    segments.forEach((segment, segmentIndex) => {
      if (segmentIndex % stride !== 0) return;
      const a = pointToSvg(segment[0], field);
      const b = pointToSvg(segment[1], field);
      const midX = (a[0] + b[0]) / 2;
      const midY = (a[1] + b[1]) / 2;
      const source = nearestSource(midX, midY);
      const constellation = source === "CENTER" ? null : input.constellations[source];
      const dimensions = source === "CENTER" ? input.dimensions : input.dimensions.filter((dimension) => dimension.constellation === source);
      const support = mean(dimensions.map((dimension) => dimension.evidenceCoverage));
      const confidence = constellation?.confidence ?? mean(CONSTELLATIONS.map((id) => input.constellations[id].confidence));
      const coherence = constellation?.coherence ?? mean(CONSTELLATIONS.map((id) => input.constellations[id].coherence));
      const unresolved = dimensions.some((dimension) => !dimension.resolved);
      const continuity = unresolved ? support * 0.72 : support;
      const importance = clamp(level * 0.36 + confidence * 0.24 + continuity * 0.22 + coherence * 0.18);
      contours.push(Object.freeze({
        id: `c-${levelIndex}-${segmentIndex}-${source}`,
        level,
        path: segmentPath(a, b),
        constellationId: source,
        importance: round(importance),
        confidence: round(confidence),
        continuity: round(continuity),
        support: round(support),
        coherence: round(coherence),
        evidenceReferences: Object.freeze(Array.from(new Set(dimensions.flatMap((dimension) => dimension.evidenceReferences))).sort()),
        unresolved,
      }));
    });
  }
  return Object.freeze(contours.sort((left, right) => right.importance - left.importance || left.id.localeCompare(right.id)));
}

export function buildStrokeLayers(contours: readonly Contour[]): readonly StrokeLayer[] {
  const layers: StrokeLayer[] = [];
  for (const contour of contours) {
    const color = COLORS[contour.constellationId];
    const broken = contour.unresolved || contour.support < 0.55;
    const dashArray = broken ? `${round(8 + (1 - contour.support) * 22, 2)} ${round(10 + (1 - contour.continuity) * 24, 2)}` : null;
    const base = 0.7 + contour.importance * 2.4;
    layers.push({
      contourId: contour.id,
      layer: "bloom",
      path: contour.path,
      color,
      width: round(base * 4.6, 3),
      opacity: round(contour.importance * contour.confidence * 0.14, 3),
      dashArray,
      evidenceReferences: contour.evidenceReferences,
    });
    layers.push({
      contourId: contour.id,
      layer: "support",
      path: contour.path,
      color,
      width: round(base * 2.25, 3),
      opacity: round(contour.importance * contour.confidence * 0.28, 3),
      dashArray,
      evidenceReferences: contour.evidenceReferences,
    });
    layers.push({
      contourId: contour.id,
      layer: "core",
      path: contour.path,
      color,
      width: round(base, 3),
      opacity: round(0.12 + contour.importance * contour.confidence * 0.62, 3),
      dashArray,
      evidenceReferences: contour.evidenceReferences,
    });
  }
  return Object.freeze(layers);
}
