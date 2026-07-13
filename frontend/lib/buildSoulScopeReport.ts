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

export type SoulScopeReport = BaseSoulScopeReport & {
  patternExpression: PatternExpression;
  modifiers: PatternModifier[];
  baselineComparison: BaselineComparison;
  scanCompleteness?: ScanCompleteness;
};

export type BuildSoulScopeReportOptions = {
  historicalDomainResults?: UserResultDomain[][];
};

function lowerFirst(value: string) {
  return value ? `${value.charAt(0).toLowerCase()}${value.slice(1)}` : value;
}

function personalizeStoryCandidate(
  candidate: UserResultStoryCandidate,
  expression: PatternExpression,
  modifiers: PatternModifier[],
): UserResultStoryCandidate {
  const resource = modifiers.find((modifier) => modifier.category === "resource")?.label;
  const load = modifiers.find((modifier) => modifier.category === "load")?.label;
  const evidence = expression.matchedSignals.slice(0, 2).join(" and ");

  if (candidate.style === "Direct") {
    return {
      ...candidate,
      summary: `${candidate.summary} Current expression: ${expression.title}. ${expression.summary}`,
    };
  }

  if (candidate.style === "Supportive") {
    const supportLine = resource
      ? `What remains available is that ${resource}.`
      : "The scan still shows usable capacity alongside the current strain.";
    return {
      ...candidate,
      summary: `${candidate.summary} ${supportLine} This expression is current-state information, not a fixed identity.`,
    };
  }

  const evidenceLine = evidence
    ? `The differentiating evidence points to ${lowerFirst(expression.title)}, supported by ${evidence}.`
    : `The differentiating layer is ${lowerFirst(expression.title)}.`;
  const loadLine = load ? `At the same time, ${load}.` : "The pattern is mixed rather than one-dimensional.";
  return {
    ...candidate,
    summary: `${candidate.summary} ${evidenceLine} ${loadLine}`,
  };
}

export function buildSoulScopeReport(
  scan: VoiceAnalysisResult,
  options: BuildSoulScopeReportOptions = {},
): SoulScopeReport {
  const scanWithCompleteness = scan as ScanWithCompleteness;
  const base = buildBaseSoulScopeReport(scan);
  const limited = scanWithCompleteness.scanCompleteness?.qualityLevel === "limited";
  const patternExpression: PatternExpression = limited
    ? {
        id: "signals-still-resolving",
        title: "The Available Signals Are Still Resolving",
        summary: "This limited reflection is based only on the clearest captured signals, so the interpretation remains intentionally broad.",
        matchedSignals: [`${scanWithCompleteness.scanCompleteness?.validRecordings ?? 0} usable recordings`],
      }
    : buildPatternExpression(base.primaryPattern.id, scan, base.domainResults);
  const modifiers = buildPatternModifiers(scan, base.domainResults).slice(0, limited ? 2 : 6);
  const baselineComparison = buildBaselineComparison(
    base.domainResults,
    options.historicalDomainResults ?? [],
  );

  const storyCandidates = base.storyCandidates.map((candidate) =>
    personalizeStoryCandidate(candidate, patternExpression, modifiers),
  );

  return {
    ...base,
    patternExpression,
    modifiers,
    baselineComparison,
    scanCompleteness: scanWithCompleteness.scanCompleteness,
    storyCandidates,
  };
}

export type { PatternMatch, PatternDefinition, PatternId };
export type { PatternExpression, PatternModifier, BaselineComparison } from "./patternPersonalization";
