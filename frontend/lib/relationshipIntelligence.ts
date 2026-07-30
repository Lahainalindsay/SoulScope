import type { CanonicalSoulScopeResult } from "./canonicalResult";
import type { LongitudinalScanSnapshot, RollingBaseline } from "./longitudinalIntelligence";

export const RELATIONSHIP_INTELLIGENCE_VERSION = "relationship-intelligence-v0.1";

export type RelationshipType =
  | "positive_association"
  | "negative_association"
  | "conditional_association"
  | "contextual_association"
  | "stability_relationship"
  | "sequential_relationship";

export type StabilityLevel = "Highly Stable" | "Moderately Stable" | "Variable" | "Rapidly Changing";

export type RelationshipInsight = {
  id: string;
  title: string;
  explanation: string;
  variables: string[];
  relationshipType: RelationshipType;
  confidence: number;
  observations: string[];
  evidence: string[];
  historicalSupport: {
    observationCount: number;
    consistency: number;
    evidenceCoverage: number;
    contradictoryObservations: number;
    missingObservations: number;
    ageDays: number;
    sourceScanIds: string[];
  };
  exceptions: string[];
};

export type RelationshipIntelligence = {
  version: string;
  relationships: RelationshipInsight[];
  discoveryCards: Array<{
    title: string;
    body: string;
    confidence: number;
    relationshipId: string;
  }>;
  stabilityProfiles: Array<{
    variable: string;
    level: StabilityLevel;
    observationCount: number;
    variability: number;
  }>;
  themes: Array<{
    title: string;
    relationshipIds: string[];
    evidence: string[];
    confidence: number;
  }>;
};

const MIN_RELATIONSHIP_OBSERVATIONS = 5;
const MIN_CONTEXT_OBSERVATIONS = 3;
const MIN_ABSOLUTE_CORRELATION = 0.55;
const MIN_CONSISTENCY = 0.64;
const MIN_CONFIDENCE = 0.5;

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

function std(values: number[]) {
  const average = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - average) ** 2)));
}

function pearson(left: number[], right: number[]) {
  return pearsonWithMinimum(left, right, MIN_RELATIONSHIP_OBSERVATIONS);
}

function pearsonWithMinimum(left: number[], right: number[], minimum: number) {
  const count = Math.min(left.length, right.length);
  if (count < minimum) return 0;
  const a = left.slice(0, count);
  const b = right.slice(0, count);
  const meanA = mean(a);
  const meanB = mean(b);
  const numerator = a.reduce((sum, value, index) => sum + (value - meanA) * (b[index] - meanB), 0);
  const denominator = Math.sqrt(a.reduce((sum, value) => sum + (value - meanA) ** 2, 0) * b.reduce((sum, value) => sum + (value - meanB) ** 2, 0));
  return denominator ? numerator / denominator : 0;
}

function domainLabel(id: string) {
  if (id === "recovery_restoration") return "recovery";
  if (id === "focus_mental_demand") return "mental demand";
  if (id === "expression_communication") return "expression";
  if (id === "regulation_stability") return "regulation";
  return id.replaceAll("_", " ");
}

function evidenceLabel(id: string) {
  return id.replaceAll("_", " ");
}

function variableLabel(id: string) {
  if (id.startsWith("domain:")) return domainLabel(id.slice("domain:".length));
  if (id.startsWith("evidence:")) return evidenceLabel(id.slice("evidence:".length));
  if (id.startsWith("context:")) return id.slice("context:".length).replaceAll("_", " ");
  return id.replaceAll("_", " ");
}

function scanAgeDays(scan: LongitudinalScanSnapshot, nowMs: number) {
  return Math.max(0, Math.round((nowMs - Date.parse(scan.createdAt)) / 86_400_000));
}

function scanVariables(scan: LongitudinalScanSnapshot): Record<string, number> {
  const domains = Object.fromEntries(scan.domains.map((domain) => [`domain:${domain.id}`, domain.score / 100]));
  const evidence = Object.fromEntries(scan.evidence.map((item) => [`evidence:${item.id}`, item.strength * (item.direction === "reduced" ? -1 : item.direction === "elevated" ? 1 : 0)]));
  const context = Object.fromEntries((scan.context ?? []).map((entry) => [`context:${entry.trim().toLowerCase().replace(/\s+/g, "_")}`, 1]));
  return { ...domains, ...evidence, ...context };
}

function evidenceRefsFor(result: CanonicalSoulScopeResult, variables: string[]) {
  const dimensionIds = variables.flatMap((variable) => {
    const label = variableLabel(variable);
    if (/recovery/.test(label)) return ["REG-P4", "CAP-P4"];
    if (/regulation/.test(label)) return ["REG-P2", "REG-P3"];
    if (/expression/.test(label)) return ["EXP-P1", "EXP-P2"];
    if (/mental demand|organization/.test(label)) return ["COG-P1", "COG-P4"];
    return [];
  });
  return Array.from(new Set(result.phaseBDimensions.records
    .filter((dimension) => dimensionIds.includes(dimension.dimensionId))
    .flatMap((dimension) => dimension.supportingEvidence))).sort();
}

function consistencyFor(left: number[], right: number[], correlation: number) {
  const signs = left.slice(1).map((value, index) => Math.sign(value - left[index]) * Math.sign(right[index + 1] - right[index]));
  const expected = correlation >= 0 ? 1 : -1;
  return signs.length ? round(signs.filter((sign) => sign === expected || sign === 0).length / signs.length) : 0;
}

function exceptionsFor(scans: LongitudinalScanSnapshot[], leftKey: string, rightKey: string, correlation: number) {
  return scans.slice(1).flatMap((scan, index) => {
    const previous = scanVariables(scans[index]);
    const current = scanVariables(scan);
    const leftDelta = (current[leftKey] ?? 0) - (previous[leftKey] ?? 0);
    const rightDelta = (current[rightKey] ?? 0) - (previous[rightKey] ?? 0);
    const supports = correlation >= 0 ? leftDelta * rightDelta >= 0 : leftDelta * rightDelta <= 0;
    return supports ? [] : [`${scan.scanId} moved differently from this relationship.`];
  }).slice(0, 3);
}

function makeRelationship(args: {
  id: string;
  variables: string[];
  type: RelationshipType;
  correlation: number;
  consistency: number;
  scans: LongitudinalScanSnapshot[];
  result: CanonicalSoulScopeResult;
  title: string;
  explanation: string;
  exceptions: string[];
  nowMs: number;
}): RelationshipInsight | null {
  const observationCount = args.scans.length;
  const contradictoryObservations = args.exceptions.length;
  const evidence = evidenceRefsFor(args.result, args.variables);
  const evidenceCoverage = round(evidence.length / Math.max(1, args.result.evidenceLedger.records.filter((record) => !record.missingEvidence).length));
  const confidence = round(Math.abs(args.correlation) * 0.36 + args.consistency * 0.32 + evidenceCoverage * 0.18 + Math.min(1, observationCount / 10) * 0.14 - contradictoryObservations * 0.04);
  if (confidence < MIN_CONFIDENCE) return null;
  return {
    id: args.id,
    title: args.title,
    explanation: args.explanation,
    variables: args.variables,
    relationshipType: args.type,
    confidence,
    observations: args.scans.map((scan) => scan.scanId),
    evidence,
    historicalSupport: {
      observationCount,
      consistency: args.consistency,
      evidenceCoverage,
      contradictoryObservations,
      missingObservations: 0,
      ageDays: Math.max(...args.scans.map((scan) => scanAgeDays(scan, args.nowMs)), 0),
      sourceScanIds: args.scans.map((scan) => scan.scanId),
    },
    exceptions: args.exceptions,
  };
}

function associationRelationships(result: CanonicalSoulScopeResult, history: LongitudinalScanSnapshot[], nowMs: number) {
  const eligible = history.filter((scan) => scan.domains.length || scan.evidence.length);
  if (eligible.length < MIN_RELATIONSHIP_OBSERVATIONS) return [];
  const matrix = eligible.map(scanVariables);
  const keys = Array.from(new Set(matrix.flatMap((row) => Object.keys(row))))
    .filter((key) => !key.startsWith("context:"));
  const relationships: RelationshipInsight[] = [];
  for (let leftIndex = 0; leftIndex < keys.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < keys.length; rightIndex += 1) {
      const leftKey = keys[leftIndex];
      const rightKey = keys[rightIndex];
      const paired = matrix.map((row, index) => ({ scan: eligible[index], left: row[leftKey], right: row[rightKey] }))
        .filter((item) => Number.isFinite(item.left) && Number.isFinite(item.right));
      if (paired.length < MIN_RELATIONSHIP_OBSERVATIONS) continue;
      const left = paired.map((item) => item.left);
      const right = paired.map((item) => item.right);
      const correlation = pearson(left, right);
      if (Math.abs(correlation) < MIN_ABSOLUTE_CORRELATION) continue;
      const consistency = consistencyFor(left, right, correlation);
      if (consistency < MIN_CONSISTENCY) continue;
      const type: RelationshipType = correlation >= 0 ? "positive_association" : "negative_association";
      const labelA = variableLabel(leftKey);
      const labelB = variableLabel(rightKey);
      const direction = correlation >= 0 ? "tend to move together" : "tend to move in opposite directions";
      const relationship = makeRelationship({
        id: `relationship:${type}:${leftKey}:${rightKey}`,
        variables: [leftKey, rightKey],
        type,
        correlation,
        consistency,
        scans: paired.map((item) => item.scan),
        result,
        title: `${labelA} and ${labelB} ${direction}`,
        explanation: `Across ${paired.length} scans, ${labelA} and ${labelB} ${direction}. This is an association in your measured history, not a causal claim.`,
        exceptions: exceptionsFor(paired.map((item) => item.scan), leftKey, rightKey, correlation),
        nowMs,
      });
      if (relationship) relationships.push(relationship);
    }
  }
  return relationships;
}

function contextRelationships(result: CanonicalSoulScopeResult, history: LongitudinalScanSnapshot[], contextEntries: string[], nowMs: number) {
  const entries = Array.from(new Set([
    ...contextEntries,
    ...history.flatMap((scan) => scan.context ?? []),
  ].map((entry) => entry.trim().toLowerCase()).filter(Boolean)));
  if (!entries.length) return [];
  return entries.flatMap((entry) => {
    const key = `context:${entry.replace(/\s+/g, "_")}`;
    const withContext = history.filter((scan) => (scan.context ?? []).map((item) => item.trim().toLowerCase()).includes(entry));
    const withoutContext = history.filter((scan) => !(scan.context ?? []).map((item) => item.trim().toLowerCase()).includes(entry));
    if (withContext.length < MIN_CONTEXT_OBSERVATIONS || withoutContext.length < MIN_CONTEXT_OBSERVATIONS) return [];
    return ["recovery_restoration", "focus_mental_demand", "expression_communication", "regulation_stability"].flatMap((domainId) => {
      const withAverage = mean(withContext.flatMap((scan) => scan.domains.filter((domain) => domain.id === domainId).map((domain) => domain.score / 100)));
      const withoutAverage = mean(withoutContext.flatMap((scan) => scan.domains.filter((domain) => domain.id === domainId).map((domain) => domain.score / 100)));
      const delta = withAverage - withoutAverage;
      if (Math.abs(delta) < 0.12) return [];
      const scans = [...withContext, ...withoutContext];
      const consistency = round(Math.min(1, Math.abs(delta) / 0.24));
      const label = domainLabel(domainId);
      const relationship = makeRelationship({
        id: `relationship:context:${key}:domain:${domainId}`,
        variables: [key, `domain:${domainId}`],
        type: "contextual_association",
        correlation: delta,
        consistency,
        scans,
        result,
        title: `${label} looks different on ${entry} scans`,
        explanation: `Across scans that include ${entry}, ${label} is measurably ${delta > 0 ? "higher" : "lower"} than scans without that context. This reports association only; the context does not override voice evidence.`,
        exceptions: [],
        nowMs,
      });
      return relationship ? [relationship] : [];
    });
  });
}

function conditionalRelationships(result: CanonicalSoulScopeResult, history: LongitudinalScanSnapshot[], nowMs: number) {
  const entries = Array.from(new Set(history.flatMap((scan) => scan.context ?? [])
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)));
  return entries.flatMap((entry) => {
    const withContext = history.filter((scan) => (scan.context ?? []).map((item) => item.trim().toLowerCase()).includes(entry));
    const withoutContext = history.filter((scan) => !(scan.context ?? []).map((item) => item.trim().toLowerCase()).includes(entry));
    if (withContext.length < MIN_CONTEXT_OBSERVATIONS || withoutContext.length < MIN_CONTEXT_OBSERVATIONS) return [];

    return [["focus_mental_demand", "recovery_restoration"], ["expression_communication", "recovery_restoration"], ["regulation_stability", "expression_communication"]].flatMap(([leftDomain, rightDomain]) => {
      const withPairs = withContext.map((scan) => ({
        scan,
        left: scan.domains.find((domain) => domain.id === leftDomain)?.score,
        right: scan.domains.find((domain) => domain.id === rightDomain)?.score,
      })).filter((item) => Number.isFinite(item.left) && Number.isFinite(item.right));
      const withoutPairs = withoutContext.map((scan) => ({
        left: scan.domains.find((domain) => domain.id === leftDomain)?.score,
        right: scan.domains.find((domain) => domain.id === rightDomain)?.score,
      })).filter((item) => Number.isFinite(item.left) && Number.isFinite(item.right));
      if (withPairs.length < MIN_CONTEXT_OBSERVATIONS || withoutPairs.length < MIN_CONTEXT_OBSERVATIONS) return [];
      const withCorrelation = pearsonWithMinimum(withPairs.map((item) => item.left / 100), withPairs.map((item) => item.right / 100), MIN_CONTEXT_OBSERVATIONS);
      const withoutCorrelation = pearsonWithMinimum(withoutPairs.map((item) => item.left / 100), withoutPairs.map((item) => item.right / 100), MIN_CONTEXT_OBSERVATIONS);
      if (Math.abs(withCorrelation) < MIN_ABSOLUTE_CORRELATION || Math.abs(withCorrelation) - Math.abs(withoutCorrelation) < 0.18) return [];
      const consistency = consistencyFor(withPairs.map((item) => item.left / 100), withPairs.map((item) => item.right / 100), withCorrelation);
      if (consistency < MIN_CONSISTENCY) return [];
      const labelA = domainLabel(leftDomain);
      const labelB = domainLabel(rightDomain);
      const direction = withCorrelation >= 0 ? "move together" : "move in opposite directions";
      const relationship = makeRelationship({
        id: `relationship:conditional:context:${entry.replace(/\s+/g, "_")}:domain:${leftDomain}:domain:${rightDomain}`,
        variables: [`context:${entry.replace(/\s+/g, "_")}`, `domain:${leftDomain}`, `domain:${rightDomain}`],
        type: "conditional_association",
        correlation: withCorrelation,
        consistency,
        scans: withPairs.map((item) => item.scan),
        result,
        title: `${labelA} and ${labelB} often ${direction} on ${entry} scans`,
        explanation: `When ${entry} is recorded, ${labelA} and ${labelB} show a stronger measured association than they do in scans without that context. This is an observed condition in your history, not an explanation for why it happens.`,
        exceptions: [],
        nowMs,
      });
      return relationship ? [relationship] : [];
    });
  });
}

function sequentialRelationships(result: CanonicalSoulScopeResult, history: LongitudinalScanSnapshot[], nowMs: number) {
  const ordered = [...history].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  if (ordered.length < MIN_RELATIONSHIP_OBSERVATIONS + 1) return [];
  const pairs = ordered.slice(0, -1).map((scan, index) => ({ current: scan, next: ordered[index + 1] }));
  return [["regulation_stability", "recovery_restoration"], ["expression_communication", "recovery_restoration"]].flatMap(([first, second]) => {
    const left = pairs.map((pair) => pair.current.domains.find((domain) => domain.id === first)?.score ?? NaN).filter(Number.isFinite).map((value) => value / 100);
    const right = pairs.map((pair) => pair.next.domains.find((domain) => domain.id === second)?.score ?? NaN).filter(Number.isFinite).map((value) => value / 100);
    const count = Math.min(left.length, right.length);
    if (count < MIN_RELATIONSHIP_OBSERVATIONS) return [];
    const correlation = pearson(left.slice(0, count), right.slice(0, count));
    if (Math.abs(correlation) < MIN_ABSOLUTE_CORRELATION) return [];
    const consistency = consistencyFor(left.slice(0, count), right.slice(0, count), correlation);
    const relationship = makeRelationship({
      id: `relationship:sequential:domain:${first}:next-domain:${second}`,
      variables: [`domain:${first}`, `next:domain:${second}`],
      type: "sequential_relationship",
      correlation,
      consistency,
      scans: ordered,
      result,
      title: `${domainLabel(first)} is often followed by ${domainLabel(second)}`,
      explanation: `Across adjacent scans, ${domainLabel(first)} is associated with ${domainLabel(second)} on the following scan. This describes sequence, not prediction.`,
      exceptions: [],
      nowMs,
    });
    return relationship ? [relationship] : [];
  });
}

function stabilityProfiles(history: LongitudinalScanSnapshot[]) {
  const keys = Array.from(new Set(history.flatMap((scan) => scan.domains.map((domain) => domain.id))));
  return keys.map((key) => {
    const values = history.flatMap((scan) => scan.domains.filter((domain) => domain.id === key).map((domain) => domain.score / 100));
    const variability = round(std(values));
    const level: StabilityLevel = variability <= 0.05 ? "Highly Stable" : variability <= 0.11 ? "Moderately Stable" : variability <= 0.22 ? "Variable" : "Rapidly Changing";
    return { variable: domainLabel(key), level, observationCount: values.length, variability };
  }).filter((profile) => profile.observationCount >= MIN_RELATIONSHIP_OBSERVATIONS);
}

function stabilityRelationships(result: CanonicalSoulScopeResult, history: LongitudinalScanSnapshot[], nowMs: number) {
  return stabilityProfiles(history)
    .filter((profile) => profile.level === "Highly Stable" || profile.level === "Moderately Stable")
    .slice(0, 2)
    .flatMap((profile) => {
      const relationship = makeRelationship({
        id: `relationship:stability:${profile.variable.replaceAll(" ", "_")}`,
        variables: [`domain:${profile.variable.replaceAll(" ", "_")}`],
        type: "stability_relationship",
        correlation: 0.7,
        consistency: round(1 - profile.variability),
        scans: history,
        result,
        title: `${profile.variable} has been ${profile.level.toLowerCase()}`,
        explanation: `Across recent scans, ${profile.variable} has varied less than other tracked areas. This describes stability in measured history, not a fixed trait.`,
        exceptions: [],
        nowMs,
      });
      return relationship ? [relationship] : [];
    });
}

function themes(relationships: RelationshipInsight[]) {
  const groups = relationships.reduce<Record<string, RelationshipInsight[]>>((acc, relationship) => {
    const key = relationship.variables.some((variable) => /recovery|regulation/.test(variable)) ? "Structured Recovery"
      : relationship.variables.some((variable) => /expression|capacity/.test(variable)) ? "Selective Expression"
      : "Personal Rhythm";
    return { ...acc, [key]: [...(acc[key] ?? []), relationship] };
  }, {});
  return Object.entries(groups)
    .filter(([, items]) => items.length >= 2)
    .map(([title, items]) => ({
      title,
      relationshipIds: items.map((item) => item.id),
      evidence: Array.from(new Set(items.flatMap((item) => item.evidence))).sort(),
      confidence: round(mean(items.map((item) => item.confidence))),
    }))
    .slice(0, 3);
}

export function buildRelationshipIntelligence(args: {
  canonicalResult: CanonicalSoulScopeResult;
  history: LongitudinalScanSnapshot[];
  personalBaseline?: RollingBaseline | null;
  contextEntries?: string[];
  nowMs?: number;
}): RelationshipIntelligence {
  const nowMs = args.nowMs ?? Date.now();
  const history = [...args.history].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  const baselineIds = new Set(args.personalBaseline?.sourceScanIds ?? []);
  const relationshipHistory = baselineIds.size >= MIN_RELATIONSHIP_OBSERVATIONS
    ? history.filter((scan) => baselineIds.has(scan.scanId))
    : history;
  const relationships = [
    ...associationRelationships(args.canonicalResult, relationshipHistory, nowMs),
    ...contextRelationships(args.canonicalResult, relationshipHistory, args.contextEntries ?? [], nowMs),
    ...conditionalRelationships(args.canonicalResult, relationshipHistory, nowMs),
    ...sequentialRelationships(args.canonicalResult, relationshipHistory, nowMs),
    ...stabilityRelationships(args.canonicalResult, relationshipHistory, nowMs),
  ]
    .sort((left, right) => right.confidence - left.confidence || right.historicalSupport.observationCount - left.historicalSupport.observationCount || left.id.localeCompare(right.id))
    .slice(0, 8);
  return {
    version: RELATIONSHIP_INTELLIGENCE_VERSION,
    relationships,
    discoveryCards: relationships
      .filter((relationship) => relationship.historicalSupport.observationCount >= MIN_RELATIONSHIP_OBSERVATIONS && relationship.confidence >= MIN_CONFIDENCE)
      .slice(0, 3)
      .map((relationship) => ({
        title: relationship.title,
        body: relationship.explanation,
        confidence: relationship.confidence,
        relationshipId: relationship.id,
      })),
    stabilityProfiles: stabilityProfiles(relationshipHistory),
    themes: themes(relationships),
  };
}
