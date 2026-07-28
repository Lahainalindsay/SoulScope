import type { CanonicalPatternResult } from "./canonicalPattern";
import type { ScanCompleteness } from "./partialScan";
import { buildMeaningNodes, combineMeaningNodes, type MeaningNode } from "./relationshipMeaningEngine";
import {
  buildResonanceNarrative as buildV2Narrative,
  type NarrativeEvidenceRef,
  type ResonanceNarrative as ResonanceNarrativeV2,
} from "./resonanceNarrativeEngineV2";
import type { UserResultDomain, UserResultDomainName } from "./systemDimensions";

export const RESONANCE_NARRATIVE_ENGINE_VERSION = "resonance-narrative-v3-meaning-graph";

export type RelationshipNarrativeV3 = MeaningNode & {
  statement: string;
  evidenceRefs: NarrativeEvidenceRef[];
  level: "pair" | "higher-order";
};

export type ResonanceNarrative = Omit<ResonanceNarrativeV2, "engineVersion" | "relationships"> & {
  engineVersion: string;
  relationships: RelationshipNarrativeV3[];
  pairStates: RelationshipNarrativeV3[];
  higherOrderStates: RelationshipNarrativeV3[];
  meaningGraph: {
    version: string;
    nodes: RelationshipNarrativeV3[];
    dominantNodeId: string | null;
  };
};

function evidenceRefFor(domain: UserResultDomainName, narrative: ResonanceNarrativeV2): NarrativeEvidenceRef | undefined {
  return narrative.evidenceLedger.find((item) => item.domain === domain);
}

function enrich(node: MeaningNode, narrative: ResonanceNarrativeV2, level: "pair" | "higher-order"): RelationshipNarrativeV3 {
  return {
    ...node,
    statement: node.meaning,
    evidenceRefs: node.evidence
      .map((item) => evidenceRefFor(item.domain, narrative))
      .filter((item): item is NarrativeEvidenceRef => Boolean(item)),
    level,
  };
}

function uniqueSentences(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

export function buildResonanceNarrative(
  domains: UserResultDomain[],
  canonical: CanonicalPatternResult,
  completeness?: ScanCompleteness,
): ResonanceNarrative {
  const base = buildV2Narrative(domains, canonical, completeness);
  const pairStates = buildMeaningNodes(domains.map((domain) => ({ domain: domain.title, score: domain.score })))
    .map((node) => enrich(node, base, "pair"));
  const higherOrderStates = combineMeaningNodes(pairStates)
    .map((node) => enrich(node, base, "higher-order"));
  const nodes = [...higherOrderStates, ...pairStates]
    .sort((a, b) => b.confidence * b.score - a.confidence * a.score);
  const dominant = higherOrderStates[0] ?? pairStates[0];
  const supporting = nodes.find((node) => node.id !== dominant?.id && node.resultType !== "unresolved");

  const introduction = dominant
    ? supporting
      ? `${dominant.meaning} ${supporting.meaning}`
      : dominant.meaning
    : base.introduction;
  const beneathTheSurface = higherOrderStates[1]?.meaning
    ?? pairStates.find((node) => node.id !== dominant?.id && node.resultType !== "unresolved")?.meaning
    ?? base.beneathTheSurface;

  const limitations = [...base.limitations];
  if (nodes.some((node) => node.resultType === "blended")) {
    limitations.push("One or more relationship states sit near a meaningful boundary, so the blend itself is preserved rather than forcing a false winner.");
  }
  if (nodes.some((node) => node.resultType === "unresolved")) {
    limitations.push("Relationship states with weak or contradictory support are retained as unresolved and do not drive the final story.");
  }

  const stronglyAdaptive = ["structured-processing", "purposeful-focus", "restored-capacity"]
    .every((id) => pairStates.some((node) => node.id === id && node.confidence >= 0.62));
  const generatedPattern = stronglyAdaptive
    ? {
        ...base.generatedPattern,
        title: "The Adaptive Integrator",
        dominantState: "Fluid reorganization",
        supportingQuality: "Coordinated flexibility",
        ruleId: "meaning-graph-adaptive-integrator",
      }
    : base.generatedPattern;

  return {
    ...base,
    engineVersion: RESONANCE_NARRATIVE_ENGINE_VERSION,
    generatedPattern,
    introduction,
    beneathTheSurface,
    howThisOftenFeels: uniqueSentences([
      ...higherOrderStates.slice(0, 2).map((node) => node.meaning),
      ...base.howThisOftenFeels,
    ]).slice(0, 6),
    relationships: nodes,
    pairStates,
    higherOrderStates,
    meaningGraph: {
      version: "meaning-graph-v1",
      nodes,
      dominantNodeId: dominant?.id ?? null,
    },
    limitations,
  };
}
