import assert from "node:assert/strict";
import test from "node:test";
import { buildRawFeatures } from "../lib/observationFramework/buildRawFeatures";
import { buildPersonalAcousticBaselines } from "../lib/data/v2/acousticRepository";
import type { VoiceAnalysisResult } from "../lib/voiceSpectrum";

const baseScan: VoiceAnalysisResult = {
  summary: "fixture",
  coreFrequencyHz: 140,
  spectralCentroidHz: 1000,
  resonanceScore: 0.5,
  dominantBand: "C",
  dominantBandLabel: "C",
  noteEnergies: [{ note: "C", score: 80, relativeEnergy: 0.2, status: "overactive" }],
  spectrumBands: [],
  missingBands: [],
  excessBands: [],
  findings: [],
  supportPlan: [],
  methodology: "fixture",
  caution: "not diagnostic",
};

test("canonical server measurements become authoritative raw features with provenance", () => {
  const features = buildRawFeatures({
    ...baseScan,
    analysisDebug: {
      promptAnalyses: [{
        index: 0,
        captureKind: "sustained_vowel",
        dominantBandLabel: "C",
        coreFrequencyHz: 140,
        spectralCentroidHz: 1000,
        resonanceScore: 0.5,
        topNotes: [],
        canonicalAcoustic: {
          schemaVersion: "soulscope.acoustic.v1",
          authoritative: true,
          captureId: "prompt:voice:1",
          captureKind: "sustained_vowel",
          extractor: "praat-parselmouth",
          extractorVersion: "praat-parselmouth-0.4.6/soulscope-1.0.0",
          quality: "good",
          confidence: 0.8,
          storagePath: "private/path.wav",
          retentionPolicy: "private",
          vadSegments: [],
          metadata: {},
          measurements: [{
            feature_id: "voice.jitter.local",
            feature_version: "1.0.0",
            value: 0.012,
            unit: "fraction",
            method: "Praat-Parselmouth",
            source_capture_id: "prompt:voice:1",
            capture_kind: "sustained_vowel",
            segment_start_ms: 0,
            segment_end_ms: 30000,
            quality: "good",
            confidence: 0.8,
            rejection_reason: null,
            extractor: "praat-parselmouth",
            extractor_version: "praat-parselmouth-0.4.6/soulscope-1.0.0",
            parameters: {},
            device_metadata: {},
            created_at: "2026-07-24T00:00:00.000Z",
          }],
        },
      }],
    },
  }, { scanId: "scan-1" });

  const canonical = features.find((feature) => feature.featureId === "voice.jitter.local");
  const compatibility = features.find((feature) => feature.featureId === "voice.jitter");
  assert.equal(canonical?.value, 0.012);
  assert.equal(canonical?.metadata?.source, "canonical_server");
  assert.equal(compatibility?.value, 1.2);
  assert.equal(compatibility?.unit, "%");
  assert.deepEqual(compatibility?.captureIds, ["prompt:voice:1"]);
});

test("legacy note energies remain visualization only", () => {
  const features = buildRawFeatures(baseScan, { scanId: "scan-1" });
  const note = features.find((feature) => feature.featureId === "voice.note_energy.c");
  assert.equal(note?.metadata?.evidenceUse, "visualization_only");
});

test("personal acoustic baselines separate units, capture kinds, prompts, and windows", () => {
  const now = Date.parse("2026-07-24T00:00:00.000Z");
  const rows = Array.from({ length: 9 }, (_, index) => ({
    scan_id: `scan-${index}`,
    feature_id: "voice.jitter.local",
    feature_version: "1.0.0",
    capture_kind: "sustained_vowel",
    source_capture_id: `prompt-a:voice:${index}`,
    unit: "fraction",
    method: "Praat-Parselmouth",
    extractor: "praat-parselmouth",
    extractor_version: "v1",
    value: index === 8 ? 100 : 0.01 + index * 0.001,
    quality: "good",
    confidence: 0.9,
    created_at: new Date(now - index * 2 * 86400000).toISOString(),
  }));
  const connectedSpeech = { ...rows[0], scan_id: "speech-scan", capture_kind: "guided_speech", source_capture_id: "prompt-a:voice:speech" };
  const baselines = buildPersonalAcousticBaselines([...rows, connectedSpeech], now);
  const vowel = baselines.filter((row) => row.capture_kind === "sustained_vowel");
  assert.equal(vowel.length, 3);
  assert.equal(vowel.find((row) => row.baseline_window === "7_day")?.status, "provisional");
  assert.equal(vowel.find((row) => row.baseline_window === "stable")?.status, "established");
  assert.equal(vowel.find((row) => row.baseline_window === "stable")?.measurements_rejected, 1);
  assert.equal(baselines.find((row) => row.capture_kind === "guided_speech")?.status, "not_established");
  assert.equal(vowel.find((row) => row.baseline_window === "stable")?.unit, "fraction");
});

test("MAD equal to zero does not convert a missing baseline into zero deviation", () => {
  const rows = [0, 0, 0].map((value, index) => ({
    scan_id: `constant-${index}`,
    feature_id: "voice.hnr.mean",
    feature_version: "1.0.0",
    capture_kind: "sustained_vowel",
    source_capture_id: `prompt:voice:${index}`,
    unit: "dB",
    method: "Praat-Parselmouth",
    extractor: "praat-parselmouth",
    extractor_version: "v1",
    value,
    quality: "good",
    confidence: 0.9,
    created_at: "2026-07-24T00:00:00.000Z",
  }));
  const result = buildPersonalAcousticBaselines(rows, Date.parse("2026-07-24T00:00:00.000Z"));
  const stable = result.find((row) => row.baseline_window === "stable");
  assert.equal(stable?.dispersion_value, 0);
  assert.equal(stable?.current_deviation, 0);
  assert.equal(stable?.current_robust_z, null);
});
