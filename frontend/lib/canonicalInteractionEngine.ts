import type { ContinuousConstellationGeometry } from "./canonicalConstellationEngine";
import type { CanonicalDimensionRecord } from "./canonicalDimensionEngine";

export const INTERACTION_ENGINE_VERSION = "cross-constellation-interactions-v0.1";

export type InteractionKind =
  | "reinforces"
  | "buffers"
  | "amplifies"
  | "masks"
  | "compensates"
  | "constrains"
  | "protects"
  | "redirects"
  | "destabilizes"
  | "integrates"
  | "reveals"
  | "shifts"
  | "suppresses_global_pattern";

export type CrossConstellationInteraction = {
  interactionId: string;
  kind: InteractionKind;
  subject: string;
  object: string;
  dimensions: string[];
  strength: number;
  confidence: number;
  uncertainty: number;
  evidenceReferences: string[];
  conditions: string[];
  alternatives: string[];
  rationale: string;
  narrativeClause: string;
  ruleVersion: string;
};

function round(value: number) {
  return Number(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)).toFixed(3));
}

function dimension(dimensions: CanonicalDimensionRecord[], id: string) {
  return dimensions.find((item) => item.dimensionId === id);
}

function value(dimensions: CanonicalDimensionRecord[], id: string) {
  return dimension(dimensions, id)?.value ?? 0.5;
}

function confidenceFor(dimensions: CanonicalDimensionRecord[], ids: string[], strength: number) {
  const records = ids.map((id) => dimension(dimensions, id)).filter((item): item is CanonicalDimensionRecord => Boolean(item));
  const base = records.length ? records.reduce((sum, item) => sum + item.confidence, 0) / records.length : 0;
  return round(base * strength);
}

function evidenceFor(dimensions: CanonicalDimensionRecord[], ids: string[]) {
  return Array.from(new Set(
    ids.flatMap((id) => dimension(dimensions, id)?.supportingEvidence ?? []),
  )).sort();
}

function makeInteraction(args: {
  interactionId: string;
  kind: InteractionKind;
  subject: string;
  object: string;
  dimensions: string[];
  strength: number;
  conditions: string[];
  alternatives: string[];
  rationale: string;
  narrativeClause: string;
  allDimensions: CanonicalDimensionRecord[];
}): CrossConstellationInteraction {
  const confidence = confidenceFor(args.allDimensions, args.dimensions, args.strength);
  return {
    interactionId: args.interactionId,
    kind: args.kind,
    subject: args.subject,
    object: args.object,
    dimensions: args.dimensions,
    strength: round(args.strength),
    confidence,
    uncertainty: round(1 - confidence),
    evidenceReferences: evidenceFor(args.allDimensions, args.dimensions),
    conditions: args.conditions,
    alternatives: args.alternatives,
    rationale: args.rationale,
    narrativeClause: args.narrativeClause,
    ruleVersion: INTERACTION_ENGINE_VERSION,
  };
}

export function buildCrossConstellationInteractions(
  dimensions: CanonicalDimensionRecord[],
  geometry: ContinuousConstellationGeometry,
): CrossConstellationInteraction[] {
  const interactions: CrossConstellationInteraction[] = [];
  const unresolvedCount = Object.values(geometry.constellations).filter((decision) => decision.winner === "unresolved").length;

  const organization = value(dimensions, "COG-P1");
  const demand = value(dimensions, "COG-P4");
  const reserve = value(dimensions, "CAP-P2");
  const effortCost = value(dimensions, "CAP-P3");
  const sustainability = value(dimensions, "CAP-P4");
  const activation = value(dimensions, "REG-P1");
  const stability = value(dimensions, "REG-P2");
  const flexibility = value(dimensions, "REG-P3");
  const recovery = value(dimensions, "REG-P4");
  const range = value(dimensions, "EXP-P1");
  const openness = value(dimensions, "EXP-P2");
  const restraint = value(dimensions, "EXP-P3");

  if (unresolvedCount >= 2) {
    interactions.push(makeInteraction({
      interactionId: "INT-008",
      kind: "suppresses_global_pattern",
      subject: "unresolved_constellations",
      object: "global_pattern",
      dimensions: dimensions.map((item) => item.dimensionId),
      strength: round(unresolvedCount / 4),
      conditions: ["Any two constellations unresolved."],
      alternatives: ["Report only supported local observations."],
      rationale: "Bible rule INT-008 suppresses global naming when local evidence remains unresolved.",
      narrativeClause: "Several views remain unresolved, so the result should stay local and cautious.",
      allDimensions: dimensions,
    }));
  }

  if (organization >= 0.56) {
    const withReserve = reserve >= 0.56 && effortCost < 0.56;
    interactions.push(makeInteraction({
      interactionId: "INT-001",
      kind: "reveals",
      subject: "CAP",
      object: "COG",
      dimensions: ["COG-P1", "CAP-P2", "CAP-P3"],
      strength: round(withReserve ? reserve : effortCost),
      conditions: ["COG Organization high; compare CAP Reserve/Cost."],
      alternatives: ["Supported structure", "Compensatory structure"],
      rationale: withReserve
        ? "Capacity suggests organized cognition is supported by reserve."
        : "Capacity cost suggests organized cognition may be compensatory.",
      narrativeClause: withReserve
        ? "Capacity appears to support the current structure."
        : "The structure is present, but it may be expensive to maintain.",
      allDimensions: dimensions,
    }));
  }

  if (openness >= 0.56 || range >= 0.56) {
    const regulated = stability >= 0.56 || recovery >= 0.56;
    interactions.push(makeInteraction({
      interactionId: "INT-002",
      kind: regulated ? "buffers" : "destabilizes",
      subject: "REG",
      object: "EXP",
      dimensions: ["EXP-P1", "EXP-P2", "REG-P2", "REG-P4"],
      strength: round(regulated ? Math.max(stability, recovery) : Math.max(openness, range) - Math.max(stability, recovery)),
      conditions: ["EXP Openness/Range high; compare REG Stability/Recovery."],
      alternatives: ["Grounded access", "Unbuffered expression"],
      rationale: regulated
        ? "Regulatory stability or recovery qualifies expressive openness."
        : "Expression is available while regulatory buffering is less supported.",
      narrativeClause: regulated
        ? "Expression appears more supported by regulation."
        : "Expression may be available without strong buffering evidence.",
      allDimensions: dimensions,
    }));
  }

  if (restraint >= 0.56 && activation >= 0.56 && effortCost < 0.72) {
    interactions.push(makeInteraction({
      interactionId: "INT-003",
      kind: "protects",
      subject: "EXP",
      object: "REG",
      dimensions: ["EXP-P3", "REG-P1", "CAP-P3"],
      strength: round((restraint + activation + (1 - effortCost)) / 3),
      conditions: ["EXP Restraint high + REG activation high + CAP cost not extreme."],
      alternatives: ["Blocked expression", "Protective restraint"],
      rationale: "Selective restraint may protect under activation rather than indicate blocked expression.",
      narrativeClause: "Restraint may be acting as a boundary under activation.",
      allDimensions: dimensions,
    }));
  }

  if (recovery >= 0.56 && sustainability >= 0.5) {
    interactions.push(makeInteraction({
      interactionId: "INT-004",
      kind: "reinforces",
      subject: "REG",
      object: "CAP",
      dimensions: ["REG-P4", "CAP-P4"],
      strength: round((recovery + sustainability) / 2),
      conditions: ["REG Recovery high precedes CAP Sustainability improvement."],
      alternatives: ["Practice effect", "Warm-up effect"],
      rationale: "Regulatory return appears to support renewed room.",
      narrativeClause: "Return cues appear to support capacity.",
      allDimensions: dimensions,
    }));
  }

  if (demand >= 0.56 && reserve < 0.5) {
    interactions.push(makeInteraction({
      interactionId: "INT-005",
      kind: "amplifies",
      subject: "COG",
      object: "CAP",
      dimensions: ["COG-P4", "CAP-P2"],
      strength: round((demand + (1 - reserve)) / 2),
      conditions: ["COG Demand high + CAP Reserve declining."],
      alternatives: ["Prompt complexity", "Temporary task load"],
      rationale: "Processing demand appears to draw on available capacity.",
      narrativeClause: "The cognitive work may be spending reserve.",
      allDimensions: dimensions,
    }));
  }

  if (stability >= 0.56 && effortCost >= 0.56 && sustainability < 0.5) {
    interactions.push(makeInteraction({
      interactionId: "INT-006",
      kind: "masks",
      subject: "REG",
      object: "CAP",
      dimensions: ["REG-P2", "CAP-P3", "CAP-P4"],
      strength: round((stability + effortCost + (1 - sustainability)) / 3),
      conditions: ["REG Stability high + CAP Cost high + Sustainability falling."],
      alternatives: ["Composure", "Costly control"],
      rationale: "Steadiness is present, but it may be expensive to maintain.",
      narrativeClause: "Steadiness may be masking cost.",
      allDimensions: dimensions,
    }));
  }

  if (value(dimensions, "COG-P2") >= 0.56 && flexibility >= 0.56) {
    interactions.push(makeInteraction({
      interactionId: "INT-007",
      kind: stability >= 0.5 ? "integrates" : "destabilizes",
      subject: "COG",
      object: "REG",
      dimensions: ["COG-P2", "REG-P3", "REG-P2"],
      strength: round((value(dimensions, "COG-P2") + flexibility + Math.max(stability, 1 - stability)) / 3),
      conditions: ["COG Exploration high + REG Flexibility high; inspect Stability."],
      alternatives: ["Generative exploration", "Fragmentation risk"],
      rationale: stability >= 0.5
        ? "Exploration appears generative because flexibility has adequate stability."
        : "Exploration may become less coherent because stability support is weaker.",
      narrativeClause: stability >= 0.5
        ? "Exploration appears to have enough containment."
        : "Exploration may need more containment.",
      allDimensions: dimensions,
    }));
  }

  return interactions.sort((left, right) => right.confidence - left.confidence || left.interactionId.localeCompare(right.interactionId));
}
