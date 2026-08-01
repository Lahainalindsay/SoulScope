import type { AnimationState, SignatureOutput } from "./types";

export function animateTransition(previousSignature: SignatureOutput, nextSignature: SignatureOutput): AnimationState {
  const previous = new Map(previousSignature.strokes.filter((stroke) => stroke.layer === "core").map((stroke) => [stroke.contourId, stroke]));
  const next = nextSignature.strokes.filter((stroke) => stroke.layer === "core");
  return Object.freeze({
    signatureId: `${previousSignature.signatureId}->${nextSignature.signatureId}`,
    stableContourIds: Object.freeze(next.filter((stroke) => previous.has(stroke.contourId)).map((stroke) => stroke.contourId).sort()),
    transitionKeyframes: Object.freeze(next.map((stroke) => {
      const from = previous.get(stroke.contourId);
      return Object.freeze({
        contourId: stroke.contourId,
        fromOpacity: from?.opacity ?? 0,
        toOpacity: stroke.opacity,
        fromWidth: from?.width ?? Math.max(0.2, stroke.width * 0.64),
        toWidth: stroke.width,
      });
    })),
  });
}
