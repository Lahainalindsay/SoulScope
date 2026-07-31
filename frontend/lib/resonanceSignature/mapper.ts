import type { CanonicalSoulScopeResult } from "../canonicalResult";
import type { CanonicalDimensionRecord, ConstellationId } from "../canonicalDimensionEngine";
import { RENDERER_VERSION } from "./registry";
import { validateResonanceSignatureInput } from "./schema";
import type { AcousticVisualInputs, ResonanceSignatureInputV1, SignatureConstellationId, SignatureDimension } from "./types";

const CONSTELLATIONS: SignatureConstellationId[] = ["COG", "REG", "CAP", "EXP"];

function clamp01(value: number) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function round(value: number) {
  return Number(clamp01(value).toFixed(3));
}

function mean(values: number[]) {
  const valid = values.filter(Number.isFinite);
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : 0;
}

function contradictionFor(dimension: CanonicalDimensionRecord) {
  return round(Math.min(1, dimension.contradictoryEvidence.length * 0.28));
}

function baselineTrustValue(dimensions: CanonicalDimensionRecord[]) {
  const values = dimensions.map((dimension) => {
    if (dimension.baselineTrust === "established") return 1;
    if (dimension.baselineTrust === "provisional") return 0.66;
    if (dimension.baselineTrust === "within_session") return 0.42;
    return 0;
  });
  return round(mean(values));
}

function dimensionToInput(dimension: CanonicalDimensionRecord, momentum: number | null): SignatureDimension {
  const unresolved = dimension.evidenceCoverage < 0.5 || dimension.confidence < 0.2 || dimension.missingEvidence.length > 0;
  return Object.freeze({
    dimensionId: dimension.dimensionId,
    mean: unresolved ? null : round(dimension.posterior.mean),
    lowerBound: unresolved ? null : round(dimension.posterior.interval.low),
    upperBound: unresolved ? null : round(dimension.posterior.interval.high),
    confidence: round(dimension.confidence),
    evidenceCoverage: round(dimension.evidenceCoverage),
    contradiction: contradictionFor(dimension),
    coherence: round(dimension.confidence * (1 - contradictionFor(dimension))),
    unresolved,
    momentum,
  });
}

function normalizedEvidence(result: CanonicalSoulScopeResult, featureId: string) {
  const records = result.evidenceLedger.records.filter((record) => record.featureId === featureId && !record.missingEvidence && record.measuredValue !== null);
  if (!records.length) return null;
  const value = mean(records.map((record) => Number(record.measuredValue)));
  const bounds: Record<string, [number, number]> = {
    "voice.f0.range_semitones": [2, 16],
    "voice.pitch_stability": [0.25, 0.92],
    "voice.harmonic_richness": [0.15, 0.95],
    "voice.spectral_flatness": [0.02, 0.35],
    "voice.phonation_time_ratio": [0.2, 0.9],
    "voice.pause.duration_mean": [180, 1400],
  };
  const [low, high] = bounds[featureId] ?? [0, 1];
  return round((value - low) / Math.max(0.000001, high - low));
}

function acousticInputs(result: CanonicalSoulScopeResult): AcousticVisualInputs {
  return Object.freeze({
    pitchRange: normalizedEvidence(result, "voice.f0.range_semitones"),
    pitchStability: normalizedEvidence(result, "voice.pitch_stability"),
    harmonicRichness: normalizedEvidence(result, "voice.harmonic_richness"),
    spectralFlatness: normalizedEvidence(result, "voice.spectral_flatness"),
    phonationRatio: normalizedEvidence(result, "voice.phonation_time_ratio"),
    pauseDensity: normalizedEvidence(result, "voice.pause.duration_mean"),
  });
}

function constellationMomentum(result: CanonicalSoulScopeResult, constellation: ConstellationId) {
  const movement = result.phaseBConstellation.geometry.constellations[constellation].temporalMovement;
  if (!movement.available) return null;
  return round(mean(Object.values(movement.vector)));
}

export function mapCanonicalResultToSignatureInput(result: CanonicalSoulScopeResult, rendererVersion = RENDERER_VERSION): ResonanceSignatureInputV1 {
  const dimensions = result.phaseBDimensions.records;
  const constellations = Object.fromEntries(CONSTELLATIONS.map((constellationId) => {
    const decision = result.phaseBConstellation.geometry.constellations[constellationId];
    const records = dimensions.filter((dimension) => dimension.constellation === constellationId);
    const contradiction = round(mean(records.map(contradictionFor)));
    return [constellationId, Object.freeze({
      constellationId,
      dimensions: records.map((dimension) => dimensionToInput(dimension, constellationMomentum(result, constellationId))),
      confidence: round(decision.confidence),
      evidenceCoverage: round(decision.evidenceCoverage),
      contradiction,
      coherence: round(decision.descriptors.coherence),
    })];
  })) as unknown as ResonanceSignatureInputV1["constellations"];
  const input: ResonanceSignatureInputV1 = {
    contractVersion: "soulscope.resonance-signature.v1",
    scanId: result.scanId,
    resultVersion: result.versions.canonicalResult,
    rendererVersion,
    overallConfidence: round(result.phaseBConstellation.geometry.confidence),
    overallCoverage: round(result.phaseBConstellation.geometry.evidenceCoverage),
    overallCoherence: round(mean(CONSTELLATIONS.map((id) => result.phaseBConstellation.geometry.constellations[id].descriptors.coherence))),
    baselineTrust: baselineTrustValue(dimensions),
    constellations,
    acousticVisualInputs: acousticInputs(result),
  };
  return validateResonanceSignatureInput(input);
}
