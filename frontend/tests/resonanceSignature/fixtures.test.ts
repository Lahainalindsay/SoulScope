import assert from "node:assert/strict";
import test from "node:test";
import { normalizeSignatureInput, serializeSignatureSvg, validateResonanceSignatureInput } from "../../lib/resonanceSignature";
import { fixtureInput } from "./fixtures";

test("fixture renders stable semantic SVG groups", () => {
  const normalized = normalizeSignatureInput(validateResonanceSignatureInput(fixtureInput()));
  const output = serializeSignatureSvg(normalized, { showGuides: true, showBaselineGhost: true });
  assert.match(output.svg, /data-layer="radial-guides"/);
  assert.match(output.svg, /data-layer="contours"/);
  assert.match(output.svg, /data-layer="convergence-nodes"/);
  assert.doesNotMatch(output.svg, /data-layer="baseline-ghost"/);
  assert.equal(output.manifest.inputContractVersion, "soulscope.resonance-signature.v1");
});
