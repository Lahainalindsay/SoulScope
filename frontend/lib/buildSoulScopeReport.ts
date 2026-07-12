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
import type { UserResultDomain } from "./systemDimensions";
import type { VoiceAnalysisResult } from "./voiceSpectrum";

export type SoulScopeReport = BaseSoulScopeReport & {
  patternExpression: PatternExpression;
  modifiers: PatternModifier[];
  baselineComparison: BaselineComparison;
};

export type BuildSoulScopeReportOptions = {
  historicalDomainResults?: UserResultDomain[][];
};

export function buildSoulScopeReport(
  scan: VoiceAnalysisResult,
  options: BuildSoulScopeReportOptions = {},
): SoulScopeReport {
  const base = buildBaseSoulScopeReport(scan);
  const patternExpression = buildPatternExpression(base.primaryPattern.id, scan, base.domainResults);
  const modifiers = buildPatternModifiers(scan, base.domainResults);
  const baselineComparison = buildBaselineComparison(
    base.domainResults,
    options.historicalDomainResults ?? [],
  );

  const storyCandidates = base.storyCandidates.map((candidate) => ({
    ...candidate,
    summary: `${patternExpression.summary} ${candidate.summary}`,
  }));

  return {
    ...base,
    patternExpression,
    modifiers,
    baselineComparison,
    storyCandidates,
  };
}

export type { PatternMatch, PatternDefinition, PatternId };
export type { PatternExpression, PatternModifier, BaselineComparison } from "./patternPersonalization";
