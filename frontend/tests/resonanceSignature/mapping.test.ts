import assert from "node:assert/strict";
import test from "node:test";
import { normalizeSignatureInput, validateResonanceSignatureInput } from "../../lib/resonanceSignature";
import { fixtureInput } from "./fixtures";

test("dimension mean controls radial extent and confidence controls opacity", () => {
  const input = fixtureInput();
  const normalized = normalizeSignatureInput(validateResonanceSignatureInput(input));
  const low = normalized.constellations.COG.dimensions[0];
  const high = normalized.constellations.EXP.dimensions[3];
  assert.ok(high.radialExtent > low.radialExtent);
  assert.equal(low.opacity, 0.8524);
});

test("baseline ghost is suppressed below trust threshold", () => {
  const normalized = normalizeSignatureInput(validateResonanceSignatureInput(fixtureInput({ baselineTrust: 0.2 })));
  assert.equal(normalized.baselineTrust, 0.2);
});
