import assert from "node:assert/strict";
import test from "node:test";
import { buildPatternPresentation, getPatternKnowledge, selectLongitudinalMessage } from "../lib/patternKnowledge";
import type { PatternId, PatternMatch } from "../lib/resonancePatterns";
import type { UserResultDomain } from "../lib/systemDimensions";

const patternIds: PatternId[] = [
  "overextended-achiever",
  "deep-processor",
  "guarded-but-responsive",
  "recovering-adapter",
  "quietly-overloaded",
  "balanced-regulator",
];

const domains: UserResultDomain[] = [
  {
    title: "Recovery & Restoration",
    score: 28,
    activityLevel: "Low",
    functionalState: "Asking for Support",
    currentPattern: "Recovery is quieter today.",
    thisCouldExpressAs: [],
    itCanAlsoShowUpAs: [],
    supportiveReframe: "Recovery can change.",
    signalSources: [],
  },
  {
    title: "Focus & Mental Load",
    score: 76,
    activityLevel: "High",
    functionalState: "Working Hard",
    currentPattern: "Mental demand is elevated.",
    thisCouldExpressAs: [],
    itCanAlsoShowUpAs: [],
    supportiveReframe: "Demand can change.",
    signalSources: [],
  },
  {
    title: "Communication & Clarity",
    score: 64,
    activityLevel: "High",
    functionalState: "Readily Available",
    currentPattern: "Expression remains available.",
    thisCouldExpressAs: [],
    itCanAlsoShowUpAs: [],
    supportiveReframe: "Expression can change.",
    signalSources: [],
  },
];

function pattern(id: PatternId): PatternMatch {
  return {
    id,
    name: `Pattern ${id}`,
    theme: "Theme",
    explanation: "Explanation",
    whatThisMayFeelLike: [],
    supportiveFactors: [],
    whatIsWorkingHardest: [],
    whatNeedsAttention: "",
    confidence: 0.7,
  };
}

const noBaseline = { available: false, scansUsed: 0, changes: [] };

test("every pattern includes the complete human-centered content shape", () => {
  patternIds.forEach((id) => {
    const knowledge = getPatternKnowledge(id);
    assert.equal(knowledge.explanation.length, 2);
    assert.equal(knowledge.defaultObservationBullets.length, 3);
    assert.equal(knowledge.dailyLife.length, 4);
    assert.equal(knowledge.reflectionQuestions.length, 4);
    assert.ok(Object.values(knowledge.longitudinal).every((messages) => messages.length > 0));
  });
});

test("presentation produces exactly three observed bullets and four daily-life examples", () => {
  const presentation = buildPatternPresentation(pattern("quietly-overloaded"), domains, noBaseline, "scan-1");
  assert.equal(presentation.observedBullets.length, 3);
  assert.equal(presentation.dailyLife.length, 4);
  assert.match(presentation.observedBullets[0], /Recovery|Mental demand|Expression/);
});

test("reflection question and longitudinal copy are deterministic", () => {
  const first = buildPatternPresentation(pattern("deep-processor"), domains, noBaseline, "same-scan");
  const second = buildPatternPresentation(pattern("deep-processor"), domains, noBaseline, "same-scan");
  assert.equal(first.reflectionQuestion, second.reflectionQuestion);
  assert.equal(
    selectLongitudinalMessage("deep-processor", "recurring", "same-history"),
    selectLongitudinalMessage("deep-processor", "recurring", "same-history"),
  );
});

test("user-facing pattern knowledge avoids prohibited engine phrases", () => {
  const prohibited = [
    "Current observations suggest",
    "Current expression",
    "Signals Are Still Resolving",
    "The system has determined",
    "The model predicts",
  ];
  patternIds.forEach((id) => {
    const serialized = JSON.stringify(getPatternKnowledge(id));
    prohibited.forEach((phrase) => assert.equal(serialized.includes(phrase), false));
  });
});
