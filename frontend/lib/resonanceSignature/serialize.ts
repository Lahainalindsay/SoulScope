import { buildContours } from "./contours";
import { buildManifest } from "./manifest";
import { buildNodes } from "./nodes";
import { CONSTELLATION_COLORS, SIGNATURE_COLORS } from "./palette";
import { CENTER, MAX_FIELD_RADIUS, SAFE_VISUAL_RADIUS, VIEWBOX_SIZE } from "./registry";
import { buildScalarField } from "./scalarField";
import { buildGeometrySeed } from "./seed";
import type { NormalizedResonanceSignature, ResonanceSignatureRenderOutput, SignatureConstellationId, SignatureContour } from "./types";

type SerializeOptions = {
  showGuides?: boolean;
  showBaselineGhost?: boolean;
  showBloom?: boolean;
  showNodes?: boolean;
  isolateConstellation?: "all" | SignatureConstellationId;
  showConfidenceOverlay?: boolean;
  showMissingnessOverlay?: boolean;
  grayscale?: boolean;
};

function colorFor(contour: SignatureContour) {
  if (contour.constellationId === "contradiction") return SIGNATURE_COLORS.unresolved;
  if (contour.constellationId === "global") return SIGNATURE_COLORS.convergence;
  return CONSTELLATION_COLORS[contour.constellationId].primary;
}

function bloomWidth(contour: SignatureContour) {
  if (contour.tier === "A") return contour.strokeWidth * 5;
  if (contour.tier === "B") return contour.strokeWidth * 3.8;
  if (contour.tier === "C") return contour.strokeWidth * 2.4;
  return contour.strokeWidth * 1.6;
}

function bloomOpacity(contour: SignatureContour) {
  if (contour.tier === "A") return contour.opacity * 0.2;
  if (contour.tier === "B") return contour.opacity * 0.16;
  if (contour.tier === "C") return contour.opacity * 0.08;
  return contour.opacity * 0.03;
}

function guideSvg() {
  const ringValues = [110, 190, 275, 360, 440, SAFE_VISUAL_RADIUS];
  const rings = ringValues
    .map((radius, index) =>
      `<circle cx="${CENTER}" cy="${CENTER}" r="${radius}" fill="none" stroke="${SIGNATURE_COLORS.guide}" stroke-width="${index === ringValues.length - 1 ? 0.95 : 0.7}" opacity="${index === ringValues.length - 1 ? 0.26 : 0.14}" />`)
    .join("");
  const axes = [
    [CENTER - SAFE_VISUAL_RADIUS, CENTER, CENTER + SAFE_VISUAL_RADIUS, CENTER],
    [CENTER, CENTER - SAFE_VISUAL_RADIUS, CENTER, CENTER + SAFE_VISUAL_RADIUS],
  ].map(([x1, y1, x2, y2]) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${SIGNATURE_COLORS.guide}" stroke-width="0.7" opacity="0.14" />`)
    .join("");
  const ticks = [270, 0, 90, 180].map((angleDeg, index) => {
    const angle = (angleDeg * Math.PI) / 180;
    const inner = SAFE_VISUAL_RADIUS + 2;
    const outer = SAFE_VISUAL_RADIUS + 16;
    const x1 = CENTER + Math.cos(angle) * inner;
    const y1 = CENTER + Math.sin(angle) * inner;
    const x2 = CENTER + Math.cos(angle) * outer;
    const y2 = CENTER + Math.sin(angle) * outer;
    return `<line x1="${x1.toFixed(3)}" y1="${y1.toFixed(3)}" x2="${x2.toFixed(3)}" y2="${y2.toFixed(3)}" stroke="${SIGNATURE_COLORS.guide}" stroke-width="1" opacity="${0.2 + index * 0.01}" />`;
  }).join("");
  const calibration = Array.from({ length: 48 }, (_, index) => {
    const angle = (index / 48) * Math.PI * 2;
    const inner = SAFE_VISUAL_RADIUS + 4;
    const outer = inner + (index % 4 === 0 ? 8 : 4);
    const x1 = CENTER + Math.cos(angle) * inner;
    const y1 = CENTER + Math.sin(angle) * inner;
    const x2 = CENTER + Math.cos(angle) * outer;
    const y2 = CENTER + Math.sin(angle) * outer;
    return `<line x1="${x1.toFixed(3)}" y1="${y1.toFixed(3)}" x2="${x2.toFixed(3)}" y2="${y2.toFixed(3)}" stroke="${SIGNATURE_COLORS.guide}" stroke-width="0.45" opacity="0.11" />`;
  }).join("");
  return `${rings}${axes}${ticks}${calibration}`;
}

export function serializeSignatureSvg(input: NormalizedResonanceSignature, options: SerializeOptions = {}): ResonanceSignatureRenderOutput {
  const seed = buildGeometrySeed(input);
  const scalarField = buildScalarField(input);
  const contours = buildContours(input, scalarField);
  const nodes = buildNodes(input, contours);
  const isolate = options.isolateConstellation ?? "all";
  const visibleContours = isolate === "all"
    ? contours
    : contours.filter((contour) => contour.constellationId === isolate || contour.constellationId === "global" || contour.constellationId === "contradiction");
  const showBaseline = Boolean(options.showBaselineGhost && input.baselineTrust >= 0.7);
  const guides = options.showGuides !== false ? guideSvg() : "";
  const baseline = showBaseline
    ? `<circle cx="${CENTER}" cy="${CENTER}" r="${MAX_FIELD_RADIUS * 0.72}" fill="none" stroke="${SIGNATURE_COLORS.guide}" stroke-width="1.1" stroke-dasharray="3 10" opacity="0.2" data-layer="baseline-ghost" />`
    : "";
  const contourBloom = options.showBloom === false
    ? ""
    : visibleContours
      .filter((contour) => contour.tier !== "D")
      .slice(0, 460)
      .map((contour) => `<path d="${contour.path}" fill="none" stroke="${colorFor(contour)}" stroke-width="${bloomWidth(contour).toFixed(3)}" stroke-opacity="${bloomOpacity(contour).toFixed(3)}" stroke-linecap="round" filter="url(#signature-bloom-${contour.tier})" />`)
      .join("");
  const contourSupport = visibleContours
    .slice(0, 700)
    .map((contour) => `<path d="${contour.path}" fill="none" stroke="${colorFor(contour)}" stroke-width="${(contour.strokeWidth * 1.8).toFixed(3)}" stroke-opacity="${(contour.opacity * 0.42).toFixed(3)}" stroke-linecap="round"${contour.unresolved ? " filter=\"url(#signature-soften)\"" : ""} />`)
    .join("");
  const contourCore = visibleContours.map((contour) => {
    const stroke = colorFor(contour);
    const dash = contour.unresolved || contour.coverage < 0.55 ? ` stroke-dasharray="${(8 + (1 - contour.coverage) * 20).toFixed(2)} ${(8 + contour.contradiction * 18).toFixed(2)}"` : "";
    return `<path d="${contour.path}" fill="none" stroke="${stroke}" stroke-width="${contour.strokeWidth}" stroke-opacity="${contour.opacity}" stroke-linecap="round"${dash} data-contour-id="${contour.id}" data-tier="${contour.tier}" />`;
  }).join("");
  const visibleNodes = options.showNodes === false
    ? []
    : nodes.filter((node) => isolate === "all" || node.constellationId === "center" || node.constellationId === isolate);
  const nodeSvg = visibleNodes.map((node) => {
    const nearWhite = node.support >= 3;
    const color = node.constellationId === "center" || nearWhite
      ? SIGNATURE_COLORS.convergence
      : CONSTELLATION_COLORS[node.constellationId].primary;
    const halo = node.support >= 2
      ? `<circle cx="${node.x}" cy="${node.y}" r="${(node.radius * 2.1).toFixed(3)}" fill="${color}" opacity="${(node.opacity * 0.22).toFixed(3)}" filter="url(#signature-bloom-B)" />`
      : "";
    return `${halo}<circle cx="${node.x}" cy="${node.y}" r="${node.radius}" fill="${color}" opacity="${node.opacity}" data-node-id="${node.id}" />`;
  }).join("");
  const confidenceOverlay = options.showConfidenceOverlay
    ? `<g opacity="0.85">
      <circle cx="${CENTER}" cy="${CENTER}" r="${MAX_FIELD_RADIUS * 0.98}" fill="none" stroke="${SIGNATURE_COLORS.convergence}" stroke-width="${(1.5 - input.overallConfidence).toFixed(3)}" stroke-opacity="${(0.1 + (1 - input.overallConfidence) * 0.35).toFixed(3)}" />
      <circle cx="${CENTER}" cy="${CENTER}" r="${MAX_FIELD_RADIUS * (0.2 + input.overallConfidence * 0.58)}" fill="none" stroke="${SIGNATURE_COLORS.convergence}" stroke-width="0.8" stroke-opacity="${(0.12 + input.overallConfidence * 0.24).toFixed(3)}" />
    </g>`
    : "";
  const missingnessOverlay = options.showMissingnessOverlay
    ? visibleContours
      .filter((contour) => contour.unresolved || contour.coverage < 0.45)
      .map((contour) => `<path d="${contour.path}" fill="none" stroke="${SIGNATURE_COLORS.unresolved}" stroke-width="${(contour.strokeWidth * 1.2).toFixed(3)}" stroke-opacity="${(0.24 + (1 - contour.coverage) * 0.2).toFixed(3)}" stroke-linecap="round" stroke-dasharray="5 11" />`)
      .join("")
    : "";
  const grayscaleFilter = options.grayscale ? ` filter="url(#signature-grayscale)"` : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}" role="img" aria-label="SoulScope Resonance Signature" data-seed="${seed}">
<defs>
  <filter id="signature-bloom-A" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="5.5" /></filter>
  <filter id="signature-bloom-B" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="4.2" /></filter>
  <filter id="signature-bloom-C" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.6" /></filter>
  <filter id="signature-soften"><feGaussianBlur stdDeviation="0.85" /></filter>
  <filter id="signature-grayscale"><feColorMatrix type="saturate" values="0" /></filter>
  <radialGradient id="signature-depth" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="${SIGNATURE_COLORS.deepField}" stop-opacity="0.78" />
    <stop offset="72%" stop-color="${SIGNATURE_COLORS.background}" stop-opacity="0.28" />
    <stop offset="100%" stop-color="${SIGNATURE_COLORS.background}" stop-opacity="0" />
  </radialGradient>
</defs>
<g${grayscaleFilter}>
<rect width="1200" height="1200" fill="${SIGNATURE_COLORS.background}" />
<circle cx="${CENTER}" cy="${CENTER}" r="${MAX_FIELD_RADIUS}" fill="url(#signature-depth)" />
<g data-layer="radial-guides">${guides}${baseline}</g>
<g data-layer="outer-bloom">${contourBloom}</g>
<g data-layer="contour-support">${contourSupport}</g>
<g data-layer="contours">${contourCore}</g>
<g data-layer="convergence-nodes">${nodeSvg}</g>
<g data-layer="confidence-overlay">${confidenceOverlay}</g>
<g data-layer="missingness-overlay">${missingnessOverlay}</g>
</g>
</svg>`;
  return Object.freeze({
    seed,
    scalarChecksum: scalarField.checksum,
    svg,
    manifest: buildManifest(input, seed, svg, scalarField.checksum),
  });
}
