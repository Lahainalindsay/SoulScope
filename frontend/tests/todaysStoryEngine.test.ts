import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildCanonicalSoulScopeResult } from "../lib/canonicalResult";
import { buildPhaseCIntelligence } from "../lib/phaseCInsightEngine";
import { buildTodaysStory } from "../lib/todaysStoryEngine";
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
      captureId: "capture-story",
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
        source_capture_id: "capture-story",
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
    scanId: "story-current",
    scan: scan(),
    canonical,
    narrative,
    resonanceSignature: { data: [], seedKey: "seed", visualState: { density: 0.5, coherence: 0.5, asymmetry: 0.2, expansion: 0.5, centerCalm: 0.5 } },
  });
}

test("Today's Story composes a human title instead of exposing closest pattern math", () => {
  const canonicalResult = result();
  const story = buildTodaysStory(canonicalResult, buildPhaseCIntelligence(canonicalResult));
  const visible = [story.title, story.essence, story.reflection, story.worthNoticing, story.gentleNextStep, ...story.howThisMayShowUp].join(" ");

  assert.doesNotMatch(story.title, /^Between\b|boundary|candidate|COG-\d{3}|REG-\d{3}|CAP-\d{3}|EXP-\d{3}/i);
  assert.doesNotMatch(visible, /\bscan(?:s|ned|ning)?\b|candidate|neighboring pattern|similarly supported|boundary|geometry|decision ledger|canonical/i);
  assert.match(story.reflection, /^Today /);
});

test("Today's Story remains traceable to canonical evidence without changing decisions", () => {
  const canonicalResult = result();
  const story = buildTodaysStory(canonicalResult, buildPhaseCIntelligence(canonicalResult));

  assert.equal(story.trace.decisionId, canonicalResult.decisionLedger.record.decisionId);
  assert.ok(story.trace.dimensions.length > 0);
  assert.ok(story.trace.evidence.length > 0);
  assert.ok(story.trace.meanings.length > 0);
  assert.ok(story.trace.interactions.length > 0);
});

test("results dashboard hero renders Today's Story instead of canonical boundary fields", () => {
  const source = readFileSync("components/ResonanceResultsDashboard.tsx", "utf8");
  const heroSection = source.slice(source.indexOf("<section className={styles.reflectionPanel}>"), source.indexOf("<HumanReflectionOverview"));

  assert.match(heroSection, /story\.title/);
  assert.match(heroSection, /story\.essence/);
  assert.match(heroSection, /story\.reflection/);
  assert.doesNotMatch(heroSection, /phaseC\.headlineInsight|canonicalNarrative\.patternTitle|canonicalNarrative\.patternSubtitle|canonicalNarrative\.reflection|Your Pattern/);
});
