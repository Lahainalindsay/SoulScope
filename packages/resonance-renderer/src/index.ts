export * from "./types";
export * from "./constants";
export * from "./resultAdapter";
export * from "./field";
export * from "./marchingSquares";
export * from "./contours";
export * from "./exporters";
export * from "./animation";
export * from "./longitudinal";

import { buildStrokeLayers, extractContours } from "./contours";
import { buildScalarField } from "./field";
import { buildAnimationState, exportPNG, renderSVG, signatureIdFor } from "./exporters";
import { adaptResultObject } from "./resultAdapter";
import type { RendererInput, SignatureJSON, SignatureOutput } from "./types";

export function generateSignature(resultObject: unknown): SignatureOutput {
  const input = adaptResultObject(resultObject);
  return generateSignatureFromInput(input);
}

export function generateSignatureFromInput(input: RendererInput): SignatureOutput {
  const field = buildScalarField(input);
  const contours = extractContours(input, field);
  const strokes = buildStrokeLayers(contours);
  const json: SignatureJSON = Object.freeze({
    rendererVersion: input.rendererVersion,
    resultId: input.resultId,
    resultVersion: input.resultVersion,
    fieldChecksum: field.checksum,
    dimensions: input.dimensions,
    constellations: input.constellations,
    interactions: input.interactions,
    contours,
    strokes,
  });
  const signatureId = signatureIdFor(field.checksum, json);
  const svg = renderSVG(strokes, signatureId);
  const output: SignatureOutput = Object.freeze({
    signatureId,
    input,
    field,
    contours,
    strokes,
    svg,
    canvas: Object.freeze({ width: 1200, height: 1200, commands: strokes }),
    png: exportPNG({ svg }),
    animationState: buildAnimationState(signatureId, strokes),
    json,
  });
  return output;
}
