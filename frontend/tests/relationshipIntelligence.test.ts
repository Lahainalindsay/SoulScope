import assert from "node:assert/strict";
import test from "node:test";
import { buildCanonicalSoulScopeResult } from "../lib/canonicalResult";
import { buildLongitudinalAnalysis, type LongitudinalScanSnapshot } from "../lib/longitudinalIntelligence";
import { buildPhaseCIntelligence } from "../lib/phaseCInsightEngine";
import { buildRelationshipIntelligence } from "../lib/relationshipIntelligence";
import type { CanonicalPatternResult } from "../lib/canonicalPattern";
import type { ResonanceNarrative } from "../lib/resonanceNarrativeEngineV3";
import type { VoiceAnalysisResult } from "../lib/voiceSpectrum";

const canonical = {
  canonicalPatternSignature: "family:adaptive",
  canonicalDisplayName: "Adaptive",
  canonicalFamily: "adaptive",
  primaryFamily: "adaptive",
  secondaryFamily: null,
  dimensions: {},
  stateVector: { activation: 0.5, organization: 0.6, regulation: 0.6, expression: 0.5, relationalOrientation: 0.5, direction: 0.6, capacity: 0.6 },
  confidence: 0.8,
  confidenceMargin: 0.2,
  resultType: "single",
  namingMatrixVersion: "matrix-v1",
  engineVersion: "pattern-v1",
  interpretationLimits: [],
  decisionLedger: { supportingEvidence: [], contradictoryEvidence: [], missingEvidence: [], alternatives: [], rejected: [] },
} as unknown as CanonicalPatternResult;

const narrative = {
  engineVersion: "narrative-v1",
  introduction: "Supported narrative.",
  beneathTheSurface: "Supported detail.",
  howThisOftenFeels: [],
  whatOthersMayNotice: [],
  strengthToday: "Supported",
  worthNoticing: "Supported",
  generatedPattern: { title: "Adaptive", dominantState: "Adaptive", supportingQuality: "Capacity", ruleId: "rule-1" },
  relationships: [],
  pairStates: [],
  higherOrderStates: [],
  meaningGraph: { version: "v1", nodes: [], dominantNodeId: null },
} as unknown as ResonanceNarrative;

function scan(): VoiceAnalysisResult {
  const featureIds = [
    "voice.f0.median",
    "voice.f0.range_semitones",
    "voice.intensity.rms",
    "voice.syllable_nuclei_rate",
    "voice.phonation_time_ratio",
    "voice.pitch_stability",
    "voice.pitch_clarity",
    "voice.pause.duration_mean",
    "voice.spectral_flatness",
    "voice.harmonic_richness",
  ];
  return {
    scanMeta: { completedAt: "2026-07-29T00:00:00.000Z" },
    canonicalAcoustic: {
      schemaVersion: "1",
      authoritative: true,
      captureId: "capture-relationship",
      captureKind: "guided_speech",
      extractor: "praat",
      extractorVersion: "extractor-v1",
      quality: "good",
      confidence: 0.84,
      storagePath: null,
      retentionPolicy: "private",
      vadSegments: [],
      metadata: {},
      measurements: featureIds.map((featureId, index) => ({
        feature_id: featureId,
        feature_version: "1.0.0",
        value: 140 + index * 4,
        unit: featureId === "voice.f0.median" ? "Hz" : "unit",
        method: "fixture",
        source_capture_id: "capture-relationship",
        capture_kind: "guided_speech",
        segment_start_ms: 0,
        segment_end_ms: 30000,
        quality: "good",
        confidence: 0.84,
        rejection_reason: null,
        extractor: "praat",
        extractor_version: "extractor-v1",
        parameters: {},
        device_metadata: {},
        created_at: "2026-07-29T00:00:00.000Z",
      })),
    },
  } as unknown as VoiceAnalysisResult;
}

function result() {
  return buildCanonicalSoulScopeResult({
    scanId: "scan-current",
    scan: scan(),
    canonical,
    narrative,
    resonanceSignature: { data: [], seedKey: "seed", visualState: { density: 0.5, coherence: 0.5, asymmetry: 0.2, expansion: 0.5, centerCalm: 0.5 } },
  });
}

function snapshot(index: number, values: Partial<Record<string, number>> = {}, context: string[] = []): LongitudinalScanSnapshot {
  return {
    scanId: `scan-${index}`,
    createdAt: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
    status: "completed",
    quality: "good",
    evidence: [
      { id: "vocal_stability", direction: "stable", strength: 0.5, confidence: "moderate" },
      { id: "pause_load", direction: values.focus_mental_demand && values.focus_mental_demand > 65 ? "elevated" : "stable", strength: 0.5, confidence: "moderate" },
    ],
    observations: [{ id: "steady_observation", direction: "stable", strength: 0.5, confidence: "moderate" }],
    domains: [
      { id: "recovery_restoration", score: values.recovery_restoration ?? 55, orientation: "availability", confidence: "moderate" },
      { id: "focus_mental_demand", score: values.focus_mental_demand ?? 58, orientation: "demand", confidence: "moderate" },
      { id: "expression_communication", score: values.expression_communication ?? 52, orientation: "availability", confidence: "moderate" },
      { id: "regulation_stability", score: values.regulation_stability ?? 60, orientation: "availability", confidence: "moderate" },
    ],
    patterns: [{ id: "adaptive", confidence: 0.7 }],
    primaryPatternId: "adaptive",
    signalDistribution: [0.2, 0.3, 0.5],
    resonanceDistribution: [0.25, 0.25, 0.5],
    context,
  };
}

test("Relationship Intelligence suppresses discoveries when history is missing", () => {
  const intelligence = buildRelationshipIntelligence({ canonicalResult: result(), history: [] });
  assert.equal(intelligence.relationships.length, 0);
  assert.equal(intelligence.discoveryCards.length, 0);
  assert.equal(intelligence.stabilityProfiles.length, 0);
});

test("Relationship Intelligence detects traceable positive and negative associations", () => {
  const history = [40, 45, 50, 55, 60, 65].map((recovery, index) => snapshot(index, {
    recovery_restoration: recovery,
    expression_communication: 90 - recovery,
    regulation_stability: recovery + 10,
  }));
  const intelligence = buildRelationshipIntelligence({ canonicalResult: result(), history, nowMs: Date.UTC(2026, 0, 20) });
  const negative = intelligence.relationships.find((relationship) => relationship.relationshipType === "negative_association");
  const positive = intelligence.relationships.find((relationship) => relationship.relationshipType === "positive_association");

  assert.ok(negative);
  assert.ok(positive);
  assert.ok(negative.evidence.length > 0);
  assert.ok(negative.historicalSupport.observationCount >= 5);
  assert.ok(negative.historicalSupport.consistency >= 0.64);
  assert.doesNotMatch(`${negative.title} ${negative.explanation}`, /causes|predicts|because of/i);
});

test("Relationship Intelligence does not report false correlations from weak history", () => {
  const history = [52, 80, 49, 77].map((recovery, index) => snapshot(index, {
    recovery_restoration: recovery,
    expression_communication: index % 2 ? 51 : 68,
  }));
  const intelligence = buildRelationshipIntelligence({ canonicalResult: result(), history });
  assert.equal(intelligence.relationships.filter((relationship) => relationship.relationshipType === "positive_association" || relationship.relationshipType === "negative_association").length, 0);
});

test("context relationships require enough with-context and without-context observations", () => {
  const shortHistory = [
    snapshot(0, { focus_mental_demand: 82 }, ["poor sleep"]),
    snapshot(1, { focus_mental_demand: 48 }, []),
    snapshot(2, { focus_mental_demand: 84 }, ["poor sleep"]),
    snapshot(3, { focus_mental_demand: 50 }, []),
  ];
  assert.equal(buildRelationshipIntelligence({ canonicalResult: result(), history: shortHistory }).relationships.some((relationship) => relationship.relationshipType === "contextual_association"), false);

  const history = [
    snapshot(0, { focus_mental_demand: 82 }, ["poor sleep"]),
    snapshot(1, { focus_mental_demand: 84 }, ["poor sleep"]),
    snapshot(2, { focus_mental_demand: 80 }, ["poor sleep"]),
    snapshot(3, { focus_mental_demand: 48 }, []),
    snapshot(4, { focus_mental_demand: 50 }, []),
    snapshot(5, { focus_mental_demand: 47 }, []),
  ];
  const relationship = buildRelationshipIntelligence({ canonicalResult: result(), history }).relationships.find((item) => item.relationshipType === "contextual_association");
  assert.ok(relationship);
  assert.match(relationship.explanation, /association only|does not override voice evidence/i);
});

test("contradictory observations weaken relationship confidence and remain visible", () => {
  const clean = [40, 50, 60, 70, 80, 90].map((recovery, index) => snapshot(index, {
    recovery_restoration: recovery,
    expression_communication: 120 - recovery,
  }));
  const changed = [40, 50, 60, 70, 80, 65].map((recovery, index) => snapshot(index, {
    recovery_restoration: recovery,
    expression_communication: index === 5 ? 35 : 120 - recovery,
  }));
  const cleanRelationship = buildRelationshipIntelligence({ canonicalResult: result(), history: clean }).relationships.find((relationship) => relationship.relationshipType === "negative_association");
  const changedRelationship = buildRelationshipIntelligence({ canonicalResult: result(), history: changed }).relationships.find((relationship) => relationship.relationshipType === "negative_association");

  assert.ok(cleanRelationship);
  assert.ok(changedRelationship);
  assert.ok(changedRelationship.exceptions.length > 0);
  assert.ok(changedRelationship.confidence < cleanRelationship.confidence);
});

test("Relationship Intelligence produces stability profiles, conditional relationships, and themes", () => {
  const history = [
    snapshot(0, { recovery_restoration: 42, focus_mental_demand: 85, expression_communication: 40, regulation_stability: 61 }, ["exercise"]),
    snapshot(1, { recovery_restoration: 46, focus_mental_demand: 80, expression_communication: 44, regulation_stability: 60 }, ["exercise"]),
    snapshot(2, { recovery_restoration: 50, focus_mental_demand: 75, expression_communication: 48, regulation_stability: 62 }, ["exercise"]),
    snapshot(3, { recovery_restoration: 60, focus_mental_demand: 50, expression_communication: 70, regulation_stability: 61 }, []),
    snapshot(4, { recovery_restoration: 61, focus_mental_demand: 70, expression_communication: 50, regulation_stability: 60 }, []),
    snapshot(5, { recovery_restoration: 62, focus_mental_demand: 45, expression_communication: 76, regulation_stability: 62 }, []),
  ];
  const intelligence = buildRelationshipIntelligence({ canonicalResult: result(), history });

  assert.ok(intelligence.stabilityProfiles.some((profile) => profile.variable === "regulation"));
  assert.ok(intelligence.relationships.some((relationship) => relationship.relationshipType === "conditional_association"));
  assert.ok(intelligence.themes.length > 0);
});

test("Phase C integrates relationship discoveries as headline candidates with traceable dimensions", () => {
  const history = [40, 45, 50, 55, 60, 65].map((recovery, index) => snapshot(index, {
    recovery_restoration: recovery,
    regulation_stability: recovery + 10,
  }));
  const current = snapshot(20, { recovery_restoration: 66, regulation_stability: 76 });
  const longitudinal = buildLongitudinalAnalysis(current, history);
  const phaseC = buildPhaseCIntelligence(result(), longitudinal, [], history);

  assert.ok(phaseC.relationshipIntelligence.discoveryCards.length > 0);
  assert.ok(phaseC.insights.some((insight) => insight.insightId.startsWith("phase-c:relationship:")));
  assert.ok(phaseC.insights.some((insight) => insight.trace.evidenceLedgerIds.length > 0));
});
