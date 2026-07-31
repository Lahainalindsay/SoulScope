import assert from "node:assert/strict";
import test from "node:test";
import { buildGeometrySeed, buildScalarField, normalizeSignatureInput, validateResonanceSignatureInput } from "../../lib/resonanceSignature";
import { fixtureInput, withDimension } from "./fixtures";

test("changed dimension changes seed and scalar field", () => {
  const original = normalizeSignatureInput(validateResonanceSignatureInput(fixtureInput()));
  const changed = normalizeSignatureInput(validateResonanceSignatureInput(withDimension(fixtureInput(), "REG-P1", { mean: 0.92, lowerBound: 0.84, upperBound: 0.96 })));
  assert.notEqual(buildGeometrySeed(original), buildGeometrySeed(changed));
  assert.notEqual(buildScalarField(original).checksum, buildScalarField(changed).checksum);
});
