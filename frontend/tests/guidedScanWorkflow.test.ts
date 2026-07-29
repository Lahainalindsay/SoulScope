import assert from "node:assert/strict";
import test from "node:test";
import {
  firstIncompleteGuidedScanStep,
  nextGuidedScanRoute,
} from "../lib/guidedScanWorkflow";

test("the baseline/current-comparison prompt advances to Prompt 2", () => {
  assert.equal(nextGuidedScanRoute(1, 3), "/scan/question/2");
});

test("only the final guided prompt advances to signature analysis", () => {
  assert.equal(nextGuidedScanRoute(2, 3), "/scan/question/3");
  assert.equal(nextGuidedScanRoute(3, 3), "/scan/analyzing");
});

test("an incomplete guided workflow returns to its first missing prompt", () => {
  const ordered = ["baseline", "challenge", "hope"];
  assert.equal(firstIncompleteGuidedScanStep(["baseline"], ordered), 2);
  assert.equal(firstIncompleteGuidedScanStep(["baseline", "challenge"], ordered), 3);
  assert.equal(firstIncompleteGuidedScanStep(ordered, ordered), null);
});

test("standalone calibration is not part of guided workflow state", () => {
  const guidedQuestionIds = ["baseline", "challenge", "hope"];
  assert.equal(firstIncompleteGuidedScanStep(["reference_signature"], guidedQuestionIds), 1);
});
