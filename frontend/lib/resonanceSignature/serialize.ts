import { buildContours } from "./contours";
import { buildManifest } from "./manifest";
import { buildNodes } from "./nodes";
import { CONSTELLATION_COLORS, SIGNATURE_COLORS } from "./palette";
import { CENTER, MAX_FIELD_RADIUS, SAFE_VISUAL_RADIUS, VIEWBOX_SIZE } from "./registry";
import { buildScalarField } from "./scalarField";
import { buildGeometrySeed } from "./seed";
import type { NormalizedResonanceSignature, ResonanceSignatureRenderOutput, SignatureContour } from "./types";

function colorFor(contour: SignatureContour) {
  if (contour.constellationId === "contradiction") return SIGNATURE_COLORS.unresolved;
  if (contour.constellationId === "global") return SIGNATURE_COLORS.convergence;
  return CONSTELLATION_COLORS[contour.constellationId].primary;
}

export function serializeSignatureSvg(input: NormalizedResonanceSignature, options: { showGuides?: boolean; showBaselineGhost?: boolean } = {}): ResonanceSignatureRenderOutput {
  const seed = buildGeometrySeed(input);
  const scalarField = buildScalarField(input);
  const contours = buildContours(input, scalarField);
  const nodes = buildNodes(input);
  const showBaseline = Boolean(options.showBaselineGhost && input.baselineTrust >= 0.7);
  const guides = options.showGuides !== false
    ? [120, 220, 320, 420, SAFE_VISUAL_RADIUS].map((r) => `<circle cx="${CENTER}" cy="${CENTER}" r="${r}" fill="none" stroke="${SIGNATURE_COLORS.guide}" stroke-width="0.8" opacity="0.22" />`).join("")
    : "";
  const baseline = showBaseline
    ? `<circle cx="${CENTER}" cy="${CENTER}" r="${MAX_FIELD_RADIUS * 0.72}" fill="none" stroke="${SIGNATURE_COLORS.guide}" stroke-width="1.2" stroke-dasharray="3 10" opacity="0.22" data-layer="baseline-ghost" />`
    : "";
  const contourSvg = contours.map((contour) => {
    const stroke = colorFor(contour);
    const dash = contour.unresolved || contour.coverage < 0.55 ? ` stroke-dasharray="${(8 + (1 - contour.coverage) * 18).toFixed(2)} ${(8 + contour.contradiction * 20).toFixed(2)}"` : "";
    return `<path d="${contour.path}" fill="none" stroke="${stroke}" stroke-width="${contour.strokeWidth}" stroke-opacity="${contour.opacity}" stroke-linecap="round"${dash} data-contour-id="${contour.id}" />`;
  }).join("");
  const bloomSvg = contours.filter((contour) => contour.confidence > 0.66 && contour.level > 0.34).slice(0, 280).map((contour) =>
    `<path d="${contour.path}" fill="none" stroke="${colorFor(contour)}" stroke-width="${(contour.strokeWidth * 3.2).toFixed(3)}" stroke-opacity="${(contour.opacity * 0.18).toFixed(3)}" stroke-linecap="round" filter="url(#signature-bloom)" />`,
  ).join("");
  const nodeSvg = nodes.map((node) => {
    const color = node.constellationId === "center" ? SIGNATURE_COLORS.convergence : CONSTELLATION_COLORS[node.constellationId].primary;
    return `<circle cx="${node.x}" cy="${node.y}" r="${node.radius}" fill="${color}" opacity="${node.opacity}" data-node-id="${node.id}" />`;
  }).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}" role="img" aria-label="SoulScope Resonance Signature" data-seed="${seed}">
<defs><filter id="signature-bloom" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="5" /></filter><radialGradient id="signature-depth" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="${SIGNATURE_COLORS.deepField}" stop-opacity="0.72" /><stop offset="100%" stop-color="${SIGNATURE_COLORS.background}" stop-opacity="0" /></radialGradient></defs>
<rect width="1200" height="1200" fill="${SIGNATURE_COLORS.background}" />
<circle cx="${CENTER}" cy="${CENTER}" r="${MAX_FIELD_RADIUS}" fill="url(#signature-depth)" />
<g data-layer="radial-guides">${guides}${baseline}</g>
<g data-layer="outer-bloom">${bloomSvg}</g>
<g data-layer="contours">${contourSvg}</g>
<g data-layer="convergence-nodes">${nodeSvg}</g>
</svg>`;
  return Object.freeze({
    seed,
    scalarChecksum: scalarField.checksum,
    svg,
    manifest: buildManifest(input, seed, svg, scalarField.checksum),
  });
}
