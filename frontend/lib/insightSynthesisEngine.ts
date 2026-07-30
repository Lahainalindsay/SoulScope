import type { MeaningObject } from "./canonicalMeaningEngine";
import type { LongitudinalAnalysis, RollingBaseline } from "./longitudinalIntelligence";
import type { CanonicalNarrative } from "./canonicalNarrativeEngine";
import type { PhaseCInsightObject } from "./phaseCInsightEngine";
import type { RelationshipInsight } from "./relationshipIntelligence";

export const INSIGHT_SYNTHESIS_ENGINE_VERSION = "insight-synthesis-v0.1";

export type SynthesizedInsight = {
  id: string;
  title: string;
  summary: string;
  explanation: string;
  supportingRelationships: string[];
  supportingDimensions: string[];
  supportingEvidence: string[];
  confidence: number;
  novelty: number;
  trace: {
    relationshipIds: string[];
    evidenceIds: string[];
    dimensionIds: string[];
    meaningObjectIds: string[];
    decisionId: string | null;
    historicalObservations: string[];
    ruleVersion: string;
  };
};

export type InsightSynthesisResult = {
  version: string;
  headline: SynthesizedInsight | null;
  discoveries: SynthesizedInsight[];
  themes: Array<{
    id: string;
    title: string;
    synthesizedInsightIds: string[];
    supportingRelationships: string[];
    supportingEvidence: string[];
    confidence: number;
  }>;
};

const TECHNICAL_TERMS = [
  "harmonic clarity",
  "spectral organization",
  "mfcc",
  "spectral slope",
  "jitter",
  "shimmer",
  "formant",
  "centroid",
  "bandwidth",
  "harmonic",
  "spectral",
];

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

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

function visibleText(value: string) {
  const readable = value.replaceAll("_", " ");
  return TECHNICAL_TERMS.reduce((text, term) => text.replace(new RegExp(term, "ig"), replacementFor(term)), readable)
    .replace(/\bevidence:[^\s,.;]+/gi, "a measured signal")
    .replace(/\bdomain:/gi, "")
    .trim();
}

function replacementFor(term: string) {
  if (/harmonic|jitter|shimmer/.test(term)) return "vocal steadiness";
  if (/spectral|mfcc|centroid|bandwidth|formant/.test(term)) return "overall vocal organization";
  return "voice pattern";
}

function variableText(variable: string) {
  const normalized = variable.toLowerCase().replace(/^domain:/, "").replace(/^evidence:/, "").replace(/^context:/, "").replace(/^next:/, "");
  if (/recovery|restoration|sustainability/.test(normalized)) return "recovery";
  if (/regulation|stability|clarity|harmonic|jitter|shimmer/.test(normalized)) return "steadiness";
  if (/expression|communication|range|openness/.test(normalized)) return "expression";
  if (/focus|mental|demand|pause|rate|organization/.test(normalized)) return "organization";
  if (/spectral|mfcc|slope|centroid|bandwidth|formant/.test(normalized)) return "vocal organization";
  return visibleText(normalized);
}

function clusterKey(relationship: RelationshipInsight) {
  const text = `${relationship.variables.join(" ")} ${relationship.title}`.toLowerCase();
  if (/(recovery|regulation|stability|harmonic|spectral|clarity|sustainability)/.test(text)) return "settled_clarity";
  if (/(expression|communication|pause|rate|focus|mental|organization)/.test(text)) return "deliberate_communication";
  if (/(context|sleep|exercise|travel|illness|workday|stress)/.test(text)) return "context_pattern";
  return "personal_rhythm";
}

function titleFor(key: string, relationships: RelationshipInsight[]) {
  const variables = unique(relationships.flatMap((relationship) => relationship.variables.map(variableText)));
  if (key === "settled_clarity") return "Your clearest moments may also be your steadiest moments";
  if (key === "deliberate_communication") return "Your communication may become more deliberate when demand rises";
  if (key === "context_pattern") return "Your patterns are beginning to show context";
  if (variables.length >= 2) return `${capitalize(variables[0])} and ${variables[1]} are forming a personal pattern`;
  return "A personal pattern is becoming clearer";
}

function summaryFor(key: string, relationships: RelationshipInsight[]) {
  const count = relationships.reduce((max, relationship) => Math.max(max, relationship.historicalSupport.observationCount), 0);
  if (key === "settled_clarity") return `Across ${count} recent observations, steadiness and recovery appear to move with a clearer, more settled voice pattern.`;
  if (key === "deliberate_communication") return `Across ${count} recent observations, the way you organize and express yourself appears to shift with the amount of demand present.`;
  if (key === "context_pattern") return `Across ${count} recent observations, some scan contexts are beginning to line up with measurable shifts in your reflection pattern.`;
  return `Across ${count} recent observations, several parts of your scan history point toward one broader personal tendency.`;
}

function explanationFor(key: string, relationships: RelationshipInsight[]) {
  const phrase = relationships.length > 1 ? "Several parts of your recent scans are pointing toward the same underlying observation." : "One recurring pattern is strong enough to summarize carefully.";
  if (key === "settled_clarity") {
    return `${phrase} You may be easiest to understand, and easiest for yourself to track, during moments when recovery and steadiness are more available.`;
  }
  if (key === "deliberate_communication") {
    return `${phrase} You may communicate with more care, pacing, or selectivity when the scan shows more mental effort.`;
  }
  if (key === "context_pattern") {
    return `${phrase} The context does not explain the result by itself, but it is becoming useful background for understanding when your pattern shifts.`;
  }
  return `${phrase} This is being held as an observation from your measured history, not as a fixed trait or prediction.`;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function dimensionsFor(relationships: RelationshipInsight[], meanings: MeaningObject[]) {
  const fromVariables = relationships.flatMap((relationship) => relationship.variables.flatMap((variable) => {
    const text = variable.toLowerCase();
    if (/recovery/.test(text)) return ["REG-P4", "CAP-P4"];
    if (/regulation|stability|harmonic|spectral/.test(text)) return ["REG-P2", "REG-P3"];
    if (/expression|communication/.test(text)) return ["EXP-P1", "EXP-P2"];
    if (/focus|mental|demand|organization|pause|rate/.test(text)) return ["COG-P1", "COG-P4"];
    return [];
  }));
  return unique([...fromVariables, ...meanings.flatMap((meaning) => meaning.supporting_dimensions)]);
}

function rankInsight(args: {
  relationships: RelationshipInsight[];
  phaseInsights: PhaseCInsightObject[];
  evidenceCount: number;
}) {
  const confidence = mean(args.relationships.map((relationship) => relationship.confidence));
  const consistency = mean(args.relationships.map((relationship) => relationship.historicalSupport.consistency));
  const coverage = mean(args.relationships.map((relationship) => relationship.historicalSupport.evidenceCoverage));
  const observationCount = Math.max(...args.relationships.map((relationship) => relationship.historicalSupport.observationCount), 0);
  const novelty = round(Math.min(1, args.relationships.length / 3 + args.phaseInsights.length / 10));
  const actionability = args.relationships.some((relationship) => relationship.relationshipType === "contextual_association" || relationship.relationshipType === "conditional_association") ? 0.78 : 0.62;
  const personalSignificance = Math.min(1, observationCount / 10);
  const score = round(novelty * 0.18 + consistency * 0.22 + coverage * 0.16 + confidence * 0.2 + personalSignificance * 0.14 + actionability * 0.1);
  return { confidence: round(confidence), novelty, score, evidenceCount: args.evidenceCount };
}

function sanitizeInsight(insight: SynthesizedInsight): SynthesizedInsight {
  return {
    ...insight,
    title: visibleText(insight.title),
    summary: visibleText(insight.summary),
    explanation: visibleText(insight.explanation),
  };
}

function synthesizedFromCluster(args: {
  key: string;
  relationships: RelationshipInsight[];
  phaseInsights: PhaseCInsightObject[];
  meanings: MeaningObject[];
  decisionId: string | null;
}): { insight: SynthesizedInsight; score: number } {
  const supportingEvidence = unique([
    ...args.relationships.flatMap((relationship) => relationship.evidence),
    ...args.meanings.flatMap((meaning) => meaning.evidence_references),
  ]);
  const supportingDimensions = dimensionsFor(args.relationships, args.meanings);
  const rank = rankInsight({
    relationships: args.relationships,
    phaseInsights: args.phaseInsights,
    evidenceCount: supportingEvidence.length,
  });
  return {
    score: rank.score,
    insight: sanitizeInsight({
      id: `synth:${args.key}:${args.relationships.map((relationship) => relationship.id).sort().join(":")}`,
      title: titleFor(args.key, args.relationships),
      summary: summaryFor(args.key, args.relationships),
      explanation: explanationFor(args.key, args.relationships),
      supportingRelationships: args.relationships.map((relationship) => relationship.id),
      supportingDimensions,
      supportingEvidence,
      confidence: rank.confidence,
      novelty: rank.novelty,
      trace: {
        relationshipIds: args.relationships.map((relationship) => relationship.id),
        evidenceIds: supportingEvidence,
        dimensionIds: supportingDimensions,
        meaningObjectIds: args.meanings.map((meaning) => meaning.meaning_id),
        decisionId: args.decisionId,
        historicalObservations: unique(args.relationships.flatMap((relationship) => relationship.historicalSupport.sourceScanIds)),
        ruleVersion: INSIGHT_SYNTHESIS_ENGINE_VERSION,
      },
    }),
  };
}

function themesFor(discoveries: SynthesizedInsight[]) {
  return discoveries
    .filter((insight) => insight.supportingRelationships.length >= 2)
    .map((insight) => ({
      id: `theme:${insight.id}`,
      title: insight.title.replace(/^Your /, ""),
      synthesizedInsightIds: [insight.id],
      supportingRelationships: insight.supportingRelationships,
      supportingEvidence: insight.supportingEvidence,
      confidence: insight.confidence,
    }))
    .slice(0, 3);
}

export function buildInsightSynthesis(args: {
  phaseInsights: PhaseCInsightObject[];
  relationships: RelationshipInsight[];
  meanings: MeaningObject[];
  longitudinal?: LongitudinalAnalysis;
  personalBaseline?: RollingBaseline | null;
  narrative?: CanonicalNarrative;
  decisionId?: string | null;
}): InsightSynthesisResult {
  const grouped = args.relationships.reduce<Record<string, RelationshipInsight[]>>((acc, relationship) => {
    const key = clusterKey(relationship);
    return { ...acc, [key]: [...(acc[key] ?? []), relationship] };
  }, {});
  const discoveries = Object.entries(grouped)
    .map(([key, relationships]) => synthesizedFromCluster({
      key,
      relationships,
      phaseInsights: args.phaseInsights,
      meanings: args.meanings,
      decisionId: args.decisionId ?? null,
    }))
    .sort((left, right) => {
      const leftRelationships = left.insight.supportingRelationships.length;
      const rightRelationships = right.insight.supportingRelationships.length;
      return right.score - left.score || rightRelationships - leftRelationships || left.insight.id.localeCompare(right.insight.id);
    })
    .map((item) => item.insight)
    .slice(0, 3);

  return {
    version: INSIGHT_SYNTHESIS_ENGINE_VERSION,
    headline: discoveries[0] ?? null,
    discoveries,
    themes: themesFor(discoveries),
  };
}
