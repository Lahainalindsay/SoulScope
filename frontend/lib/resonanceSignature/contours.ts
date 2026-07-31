import { CENTER, CONTOUR_THRESHOLDS } from "./registry";
import { marchingSquares } from "./marchingSquares";
import type { NormalizedResonanceSignature, ScalarField, SignatureConstellationId, SignatureContour } from "./types";

const CONSTELLATIONS: SignatureConstellationId[] = ["COG", "REG", "CAP", "EXP"];

function pointToSvg(point: readonly [number, number], field: ScalarField) {
  return [
    Number(((point[0] / (field.width - 1)) * 1200).toFixed(3)),
    Number(((point[1] / (field.height - 1)) * 1200).toFixed(3)),
  ] as const;
}

function segmentPath(a: readonly [number, number], b: readonly [number, number]) {
  return `M ${a[0].toFixed(3)} ${a[1].toFixed(3)} L ${b[0].toFixed(3)} ${b[1].toFixed(3)}`;
}

function nearestConstellation(x: number, y: number, input: NormalizedResonanceSignature): SignatureConstellationId | "global" {
  const angle = (Math.atan2(y - CENTER, x - CENTER) * 180) / Math.PI;
  const normalized = (angle + 360) % 360;
  let best: SignatureConstellationId | "global" = "global";
  let bestDelta = 999;
  for (const id of CONSTELLATIONS) {
    const anchor = input.constellations[id].anchorAngle;
    const delta = Math.abs((((normalized - anchor + 540) % 360) - 180));
    if (delta < bestDelta) {
      bestDelta = delta;
      best = id;
    }
  }
  return bestDelta <= 72 ? best : "global";
}

export function buildContours(input: NormalizedResonanceSignature, field: ScalarField): SignatureContour[] {
  const contours: SignatureContour[] = [];
  for (const [levelIndex, level] of CONTOUR_THRESHOLDS.entries()) {
    const segments = marchingSquares(field.values, field.width, field.height, level);
    const stride = Math.max(1, Math.round(4 - input.overallCoverage * 3));
    segments.forEach((segment, segmentIndex) => {
      if (segmentIndex % stride !== 0) return;
      const a = pointToSvg(segment[0], field);
      const b = pointToSvg(segment[1], field);
      const midX = (a[0] + b[0]) / 2;
      const midY = (a[1] + b[1]) / 2;
      const constellationId = nearestConstellation(midX, midY, input);
      const source = constellationId === "global" ? null : input.constellations[constellationId];
      const contradiction = source?.contradiction ?? 0;
      const unresolved = Boolean(source?.dimensions.some((dimension) => dimension.unresolved));
      contours.push(Object.freeze({
        id: `contour-${levelIndex}-${segmentIndex}`,
        level,
        path: segmentPath(a, b),
        constellationId: contradiction > 0.42 && segmentIndex % 5 === 0 ? "contradiction" : constellationId,
        confidence: source?.confidence ?? input.overallConfidence,
        coverage: source?.evidenceCoverage ?? input.overallCoverage,
        contradiction,
        unresolved,
        strokeWidth: Number((0.55 + level * 2.2 + (source?.confidence ?? input.overallConfidence) * 0.6).toFixed(3)),
        opacity: Number(((0.06 + level * 0.28) * (source?.confidence ?? input.overallConfidence) * (0.35 + (source?.evidenceCoverage ?? input.overallCoverage) * 0.65)).toFixed(3)),
      }));
    });
  }
  return contours.sort((left, right) => left.constellationId.localeCompare(right.constellationId) || left.level - right.level || left.id.localeCompare(right.id));
}
