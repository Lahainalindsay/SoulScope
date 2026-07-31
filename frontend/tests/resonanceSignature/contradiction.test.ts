import assert from "node:assert/strict";
import test from "node:test";
import { buildContours, buildScalarField, normalizeSignatureInput, validateResonanceSignatureInput } from "../../lib/resonanceSignature";
import { fixtureInput, withDimension } from "./fixtures";

test("high contradiction creates localized counter-phase geometry", () => {
  const input = withDimension(fixtureInput(), "EXP-P4", { contradiction: 0.9, coherence: 0.2 });
  const normalized = normalizeSignatureInput(validateResonanceSignatureInput({
    ...input,
    constellations: {
      ...input.constellations,
      EXP: { ...input.constellations.EXP, contradiction: 0.9, coherence: 0.2 },
    },
  }));
  const contours = buildContours(normalized, buildScalarField(normalized));
  const contradictionContours = contours.filter((contour) => contour.constellationId === "contradiction");
  assert.ok(contradictionContours.length > 0);
  assert.ok(contradictionContours.every((contour) => contour.contradiction >= 0.9));
});
