import assert from "node:assert/strict";
import test from "node:test";
import type { CanonicalPatternResult } from "../lib/canonicalPattern";
import { buildResonanceNarrative } from "../lib/resonanceNarrativeEngine";
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

const canonical = {
  canonicalDisplayName: "The Adaptive Integrator",
  canonicalFamily: "adaptive",
  confidence: 0.91,
} as CanonicalPatternResult;

const domains: UserResultDomain[] = [
  domain("Energy & Vitality", 74),
  domain("Recovery & Restoration", 79),
  domain("Communication & Clarity", 72),
  domain("Emotional Expression", 63),
  domain("Connection & Support", 68),
  domain("Focus & Mental Load", 76),
  domain("Direction & Adaptability", 91),
  domain("Regulation", 84),
];

test("builds the pattern from component states instead of selecting a fixed description", () => {
  const result = buildResonanceNarrative(domains, canonical);

  assert.equal(result.generatedPattern.title, "The Adaptive Anchor");
  assert.equal(result.generatedPattern.territory, "The Adaptive Integrator");
  assert.match(result.generatedPattern.fingerprintCode, /^[A-Z0-9]{7}$/);
  assert.equal(result.components.length, domains.length);
  assert.equal(result.evidenceLedger.length, domains.length);
  assert.ok(result.relationships.some((item) => item.id === "regulated-adaptability"));
  assert.ok(result.relationships.some((item) => item.id === "load-supported-by-recovery"));
});

test("every component statement retains its verifiable source references", () => {
  const result = buildResonanceNarrative(domains, canonical);

  for (const component of result.components) {
    assert.equal(component.evidence.domain, component.domain);
    assert.equal(component.evidence.score, component.score);
    assert.ok(component.evidence.signalSources.length > 0);
  }

  for (const relationship of result.relationships) {
    assert.ok(relationship.evidence.length >= 2);
    assert.ok(relationship.confidence >= 0 && relationship.confidence <= 1);
  }
});

test("creates a different fingerprint and title when the component aggregate changes", () => {
  const adaptive = buildResonanceNarrative(domains, canonical);
  const restored = buildResonanceNarrative(
    domains.map((item) => item.title === "Recovery & Restoration" ? { ...item, score: 96 } : item),
    canonical,
  );

  assert.notEqual(restored.generatedPattern.fingerprintCode, adaptive.generatedPattern.fingerprintCode);
  assert.equal(restored.generatedPattern.title, "The Resilient Navigator");
});

test("keeps the narrative mostly positive with one gentle tradeoff", () => {
  const result = buildResonanceNarrative(domains, canonical);

  assert.ok(result.howThisOftenFeels.length >= 4);
  assert.ok(result.whatOthersMayNotice.length >= 2);
  assert.ok(result.strengthToday.length > 40);
  assert.ok(result.worthNoticing.length > 40);
  assert.equal(result.reflectionQuestion.endsWith("?"), true);
});
