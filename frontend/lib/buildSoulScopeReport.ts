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
import { buildPatternPresentation, type PatternPresentation } from "./patternKnowledge";
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
  presentation: PatternPresentation;
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

function personalizeStoryCandidate(
  candidate: UserResultStoryCandidate,
  presentation: PatternPresentation,
  modifiers: PatternModifier[],
  supporting: PatternMatch | undefined,
  baseline: BaselineComparison,
  completeness?: ScanCompleteness,
): UserResultStoryCandidate {
  const resource = modifiers.find((modifier) => modifier.category === "resource")?.label;
  const qualityLine = completeness?.qualityLevel === "limited"
    ? "This reflection stays broad because only a limited amount of clear voice data was available."
    : completeness?.status === "partial"
    ? "This reflection is based only on the recordings captured clearly."
    : "";

  if (candidate.style === "Direct") {
    return {
      ...candidate,
      summary: `${presentation.summary} ${presentation.observedBullets[0]} ${qualityLine}`.trim(),
    };
  }
  if (candidate.style === "Supportive") {
    const capacityLine = resource
      ? `${resource.charAt(0).toUpperCase()}${resource.slice(1)} remains available alongside the areas asking for more care.`
      : supporting
      ? `${supporting.name} also adds context to what may be supporting you today.`
      : "Useful capacity remains present alongside the current demand.";
    return {
      ...candidate,
      summary: `${presentation.explanation[0]} ${capacityLine} ${qualityLine}`.trim(),
    };
  }
  const baselineLine = baseline.available
    ? baseline.overallSummary ?? presentation.longitudinalMessage
    : presentation.longitudinalMessage;
  return {
    ...candidate,
    summary: `${presentation.explanation[1]} ${baselineLine} ${qualityLine}`.trim(),
  };
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
        title: "A Limited Reflection",
        summary: "This reflection is intentionally broad because only the clearest captured voice data could be used.",
        matchedSignals: [`${scanWithCompleteness.scanCompleteness?.validRecordings ?? 0} usable recordings`],
      }
    : buildPatternExpression(primaryPattern.id, scan, domainResults);
  const modifiers = buildPatternModifiers(scan, domainResults).slice(0, limited ? 2 : 6);
  const baselineComparison = buildBaselineComparison(domainResults, options.historicalDomainResults ?? []);
  const presentation = buildPatternPresentation(
    primaryPattern,
    domainResults,
    baselineComparison,
    options.scanId ?? `${primaryPattern.id}:${patternExpression.id}`,
  );
  const storyCandidates = base.storyCandidates.map((candidate) => personalizeStoryCandidate(
    candidate,
    presentation,
    modifiers,
    supportingPattern,
    baselineComparison,
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
    presentation,
    scanCompleteness: scanWithCompleteness.scanCompleteness,
    observationPipeline,
    storyCandidates,
  };
}

export type { PatternMatch, PatternDefinition, PatternId };
export type { PatternExpression, PatternModifier, BaselineComparison } from "./patternPersonalization";
