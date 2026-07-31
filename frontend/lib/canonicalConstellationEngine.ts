import type { CanonicalDimensionId, CanonicalDimensionRecord, ConstellationId } from "./canonicalDimensionEngine";

export const CONSTELLATION_ENGINE_VERSION = "constellation-geometry-v0.1";
export const CONSTELLATION_REGISTRY_VERSION = "soulscope-constellation-bible-v0.1";

export type CanonicalConstellationRegion =
  | "COG-017"
  | "COG-014"
  | "COG-011"
  | "COG-020"
  | "REG-022"
  | "REG-019"
  | "REG-024"
  | "REG-026"
  | "CAP-012"
  | "CAP-016"
  | "CAP-018"
  | "CAP-021"
  | "EXP-009"
  | "EXP-006"
  | "EXP-004"
  | "EXP-012"
  | "unresolved";

export type BoundaryBlend = {
  blendId: string;
  primaryRegion: CanonicalConstellationRegion;
  secondaryRegion: CanonicalConstellationRegion;
  blend: number;
  transition: number;
  overlap: number;
  uncertainty: number;
  rationale: string;
};

export type ConstellationDecision = {
  constellation: ConstellationId;
  label: string;
  points: CanonicalDimensionId[];
  coordinates: Record<string, number>;
  descriptors: {
    magnitude: number;
    dominance: number;
    symmetry: number;
    tension: number;
    coherence: number;
    compensation: number;
    momentum: number;
    distortion: number;
  };
  confidence: number;
  uncertainty: number;
  uncertaintyInterval: { low: number; high: number };
  evidenceCoverage: number;
  temporalMovement: {
    available: boolean;
    vector: Record<string, number>;
    evidenceReferences: string[];
  };
  nearestRegions: Array<{
    region: CanonicalConstellationRegion;
    distance: number;
    compatibility: number;
    evidenceReferences: string[];
    whyLost?: string[];
  }>;
  boundaryBlend: BoundaryBlend | null;
  winner: CanonicalConstellationRegion;
};

export type ContinuousConstellationGeometry = {
  version: string;
  registryVersion: string;
  coordinates: {
    x: number;
    y: number;
    z: number;
    activation: number;
  };
  confidence: number;
  uncertainty: number;
  uncertaintyInterval: { low: number; high: number };
  temporalMovement: {
    available: boolean;
    vector: { dx: number; dy: number; dz: number };
    evidenceReferences: string[];
  };
  evidenceCoverage: number;
  nearestRegions: Array<{
    region: CanonicalConstellationRegion;
    distance: number;
    compatibility: number;
    evidenceReferences: string[];
  }>;
  boundaryBlend: BoundaryBlend | null;
  constellations: Record<ConstellationId, ConstellationDecision>;
};

type StateRegion = {
  stateId: Exclude<CanonicalConstellationRegion, "unresolved">;
  constellation: ConstellationId;
  displayName: string;
  target: Partial<Record<CanonicalDimensionId, number>>;
  requiredPoints: CanonicalDimensionId[];
};

const CONSTELLATION_POINTS: Record<ConstellationId, CanonicalDimensionId[]> = {
  COG: ["COG-P1", "COG-P2", "COG-P3", "COG-P4"],
  REG: ["REG-P1", "REG-P2", "REG-P3", "REG-P4"],
  CAP: ["CAP-P1", "CAP-P2", "CAP-P3", "CAP-P4"],
  EXP: ["EXP-P1", "EXP-P2", "EXP-P3", "EXP-P4"],
};

const CONSTELLATION_LABELS: Record<ConstellationId, string> = {
  COG: "Cognitive Form",
  REG: "Regulatory Motion",
  CAP: "Available Capacity",
  EXP: "Expressive Interface",
};

const STATES: StateRegion[] = [
  { stateId: "COG-017", constellation: "COG", displayName: "Deliberate Builder", target: { "COG-P1": 0.78, "COG-P2": 0.42, "COG-P3": 0.72, "COG-P4": 0.68 }, requiredPoints: CONSTELLATION_POINTS.COG },
  { stateId: "COG-014", constellation: "COG", displayName: "Structured Ease", target: { "COG-P1": 0.82, "COG-P2": 0.42, "COG-P3": 0.82, "COG-P4": 0.28 }, requiredPoints: CONSTELLATION_POINTS.COG },
  { stateId: "COG-011", constellation: "COG", displayName: "Open Architect", target: { "COG-P1": 0.68, "COG-P2": 0.68, "COG-P3": 0.58, "COG-P4": 0.42 }, requiredPoints: CONSTELLATION_POINTS.COG },
  { stateId: "COG-020", constellation: "COG", displayName: "Searching Load", target: { "COG-P1": 0.42, "COG-P2": 0.78, "COG-P3": 0.38, "COG-P4": 0.78 }, requiredPoints: CONSTELLATION_POINTS.COG },
  { stateId: "REG-022", constellation: "REG", displayName: "Adaptive Recovery", target: { "REG-P1": 0.68, "REG-P2": 0.68, "REG-P3": 0.78, "REG-P4": 0.8 }, requiredPoints: CONSTELLATION_POINTS.REG },
  { stateId: "REG-019", constellation: "REG", displayName: "Steady Mobilization", target: { "REG-P1": 0.82, "REG-P2": 0.78, "REG-P3": 0.52, "REG-P4": 0.48 }, requiredPoints: CONSTELLATION_POINTS.REG },
  { stateId: "REG-024", constellation: "REG", displayName: "Returning Capacity", target: { "REG-P1": 0.42, "REG-P2": 0.68, "REG-P3": 0.58, "REG-P4": 0.82 }, requiredPoints: CONSTELLATION_POINTS.REG },
  { stateId: "REG-026", constellation: "REG", displayName: "Held Activation", target: { "REG-P1": 0.82, "REG-P2": 0.66, "REG-P3": 0.38, "REG-P4": 0.28 }, requiredPoints: CONSTELLATION_POINTS.REG },
  { stateId: "CAP-012", constellation: "CAP", displayName: "Available Reserve", target: { "CAP-P1": 0.68, "CAP-P2": 0.8, "CAP-P3": 0.32, "CAP-P4": 0.78 }, requiredPoints: CONSTELLATION_POINTS.CAP },
  { stateId: "CAP-016", constellation: "CAP", displayName: "Efficient Engagement", target: { "CAP-P1": 0.78, "CAP-P2": 0.5, "CAP-P3": 0.26, "CAP-P4": 0.78 }, requiredPoints: CONSTELLATION_POINTS.CAP },
  { stateId: "CAP-018", constellation: "CAP", displayName: "Costly Output", target: { "CAP-P1": 0.72, "CAP-P2": 0.32, "CAP-P3": 0.78, "CAP-P4": 0.38 }, requiredPoints: CONSTELLATION_POINTS.CAP },
  { stateId: "CAP-021", constellation: "CAP", displayName: "Rebuilding Reserve", target: { "CAP-P1": 0.56, "CAP-P2": 0.42, "CAP-P3": 0.42, "CAP-P4": 0.62 }, requiredPoints: CONSTELLATION_POINTS.CAP },
  { stateId: "EXP-009", constellation: "EXP", displayName: "Guarded Openness", target: { "EXP-P1": 0.58, "EXP-P2": 0.68, "EXP-P3": 0.78, "EXP-P4": 0.68 }, requiredPoints: CONSTELLATION_POINTS.EXP },
  { stateId: "EXP-006", constellation: "EXP", displayName: "Selective Clarity", target: { "EXP-P1": 0.42, "EXP-P2": 0.52, "EXP-P3": 0.72, "EXP-P4": 0.78 }, requiredPoints: CONSTELLATION_POINTS.EXP },
  { stateId: "EXP-004", constellation: "EXP", displayName: "Open Range", target: { "EXP-P1": 0.82, "EXP-P2": 0.82, "EXP-P3": 0.32, "EXP-P4": 0.68 }, requiredPoints: CONSTELLATION_POINTS.EXP },
  { stateId: "EXP-012", constellation: "EXP", displayName: "Constrained Access", target: { "EXP-P1": 0.24, "EXP-P2": 0.28, "EXP-P3": 0.82, "EXP-P4": 0.34 }, requiredPoints: CONSTELLATION_POINTS.EXP },
];

export const CANONICAL_STATE_DISPLAY_NAMES: Record<Exclude<CanonicalConstellationRegion, "unresolved">, string> = Object.fromEntries(
  STATES.map((state) => [state.stateId, state.displayName]),
) as Record<Exclude<CanonicalConstellationRegion, "unresolved">, string>;

export function displayNameForCanonicalRegion(region: CanonicalConstellationRegion) {
  return region === "unresolved" ? null : CANONICAL_STATE_DISPLAY_NAMES[region] ?? null;
}

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}

function round(value: number) {
  return Number(clamp(value).toFixed(3));
}

function byId(dimensions: CanonicalDimensionRecord[], id: CanonicalDimensionId) {
  return dimensions.find((item) => item.dimensionId === id);
}

function value(dimensions: CanonicalDimensionRecord[], id: CanonicalDimensionId) {
  return byId(dimensions, id)?.value ?? 0.5;
}

function mean(values: number[]) {
  const valid = values.filter(Number.isFinite);
  return valid.length ? valid.reduce((sum, item) => sum + item, 0) / valid.length : 0;
}

function spread(values: number[]) {
  if (!values.length) return 0;
  const average = mean(values);
  return mean(values.map((item) => Math.abs(item - average)));
}

function evidenceFor(dimensions: CanonicalDimensionRecord[]) {
  return Array.from(new Set(dimensions.flatMap((item) => item.supportingEvidence))).sort();
}

function distance(dimensions: CanonicalDimensionRecord[], target: StateRegion["target"]) {
  const entries = Object.entries(target) as Array<[CanonicalDimensionId, number]>;
  return Math.sqrt(mean(entries.map(([id, expected]) => (value(dimensions, id) - expected) ** 2)));
}

function descriptors(points: CanonicalDimensionRecord[]) {
  const values = points.map((point) => point.value);
  const uncertainties = points.map((point) => point.uncertainty);
  const contradiction = mean(points.map((point) => point.contradictionStrength));
  const magnitude = mean(values);
  const dominance = Math.max(...values) - mean(values.filter((item) => item !== Math.max(...values)));
  return {
    magnitude: round(magnitude),
    dominance: round(Math.max(0, dominance)),
    symmetry: round(1 - spread(values)),
    tension: round(spread(values)),
    coherence: round(mean(points.map((point) => point.confidence)) * (1 - contradiction)),
    compensation: round(Math.max(0, spread(values) - 0.16)),
    momentum: 0,
    distortion: round(mean(uncertainties) * 0.62 + contradiction),
  };
}

function buildDecision(constellation: ConstellationId, dimensions: CanonicalDimensionRecord[]): ConstellationDecision {
  const points = CONSTELLATION_POINTS[constellation];
  const pointRecords = points.map((id) => byId(dimensions, id)).filter((item): item is CanonicalDimensionRecord => Boolean(item));
  const coordinates = Object.fromEntries(pointRecords.map((point) => [point.dimensionId, point.value]));
  const coverage = round(mean(pointRecords.map((point) => point.evidenceCoverage)));
  const confidence = round(mean(pointRecords.map((point) => point.confidence)) * coverage);
  const uncertainty = round(1 - confidence);
  const pointEvidence = evidenceFor(pointRecords);
  const candidates = STATES
    .filter((state) => state.constellation === constellation)
    .map((state) => {
      const candidateDistance = distance(dimensions, state.target);
      const missingRequired = state.requiredPoints.filter((id) => {
        const point = byId(dimensions, id);
        return !point || point.evidenceCoverage < 0.5;
      });
      const compatibility = round((1 - candidateDistance) * (missingRequired.length ? 0.62 : 1));
      return {
        region: state.stateId,
        distance: Number(candidateDistance.toFixed(3)),
        compatibility,
        evidenceReferences: pointEvidence,
        whyLost: missingRequired.length ? [`Missing required point evidence: ${missingRequired.join(", ")}.`] : [],
      };
    })
    .sort((left, right) => right.compatibility - left.compatibility || left.distance - right.distance);
  const [first, second] = candidates;
  const margin = first && second ? first.compatibility - second.compatibility : 1;
  const unresolved = !first || coverage < 0.5 || confidence < 0.2;
  const boundaryBlend = !unresolved && first && second && margin <= 0.08
    ? {
        blendId: `blend:${first.region}:${second.region}`,
        primaryRegion: first.region,
        secondaryRegion: second.region,
        blend: round(second.compatibility / Math.max(0.000001, first.compatibility + second.compatibility)),
        transition: round(1 - margin / 0.08),
        overlap: round((first.compatibility + second.compatibility) / 2),
        uncertainty: round(Math.max(uncertainty, 1 - margin)),
        rationale: "Bible v0.1 boundary-blend rule preserved adjacent candidate ambiguity.",
      }
    : null;

  return {
    constellation,
    label: CONSTELLATION_LABELS[constellation],
    points,
    coordinates,
    descriptors: descriptors(pointRecords),
    confidence,
    uncertainty,
    uncertaintyInterval: {
      low: round(Math.max(0, (first?.compatibility ?? 0) - uncertainty / 2)),
      high: round(Math.min(1, (first?.compatibility ?? 0) + uncertainty / 2)),
    },
    evidenceCoverage: coverage,
    temporalMovement: { available: false, vector: {}, evidenceReferences: [] },
    nearestRegions: candidates,
    boundaryBlend,
    winner: unresolved ? "unresolved" : boundaryBlend ? boundaryBlend.primaryRegion : first.region,
  };
}

export function buildContinuousConstellationGeometry(
  dimensions: CanonicalDimensionRecord[],
): ContinuousConstellationGeometry {
  const constellations = {
    COG: buildDecision("COG", dimensions),
    REG: buildDecision("REG", dimensions),
    CAP: buildDecision("CAP", dimensions),
    EXP: buildDecision("EXP", dimensions),
  };
  const allDecisions = Object.values(constellations);
  const allNearest = allDecisions.flatMap((decision) => decision.nearestRegions);
  const allBlends = allDecisions.map((decision) => decision.boundaryBlend).filter((blend): blend is BoundaryBlend => Boolean(blend));
  const evidenceCoverage = round(mean(allDecisions.map((decision) => decision.evidenceCoverage)));
  const confidence = round(mean(allDecisions.map((decision) => decision.confidence)) * evidenceCoverage);
  const uncertainty = round(1 - confidence);
  const coordinates = {
    x: round(mean([value(dimensions, "COG-P1"), value(dimensions, "COG-P3"), value(dimensions, "REG-P2")])),
    y: round(mean([value(dimensions, "REG-P4"), value(dimensions, "CAP-P2"), value(dimensions, "CAP-P4")])),
    z: round(mean([value(dimensions, "EXP-P1"), value(dimensions, "EXP-P2"), value(dimensions, "EXP-P4")])),
    activation: round(mean([value(dimensions, "REG-P1"), value(dimensions, "CAP-P1"), value(dimensions, "COG-P4")])),
  };

  return {
    version: CONSTELLATION_ENGINE_VERSION,
    registryVersion: CONSTELLATION_REGISTRY_VERSION,
    coordinates,
    confidence,
    uncertainty,
    uncertaintyInterval: {
      low: round(Math.max(0, mean(allNearest.slice(0, 4).map((item) => item.compatibility)) - uncertainty / 2)),
      high: round(Math.min(1, mean(allNearest.slice(0, 4).map((item) => item.compatibility)) + uncertainty / 2)),
    },
    temporalMovement: { available: false, vector: { dx: 0, dy: 0, dz: 0 }, evidenceReferences: [] },
    evidenceCoverage,
    nearestRegions: allNearest.sort((left, right) => right.compatibility - left.compatibility).slice(0, 8),
    boundaryBlend: allBlends.sort((left, right) => right.uncertainty - left.uncertainty)[0] ?? null,
    constellations,
  };
}
