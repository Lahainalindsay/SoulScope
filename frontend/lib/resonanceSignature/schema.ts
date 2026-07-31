import type { ResonanceSignatureInputV1, SignatureConstellationId } from "./types";

const CONSTELLATIONS: SignatureConstellationId[] = ["COG", "REG", "CAP", "EXP"];

function isUnit(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}

function assertUnit(value: unknown, path: string) {
  if (!isUnit(value)) throw new Error(`${path} must be a finite number in [0, 1].`);
}

function assertNullableUnit(value: unknown, path: string) {
  if (value !== null) assertUnit(value, path);
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value as Readonly<T>;
  for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  return Object.freeze(value);
}

export function validateResonanceSignatureInput(input: unknown): ResonanceSignatureInputV1 {
  const candidate = input as ResonanceSignatureInputV1;
  if (!candidate || typeof candidate !== "object") throw new Error("ResonanceSignatureInputV1 must be an object.");
  if (candidate.contractVersion !== "soulscope.resonance-signature.v1") throw new Error("Unsupported resonance signature contractVersion.");
  if (!candidate.scanId || !candidate.resultVersion || !candidate.rendererVersion) throw new Error("scanId, resultVersion, and rendererVersion are required.");
  assertUnit(candidate.overallConfidence, "overallConfidence");
  assertUnit(candidate.overallCoverage, "overallCoverage");
  assertUnit(candidate.overallCoherence, "overallCoherence");
  assertUnit(candidate.baselineTrust, "baselineTrust");
  for (const constellationId of CONSTELLATIONS) {
    const constellation = candidate.constellations?.[constellationId];
    if (!constellation) throw new Error(`constellations.${constellationId} is required.`);
    if (constellation.constellationId !== constellationId) throw new Error(`constellations.${constellationId}.constellationId mismatch.`);
    if (!Array.isArray(constellation.dimensions) || constellation.dimensions.length !== 4) {
      throw new Error(`constellations.${constellationId}.dimensions must contain four dimensions.`);
    }
    assertUnit(constellation.confidence, `constellations.${constellationId}.confidence`);
    assertUnit(constellation.evidenceCoverage, `constellations.${constellationId}.evidenceCoverage`);
    assertUnit(constellation.contradiction, `constellations.${constellationId}.contradiction`);
    assertUnit(constellation.coherence, `constellations.${constellationId}.coherence`);
    constellation.dimensions.forEach((dimension, index) => {
      const path = `constellations.${constellationId}.dimensions.${index}`;
      if (!dimension.dimensionId) throw new Error(`${path}.dimensionId is required.`);
      assertNullableUnit(dimension.mean, `${path}.mean`);
      assertNullableUnit(dimension.lowerBound, `${path}.lowerBound`);
      assertNullableUnit(dimension.upperBound, `${path}.upperBound`);
      assertUnit(dimension.confidence, `${path}.confidence`);
      assertUnit(dimension.evidenceCoverage, `${path}.evidenceCoverage`);
      assertUnit(dimension.contradiction, `${path}.contradiction`);
      assertUnit(dimension.coherence, `${path}.coherence`);
      if (dimension.momentum !== undefined && dimension.momentum !== null && (!Number.isFinite(dimension.momentum) || dimension.momentum < -1 || dimension.momentum > 1)) {
        throw new Error(`${path}.momentum must be null or finite in [-1, 1].`);
      }
    });
  }
  return deepFreeze(candidate) as ResonanceSignatureInputV1;
}
