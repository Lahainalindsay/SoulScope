import type { CanonicalSoulScopeResult } from "../canonicalResult";
import type { CanonicalDimensionRecord, ConstellationId } from "../canonicalDimensionEngine";
import { ACOUSTIC_VISUAL_REGISTRY_V1, type AcousticVisualRegistryEntry } from "./acousticVisualRegistry.v1";
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

function clampSigned(value: number) {
  return Math.max(-1, Math.min(1, Number.isFinite(value) ? value : 0));
}

function roundSigned(value: number) {
  return Number(clampSigned(value).toFixed(3));
}

function mean(values: number[]) {
  const valid = values.filter(Number.isFinite);
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : 0;
}

function contradictionFor(dimension: CanonicalDimensionRecord) {
  return round(dimension.contradictionStrength);
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
  const unresolved = !dimension.resolved;
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
  const entry = Object.values(ACOUSTIC_VISUAL_REGISTRY_V1).find((item) => item.featureId === featureId);
  const { low, high } = entry?.normalizationRange ?? { low: 0, high: 1 };
  return round((value - low) / Math.max(0.000001, high - low));
}

function normalizedRegistryEvidence(result: CanonicalSoulScopeResult, entry: AcousticVisualRegistryEntry) {
  return normalizedEvidence(result, entry.featureId);
}

function acousticInputs(result: CanonicalSoulScopeResult): AcousticVisualInputs {
  return Object.freeze({
    pitchRange: normalizedRegistryEvidence(result, ACOUSTIC_VISUAL_REGISTRY_V1.pitchRange),
    pitchStability: normalizedRegistryEvidence(result, ACOUSTIC_VISUAL_REGISTRY_V1.pitchStability),
    harmonicRichness: normalizedRegistryEvidence(result, ACOUSTIC_VISUAL_REGISTRY_V1.harmonicRichness),
    spectralFlatness: normalizedRegistryEvidence(result, ACOUSTIC_VISUAL_REGISTRY_V1.spectralFlatness),
    phonationRatio: normalizedRegistryEvidence(result, ACOUSTIC_VISUAL_REGISTRY_V1.phonationRatio),
    pauseDensity: normalizedRegistryEvidence(result, ACOUSTIC_VISUAL_REGISTRY_V1.pauseDensity),
    pauseDurationMean: normalizedRegistryEvidence(result, ACOUSTIC_VISUAL_REGISTRY_V1.pauseDurationMean),
  });
}

function constellationMomentum(result: CanonicalSoulScopeResult, constellation: ConstellationId) {
  const movement = result.phaseBConstellation.geometry.constellations[constellation].temporalMovement;
  if (!movement.available) return null;
  return roundSigned(mean(Object.values(movement.vector)));
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
