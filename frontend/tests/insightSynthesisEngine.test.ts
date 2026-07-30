import assert from "node:assert/strict";
import test from "node:test";
import { buildInsightSynthesis } from "../lib/insightSynthesisEngine";
import type { MeaningObject } from "../lib/canonicalMeaningEngine";
import type { PhaseCInsightObject } from "../lib/phaseCInsightEngine";
import type { RelationshipInsight } from "../lib/relationshipIntelligence";

function relationship(id: string, variables: string[], confidence = 0.82): RelationshipInsight {
  return {
    id,
    title: variables.join(" correlates with "),
    explanation: `${variables.join(" and ")} correlate across recent scans.`,
    variables,
    relationshipType: "positive_association",
    confidence,
    observations: ["scan-1", "scan-2", "scan-3", "scan-4", "scan-5", "scan-6"],
    evidence: [`evidence-${id}`],
    historicalSupport: {
      observationCount: 6,
      consistency: 0.86,
      evidenceCoverage: 0.74,
      contradictoryObservations: 0,
      missingObservations: 0,
      ageDays: 12,
      sourceScanIds: ["scan-1", "scan-2", "scan-3", "scan-4", "scan-5", "scan-6"],
    },
    exceptions: [],
  };
}

const meaning: MeaningObject = {
  meaning_id: "meaning:steady-recovery",
  primary_theme: "Supported local observations",
  secondary_theme: null,
  supporting_dimensions: ["REG-P2", "REG-P4"],
  supporting_interactions: ["INT-004"],
  confidence: 0.81,
  uncertainty: 0.19,
  evidence_references: ["meaning-evidence-1"],
  alternatives: [],
  reflection_direction: "Summarize supported geometry without unsupported certainty.",
  rule_version: "test",
};

const phaseInsight: PhaseCInsightObject = {
  insightId: "phase-c:test",
  title: "Recovery is stable",
  explanation: "Recovery is supported by history.",
  evidence: ["phase-evidence-1"],
  confidence: 0.8,
  relatedDimensions: ["REG-P4"],
  supportingHistory: ["6 observations"],
  ranking: {
    novelty: 0.6,
    confidence: 0.8,
    stability: 0.86,
    magnitude: 0.7,
    personalSignificance: 0.7,
    total: 0.74,
  },
  trace: {
    evidenceLedgerIds: ["phase-evidence-1"],
    dimensionValues: [{ dimensionId: "REG-P4", value: 0.7, confidence: 0.8 }],
    historicalComparisons: ["6 observations"],
    decisionId: "decision-1",
    ruleVersion: "test",
  },
};

const technicalTerms = /harmonic clarity|spectral organization|MFCC|spectral slope|jitter|shimmer|formants?|centroid|bandwidth|correlates/i;

test("Insight Synthesis merges related technical correlations into one human insight", () => {
  const relationships = [
    relationship("rel-1", ["domain:regulation_stability", "evidence:harmonic_clarity"]),
    relationship("rel-2", ["domain:regulation_stability", "evidence:spectral_organization"]),
    relationship("rel-3", ["evidence:harmonic_clarity", "evidence:spectral_organization"]),
  ];
  const synthesis = buildInsightSynthesis({
    phaseInsights: [phaseInsight],
    relationships,
    meanings: [meaning],
    decisionId: "decision-1",
  });

  assert.equal(synthesis.discoveries.length, 1);
  assert.equal(synthesis.discoveries[0].supportingRelationships.length, 3);
  assert.match(synthesis.discoveries[0].title, /clearest moments|steadiest moments/i);
});

test("Insight Synthesis hides acoustic terminology while preserving traceability", () => {
  const relationships = [
    relationship("rel-1", ["domain:recovery_restoration", "evidence:harmonic_clarity"]),
    relationship("rel-2", ["domain:regulation_stability", "evidence:spectral_slope"]),
  ];
  const synthesis = buildInsightSynthesis({
    phaseInsights: [phaseInsight],
    relationships,
    meanings: [meaning],
    decisionId: "decision-1",
  });
  const visible = synthesis.discoveries.map((item) => `${item.title} ${item.summary} ${item.explanation}`).join(" ");

  assert.doesNotMatch(visible, technicalTerms);
  assert.deepEqual(synthesis.discoveries[0].trace.relationshipIds.sort(), ["rel-1", "rel-2"]);
  assert.ok(synthesis.discoveries[0].trace.evidenceIds.includes("evidence-rel-1"));
  assert.ok(synthesis.discoveries[0].trace.dimensionIds.includes("REG-P4"));
  assert.ok(synthesis.discoveries[0].trace.meaningObjectIds.includes("meaning:steady-recovery"));
  assert.equal(synthesis.discoveries[0].trace.decisionId, "decision-1");
});

test("Insight Synthesis emits evidence-derived themes and limits visible discoveries to three", () => {
  const relationships = [
    relationship("rel-1", ["domain:recovery_restoration", "evidence:harmonic_clarity"]),
    relationship("rel-2", ["domain:regulation_stability", "evidence:spectral_organization"]),
    relationship("rel-3", ["domain:expression_communication", "evidence:pause_load"]),
    relationship("rel-4", ["domain:focus_mental_demand", "evidence:speaking_rate"]),
    relationship("rel-5", ["context:poor_sleep", "domain:focus_mental_demand"]),
    relationship("rel-6", ["evidence:centroid", "evidence:bandwidth"]),
  ];
  const synthesis = buildInsightSynthesis({
    phaseInsights: [phaseInsight],
    relationships,
    meanings: [meaning],
    decisionId: "decision-1",
  });

  assert.equal(synthesis.discoveries.length, 3);
  assert.ok(synthesis.themes.length > 0);
  assert.ok(synthesis.themes.every((theme) => theme.supportingRelationships.length >= 2));
});

test("Insight Synthesis leaves developer relationship detail available outside the visible synthesis", () => {
  const relationships = [
    relationship("rel-raw", ["domain:regulation_stability", "evidence:harmonic_clarity"]),
  ];
  const synthesis = buildInsightSynthesis({
    phaseInsights: [phaseInsight],
    relationships,
    meanings: [meaning],
    decisionId: "decision-1",
  });

  assert.match(relationships[0].title, /harmonic_clarity/);
  assert.doesNotMatch(synthesis.discoveries[0].title, /harmonic/i);
  assert.equal(synthesis.discoveries[0].supportingRelationships[0], "rel-raw");
});
