import assert from "node:assert/strict";
import test from "node:test";
import { normalizeSignatureInput, serializeSignatureSvg, validateResonanceSignatureInput } from "../../lib/resonanceSignature";
import { fixtureInput, withDimension } from "./fixtures";

test("unresolved dimension creates missing arc and manifest entry", () => {
  const input = withDimension(fixtureInput(), "COG-P2", {
    mean: null,
    lowerBound: null,
    upperBound: null,
    evidenceCoverage: 0.18,
    confidence: 0.1,
    unresolved: true,
  });
  const normalized = normalizeSignatureInput(validateResonanceSignatureInput(input));
  const dimension = normalized.constellations.COG.dimensions[1];
  const output = serializeSignatureSvg(normalized);
  assert.equal(dimension.unresolved, true);
  assert.ok(dimension.missingArc > 0.3);
  assert.ok(output.manifest.missingDimensions.includes("COG-P2"));
  assert.match(output.svg, /stroke-dasharray/);
});
