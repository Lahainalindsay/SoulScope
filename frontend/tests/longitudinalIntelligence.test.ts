import assert from "node:assert/strict";
import test from "node:test";
import {
  analyzePatternEvolution,
  buildCalibrationAnalytics,
  buildLongitudinalAnalysis,
  buildRollingBaselines,
  calculateSimilarity,
  classifyObservationStability,
  detectTrends,
  isBaselineEligible,
  type LongitudinalScanSnapshot,
} from "../lib/longitudinalIntelligence";

function snapshot(index: number, overrides: Partial<LongitudinalScanSnapshot> = {}): LongitudinalScanSnapshot {
  const recovery = 52 + index;
  return {
    scanId: `scan-${index}`,
    createdAt: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
    status: "completed",
    quality: "good",
    evidence: [
      { id: "vocal_stability", direction: index % 3 === 0 ? "reduced" : "elevated", strength: 0.55, confidence: "moderate" },
      { id: "processing_pauses", direction: index % 4 === 0 ? "elevated" : "stable", strength: 0.45, confidence: "moderate" },
    ],
    observations: [
      { id: "vocal_stability_observation", direction: index % 3 === 0 ? "reduced" : "elevated", strength: 0.5, confidence: "moderate" },
      ...(index % 2 === 0 ? [{ id: "recovery_demand_observation", direction: "reduced" as const, strength: 0.45, confidence: "moderate" as const }] : []),
    ],
    domains: [
      { id: "recovery_restoration", score: recovery, orientation: "availability", confidence: "moderate" },
      { id: "focus_mental_demand", score: 64 - index, orientation: "demand", confidence: "moderate" },
      { id: "expression_communication", score: 58, orientation: "availability", confidence: "moderate" },
    ],
    patterns: [{ id: index % 2 === 0 ? "deep-processor" : "balanced-regulator", confidence: 0.7 }],
    primaryPatternId: index % 2 === 0 ? "deep-processor" : "balanced-regulator",
    signalDistribution: [0.1 + index / 100, 0.2, 0.3],
    resonanceDistribution: [0.3, 0.25 + index / 200, 0.45],
    ...overrides,
  };
}

const history = (count: number) => Array.from({ length: count }, (_, index) => snapshot(index));

test("baseline eligibility excludes poor, limited, and failed scans", () => {
  assert.equal(isBaselineEligible(snapshot(1)), true);
  assert.equal(isBaselineEligible(snapshot(1, { status: "partial", quality: "good" })), true);
  assert.equal(isBaselineEligible(snapshot(1, { status: "partial", quality: "limited" })), false);
  assert.equal(isBaselineEligible(snapshot(1, { status: "completed", quality: "poor" })), true);
  assert.equal(isBaselineEligible(snapshot(1, { status: "failed" })), false);
});

test("rolling baselines do not appear before sufficient history", () => {
  const baselines = buildRollingBaselines(history(2));
  assert.equal(baselines.recent.available, false);
  assert.equal(baselines.intermediate.available, false);
  assert.equal(baselines.long_term.available, false);
});

test("rolling baseline windows use deterministic scan limits", () => {
  const baselines = buildRollingBaselines(history(60));
  assert.equal(baselines.recent.scansUsed, 10);
  assert.equal(baselines.intermediate.scansUsed, 50);
  assert.equal(baselines.long_term.scansUsed, 60);
  assert.equal(baselines.recent.sourceScanIds[0], "scan-59");
});

test("poor captures never contribute to rolling baselines", () => {
  const scans = [...history(3), snapshot(99, { quality: "poor" })];
  const baselines = buildRollingBaselines(scans);
  assert.equal(baselines.recent.scansUsed, 3);
  assert.ok(!baselines.recent.sourceScanIds.includes("scan-99"));
});

test("similar scans score closer than shifted scans", () => {
  const baseline = buildRollingBaselines(history(10)).recent;
  const similar = calculateSimilarity(snapshot(9), baseline);
  const shifted = calculateSimilarity(snapshot(90, {
    evidence: [{ id: "vocal_stability", direction: "reduced", strength: 1, confidence: "high" }],
    observations: [{ id: "expression_effort_observation", direction: "elevated", strength: 1, confidence: "high" }],
    domains: [{ id: "recovery_restoration", score: 5, orientation: "availability", confidence: "high" }],
    patterns: [{ id: "quietly-overloaded", confidence: 1 }],
    primaryPatternId: "quietly-overloaded",
    signalDistribution: [1, 0, 0], resonanceDistribution: [0, 1, 0],
  }), baseline);
  assert.ok((similar.score ?? 0) > (shifted.score ?? 0));
  assert.notEqual(similar.category, shifted.category);
});

test("trend semantics respect recovery and mental-demand orientation", () => {
  const baselines = buildRollingBaselines(history(10));
  const current = snapshot(20, { domains: [
    { id: "recovery_restoration", score: 90, orientation: "availability", confidence: "high" },
    { id: "focus_mental_demand", score: 20, orientation: "demand", confidence: "high" },
  ] });
  const trends = detectTrends(current, baselines);
  assert.match(trends.find((trend) => trend.domainId === "recovery_restoration")?.summary ?? "", /Recovery appears stronger/);
  assert.match(trends.find((trend) => trend.domainId === "focus_mental_demand")?.summary ?? "", /Mental demand appears lower/);
});

test("observation stability distinguishes consistent recurring rare and emerging", () => {
  const baseline = buildRollingBaselines(history(10)).recent;
  const current = snapshot(20, { observations: [
    { id: "vocal_stability_observation", direction: "elevated", strength: 0.5, confidence: "moderate" },
    { id: "recovery_demand_observation", direction: "reduced", strength: 0.5, confidence: "moderate" },
    { id: "new_observation", direction: "elevated", strength: 0.5, confidence: "moderate" },
  ] });
  const stability = classifyObservationStability(current, baseline);
  assert.equal(stability.find((item) => item.observationId === "vocal_stability_observation")?.stability, "consistent");
  assert.equal(stability.find((item) => item.observationId === "recovery_demand_observation")?.stability, "recurring");
  assert.equal(stability.find((item) => item.observationId === "new_observation")?.stability, "emerging");
});

test("pattern evolution detects repeated oscillation deterministically", () => {
  const scans = [
    snapshot(1, { primaryPatternId: "deep-processor" }),
    snapshot(2, { primaryPatternId: "balanced-regulator" }),
    snapshot(3, { primaryPatternId: "deep-processor" }),
  ];
  const result = analyzePatternEvolution(scans, snapshot(4, { primaryPatternId: "balanced-regulator" }));
  assert.equal(result.kind, "oscillating");
  assert.equal(result.available, true);
});

test("users with one or two scans receive no fabricated history", () => {
  const one = buildLongitudinalAnalysis(snapshot(2), [snapshot(1)]);
  assert.equal(one.similarity.recent.available, false);
  assert.equal(one.trends.length, 0);
  assert.equal(one.patternEvolution.available, false);
});

test("partial good scans contribute while limited scans do not", () => {
  const scans = [
    snapshot(1),
    snapshot(2, { status: "partial", quality: "good" }),
    snapshot(3, { status: "partial", quality: "limited" }),
    snapshot(4),
  ];
  const baseline = buildRollingBaselines(scans).recent;
  assert.equal(baseline.available, true);
  assert.equal(baseline.scansUsed, 3);
});

test("longitudinal analysis is deterministic", () => {
  const current = snapshot(20);
  const scans = history(20);
  assert.deepEqual(buildLongitudinalAnalysis(current, scans), buildLongitudinalAnalysis(current, scans));
});

test("calibration analytics remain developer-only aggregate values", () => {
  const analytics = buildCalibrationAnalytics([...history(9), snapshot(10, { status: "partial", quality: "limited" })]);
  assert.equal(analytics.scanCount, 10);
  assert.equal(analytics.eligibleCount, 9);
  assert.equal(analytics.partialScanRate, 0.1);
  assert.ok(Object.keys(analytics.patternFrequency).length > 0);
});
