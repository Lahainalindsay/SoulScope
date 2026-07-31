import { CENTER, CONTOUR_THRESHOLDS } from "./registry";
import { marchingSquares } from "./marchingSquares";
import type { NormalizedResonanceSignature, ScalarField, SignatureConstellationId, SignatureContour } from "./types";

const CONSTELLATIONS: SignatureConstellationId[] = ["COG", "REG", "CAP", "EXP"];

function clamp01(value: number) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function lerp(min: number, max: number, value: number) {
  return min + (max - min) * clamp01(value);
}

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
  return bestDelta <= 76 ? best : "global";
}

function tierFromImportance(importance: number, confidence: number, coverage: number, multiSourceSupport: number): SignatureContour["tier"] {
  if (importance >= 0.72 && confidence >= 0.74 && coverage >= 0.72 && multiSourceSupport >= 0.62) return "A";
  if (importance >= 0.52) return "B";
  if (importance >= 0.3) return "C";
  return "D";
}

function strokeForTier(tier: SignatureContour["tier"], confidence: number) {
  switch (tier) {
    case "A":
      return lerp(2.2, 4.2, confidence);
    case "B":
      return lerp(1.15, 2.2, confidence);
    case "C":
      return lerp(0.55, 1.1, confidence);
    default:
      return lerp(0.35, 0.75, confidence);
  }
}

function opacityForTier(tier: SignatureContour["tier"], confidence: number, coverage: number, contradiction: number, unresolved: boolean) {
  const support = confidence * (0.35 + coverage * 0.65);
  if (tier === "A") return clamp01(0.82 + support * 0.18);
  if (tier === "B") return clamp01(0.5 + support * 0.38);
  if (tier === "C") return clamp01(0.2 + support * 0.3);
  const uncertaintyLift = unresolved ? 0.04 : 0;
  const contradictionLift = contradiction > 0.45 ? 0.06 : 0;
  return clamp01(0.05 + support * 0.17 + uncertaintyLift + contradictionLift);
}

function multiSourceSupportAt(input: NormalizedResonanceSignature, x: number, y: number) {
  const distances = CONSTELLATIONS.map((id) => {
    const anchor = (input.constellations[id].anchorAngle * Math.PI) / 180;
    const angle = Math.atan2(y - CENTER, x - CENTER);
    const delta = Math.atan2(Math.sin(angle - anchor), Math.cos(angle - anchor));
    const angularProximity = Math.exp(-Math.pow(delta / 0.95, 2));
    return angularProximity * input.constellations[id].fieldWeight;
  }).sort((a, b) => b - a);
  return clamp01((distances[0] ?? 0) * 0.45 + (distances[1] ?? 0) * 0.55);
}

export function buildContours(input: NormalizedResonanceSignature, field: ScalarField): SignatureContour[] {
  const contours: SignatureContour[] = [];
  for (const [levelIndex, level] of CONTOUR_THRESHOLDS.entries()) {
    const segments = marchingSquares(field.values, field.width, field.height, level);
    const stride = Math.max(1, Math.round(4 - input.overallCoverage * 3.2));
    segments.forEach((segment, segmentIndex) => {
      if (segmentIndex % stride !== 0) return;
      const a = pointToSvg(segment[0], field);
      const b = pointToSvg(segment[1], field);
      const midX = (a[0] + b[0]) / 2;
      const midY = (a[1] + b[1]) / 2;
      const segmentLength = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const continuity = clamp01(segmentLength / 36);
      const constellationId = nearestConstellation(midX, midY, input);
      const source = constellationId === "global" ? null : input.constellations[constellationId];
      const contradiction = source?.contradiction ?? 0;
      const unresolved = Boolean(source?.dimensions.some((dimension) => dimension.unresolved));
      const confidence = source?.confidence ?? input.overallConfidence;
      const coverage = source?.evidenceCoverage ?? input.overallCoverage;
      const coherence = source?.coherence ?? input.overallCoherence;
      const sourceSupport = multiSourceSupportAt(input, midX, midY);
      const importance = clamp01(
        confidence
          * coverage
          * (0.35 + continuity * 0.65)
          * (0.4 + sourceSupport * 0.6)
          * (0.42 + coherence * 0.58),
      );
      const tier = tierFromImportance(importance, confidence, coverage, sourceSupport);
      const contradictionContour = contradiction > 0.42 && segmentIndex % 5 === 0;
      if (tier === "D" && !contradictionContour && !unresolved && segmentLength < 4) return;
      contours.push(Object.freeze({
        id: `contour-${levelIndex}-${segmentIndex}`,
        level,
        path: segmentPath(a, b),
        constellationId: contradictionContour ? "contradiction" : constellationId,
        tier,
        importance: Number(importance.toFixed(3)),
        confidence,
        coverage,
        contradiction,
        unresolved,
        strokeWidth: Number(strokeForTier(tier, confidence).toFixed(3)),
        opacity: Number(opacityForTier(tier, confidence, coverage, contradiction, unresolved).toFixed(3)),
      }));
    });
  }
  return contours.sort((left, right) =>
    left.tier.localeCompare(right.tier)
    || right.importance - left.importance
    || left.constellationId.localeCompare(right.constellationId)
    || left.level - right.level
    || left.id.localeCompare(right.id));
}
