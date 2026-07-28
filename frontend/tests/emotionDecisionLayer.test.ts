import assert from "node:assert/strict";
import test from "node:test";
import { buildEmotionDecisionLayer } from "../lib/emotionDecisionLayer";

const base = {
  activation: 0.7,
  organization: 0.65,
  regulation: 0.55,
  expression: 0.62,
  relationalOrientation: 0.58,
  direction: 0.68,
  capacity: 0.48,
  recovery: 0.42,
  challengeModulation: 0.6,
  evidenceConfidence: 0.8,
  evidenceIds: ["acoustic-activation", "acoustic-organization", "acoustic-expression"],
};

test("builds all sixteen emotion evidence signals", () => {
  const result = buildEmotionDecisionLayer(base);
  assert.equal(Object.keys(result.emotions).length, 16);
  assert.equal(result.version, "soulscope-emotion-layer-v1");
  assert.ok(result.emotions.stress.score >= 0 && result.emotions.stress.score <= 1);
  assert.ok(result.emotions.mentalEffort.evidence.includes("recovery"));
});

test("builds eight relational dimension pairs", () => {
  const result = buildEmotionDecisionLayer(base);
  assert.equal(Object.keys(result.pairs).length, 8);
  assert.ok(result.pairs.activationRestoration.balance > 0);
  assert.ok(result.pairs.loadCapacity.interpretation.length > 0);
});

test("high activation with cognitive organization resolves to energetic logical style", () => {
  const result = buildEmotionDecisionLayer({
    ...base,
    activation: 0.85,
    recovery: 0.35,
    organization: 0.85,
    expression: 0.35,
  });
  assert.equal(result.style.id, "EN-LO");
});

test("mental effort and efficiency remain separate outputs", () => {
  const result = buildEmotionDecisionLayer({
    ...base,
    organization: 0.25,
    recovery: 0.2,
    regulation: 0.2,
    challengeModulation: 0.9,
    capacity: 0.2,
  });
  assert.ok(result.mentalEffortEfficiency.effort > result.mentalEffortEfficiency.efficiency);
});
