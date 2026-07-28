import assert from "node:assert/strict";
import test from "node:test";
import type { CanonicalPatternResult } from "../lib/canonicalPattern";
import { buildResonanceNarrative } from "../lib/resonanceNarrativeEngineV2";
import type { UserResultDomain, UserResultDomainName } from "../lib/systemDimensions";

function domain(title: UserResultDomainName, score: number): UserResultDomain {
  return {
    title,
    score,
    activityLevel: score >= 62 ? "High" : score >= 45 ? "Moderate" : "Low",
    functionalState: score >= 75 ? "Working Hard" : score >= 62 ? "Highly Engaged" : score >= 45 ? "Readily Available" : "Recovering",
    currentPattern: `${title} current pattern`,
    thisCouldExpressAs: [],
    itCanAlsoShowUpAs: [],
    supportiveReframe: `${title} remains usable when it is supported intentionally.`,
    signalSources: [`verified:${title.toLowerCase().replaceAll(" ", "-")}`],
  };
}

function canonical(overrides: Partial<CanonicalPatternResult> = {}): CanonicalPatternResult {
  return {
    canonicalPatternSignature: "family:adaptive+test",
    canonicalDisplayName: "The Adaptive Integrator",
    canonicalFamily: "adaptive",
    primaryFamily: "adaptive",
    secondaryFamily: null,
    stateVector: {
      activation: 0.55,
      organization: 0.72,
      regulation: 0.7,
      expression: 0.62,
      relationalOrientation: 0.6,
      direction: 0.72,
      capacity: 0.7,
    },
    dimensions: {} as CanonicalPatternResult["dimensions"],
    confidence: 0.84,
    confidenceMargin: 0.2,
    organizingQuality: "contained",
    resultType: "single",
    namingMatrixVersion: "test",
    evidenceLedger: {
      supporting: [],
      contradictory: [],
      missing: [],
      quality: { usable: true, confidence: 0.84, reasons: [] },
    },
    dimensionLedger: {} as CanonicalPatternResult["dimensionLedger"],
    decisionLedger: {
      selected: {
        displayName: "The Adaptive Integrator",
        signature: "family:adaptive+test",
        mode: "single",
        primaryFamily: "adaptive",
        secondaryFamily: null,
        confidence: 0.84,
        confidenceMargin: 0.2,
        organizingQuality: "contained",
        namingMatrixVersion: "test",
        nameSource: "naming-matrix",
      },
      thresholds: {
        clearWinMargin: 0.14,
        compositeMargin: 0.18,
        ambiguousMargin: 0.04,
        minSecondaryScore: 0.46,
        groundedMinCapacity: 0.52,
        groundedMinRegulation: 0.52,
      },
      supportingEvidence: [],
      contradictoryEvidence: [],
      missingEvidence: [],
      alternatives: [
        { family: "adaptive", score: 0.82, rawScore: 0.82, supportingEvidence: [], contradictoryEvidence: [], missingEvidence: [], gates: [], disqualified: false },
        { family: "grounded", score: 0.59, rawScore: 0.59, supportingEvidence: [], contradictoryEvidence: [], missingEvidence: [], gates: [], disqualified: false },
      ],
      rejected: [],
      notes: [],
    },
    interpretationLimits: [],
    reflectionSource: {
      dynamicDisplayName: "The Adaptive Integrator",
      dynamicFamily: "adaptive",
      atlasProfileId: "adaptive",
      atlasProfileName: "Adaptive",
      atlasScore: 0.82,
      legacyPrimaryId: "legacy",
      legacyPrimaryName: "Legacy",
    },
    engineVersion: "test",
    summary: "test",
    explanation: ["test", "test"],
    dailyLife: ["test", "test", "test", "test"],
    supportLines: ["test", "test", "test"],
    reflectionQuestion: "test?",
    ...overrides,
  };
}

const adaptiveDomains: UserResultDomain[] = [
  domain("Energy & Vitality", 74),
  domain("Recovery & Restoration", 79),
  domain("Communication & Clarity", 72),
  domain("Emotional Expression", 63),
  domain("Connection & Support", 68),
  domain("Focus & Mental Load", 76),
  domain("Direction & Adaptability", 91),
  domain("Regulation", 84),
];

const suppliedScanDomains: UserResultDomain[] = [
  domain("Energy & Vitality", 56),
  domain("Recovery & Restoration", 38),
  domain("Communication & Clarity", 49),
  domain("Emotional Expression", 45),
  domain("Connection & Support", 50),
  domain("Focus & Mental Load", 62),
  domain("Direction & Adaptability", 47),
  domain("Regulation", 34),
];

test("builds the title from the complete component state rather than copying the coordinate territory", () => {
  const result = buildResonanceNarrative(adaptiveDomains, canonical());

  assert.equal(result.generatedPattern.title, "The Adaptive Integrator");
  assert.equal(result.generatedPattern.territory, "The Adaptive Integrator");
  assert.match(result.generatedPattern.fingerprintCode, /^[A-Z0-9]{7}$/);
  assert.equal(result.components.length, adaptiveDomains.length);
  assert.ok(result.relationships.some((item) => item.id === "regulated-adaptability"));
  assert.ok(result.relationships.some((item) => item.id === "load-supported-by-recovery"));
});

test("identifies the supplied scan as a steady carrier with adaptive integration as context", () => {
  const scanCanonical = canonical({
    confidence: 0.621,
    stateVector: {
      activation: 0.277,
      organization: 0.605,
      regulation: 0.455,
      expression: 0.391,
      relationalOrientation: 0.43,
      direction: 0.38,
      capacity: 0.455,
    },
    evidenceLedger: {
      supporting: [],
      contradictory: [],
      missing: [
        { id: "camera-evidence-missing", label: "camera", value: 1, confidence: 0.9, polarity: "missing", measurements: {}, prompts: [], longitudinal: false, rationale: "missing" },
        { id: "personal-baseline-unavailable", label: "baseline", value: 1, confidence: 1, polarity: "missing", measurements: {}, prompts: [], longitudinal: true, rationale: "missing" },
      ],
      quality: { usable: true, confidence: 0.702, reasons: [] },
    },
    decisionLedger: {
      ...canonical().decisionLedger,
      alternatives: [
        { family: "overextended", score: 0.542, rawScore: 0.542, supportingEvidence: [], contradictoryEvidence: [], missingEvidence: [], gates: [], disqualified: false },
        { family: "reflective", score: 0.438, rawScore: 0.438, supportingEvidence: [], contradictoryEvidence: [], missingEvidence: [], gates: [], disqualified: false },
        { family: "adaptive", score: 0.326, rawScore: 0.326, supportingEvidence: [], contradictoryEvidence: [], missingEvidence: [], gates: [], disqualified: false },
      ],
    },
  });
  const result = buildResonanceNarrative(suppliedScanDomains, scanCanonical);

  assert.equal(result.generatedPattern.title, "The Steady Carrier");
  assert.equal(result.generatedPattern.dominantState, "Continuing under demand");
  assert.equal(result.generatedPattern.supportingQuality, "Organized persistence");
  assert.equal(result.generatedPattern.confidenceLabel, "Developing");
  assert.equal(result.generatedPattern.decisive, false);
  assert.ok(result.generatedPattern.closestTerritories.includes("overextended"));
  assert.ok(result.relationships.some((item) => item.id === "effortful-continuation"));
  assert.match(result.introduction, /maintaining function|recovery is not keeping pace/i);
});

test("every component and relationship retains verifiable source references", () => {
  const result = buildResonanceNarrative(adaptiveDomains, canonical());
  for (const component of result.components) {
    assert.equal(component.evidence.domain, component.domain);
    assert.equal(component.evidence.score, component.score);
    assert.ok(component.evidence.signalSources.length > 0);
  }
  for (const item of result.relationships) {
    assert.ok(item.evidence.length >= 2);
    assert.ok(item.confidence >= 0 && item.confidence <= 1);
  }
});

test("changes the fingerprint when any component band changes", () => {
  const first = buildResonanceNarrative(adaptiveDomains, canonical());
  const changed = buildResonanceNarrative(
    adaptiveDomains.map((item) => item.title === "Recovery & Restoration" ? { ...item, score: 39 } : item),
    canonical(),
  );
  assert.notEqual(changed.generatedPattern.fingerprintCode, first.generatedPattern.fingerprintCode);
  assert.notEqual(changed.generatedPattern.title, first.generatedPattern.title);
});

test("keeps the narrative mostly positive with one gentle tradeoff", () => {
  const result = buildResonanceNarrative(suppliedScanDomains, canonical());
  assert.ok(result.howThisOftenFeels.length >= 4);
  assert.ok(result.whatOthersMayNotice.length >= 2);
  assert.ok(result.strengthToday.length > 40);
  assert.ok(result.worthNoticing.length > 40);
  assert.equal(result.reflectionQuestion.endsWith("?"), true);
});
