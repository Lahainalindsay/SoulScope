import assert from "node:assert/strict";
import test from "node:test";
import { buildGeometrySeed, buildScalarField, normalizeSignatureInput, serializeSignatureSvg, validateResonanceSignatureInput } from "../../lib/resonanceSignature";
import { fixtureInput } from "./fixtures";

test("same input produces same seed, scalar checksum, and SVG", () => {
  const normalized = normalizeSignatureInput(validateResonanceSignatureInput(fixtureInput()));
  const first = serializeSignatureSvg(normalized);
  const second = serializeSignatureSvg(normalized);
  assert.equal(buildGeometrySeed(normalized), first.seed);
  assert.equal(first.seed, second.seed);
  assert.equal(first.scalarChecksum, second.scalarChecksum);
  assert.equal(first.svg, second.svg);
});

test("different scan IDs with identical canonical values produce same core geometry", () => {
  const first = normalizeSignatureInput(validateResonanceSignatureInput(fixtureInput({ scanId: "scan-a" })));
  const second = normalizeSignatureInput(validateResonanceSignatureInput(fixtureInput({ scanId: "scan-b" })));
  assert.equal(buildGeometrySeed(first), buildGeometrySeed(second));
  assert.equal(buildScalarField(first).checksum, buildScalarField(second).checksum);
});
