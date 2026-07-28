export type ResonanceCoreId = "mobilization" | "restoration" | "coherence" | "openness";

export type ResonanceCore = {
  id: ResonanceCoreId;
  label: string;
  score: number;
  confidence: number;
  evidence: string[];
};

export type ResonanceCoordinate = {
  version: "soulscope-resonance-coordinate-v1";
  cores: Record<ResonanceCoreId, ResonanceCore>;
  x: number;
  y: number;
  radius: number;
  quadrant: "settled-coherent" | "activated-coherent" | "settled-diffuse" | "activated-diffuse";
  confidence: number;
  rationale: string[];
};

export type ResonanceCoordinateInput = {
  activation: number;
  organization: number;
  regulation: number;
  expression: number;
  relationalOrientation: number;
  direction: number;
  capacity: number;
  recovery: number;
  stress: number;
  mentalEffort: number;
  evidenceConfidence: number;
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0.5));
const clampSigned = (value: number) => Math.max(-1, Math.min(1, Number.isFinite(value) ? value : 0));
const mean = (...values: number[]) => values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
const round01 = (value: number) => Number(clamp01(value).toFixed(3));
const roundSigned = (value: number) => Number(clampSigned(value).toFixed(3));

function core(id: ResonanceCoreId, label: string, score: number, confidence: number, evidence: string[]): ResonanceCore {
  return { id, label, score: round01(score), confidence: round01(confidence), evidence };
}

export function buildResonanceCoordinate(input: ResonanceCoordinateInput): ResonanceCoordinate {
  const mobilization = clamp01(mean(input.activation, input.direction, input.expression));
  const restoration = clamp01(mean(input.regulation, input.recovery, input.capacity));
  const coherence = clamp01(mean(input.organization, input.regulation, input.direction));
  const openness = clamp01(mean(input.expression, input.relationalOrientation, 1 - input.stress));

  const cores: Record<ResonanceCoreId, ResonanceCore> = {
    mobilization: core("mobilization", "Mobilization", mobilization, input.evidenceConfidence, ["activation", "direction", "expression"]),
    restoration: core("restoration", "Restoration", restoration, input.evidenceConfidence, ["regulation", "recovery", "capacity"]),
    coherence: core("coherence", "Coherence", coherence, input.evidenceConfidence, ["organization", "regulation", "direction"]),
    openness: core("openness", "Openness", openness, input.evidenceConfidence, ["expression", "relationalOrientation", "stress"]),
  };

  // X expresses the balance between outward mobilization and restorative capacity.
  // Y expresses whether organized, open signal structure is leading diffuse load.
  const x = clampSigned(mobilization - restoration);
  const diffuseLoad = clamp01(mean(input.stress, input.mentalEffort, 1 - input.organization));
  const y = clampSigned(mean(coherence, openness) - diffuseLoad);
  const radius = clamp01(Math.sqrt(x * x + y * y) / Math.sqrt(2));
  const quadrant = `${x >= 0 ? "activated" : "settled"}-${y >= 0 ? "coherent" : "diffuse"}` as ResonanceCoordinate["quadrant"];
  const confidence = clamp01(mean(input.evidenceConfidence, ...Object.values(cores).map((item) => item.confidence)));

  return {
    version: "soulscope-resonance-coordinate-v1",
    cores,
    x: roundSigned(x),
    y: roundSigned(y),
    radius: round01(radius),
    quadrant,
    confidence: round01(confidence),
    rationale: [
      "The horizontal axis is derived from mobilization relative to restoration.",
      "The vertical axis is derived from coherence and openness relative to diffuse load.",
      "The coordinate is derived before pattern selection; pattern labels do not create the coordinate.",
    ],
  };
}

export function coordinateCompatibility(
  coordinate: Pick<ResonanceCoordinate, "x" | "y">,
  target: { x: number; y: number },
): number {
  const distance = Math.sqrt((coordinate.x - target.x) ** 2 + (coordinate.y - target.y) ** 2);
  return round01(1 - Math.min(1, distance / Math.sqrt(8)));
}
