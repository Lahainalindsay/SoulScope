import type { ConstellationId } from "../canonicalDimensionEngine";

export type SignatureConstellationId = Extract<ConstellationId, "COG" | "REG" | "CAP" | "EXP">;

export type SignatureDimension = Readonly<{
  dimensionId: string;
  mean: number | null;
  lowerBound: number | null;
  upperBound: number | null;
  confidence: number;
  evidenceCoverage: number;
  contradiction: number;
  coherence: number;
  unresolved: boolean;
  momentum?: number | null;
}>;

export type SignatureConstellation = Readonly<{
  constellationId: SignatureConstellationId;
  dimensions: readonly SignatureDimension[];
  confidence: number;
  evidenceCoverage: number;
  contradiction: number;
  coherence: number;
}>;

export type AcousticVisualInputs = Readonly<{
  pitchRange?: number | null;
  pitchStability?: number | null;
  harmonicRichness?: number | null;
  spectralFlatness?: number | null;
  hnr?: number | null;
  jitter?: number | null;
  shimmer?: number | null;
  pauseDensity?: number | null;
  pauseDurationMean?: number | null;
  phonationRatio?: number | null;
  formantStability?: number | null;
}>;

export type SignaturePromptPhase = Readonly<{
  promptId: string;
  order: number;
  confidence: number;
  constellationDeltas: Partial<Record<SignatureConstellationId, number>>;
}>;

export type ResonanceSignatureInputV1 = Readonly<{
  contractVersion: "soulscope.resonance-signature.v1";
  scanId: string;
  resultVersion: string;
  rendererVersion: string;
  overallConfidence: number;
  overallCoverage: number;
  overallCoherence: number;
  baselineTrust: number;
  constellations: Readonly<Record<SignatureConstellationId, SignatureConstellation>>;
  acousticVisualInputs?: AcousticVisualInputs;
  promptPhases?: readonly SignaturePromptPhase[];
}>;

export type NormalizedSignatureDimension = SignatureDimension & Readonly<{
  normalizedMean: number | null;
  uncertainty: number;
  radialExtent: number;
  opacity: number;
  contourCount: number;
  lineSpread: number;
  missingArc: number;
}>;

export type NormalizedSignatureConstellation = Omit<SignatureConstellation, "dimensions"> & Readonly<{
  dimensions: readonly NormalizedSignatureDimension[];
  anchorAngle: number;
  fieldWeight: number;
}>;

export type NormalizedResonanceSignature = Omit<ResonanceSignatureInputV1, "constellations"> & Readonly<{
  constellations: Readonly<Record<SignatureConstellationId, NormalizedSignatureConstellation>>;
  overallConfidence: number;
  overallCoverage: number;
  overallCoherence: number;
  baselineTrust: number;
}>;

export type ResonanceSignatureRenderOutput = Readonly<{
  seed: string;
  scalarChecksum: string;
  svg: string;
  manifest: ResonanceSignatureManifest;
}>;

export type VisualMappingEntry = Readonly<{
  visualProperty: string;
  sourcePath: string;
  sourceValue: unknown;
  renderedValue: unknown;
}>;

export type ResonanceSignatureManifest = Readonly<{
  inputContractVersion: ResonanceSignatureInputV1["contractVersion"];
  rendererVersion: string;
  canonicalResultVersion: string;
  seed: string;
  normalizedParameters: unknown;
  contourThresholds: readonly number[];
  visualMappingEntries: readonly VisualMappingEntry[];
  missingDimensions: readonly string[];
  warnings: readonly string[];
  svgChecksum: string;
}>;

export type ScalarField = Readonly<{
  width: number;
  height: number;
  values: readonly number[];
  checksum: string;
}>;

export type SignatureContour = Readonly<{
  id: string;
  level: number;
  path: string;
  constellationId: SignatureConstellationId | "global" | "contradiction";
  confidence: number;
  coverage: number;
  contradiction: number;
  unresolved: boolean;
  strokeWidth: number;
  opacity: number;
}>;

export type SignatureNode = Readonly<{
  id: string;
  x: number;
  y: number;
  radius: number;
  opacity: number;
  constellationId: SignatureConstellationId | "center";
  support: number;
}>;
