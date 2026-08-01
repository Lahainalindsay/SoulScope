export type ConstellationId = "COG" | "REG" | "CAP" | "EXP";

export type DimensionInput = Readonly<{
  dimensionId: string;
  constellation: ConstellationId;
  mean: number | null;
  lowerBound: number | null;
  upperBound: number | null;
  confidence: number;
  evidenceCoverage: number;
  signalReliability: number;
  coherence: number;
  contradiction: number;
  momentum: number;
  baselineTrust: number;
  resolved: boolean;
  evidenceReferences: readonly string[];
}>;

export type ConstellationParameters = Readonly<{
  constellationId: ConstellationId;
  magnitude: number;
  dominance: number;
  symmetry: number;
  coherence: number;
  tension: number;
  compensation: number;
  momentum: number;
  distortion: number;
  confidence: number;
  evidenceCoverage: number;
}>;

export type InteractionKind =
  | "reinforces"
  | "buffers"
  | "amplifies"
  | "protects"
  | "reveals"
  | "redirects"
  | "integrates"
  | "constrains"
  | "destabilizes"
  | "compensates";

export type InteractionInput = Readonly<{
  interactionId: string;
  kind: InteractionKind;
  subject: ConstellationId;
  object: ConstellationId;
  strength: number;
  confidence: number;
  evidenceReferences: readonly string[];
}>;

export type AcousticTextureInputs = Readonly<{
  pitchRange?: number | null;
  pitchStability?: number | null;
  hnr?: number | null;
  jitter?: number | null;
  shimmer?: number | null;
  spectralFlux?: number | null;
  spectralFlatness?: number | null;
  pauseDensity?: number | null;
  pauseDuration?: number | null;
  rhythmRegularity?: number | null;
  formantStability?: number | null;
  harmonicRichness?: number | null;
}>;

export type RendererInput = Readonly<{
  rendererVersion: string;
  resultId: string;
  resultVersion: string;
  dimensions: readonly DimensionInput[];
  constellations: Readonly<Record<ConstellationId, ConstellationParameters>>;
  interactions: readonly InteractionInput[];
  acousticTexture: AcousticTextureInputs;
}>;

export type ScalarField = Readonly<{
  width: number;
  height: number;
  values: readonly number[];
  constellationFields: Readonly<Record<ConstellationId, readonly number[]>>;
  interactionField: readonly number[];
  checksum: string;
}>;

export type Contour = Readonly<{
  id: string;
  level: number;
  path: string;
  constellationId: ConstellationId | "CENTER" | "INTERACTION";
  importance: number;
  confidence: number;
  continuity: number;
  support: number;
  coherence: number;
  evidenceReferences: readonly string[];
  unresolved: boolean;
}>;

export type StrokeLayer = Readonly<{
  contourId: string;
  layer: "bloom" | "support" | "core";
  path: string;
  color: string;
  width: number;
  opacity: number;
  dashArray: string | null;
  evidenceReferences: readonly string[];
}>;

export type AnimationState = Readonly<{
  signatureId: string;
  stableContourIds: readonly string[];
  transitionKeyframes: readonly {
    contourId: string;
    fromOpacity: number;
    toOpacity: number;
    fromWidth: number;
    toWidth: number;
  }[];
}>;

export type SignatureJSON = Readonly<{
  rendererVersion: string;
  resultId: string;
  resultVersion: string;
  fieldChecksum: string;
  dimensions: readonly DimensionInput[];
  constellations: RendererInput["constellations"];
  interactions: readonly InteractionInput[];
  contours: readonly Contour[];
  strokes: readonly StrokeLayer[];
}>;

export type SignatureOutput = Readonly<{
  signatureId: string;
  input: RendererInput;
  field: ScalarField;
  contours: readonly Contour[];
  strokes: readonly StrokeLayer[];
  svg: string;
  canvas: {
    width: number;
    height: number;
    commands: readonly StrokeLayer[];
  };
  png: {
    mimeType: "image/svg+xml";
    dataUri: string;
  };
  animationState: AnimationState;
  json: SignatureJSON;
}>;
