import { COLORS, VIEWBOX_SIZE } from "./constants";
import { sha256Like } from "./math";
import type { AnimationState, SignatureJSON, SignatureOutput, StrokeLayer } from "./types";

function attrs(layer: StrokeLayer) {
  const dash = layer.dashArray ? ` stroke-dasharray="${layer.dashArray}"` : "";
  return `d="${layer.path}" fill="none" stroke="${layer.color}" stroke-width="${layer.width}" stroke-opacity="${layer.opacity}" stroke-linecap="round"${dash} data-contour-id="${layer.contourId}" data-stroke-layer="${layer.layer}"`;
}

export function renderSVG(strokes: readonly StrokeLayer[], signatureId: string) {
  const bloom = strokes.filter((layer) => layer.layer === "bloom").map((layer) => `<path ${attrs(layer)} filter="url(#bloom)" />`).join("");
  const support = strokes.filter((layer) => layer.layer === "support").map((layer) => `<path ${attrs(layer)} />`).join("");
  const core = strokes.filter((layer) => layer.layer === "core").map((layer) => `<path ${attrs(layer)} />`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}" role="img" aria-label="SoulScope deterministic resonance signature" data-signature-id="${signatureId}">
<defs><filter id="bloom" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4.8" /></filter><radialGradient id="fieldDepth" cx="50%" cy="50%" r="54%"><stop offset="0%" stop-color="#ffffff" stop-opacity="0.055" /><stop offset="100%" stop-color="#ffffff" stop-opacity="0" /></radialGradient></defs>
<rect width="${VIEWBOX_SIZE}" height="${VIEWBOX_SIZE}" fill="${COLORS.BACKGROUND}" />
<rect width="${VIEWBOX_SIZE}" height="${VIEWBOX_SIZE}" fill="url(#fieldDepth)" />
<g data-layer="bloom">${bloom}</g>
<g data-layer="support">${support}</g>
<g data-layer="core">${core}</g>
</svg>`;
}

export function exportSVG(signature: Pick<SignatureOutput, "svg">) {
  return signature.svg;
}

export function exportPNG(signature: Pick<SignatureOutput, "svg">) {
  return {
    mimeType: "image/svg+xml" as const,
    dataUri: `data:image/svg+xml;base64,${Buffer.from(signature.svg, "utf8").toString("base64")}`,
  };
}

export function exportJSON(signature: Pick<SignatureOutput, "json">): SignatureJSON {
  return signature.json;
}

export function buildAnimationState(signatureId: string, strokes: readonly StrokeLayer[]): AnimationState {
  const core = strokes.filter((stroke) => stroke.layer === "core");
  return Object.freeze({
    signatureId,
    stableContourIds: Object.freeze(core.filter((stroke) => stroke.opacity >= 0.36).map((stroke) => stroke.contourId).sort()),
    transitionKeyframes: Object.freeze(core.map((stroke) => Object.freeze({
      contourId: stroke.contourId,
      fromOpacity: 0,
      toOpacity: stroke.opacity,
      fromWidth: Math.max(0.2, stroke.width * 0.72),
      toWidth: stroke.width,
    }))),
  });
}

export function signatureIdFor(fieldChecksum: string, json: unknown) {
  return `signature:${fieldChecksum}:${sha256Like(JSON.stringify(json)).slice(0, 12)}`;
}
