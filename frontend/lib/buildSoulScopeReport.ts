import {
  buildSoulScopeReport as buildBaseSoulScopeReport,
  type SoulScopeReport as BaseSoulScopeReport,
  type PatternMatch,
  type PatternDefinition,
  type PatternId,
} from "./resonancePatterns";
import {
  buildBaselineComparison,
  buildPatternExpression,
  buildPatternModifiers,
  type BaselineComparison,
  type PatternExpression,
  type PatternModifier,
} from "./patternPersonalization";
import type { ScanCompleteness, ScanWithCompleteness } from "./partialScan";
import type { UserResultDomain, UserResultStoryCandidate } from "./systemDimensions";
import type { VoiceAnalysisResult } from "./voiceSpectrum";
import { adaptDomainsToLegacy } from "./observationFramework/adaptDomainsToLegacy";
import { buildObservationPipeline } from "./observationFramework/buildObservationPipeline";
import type { ObservationPipelineResult } from "./observationFramework/types";
import { USE_OBSERVATION_PIPELINE_V2 } from "./observationFramework/versions";
import { discriminatePatternMatches } from "./patternDiscrimination";

export type SoulScopeReport = BaseSoulScopeReport & {
  patternExpression: PatternExpression;
  modifiers: PatternModifier[];
  baselineComparison: BaselineComparison;
  scanCompleteness?: ScanCompleteness;
  observationPipeline?: ObservationPipelineResult;
};

export type BuildSoulScopeReportOptions = {
  historicalDomainResults?: UserResultDomain[][];
  scanId?: string;
};

function lowerFirst(value: string) {
  return value ? `${value.charAt(0).toLowerCase()}${value.slice(1)}` : value;
}

function strongestObservations(pipeline?: ObservationPipelineResult) {
  return (pipeline?.observations ?? [])
    .filter((observation) => observation.direction !== "stable")
    .sort((a, b) => {
      const confidence = { high: 2, moderate: 1, exploratory: 0 } as const;
      const confidenceDelta = confidence[b.interpretationConfidence] - confidence[a.interpretationConfidence];
      return confidenceDelta || b.strength - a.strength || a.observationId.localeCompare(b.observationId);
    })
    .slice(0, 2);
}

function personalizeStoryCandidate(
  candidate: UserResultStoryCandidate,
  expression: PatternExpression,
  modifiers: PatternModifier[],
  primary: PatternMatch,
  supporting: PatternMatch | undefined,
  baseline: BaselineComparison,
  pipeline?: ObservationPipelineResult,
  completeness?: ScanCompleteness,
): UserResultStoryCandidate {
  const resource = modifiers.find((modifier) => modifier.category === "resource")?.label;
  const load = modifiers.find((modifier) => modifier.category === "load")?.label;
  const observations = strongestObservations(pipeline);
  const observationLine = observations.length
    ? observations.map((observation) => observation.summary).join(" ")
    : expression.summary;
  const qualityLine = completeness?.qualityLevel === "limited"
    ? "Because the captured signal was limited, this reflection stays intentionally broad."
    : completeness?.status === "partial"
    ? "This reflection uses only the recordings that contained clear usable signal."
    : "";

  if (candidate.style === "Direct") {
    const loadLine = load ? `The clearest current load is that ${lowerFirst(load)}.` : primary.theme;
    return { ...candidate, summary: `Current expression: ${expression.title}. Current observations suggest ${lowerFirst(expression.title)}. ${observationLine} ${loadLine} ${qualityLine}`.trim() };
  }
  if (candidate.style === "Supportive") {
    const capacityLine = resource ? `At the same time, ${lowerFirst(resource)} remains available.` : "Usable capacity remains present alongside the current demand.";
    const supportLine = supporting ? `A supporting pattern also points to ${lowerFirst(supporting.theme)}` : "The current picture is mixed rather than one-dimensional.";
    return { ...candidate, summary: `${observationLine} ${capacityLine} ${supportLine} This is current-state information, not a fixed identity. ${qualityLine}`.trim() };
  }
  const baselineLine = baseline.available
    ? baseline.overallSummary ?? "Your recent scans provide additional context for this shift."
    : "There is not yet enough personal history to describe this as a change from your usual baseline.";
  const evidenceLine = expression.matchedSignals.length
    ? `The differentiating evidence includes ${expression.matchedSignals.slice(0, 2).join(" and ")}.`
    : "The differentiating evidence comes from the current combination of observations and domain balance.";
  return { ...candidate, summary: `This pattern often appears when ${lowerFirst(primary.theme)} ${observationLine} ${evidenceLine} ${baselineLine} ${qualityLine}`.trim() };
}

export function buildSoulScopeReport(
  scan: VoiceAnalysisResult,
  options: BuildSoulScopeReportOptions = {},
): SoulScopeReport {
  const scanWithCompleteness = scan as ScanWithCompleteness;
  const base = buildBaseSoulScopeReport(scan);
  const observationPipeline = USE_OBSERVATION_PIPELINE_V2
    ? buildObservationPipeline(scan, {
        scanId: options.scanId,
        captureQuality: scanWithCompleteness.scanCompleteness?.qualityLevel,
        recordingCompleteness: scanWithCompleteness.scanCompleteness
          ? {
              expectedRecordings: scanWithCompleteness.scanCompleteness.expectedRecordings,
              validRecordings: scanWithCompleteness.scanCompleteness.validRecordings,
            }
          : undefined,
      })
    : undefined;
  const adaptedDomains = observationPipeline && observationPipeline.domains.length >= 4
    ? adaptDomainsToLegacy(observationPipeline.domains)
    : [];
  const domainResults = adaptedDomains.length >= 4 ? adaptedDomains : base.domainResults;
  if (observationPipeline && adaptedDomains.length < 4) {
    observationPipeline.warnings.push("Legacy domain builder was retained because the V2 adapter did not produce enough domains.");
  }

  const discriminated = discriminatePatternMatches(
    [base.primaryPattern, base.supportingPattern, base.emergingPattern],
    observationPipeline,
  );
  const primaryPattern = discriminated[0] ?? base.primaryPattern;
  const supportingPattern = discriminated[1]?.confidence > 0.2 ? discriminated[1] : undefined;
  const emergingPattern = discriminated[2]?.confidence > 0.15 ? discriminated[2] : undefined;
  const limited = scanWithCompleteness.scanCompleteness?.qualityLevel === "limited";
  const patternExpression: PatternExpression = limited
    ? {
        id: "signals-still-resolving",
        title: "The Available Signals Are Still Resolving",
        summary: "This limited reflection is based only on the clearest captured signals, so the interpretation remains intentionally broad.",
        matchedSignals: [`${scanWithCompleteness.scanCompleteness?.validRecordings ?? 0} usable recordings`],
      }
    : buildPatternExpression(primaryPattern.id, scan, domainResults);
  const modifiers = buildPatternModifiers(scan, domainResults).slice(0, limited ? 2 : 6);
  const baselineComparison = buildBaselineComparison(domainResults, options.historicalDomainResults ?? []);
  const storyCandidates = base.storyCandidates.map((candidate) => personalizeStoryCandidate(
    candidate,
    patternExpression,
    modifiers,
    primaryPattern,
    supportingPattern,
    baselineComparison,
    observationPipeline,
    scanWithCompleteness.scanCompleteness,
  ));

  return {
    ...base,
    primaryPattern,
    supportingPattern,
    emergingPattern,
    domainResults,
    patternExpression,
    modifiers,
    baselineComparison,
    scanCompleteness: scanWithCompleteness.scanCompleteness,
    observationPipeline,
    storyCandidates,
  };
}

export type { PatternMatch, PatternDefinition, PatternId };
export type { PatternExpression, PatternModifier, BaselineComparison } from "./patternPersonalization";