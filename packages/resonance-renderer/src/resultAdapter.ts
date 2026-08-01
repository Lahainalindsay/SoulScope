import { CONSTELLATIONS, DIMENSION_ORDER, RENDERER_VERSION } from "./constants";
import { clamp, clampSigned, mean, spread } from "./math";
import type { ConstellationId, ConstellationParameters, DimensionInput, InteractionInput, InteractionKind, RendererInput } from "./types";

const RENDERED_INTERACTIONS = new Set<InteractionKind>([
  "reinforces",
  "buffers",
  "amplifies",
  "protects",
  "reveals",
  "redirects",
  "integrates",
  "constrains",
  "destabilizes",
  "compensates",
]);

const KIND_ALIASES: Record<string, InteractionKind | null> = {
  reinforces: "reinforces",
  buffers: "buffers",
  amplifies: "amplifies",
  protects: "protects",
  reveals: "reveals",
  redirects: "redirects",
  integrates: "integrates",
  constrains: "constrains",
  destabilizes: "destabilizes",
  compensates: "compensates",
  masks: "constrains",
  shifts: "redirects",
  suppresses_global_pattern: null,
};

function dimensionRecord(result: any, dimensionId: string) {
  return result?.phaseBDimensions?.records?.find((record: any) => record.dimensionId === dimensionId);
}

function measured(result: any, featureId: string) {
  const records = result?.evidenceLedger?.records?.filter((record: any) =>
    record.featureId === featureId && !record.missingEvidence && record.measuredValue !== null,
  ) ?? [];
  if (!records.length) return null;
  return mean(records.map((record: any) => Number(record.measuredValue)));
}

function normalize(result: any, featureId: string, low: number, high: number) {
  const value = measured(result, featureId);
  return value === null ? null : clamp((value - low) / Math.max(0.000001, high - low));
}

function dimensionToInput(result: any, record: any): DimensionInput {
  const movement = result?.phaseBConstellation?.geometry?.constellations?.[record.constellation]?.temporalMovement;
  const momentum = movement?.available ? clampSigned(mean(Object.values(movement.vector ?? {}).map(Number))) : 0;
  const signalReliability = clamp(mean((record.supportingEvidence ?? []).map((id: string) => {
    const evidence = result?.evidenceLedger?.records?.find((item: any) => item.evidenceId === id);
    return evidence?.confidence ?? record.confidence ?? 0;
  })));
  return Object.freeze({
    dimensionId: record.dimensionId,
    constellation: record.constellation,
    mean: record.resolved === false ? null : clamp(record.posterior?.mean ?? record.value ?? 0),
    lowerBound: record.resolved === false ? null : clamp(record.posterior?.interval?.low ?? record.value ?? 0),
    upperBound: record.resolved === false ? null : clamp(record.posterior?.interval?.high ?? record.value ?? 0),
    confidence: clamp(record.confidence ?? 0),
    evidenceCoverage: clamp(record.evidenceCoverage ?? 0),
    signalReliability,
    coherence: clamp((record.confidence ?? 0) * (1 - (record.contradictionStrength ?? 0))),
    contradiction: clamp(record.contradictionStrength ?? 0),
    momentum,
    baselineTrust: record.baselineTrust === "established" ? 1 : record.baselineTrust === "provisional" ? 0.66 : record.baselineTrust === "within_session" ? 0.42 : 0,
    resolved: Boolean(record.resolved),
    evidenceReferences: Object.freeze([...(record.supportingEvidence ?? [])].sort()),
  });
}

function constellationParameters(result: any, constellationId: ConstellationId, dimensions: readonly DimensionInput[]): ConstellationParameters {
  const decision = result?.phaseBConstellation?.geometry?.constellations?.[constellationId];
  const values = dimensions.map((dimension) => dimension.mean ?? 0);
  const descriptors = decision?.descriptors ?? {};
  return Object.freeze({
    constellationId,
    magnitude: clamp(descriptors.magnitude ?? mean(values)),
    dominance: clamp(descriptors.dominance ?? Math.max(0, Math.max(...values) - mean(values))),
    symmetry: clamp(descriptors.symmetry ?? (1 - spread(values))),
    coherence: clamp(descriptors.coherence ?? mean(dimensions.map((dimension) => dimension.coherence))),
    tension: clamp(descriptors.tension ?? spread(values)),
    compensation: clamp(descriptors.compensation ?? Math.max(0, spread(values) - 0.16)),
    momentum: clampSigned(descriptors.momentum ?? mean(dimensions.map((dimension) => dimension.momentum))),
    distortion: clamp(descriptors.distortion ?? mean(dimensions.map((dimension) => dimension.contradiction))),
    confidence: clamp(decision?.confidence ?? mean(dimensions.map((dimension) => dimension.confidence))),
    evidenceCoverage: clamp(decision?.evidenceCoverage ?? mean(dimensions.map((dimension) => dimension.evidenceCoverage))),
  });
}

function interactionToInput(record: any): InteractionInput | null {
  const kind = KIND_ALIASES[record.kind] ?? null;
  if (!kind || !RENDERED_INTERACTIONS.has(kind)) return null;
  if (!CONSTELLATIONS.includes(record.subject) || !CONSTELLATIONS.includes(record.object)) return null;
  return Object.freeze({
    interactionId: String(record.interactionId),
    kind,
    subject: record.subject,
    object: record.object,
    strength: clamp(record.strength ?? 0),
    confidence: clamp(record.confidence ?? 0),
    evidenceReferences: Object.freeze([...(record.evidenceReferences ?? [])].sort()),
  });
}

export function adaptResultObject(resultObject: any): RendererInput {
  const dimensions = CONSTELLATIONS.flatMap((constellation) =>
    DIMENSION_ORDER[constellation].map((dimensionId) => dimensionRecord(resultObject, dimensionId)).filter(Boolean).map((record) => dimensionToInput(resultObject, record)),
  );
  const constellations = Object.fromEntries(CONSTELLATIONS.map((constellation) => [
    constellation,
    constellationParameters(resultObject, constellation, dimensions.filter((dimension) => dimension.constellation === constellation)),
  ])) as RendererInput["constellations"];
  const interactions = (resultObject?.phaseBInteractions?.records ?? []).map(interactionToInput).filter(Boolean);
  return Object.freeze({
    rendererVersion: RENDERER_VERSION,
    resultId: String(resultObject?.scanId ?? "unknown-result"),
    resultVersion: String(resultObject?.versions?.canonicalResult ?? resultObject?.schemaVersion ?? "unknown-result-version"),
    dimensions: Object.freeze(dimensions),
    constellations: Object.freeze(constellations),
    interactions: Object.freeze(interactions),
    acousticTexture: Object.freeze({
      pitchRange: normalize(resultObject, "voice.f0.range_semitones", 2, 16),
      pitchStability: normalize(resultObject, "voice.pitch_stability", 0.25, 0.92),
      hnr: normalize(resultObject, "voice.hnr", 0, 24),
      jitter: normalize(resultObject, "voice.jitter", 0, 5),
      shimmer: normalize(resultObject, "voice.shimmer", 0, 12),
      spectralFlux: normalize(resultObject, "voice.spectral_flux", 0, 0.6),
      spectralFlatness: normalize(resultObject, "voice.spectral_flatness", 0.02, 0.35),
      pauseDensity: normalize(resultObject, "voice.pause.density", 1, 18),
      pauseDuration: normalize(resultObject, "voice.pause.duration_mean", 180, 1400),
      rhythmRegularity: normalize(resultObject, "voice.rhythm_regularity", 0, 1),
      formantStability: normalize(resultObject, "voice.formant_stability", 0, 1),
      harmonicRichness: normalize(resultObject, "voice.harmonic_richness", 0.15, 0.95),
    }),
  });
}
