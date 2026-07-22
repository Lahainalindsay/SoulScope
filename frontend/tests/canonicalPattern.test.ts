import assert from "node:assert/strict";
import test from "node:test";
import { ATLAS_PROFILES, type AtlasResult } from "../lib/patternAtlas";
import { canonicalPatternExpression, canonicalPresentation, resolveCanonicalPattern } from "../lib/canonicalPattern";
import { hydrateReportFromV2 } from "../lib/data/v2/hydrateReportFromV2";
import { mapPatternMatches } from "../lib/data/v2/mappers/mapPatternMatches";
import { mapReflectionVariants } from "../lib/data/v2/mappers/mapReflectionVariants";
import type { SoulScopeReport } from "../lib/buildSoulScopeReport";
import type { DynamicPatternResult, EvidenceEntry, PatternFamily, StateVector } from "../lib/patternInterpretation";
import type { PatternMatch } from "../lib/resonancePatterns";
import type { V2MappingContext } from "../lib/data/v2/mappers/context";

const presentation = {
  summary: "Atlas summary",
  explanation: ["Atlas explanation one", "Atlas explanation two"] as [string, string],
  observedBullets: ["One", "Two", "Three"] as [string, string, string],
  dailyLife: ["A", "B", "C", "D"] as [string, string, string, string],
  reflectionQuestion: "Atlas question?",
  longitudinalMessage: "Baseline unavailable.",
};

function profile(id: string) {
  const match = ATLAS_PROFILES.find((item) => item.id === id);
  assert.ok(match, `Missing Atlas profile ${id}`);
  return match;
}

function atlas(profileId = "grounded-navigator", score = 0.82): AtlasResult {
  return {
    profile: profile(profileId),
    score,
    supporting: [
      { profile: profile("overextended-steward"), score: 0.72 },
      { profile: profile("reflective-protector"), score: 0.62 },
    ],
    subpatterns: [
      { id: "quiet-overload", score: 0.72 },
      { id: "recovery-gap", score: 0.68 },
      { id: "protective-expression", score: 0.58 },
      { id: "settled-presence", score: 0.48 },
    ],
  };
}

function entry(id: string, value = 0.72): EvidenceEntry {
  return {
    id,
    label: id,
    value,
    confidence: 0.86,
    polarity: "supporting",
    measurements: {},
    prompts: [],
    longitudinal: false,
    rationale: id,
  };
}

function dynamic(overrides: Partial<StateVector> = {}, family: PatternFamily = "overextended", options: { qualityUsable?: boolean; baseline?: boolean } = {}): DynamicPatternResult {
  const stateVector: StateVector = {
    activation: 0.22,
    organization: 0.62,
    regulation: 0.25,
    expression: 0.48,
    relationalOrientation: 0.63,
    direction: 0.26,
    capacity: 0.17,
    ...overrides,
  };
  const missing = [
    {
      ...entry("recovery-evidence-missing", 1),
      polarity: "missing" as const,
      confidence: 0.7,
    },
  ];
  const supporting = [
    entry("activation-with-coherence", 0.58),
    entry("slow-recovery", 0.64),
    entry("activation-with-fragmentation", 0.42),
  ];
  const dimensions = Object.fromEntries(
    Object.entries(stateVector).map(([key, score]) => [
      key,
      {
        key,
        label: key,
        state: score < 0.34 ? "strained" : score < 0.52 ? "effortful" : "available",
        score,
        confidence: 0.78,
        supportingEvidence: [],
        contradictoryEvidence: [],
        missingEvidence: missing.map((item) => item.id),
      },
    ]),
  ) as DynamicPatternResult["dimensions"];
  return {
    family,
    dimensions,
    evidenceLedger: {
      supporting,
      contradictory: [],
      missing,
      quality: {
        usable: options.qualityUsable ?? true,
        confidence: options.qualityUsable === false ? 0.28 : 0.84,
        reasons: [],
      },
    },
    stateVector,
    patternSignature: Object.entries(stateVector).map(([key, score]) => `${key}:${score.toFixed(2)}`).join("+"),
    displayName: family === "grounded" ? "The Grounded Navigator" : "The Overextended Steward",
    confidence: 0.76,
    interpretationLimits: ["The pattern is not diagnostic."],
    decisionLedger: { selected: "dynamic", rejected: [], alternatives: [] },
    baseline: {
      subjectId: options.baseline ? "subject-1" : null,
      comparisonAvailable: options.baseline ?? false,
      identityConfidence: options.baseline ? 0.9 : 0,
      deviationScore: null,
      changedDimensions: [],
    },
  };
}

const primaryPattern: PatternMatch = {
  id: "overextended-achiever",
  name: "The Overextended Achiever",
  theme: "Legacy theme",
  explanation: "Legacy explanation",
  whatThisMayFeelLike: [],
  supportiveFactors: [],
  whatIsWorkingHardest: [],
  whatNeedsAttention: "Legacy attention",
  confidence: 0.7,
};

test("low capacity and strained regulation cannot resolve to plain Grounded Navigator", () => {
  const result = resolveCanonicalPattern({
    dynamicPattern: dynamic(),
    atlasInput: {
      "grounded-presence": 0.78,
      "steady-regulation": 0.72,
      "returning-capacity": 0,
      "protective-restraint": 0.58,
    },
    atlasResult: atlas("grounded-navigator", 0.88),
    primaryPattern,
  }, presentation);

  assert.notEqual(result.canonicalDisplayName, "The Grounded Navigator");
  assert.equal(result.primaryFamily, "overextended");
  assert.ok(result.decisionLedger.rejected.some((item) => item.id === "family:grounded" && item.reasons.join(" ").includes("Capacity 0.17")));
});

test("grounded and protective close scores resolve to one composite title", () => {
  const groundedProtective = dynamic({
    activation: 0.36,
    organization: 0.72,
    regulation: 0.62,
    expression: 0.5,
    relationalOrientation: 0.46,
    direction: 0.62,
    capacity: 0.61,
  }, "grounded");
  groundedProtective.evidenceLedger.supporting = [entry("activation-with-coherence", 0.72), entry("vocal-facial-divergence", 0.34)];
  const result = resolveCanonicalPattern({
    dynamicPattern: groundedProtective,
    atlasInput: {
      "grounded-presence": 0.76,
      "steady-regulation": 0.74,
      "protective-restraint": 0.72,
      "returning-capacity": 0,
    },
    atlasResult: {
      ...atlas("grounded-navigator", 0.76),
      subpatterns: [
        { id: "settled-presence", score: 0.75 },
        { id: "protective-expression", score: 0.72 },
        { id: "adaptive-regulation", score: 0.62 },
        { id: "relational-openness", score: 0.42 },
      ],
    },
    primaryPattern,
  }, presentation);

  assert.equal(result.canonicalDisplayName, "The Selective Navigator");
  assert.equal(result.secondaryFamily, "protective");
  assert.equal(result.decisionLedger.selected.mode, "composite");
});

test("overextended and protective resolve to one guarded result", () => {
  const result = resolveCanonicalPattern({
    dynamicPattern: dynamic({ relationalOrientation: 0.28, expression: 0.3, capacity: 0.2, regulation: 0.22 }),
    atlasInput: { "protective-restraint": 0.92, "reduced-recovery": 0.84, "returning-capacity": 0 },
    atlasResult: {
      ...atlas("overextended-steward", 0.8),
      subpatterns: [
        { id: "recovery-gap", score: 0.74 },
        { id: "quiet-overload", score: 0.7 },
        { id: "protective-expression", score: 0.9 },
        { id: "settled-presence", score: 0.2 },
      ],
    },
    primaryPattern,
  }, presentation);

  assert.equal(result.canonicalDisplayName, "The Guarded Steward");
  assert.equal(result.primaryFamily, "overextended");
  assert.equal(result.secondaryFamily, "protective");
});

test("Atlas and legacy names cannot overwrite canonical identity", () => {
  const result = resolveCanonicalPattern({
    dynamicPattern: dynamic(),
    atlasInput: { "grounded-presence": 0.9, "returning-capacity": 0 },
    atlasResult: atlas("grounded-navigator", 0.92),
    primaryPattern,
  }, presentation);
  const expression = canonicalPatternExpression(result, ["Grounded Presence · 90%"]);
  const hydratedPresentation = canonicalPresentation(result, presentation);

  assert.equal(expression.title, result.canonicalDisplayName);
  assert.notEqual(expression.title, "The Grounded Navigator");
  assert.equal(hydratedPresentation.summary, result.summary);
  assert.ok(result.decisionLedger.rejected.some((item) => item.id === "atlas:grounded-navigator"));
  assert.ok(result.decisionLedger.rejected.some((item) => item.id === "legacy:overextended-achiever"));
});

test("missing camera evidence reduces confidence without creating false groundedness", () => {
  const result = resolveCanonicalPattern({
    dynamicPattern: dynamic(),
    atlasInput: { "grounded-presence": 0.68, "returning-capacity": 0 },
    atlasResult: atlas("grounded-navigator", 0.72),
    primaryPattern,
  }, presentation);

  assert.ok(result.confidence < 0.8);
  assert.notEqual(result.primaryFamily, "grounded");
  assert.ok(result.decisionLedger.missingEvidence.includes("recovery-evidence-missing"));
});

test("poor capture quality prevents overconfident classification", () => {
  const result = resolveCanonicalPattern({
    dynamicPattern: dynamic({}, "grounded", { qualityUsable: false }),
    atlasInput: { "grounded-presence": 0.9, "returning-capacity": 0 },
    atlasResult: atlas("grounded-navigator", 0.9),
    primaryPattern,
    completeness: {
      status: "failed",
      qualityLevel: "limited",
      expectedRecordings: 7,
      validRecordings: 1,
      invalidRecordings: 6,
      completionRatio: 1 / 7,
      resultConfidence: "limited",
      invalidRecordingReasons: [],
      retryRecommended: true,
      userMessage: "Poor capture",
    },
  }, presentation);

  assert.equal(result.canonicalDisplayName, "A Limited Reflection");
  assert.equal(result.decisionLedger.selected.mode, "insufficient-evidence");
  assert.ok(result.confidence <= 0.42);
});

test("restoring names require longitudinal evidence", () => {
  const result = resolveCanonicalPattern({
    dynamicPattern: dynamic({ capacity: 0.48, regulation: 0.5 }, "recovering"),
    atlasInput: { "returning-capacity": 0.8 },
    atlasResult: atlas("emerging-restorer", 0.88),
    primaryPattern,
  }, presentation);

  assert.notEqual(result.canonicalDisplayName, "The Emerging Restorer");
  assert.ok(result.decisionLedger.rejected.some((item) => item.id === "family:recovering" && item.reasons.join(" ").includes("longitudinal")));
});

test("identical inputs produce identical signatures and small changes do not cause unjustified switching", () => {
  const args = {
    dynamicPattern: dynamic({ capacity: 0.18 }),
    atlasInput: { "reduced-recovery": 0.78, "protective-restraint": 0.56, "returning-capacity": 0 },
    atlasResult: atlas("overextended-steward", 0.78),
    primaryPattern,
  };
  const first = resolveCanonicalPattern(args, presentation);
  const second = resolveCanonicalPattern(args, presentation);
  const nearby = resolveCanonicalPattern({ ...args, dynamicPattern: dynamic({ capacity: 0.2 }) }, presentation);

  assert.equal(first.canonicalPatternSignature, second.canonicalPatternSignature);
  assert.equal(first.canonicalDisplayName, second.canonicalDisplayName);
  assert.equal(nearby.canonicalDisplayName, first.canonicalDisplayName);
});

test("saved scans hydrate with canonical diagnostics before lower-priority names", () => {
  const canonical = resolveCanonicalPattern({
    dynamicPattern: dynamic(),
    atlasInput: { "returning-capacity": 0 },
    atlasResult: atlas("grounded-navigator", 0.9),
    primaryPattern,
  }, presentation);
  const report = {
    canonicalPattern: canonical,
    primaryPattern,
    supportingPattern: undefined,
    emergingPattern: undefined,
    domainResults: [],
    storyCandidates: [],
    presentation,
    patternExpression: { id: "old", title: "The Grounded Navigator", summary: "Old", matchedSignals: [] },
  } as unknown as SoulScopeReport;

  const hydrated = hydrateReportFromV2(report, {
    domains: [],
    reflections: [],
    patterns: [{
      id: "pattern-row",
      scan_id: "scan-1",
      user_id: "user-1",
      role: "primary",
      pattern_id: "balanced-regulator",
      pattern_name: "The Grounded Navigator",
      pattern_theme: "Old theme",
      explanation: "Old explanation",
      confidence: "high",
      confidence_score: 0.91,
      pattern_expression_id: "atlas:grounded-navigator",
      pattern_expression_title: "The Grounded Navigator",
      pattern_expression_summary: "Old expression",
      modifiers: [],
      evidence_provenance: [],
      baseline_comparison: null,
      created_at: "2026-07-22T00:00:00Z",
      updated_at: "2026-07-22T00:00:00Z",
    }],
    diagnostics: [{
      scan_id: "scan-1",
      user_id: "user-1",
      subject_id: null,
      pattern_signature: canonical.canonicalPatternSignature,
      display_name: canonical.canonicalDisplayName,
      family: canonical.canonicalFamily,
      canonical_pattern_signature: canonical.canonicalPatternSignature,
      canonical_display_name: canonical.canonicalDisplayName,
      canonical_family: canonical.canonicalFamily,
      primary_family: canonical.primaryFamily,
      secondary_family: canonical.secondaryFamily,
      confidence: canonical.confidence,
      confidence_margin: canonical.confidenceMargin,
      state_vector: {},
      evidence_ledger: {},
      dimension_ledger: {},
      decision_ledger: {},
      baseline: null,
      interpretation_limits: [],
      reflection_source: {},
      engine_version: canonical.engineVersion,
      created_at: "2026-07-22T00:00:00Z",
      updated_at: "2026-07-22T00:00:00Z",
    }],
  });

  assert.equal(hydrated.primaryPattern.name, canonical.canonicalDisplayName);
  assert.equal(hydrated.patternExpression.title, canonical.canonicalDisplayName);
  assert.equal(hydrated.canonicalPattern.canonicalDisplayName, canonical.canonicalDisplayName);
});

test("persistence rows and variants preserve one canonical identity", () => {
  const canonical = resolveCanonicalPattern({
    dynamicPattern: dynamic(),
    atlasInput: { "returning-capacity": 0 },
    atlasResult: atlas("grounded-navigator", 0.9),
    primaryPattern,
  }, presentation);
  const report = {
    canonicalPattern: canonical,
    primaryPattern: { ...primaryPattern, name: canonical.canonicalDisplayName },
    supportingPattern: undefined,
    emergingPattern: undefined,
    patternExpression: canonicalPatternExpression(canonical, []),
    modifiers: [],
    baselineComparison: {},
    storyCandidates: [
      {
        style: "Direct",
        title: "What the signals show",
        summary: `${canonical.canonicalDisplayName}: ${canonical.summary}`,
        strongestResources: [],
        areasWorkingHard: [],
        areasAskingForSupport: [],
      },
    ],
  } as unknown as SoulScopeReport;
  const context = {
    scanId: "scan-1",
    userId: "user-1",
    report,
  } as unknown as V2MappingContext;

  const primary = mapPatternMatches(context)[0];
  const variant = mapReflectionVariants(context)[0];
  assert.equal(primary.pattern_name, canonical.canonicalDisplayName);
  assert.equal(primary.pattern_expression_title, canonical.canonicalDisplayName);
  assert.equal(variant.content.canonicalDisplayName, canonical.canonicalDisplayName);
});

test("composite logic only activates when secondary support and margin qualify", () => {
  const result = resolveCanonicalPattern({
    dynamicPattern: dynamic({ capacity: 0.12, regulation: 0.18, relationalOrientation: 0.78, expression: 0.72 }),
    atlasInput: { "reduced-recovery": 0.9, "protective-restraint": 0.2, "returning-capacity": 0 },
    atlasResult: {
      ...atlas("overextended-steward", 0.86),
      supporting: [{ profile: profile("adaptive-builder"), score: 0.3 }],
      subpatterns: [
        { id: "recovery-gap", score: 0.88 },
        { id: "quiet-overload", score: 0.78 },
        { id: "adaptive-regulation", score: 0.24 },
        { id: "settled-presence", score: 0.12 },
      ],
    },
    primaryPattern,
  }, presentation);

  assert.equal(result.secondaryFamily, null);
  assert.equal(result.decisionLedger.selected.mode, "single");
  assert.equal(result.canonicalDisplayName, "The Overextended Steward");
});
