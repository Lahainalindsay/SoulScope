import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildSoulScopeReport } from "../lib/buildSoulScopeReport";
import { buildScanCompleteness, type ScanWithCompleteness } from "../lib/partialScan";
import type { VoiceAnalysisResult } from "../lib/voiceSpectrum";
import { mapScanSession } from "../lib/data/v2/mappers/mapScanSession";
import { mapSensorCaptures } from "../lib/data/v2/mappers/mapSensorCaptures";
import { mapRawFeatures } from "../lib/data/v2/mappers/mapRawFeatures";
import { mapEvidenceSignals } from "../lib/data/v2/mappers/mapEvidenceSignals";
import { mapObservations } from "../lib/data/v2/mappers/mapObservations";
import { mapDomains } from "../lib/data/v2/mappers/mapDomains";
import { mapPatternMatches } from "../lib/data/v2/mappers/mapPatternMatches";
import { mapReflectionVariants } from "../lib/data/v2/mappers/mapReflectionVariants";
import { stableUuid } from "../lib/data/v2/stableId";
import { diagnosticPayloadVariants } from "../lib/data/v2/persistSoulScopeV2Result";
import { isDiagnosticsSchemaDriftError } from "../lib/data/v2/diagnosticsRepository";

function scan(): VoiceAnalysisResult {
  return {
    summary: "fixture",
    coreFrequencyHz: 145,
    spectralCentroidHz: 920,
    resonanceScore: 0.68,
    dominantBand: "D",
    dominantBandLabel: "D",
    noteEnergies: [
      { note: "C", score: 52, relativeEnergy: 0.08, status: "balanced" },
      { note: "C#", score: 48, relativeEnergy: 0.07, status: "balanced" },
      { note: "D", score: 70, relativeEnergy: 0.14, status: "overactive" },
      { note: "D#", score: 44, relativeEnergy: 0.06, status: "balanced" },
      { note: "E", score: 68, relativeEnergy: 0.13, status: "overactive" },
      { note: "F", score: 45, relativeEnergy: 0.06, status: "balanced" },
      { note: "F#", score: 42, relativeEnergy: 0.05, status: "underactive" },
      { note: "G", score: 58, relativeEnergy: 0.09, status: "balanced" },
      { note: "G#", score: 38, relativeEnergy: 0.04, status: "underactive" },
      { note: "A", score: 55, relativeEnergy: 0.08, status: "balanced" },
      { note: "A#", score: 63, relativeEnergy: 0.11, status: "overactive" },
      { note: "B", score: 57, relativeEnergy: 0.09, status: "balanced" },
    ],
    spectrumBands: [], missingBands: [], excessBands: [], findings: [], supportPlan: [],
    methodology: "fixture", caution: "not diagnostic",
    voiceDynamics: {
      analyzedDurationMs: 42000, voicedDurationMs: 26000, silenceDurationMs: 16000,
      activeFrameRatio: 0.62, voicedFrameRatio: 0.58, voicedFrameCount: 84, pitchFrameCount: 72,
      pauseCount: 5, averagePauseMs: 620, longestPauseMs: 1100, medianPitchHz: 145,
      lowPitchHz: 110, highPitchHz: 210, medianMidi: 50, dominantOctave: 3,
      pitchRangeHz: 100, pitchRangeSemitones: 7.2, pitchStability: 0.72, pitchClarity: 0.76,
      jitterLocalPct: 1.4, shimmerLocalPct: 4.2, harmonicToNoiseRatioDb: 11,
      harmonicRichness: 0.64, spectralFlatness: 0.22, zeroCrossingRate: 0.08,
      pauseDensityPerMin: 7.1, speechRateProxyPerMin: 108, formantStability: 0.7,
      formantDynamics: 0.58, clippingFrameRatio: 0.01, captureQuality: "good",
      captureRecommendation: "good", primaryNoteSource: "tracked-pitch",
    },
  };
}

function context(validRecordings = 7) {
  const source = scan();
  const completeness = buildScanCompleteness({
    expectedRecordings: 7,
    analyses: Array.from({ length: 7 }, (_, index) => index < validRecordings ? source : null),
    invalidRecordingReasons: Array.from({ length: 7 - validRecordings }, (_, index) => ({
      index: validRecordings + index,
      questionId: `prompt-${validRecordings + index + 1}`,
      reason: "No usable voice signal",
    })),
  });
  const scanWithCompleteness = { ...source, scanCompleteness: completeness } satisfies ScanWithCompleteness;
  const report = buildSoulScopeReport(scanWithCompleteness, { scanId: "11111111-1111-4111-a111-111111111111" });
  assert.ok(report.observationPipeline);
  return {
    scanId: "11111111-1111-4111-a111-111111111111",
    userId: "22222222-2222-4222-a222-222222222222",
    report,
    pipeline: report.observationPipeline,
    completeness,
    rawResult: { ...source, scanCompleteness: completeness },
    startedAt: "2026-07-14T10:00:00.000Z",
    completedAt: "2026-07-14T10:01:00.000Z",
  };
}

test("stable identifiers are deterministic and UUID-shaped", () => {
  const first = stableUuid("scan", "capture", "one");
  assert.equal(first, stableUuid("scan", "capture", "one"));
  assert.match(first, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-a[0-9a-f]{3}-[0-9a-f]{12}$/);
});

test("complete scan maps to a completed V2 session", () => {
  const row = mapScanSession(context(7), "completed");
  assert.equal(row.status, "completed");
  assert.equal(row.valid_recording_count, 7);
  assert.equal(row.capture_quality, "high");
  assert.ok(row.observation_pipeline);
});

test("partial scan maps without fabricating missing measurements", () => {
  const partial = context(4);
  const session = mapScanSession(partial, "partial");
  const captures = mapSensorCaptures(partial);
  const features = mapRawFeatures(partial);
  assert.equal(session.status, "partial");
  assert.equal(session.valid_recording_count, 4);
  assert.equal(captures.filter((capture) => capture.status === "invalid").length, 3);
  assert.equal(features.length, partial.pipeline.rawFeatures.length);
});

test("raw feature mapping preserves versions and finite values", () => {
  const rows = mapRawFeatures(context());
  assert.ok(rows.length > 10);
  assert.ok(rows.every((row) => Number.isFinite(row.value)));
  assert.ok(rows.every((row) => row.extraction_version === "1.1.0"));
});

test("diagnostic persistence can fall back for older deployed schemas", () => {
  const [matrix, canonical, legacy] = diagnosticPayloadVariants(context() as any);
  assert.ok("naming_matrix_version" in matrix);
  assert.ok("organizing_quality" in matrix);
  assert.ok("canonical_display_name" in canonical);
  assert.ok(!("naming_matrix_version" in canonical));
  assert.ok(!("organizing_quality" in canonical));
  assert.ok(!("canonical_display_name" in legacy));
  assert.ok(!("confidence_margin" in legacy));
  assert.ok("pattern_signature" in legacy);
});

test("diagnostic schema drift includes deployed missing-column errors", () => {
  assert.equal(isDiagnosticsSchemaDriftError({ code: "PGRST204", message: "schema cache missing column" }), true);
  assert.equal(
    isDiagnosticsSchemaDriftError({
      code: "42703",
      message: "column scan_interpretation_diagnostics.organizing_quality does not exist",
    }),
    true,
  );
  assert.equal(
    isDiagnosticsSchemaDriftError({
      message: "column scan_interpretation_diagnostics.naming_matrix_version does not exist",
    }),
    true,
  );
  assert.equal(isDiagnosticsSchemaDriftError({ code: "42501", message: "permission denied" }), false);
});

test("evidence, observation, and domain mappings preserve traceability", () => {
  const value = context();
  const evidence = mapEvidenceSignals(value);
  const observations = mapObservations(value);
  const domains = mapDomains(value);
  assert.ok(evidence.every((row) => row.source_capture_ids.length > 0));
  assert.ok(observations.every((row) => row.contributing_evidence_ids.length > 0));
  assert.ok(domains.every((row) => row.contributing_observation_ids.length > 0));
});

test("pattern roles remain unique per scan", () => {
  const rows = mapPatternMatches(context());
  assert.equal(new Set(rows.map((row) => row.role)).size, rows.length);
  assert.equal(rows[0].role, "primary");
  assert.ok(rows[0].pattern_expression_title);
  assert.equal(rows[0].pattern_name, context().report.canonicalPattern.canonicalDisplayName);
  assert.equal(rows[0].pattern_expression_title, context().report.canonicalPattern.canonicalDisplayName);
});

test("all three reflection variants are persisted", () => {
  const value = context();
  const rows = mapReflectionVariants(value);
  assert.deepEqual(rows.map((row) => row.style).sort(), ["direct", "insight", "supportive"]);
  assert.equal(new Set(rows.map((row) => row.id)).size, 3);
  assert.ok(rows.every((row) => row.content.canonicalDisplayName === value.report.canonicalPattern.canonicalDisplayName));
});

test("retry mapping produces the same child identifiers", () => {
  const value = context();
  assert.deepEqual(mapRawFeatures(value).map((row) => row.id), mapRawFeatures(value).map((row) => row.id));
  assert.deepEqual(mapPatternMatches(value).map((row) => row.id), mapPatternMatches(value).map((row) => row.id));
});

test("active production files do not query legacy scan tables or RPC", () => {
  const activeFiles = [
    "lib/reportPersistence.ts",
    "lib/data/scanAPI.ts",
    "pages/scan/analyzing.tsx",
    "pages/results/[id].tsx",
    "components/PatternHistoryDashboard.tsx",
  ];
  const prohibited = [
    /from\(["']scans["']\)/,
    /scan_pattern_matches/,
    /scan_story_variants/,
    /scan_story_preferences/,
    /set_scan_story_preference/,
  ];
  for (const file of activeFiles) {
    const source = readFileSync(file, "utf8");
    for (const pattern of prohibited) assert.doesNotMatch(source, pattern, `${file} contains ${pattern}`);
  }
});

test("the V2 scan flow never writes the compatibility view", () => {
  const source = readFileSync("pages/scan/analyzing.tsx", "utf8");
  assert.match(source, /persistCanonicalReport/);
  assert.doesNotMatch(source, /\.from\(["']scans["']\)/);
  assert.match(source, /We could not save your reflection/);
  assert.match(source, /errorHeading \?\? hardRetryMessage\(\)\.heading/);
  assert.match(readFileSync("lib/data/v2/scanRepository.ts", "utf8"), /from\(["']scan_sessions["']\)/);
});
