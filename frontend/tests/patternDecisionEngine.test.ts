import assert from "node:assert/strict";
import test from "node:test";
import { buildDynamicPatternResult } from "../lib/patternInterpretation";
import { buildResonanceCoordinate } from "../lib/resonanceCoordinate";
import type { VoiceAnalysisResult } from "../lib/voiceSpectrum";

function prompt(index: number, speechRate: number, pitchRange: number, pitchStability: number, confidence = 0.82) {
  return {
    index,
    resonanceScore: 0.68,
    voiceDynamics: {
      speechRateProxyPerMin: speechRate,
      pitchRangeSemitones: pitchRange,
      pitchStability,
      voicedFrameRatio: 0.52,
      harmonicToNoiseRatioDb: 10,
    },
    canonicalAcoustic: { confidence },
  };
}

function scanWithPrompts(prompts: ReturnType<typeof prompt>[]): VoiceAnalysisResult {
  return {
    voiceDynamics: {
      captureQuality: "good",
      voicedFrameRatio: 0.52,
      voicedFrameCount: 500,
      clippingFrameRatio: 0,
      pitchClarity: 0.88,
      pitchStability: 0.74,
      speechRateProxyPerMin: 132,
      pitchRangeSemitones: 4.2,
      averagePauseMs: 420,
      spectralFlatness: 0.02,
      harmonicRichness: 0.82,
    },
    analysisDebug: { promptAnalyses: prompts },
    scanMeta: { subject: { subjectId: null, identityConfidence: 0.85, historyEligible: false } },
  } as unknown as VoiceAnalysisResult;
}

test("selected pattern is always the highest-ranked compatibility candidate", () => {
  const result = buildDynamicPatternResult(
    scanWithPrompts([
      prompt(0, 150, 5.2, 0.7),
      prompt(1, 105, 2.8, 0.58),
      prompt(2, 142, 4.8, 0.68),
    ]),
    [],
  );

  assert.equal(result.family, result.decisionLedger.alternatives[0].id);
  assert.equal(result.displayName, result.decisionLedger.alternatives[0].name);
  assert.match(result.decisionLedger.selected, new RegExp(result.decisionLedger.alternatives[0].compatibility.toString()));
});

test("three complete prompts create explicit within-scan recovery evidence", () => {
  const result = buildDynamicPatternResult(
    scanWithPrompts([
      prompt(0, 150, 5.2, 0.72),
      prompt(1, 100, 2.5, 0.55),
      prompt(2, 145, 4.9, 0.69),
    ]),
    [],
  );

  assert.ok(result.evidenceLedger.supporting.some((entry) => entry.id === "within-scan-recovery"));
  assert.ok(!result.evidenceLedger.missing.some((entry) => entry.id === "recovery-evidence-missing"));
  assert.ok(result.dimensions.regulation.supportingEvidence.includes("within-scan-recovery"));
  assert.ok(result.dimensions.capacity.supportingEvidence.includes("within-scan-recovery"));
});

test("missing recovery evidence cannot produce a recovery claim", () => {
  const result = buildDynamicPatternResult(scanWithPrompts([prompt(0, 132, 4.2, 0.74)]), []);

  assert.ok(result.evidenceLedger.missing.some((entry) => entry.id === "recovery-evidence-missing"));
  assert.ok(result.interpretationLimits.some((limit) => limit.includes("Recovery is not described")));
  assert.ok(result.dimensions.regulation.missingEvidence.includes("recovery-evidence-missing"));
  assert.ok(result.dimensions.capacity.missingEvidence.includes("recovery-evidence-missing"));
});

test("every scored dimension carries direct evidence or an explicit limitation", () => {
  const result = buildDynamicPatternResult(
    scanWithPrompts([
      prompt(0, 132, 4.2, 0.74),
      prompt(1, 115, 3.1, 0.65),
      prompt(2, 128, 4, 0.72),
    ]),
    [],
  );

  for (const dimension of Object.values(result.dimensions)) {
    assert.ok(
      dimension.supportingEvidence.length > 0 || dimension.missingEvidence.length > 0,
      `${dimension.key} must be traceable to evidence or a declared limitation`,
    );
  }
});

test("four core dimensions create a bounded coordinate before pattern selection", () => {
  const coordinate = buildResonanceCoordinate({
    activation: 0.8,
    organization: 0.75,
    regulation: 0.62,
    expression: 0.7,
    relationalOrientation: 0.65,
    direction: 0.78,
    capacity: 0.55,
    recovery: 0.5,
    stress: 0.42,
    mentalEffort: 0.58,
    evidenceConfidence: 0.82,
  });

  assert.ok(coordinate.x >= -1 && coordinate.x <= 1);
  assert.ok(coordinate.y >= -1 && coordinate.y <= 1);
  assert.equal(Object.keys(coordinate.cores).length, 4);
  assert.equal(coordinate.quadrant, "activated-coherent");
});

test("decision ledger records coordinate distance and coordinate compatibility", () => {
  const result = buildDynamicPatternResult(
    scanWithPrompts([
      prompt(0, 150, 5.2, 0.72),
      prompt(1, 100, 2.5, 0.55),
      prompt(2, 145, 4.9, 0.69),
    ]),
    [],
  );

  assert.match(result.decisionLedger.selected, /coordinate \(-?\d+(?:\.\d+)?, -?\d+(?:\.\d+)?\)/);
  assert.ok(result.patternSignature.includes("coordinate:"));
  assert.ok(result.decisionLedger.alternatives.every((candidate) => Number.isFinite(candidate.distance)));
  assert.ok(result.decisionLedger.alternatives.every((candidate) => candidate.coordinateCompatibility >= 0 && candidate.coordinateCompatibility <= 1));
});
