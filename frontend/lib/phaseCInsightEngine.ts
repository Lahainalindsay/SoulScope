import type { CanonicalDimensionRecord } from "./canonicalDimensionEngine";
import type { CanonicalSoulScopeResult } from "./canonicalResult";
import type { LongitudinalAnalysis, LongitudinalScanSnapshot, TrendResult } from "./longitudinalIntelligence";
import { buildRelationshipIntelligence, type RelationshipIntelligence } from "./relationshipIntelligence";

export const PHASE_C_INSIGHT_ENGINE_VERSION = "phase-c-insight-engine-v0.1";

export type PhaseCInsightObject = {
  insightId: string;
  title: string;
  explanation: string;
  evidence: string[];
  confidence: number;
  relatedDimensions: string[];
  supportingHistory: string[];
  ranking: {
    novelty: number;
    confidence: number;
    stability: number;
    magnitude: number;
    personalSignificance: number;
    total: number;
  };
  trace: {
    evidenceLedgerIds: string[];
    dimensionValues: Array<{ dimensionId: string; value: number; confidence: number }>;
    historicalComparisons: string[];
    decisionId: string;
    ruleVersion: string;
  };
};

export type PhaseCConfidenceCalibration = {
  measurementConfidence: number;
  interpretationConfidence: number;
  historicalStability: number;
  personalFamiliarity: number;
};

export type PhaseCIntelligence = {
  version: string;
  headlineInsight: PhaseCInsightObject;
  insights: PhaseCInsightObject[];
  confidenceCalibration: PhaseCConfidenceCalibration;
  patternEvolution: {
    available: boolean;
    status: "Emerging" | "Strengthening" | "Stable" | "Softening" | "Transitioning";
    summary: string;
  };
  trajectory: {
    available: boolean;
    previous?: { x: number; y: number; z: number };
    current: { x: number; y: number; z: number };
    direction: { dx: number; dy: number; dz: number };
    note: string;
  };
  reflectionMemory: string[];
  contextMemory: {
    available: boolean;
    entries: string[];
    note: string;
  };
  relationshipIntelligence: RelationshipIntelligence;
};

const DOMAIN_DIMENSIONS: Record<string, string[]> = {
  recovery_restoration: ["REG-P4", "CAP-P4", "CAP-P2"],
  focus_mental_demand: ["COG-P1", "COG-P3", "COG-P4"],
  expression_communication: ["EXP-P1", "EXP-P2", "EXP-P3"],
  regulation_stability: ["REG-P2", "REG-P3", "REG-P4"],
};

function clamp(value: number) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function round(value: number) {
  return Number(clamp(value).toFixed(3));
}

function mean(values: number[]) {
  const valid = values.filter(Number.isFinite);
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : 0;
}

function dimensionLabel(id: string) {
  const labels: Record<string, string> = {
    "COG-P1": "organization",
    "COG-P2": "exploration",
    "COG-P3": "focus continuity",
    "COG-P4": "processing demand",
    "REG-P1": "activation",
    "REG-P2": "stability",
    "REG-P3": "flexibility",
    "REG-P4": "recovery",
    "CAP-P1": "mobilization",
    "CAP-P2": "reserve",
    "CAP-P3": "effort cost",
    "CAP-P4": "sustainability",
    "EXP-P1": "range",
    "EXP-P2": "openness",
    "EXP-P3": "restraint",
    "EXP-P4": "relational availability",
  };
  return labels[id] ?? id.toLowerCase();
}

function domainLabel(id: string) {
  if (id === "recovery_restoration") return "Recovery";
  if (id === "focus_mental_demand") return "Mental demand";
  if (id === "expression_communication") return "Expression";
  if (id === "regulation_stability") return "Regulation";
  return id.replaceAll("_", " ");
}

function directionPhrase(trend: TrendResult) {
  if (trend.direction === "stable") return "held steady";
  if (trend.domainId === "focus_mental_demand") return trend.direction === "higher" ? "asked for more effort" : "asked for less effort";
  return trend.direction === "higher" ? "appeared more available" : "appeared less available";
}

function strongestDimensions(result: CanonicalSoulScopeResult) {
  return [...result.phaseBDimensions.records]
    .filter((dimension) => dimension.evidenceCoverage > 0)
    .sort((left, right) => Math.abs(right.value - 0.5) * right.confidence - Math.abs(left.value - 0.5) * left.confidence);
}

function evidenceFor(dimensions: CanonicalDimensionRecord[]) {
  return Array.from(new Set(dimensions.flatMap((dimension) => dimension.supportingEvidence))).sort();
}

function confidenceCalibration(result: CanonicalSoulScopeResult, longitudinal?: LongitudinalAnalysis): PhaseCConfidenceCalibration {
  const evidence = result.evidenceLedger.records.filter((record) => !record.missingEvidence);
  const recent = longitudinal?.similarity.recent;
  const stableObservations = longitudinal?.observationStability.filter((item) => item.stability === "consistent" || item.stability === "recurring").length ?? 0;
  return {
    measurementConfidence: round(mean(evidence.map((record) => record.confidence))),
    interpretationConfidence: round(mean([
      result.phaseBConstellation.geometry.confidence,
      result.meaningObjects.records[0]?.confidence ?? 0,
    ])),
    historicalStability: recent?.available ? round(recent.score ?? 0) : 0,
    personalFamiliarity: longitudinal ? round(Math.min(1, stableObservations / 3)) : 0,
  };
}

function insightRanking(args: {
  novelty: number;
  confidence: number;
  stability: number;
  magnitude: number;
  personalSignificance: number;
}) {
  const total = round(args.novelty * 0.24 + args.confidence * 0.24 + args.stability * 0.16 + args.magnitude * 0.22 + args.personalSignificance * 0.14);
  return {
    novelty: round(args.novelty),
    confidence: round(args.confidence),
    stability: round(args.stability),
    magnitude: round(args.magnitude),
    personalSignificance: round(args.personalSignificance),
    total,
  };
}

function makeInsight(args: {
  id: string;
  title: string;
  explanation: string;
  dimensions: CanonicalDimensionRecord[];
  supportingHistory: string[];
  decisionId: string;
  ranking: ReturnType<typeof insightRanking>;
}): PhaseCInsightObject {
  return {
    insightId: args.id,
    title: args.title,
    explanation: args.explanation,
    evidence: evidenceFor(args.dimensions),
    confidence: args.ranking.confidence,
    relatedDimensions: args.dimensions.map((dimension) => dimension.dimensionId),
    supportingHistory: args.supportingHistory,
    ranking: args.ranking,
    trace: {
      evidenceLedgerIds: evidenceFor(args.dimensions),
      dimensionValues: args.dimensions.map((dimension) => ({ dimensionId: dimension.dimensionId, value: dimension.value, confidence: dimension.confidence })),
      historicalComparisons: args.supportingHistory,
      decisionId: args.decisionId,
      ruleVersion: PHASE_C_INSIGHT_ENGINE_VERSION,
    },
  };
}

function trendInsights(result: CanonicalSoulScopeResult, longitudinal: LongitudinalAnalysis | undefined) {
  if (!longitudinal) return [];
  return longitudinal.trends
    .filter((trend) => trend.direction !== "stable" && Math.abs(trend.delta) >= 4)
    .sort((left, right) => Math.abs(right.delta) - Math.abs(left.delta))
    .slice(0, 3)
    .map((trend) => {
      const dimensions = result.phaseBDimensions.records.filter((dimension) => (DOMAIN_DIMENSIONS[trend.domainId] ?? []).includes(dimension.dimensionId));
      const confidence = mean(dimensions.map((dimension) => dimension.confidence));
      const magnitude = Math.min(1, Math.abs(trend.delta) / 30);
      return makeInsight({
        id: `phase-c:trend:${trend.domainId}:${trend.window}`,
        title: `${domainLabel(trend.domainId)} ${directionPhrase(trend)} than your usual pattern`,
        explanation: `${trend.summary} The current scan is being compared with your ${trend.window.replace("_", " ")} history, while the canonical evidence remains unchanged.`,
        dimensions,
        supportingHistory: [trend.summary, `Delta ${trend.delta} from ${trend.window} baseline.`],
        decisionId: result.decisionLedger.record.decisionId,
        ranking: insightRanking({
          novelty: magnitude,
          confidence,
          stability: longitudinal.similarity[trend.window].score ?? 0,
          magnitude,
          personalSignificance: 0.8,
        }),
      });
    });
}

function currentStateInsight(result: CanonicalSoulScopeResult) {
  const dimensions = strongestDimensions(result).slice(0, 3);
  const lead = dimensions[0];
  return makeInsight({
    id: `phase-c:current:${lead?.dimensionId ?? "developing"}`,
    title: lead ? `${lead.label} is the clearest signal today` : "Today is best held as a broad reflection",
    explanation: lead
      ? `${lead.label} carried the strongest combination of evidence coverage, confidence, and distance from the center of the current scan. This is a present-moment observation, not a trait claim.`
      : "The scan did not provide enough supported dimensions to prioritize a specific tendency.",
    dimensions,
    supportingHistory: [],
    decisionId: result.decisionLedger.record.decisionId,
    ranking: insightRanking({
      novelty: 0.35,
      confidence: mean(dimensions.map((dimension) => dimension.confidence)),
      stability: 0,
      magnitude: mean(dimensions.map((dimension) => Math.abs(dimension.value - 0.5) * 2)),
      personalSignificance: 0.55,
    }),
  });
}

function relationshipInsight(result: CanonicalSoulScopeResult) {
  const interaction = result.phaseBInteractions.records.find((item) => item.interactionId !== "INT-008");
  if (!interaction) return null;
  const dimensions = result.phaseBDimensions.records.filter((dimension) => interaction.dimensions.includes(dimension.dimensionId));
  const title = interaction.kind === "buffers"
    ? "One strength may be helping steady another area"
    : interaction.kind === "amplifies"
    ? "Several signals are reinforcing the same tendency"
    : interaction.kind === "masks"
    ? "A steady surface may be carrying hidden cost"
    : "The most interesting signal is relational";
  return makeInsight({
    id: `phase-c:relationship:${interaction.interactionId}`,
    title,
    explanation: "The canonical interaction engine connected multiple supported dimensions, so this insight describes a relationship between signals rather than a single isolated score.",
    dimensions,
    supportingHistory: [],
    decisionId: result.decisionLedger.record.decisionId,
    ranking: insightRanking({
      novelty: 0.5,
      confidence: interaction.confidence,
      stability: 0,
      magnitude: interaction.strength,
      personalSignificance: 0.7,
    }),
  });
}

function dimensionsForRelationship(result: CanonicalSoulScopeResult, variables: string[], evidence: string[]) {
  const mappedDimensionIds = new Set(variables.flatMap((variable) => {
    if (variable.includes("recovery_restoration")) return DOMAIN_DIMENSIONS.recovery_restoration;
    if (variable.includes("focus_mental_demand")) return DOMAIN_DIMENSIONS.focus_mental_demand;
    if (variable.includes("expression_communication")) return DOMAIN_DIMENSIONS.expression_communication;
    if (variable.includes("regulation_stability")) return DOMAIN_DIMENSIONS.regulation_stability;
    if (variable.includes("recovery")) return ["REG-P4", "CAP-P4"];
    if (variable.includes("expression")) return ["EXP-P1", "EXP-P2"];
    if (variable.includes("regulation")) return ["REG-P2", "REG-P3"];
    if (variable.includes("mental_demand") || variable.includes("organization")) return ["COG-P1", "COG-P4"];
    return [];
  }));
  const byEvidence = result.phaseBDimensions.records.filter((dimension) => evidence.some((id) => dimension.supportingEvidence.includes(id)));
  const byVariable = result.phaseBDimensions.records.filter((dimension) => mappedDimensionIds.has(dimension.dimensionId));
  return Array.from(new Map([...byEvidence, ...byVariable].map((dimension) => [dimension.dimensionId, dimension])).values());
}

function patternEvolution(longitudinal?: LongitudinalAnalysis): PhaseCIntelligence["patternEvolution"] {
  if (!longitudinal?.patternEvolution.available) {
    return { available: false, status: "Emerging", summary: "More scan history is needed before pattern evolution can be described." };
  }
  const kind = longitudinal.patternEvolution.kind;
  return {
    available: true,
    status: kind === "stable" ? "Stable" : kind === "gradual_movement" ? "Transitioning" : kind === "oscillating" ? "Transitioning" : kind === "rapid_shifts" ? "Emerging" : "Emerging",
    summary: longitudinal.patternEvolution.summary,
  };
}

function trajectory(result: CanonicalSoulScopeResult, longitudinal?: LongitudinalAnalysis): PhaseCIntelligence["trajectory"] {
  const current = result.phaseBConstellation.geometry.coordinates;
  const similar = longitudinal?.similarity.recent;
  return {
    available: Boolean(similar?.available),
    current: { x: current.x, y: current.y, z: current.z },
    direction: { dx: 0, dy: 0, dz: 0 },
    note: similar?.available
      ? `This scan is ${similar.category?.toLowerCase()} compared with recent scans; direction is descriptive, not predictive.`
      : "Trajectory needs more comparable history before movement can be described.",
  };
}

function reflectionMemory(longitudinal?: LongitudinalAnalysis) {
  if (!longitudinal) return [];
  const lines: string[] = [];
  const trend = longitudinal.trends.find((item) => item.direction !== "stable");
  if (trend) lines.push(trend.summary);
  if (longitudinal.patternEvolution.available) lines.push(longitudinal.patternEvolution.summary);
  const recurring = longitudinal.observationStability.find((item) => item.stability === "consistent" || item.stability === "recurring");
  if (recurring) lines.push(`One observation has appeared ${recurring.appearances} times across ${recurring.scansUsed} recent baseline scans.`);
  return lines.slice(0, 3);
}

export function buildPhaseCIntelligence(
  result: CanonicalSoulScopeResult,
  longitudinal?: LongitudinalAnalysis,
  contextEntries: string[] = [],
  history: LongitudinalScanSnapshot[] = [],
): PhaseCIntelligence {
  const relationshipIntelligence = buildRelationshipIntelligence({
    canonicalResult: result,
    history,
    personalBaseline: longitudinal?.baselines.recent.available ? longitudinal.baselines.recent : null,
    contextEntries,
  });
  const candidates = [
    ...trendInsights(result, longitudinal),
    ...relationshipIntelligence.relationships.slice(0, 2).map((relationship) => makeInsight({
      id: `phase-c:${relationship.id}`,
      title: relationship.title,
      explanation: relationship.explanation,
      dimensions: dimensionsForRelationship(result, relationship.variables, relationship.evidence),
      supportingHistory: [
        `${relationship.historicalSupport.observationCount} observations`,
        `${relationship.historicalSupport.consistency} consistency`,
        ...relationship.exceptions,
      ],
      decisionId: result.decisionLedger.record.decisionId,
      ranking: insightRanking({
        novelty: relationship.relationshipType === "contextual_association" ? 0.75 : 0.62,
        confidence: relationship.confidence,
        stability: relationship.historicalSupport.consistency,
        magnitude: relationship.confidence,
        personalSignificance: 0.9,
      }),
    })),
    relationshipInsight(result),
    currentStateInsight(result),
  ].filter((item): item is PhaseCInsightObject => Boolean(item));
  const insights = candidates
    .sort((left, right) => right.ranking.total - left.ranking.total || left.insightId.localeCompare(right.insightId))
    .slice(0, 3);
  const headlineInsight = insights[0] ?? currentStateInsight(result);
  return {
    version: PHASE_C_INSIGHT_ENGINE_VERSION,
    headlineInsight,
    insights,
    confidenceCalibration: confidenceCalibration(result, longitudinal),
    patternEvolution: patternEvolution(longitudinal),
    trajectory: trajectory(result, longitudinal),
    reflectionMemory: reflectionMemory(longitudinal),
    contextMemory: {
      available: contextEntries.length > 0,
      entries: contextEntries,
      note: contextEntries.length
        ? "Context is stored as metadata for future comparison; it does not override measured evidence."
        : "No optional context was supplied for this scan.",
    },
    relationshipIntelligence,
  };
}
