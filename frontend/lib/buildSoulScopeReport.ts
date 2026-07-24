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
import { type PatternPresentation } from "./patternKnowledge";
import type { ScanCompleteness, ScanWithCompleteness } from "./partialScan";
import type { UserResultDomain, UserResultStoryCandidate } from "./systemDimensions";
import type { VoiceAnalysisResult } from "./voiceSpectrum";
import { buildVocalStateProfile, type VocalStateProfile } from "./vocalStateProfile";
import { adaptDomainsToLegacy } from "./observationFramework/adaptDomainsToLegacy";
import { buildObservationPipeline } from "./observationFramework/buildObservationPipeline";
import type { ObservationPipelineResult } from "./observationFramework/types";
import { USE_OBSERVATION_PIPELINE_V2 } from "./observationFramework/versions";
import { discriminatePatternMatches } from "./patternDiscrimination";
import { buildAtlasPresentation, buildAtlasRuntime, topAtlasEvidence } from "./atlasRuntime";
import { buildAtlasSignatureModel, type AtlasSignatureModel } from "./atlasSignature";
import type { AtlasInput, AtlasResult } from "./patternAtlas";
import {
  canonicalPatternExpression,
  canonicalPresentation,
  resolveCanonicalPattern,
  type CanonicalPatternResult,
} from "./canonicalPattern";

export type SoulScopeReport = BaseSoulScopeReport & {
  patternExpression: PatternExpression;
  modifiers: PatternModifier[];
  baselineComparison: BaselineComparison;
  presentation: PatternPresentation;
  scanCompleteness?: ScanCompleteness;
  observationPipeline?: ObservationPipelineResult;
  vocalStateProfile: VocalStateProfile;
  atlas: {
    input: AtlasInput;
    result: AtlasResult;
    signature: AtlasSignatureModel;
  };
  canonicalPattern: CanonicalPatternResult;
};

export type BuildSoulScopeReportOptions = {
  historicalDomainResults?: UserResultDomain[][];
  scanId?: string;
};

function personalizeStoryCandidate(
  candidate: UserResultStoryCandidate,
  presentation: PatternPresentation,
  modifiers: PatternModifier[],
  supportingName: string | undefined,
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
      title: "What the signals show",
      summary: `${presentation.summary} ${presentation.observedBullets[0]} ${qualityLine}`.trim(),
    };
  }
  if (candidate.style === "Supportive") {
    const capacityLine = resource
      ? `${resource.charAt(0).toUpperCase()}${resource.slice(1)} remains available alongside the areas asking for more care.`
      : supportingName
      ? `${supportingName} also adds context to the capacities supporting you today.`
      : "Useful capacity remains present alongside the current demand.";
    return {
      ...candidate,
      title: "What may be supporting you",
      summary: `${presentation.explanation[0]} ${capacityLine} ${qualityLine}`.trim(),
    };
  }
  const baselineLine = baseline.available
    ? baseline.overallSummary ?? presentation.longitudinalMessage
    : presentation.longitudinalMessage;
  return {
    ...candidate,
    title: "What may be changing",
    summary: `${presentation.explanation[1]} ${baselineLine} ${qualityLine}`.trim(),
  };
}

export function buildSoulScopeReport(
  scan: VoiceAnalysisResult,
  options: BuildSoulScopeReportOptions = {},
): SoulScopeReport {
  const scanWithCompleteness = scan as ScanWithCompleteness;
  const base = buildBaseSoulScopeReport(scan);
  const vocalStateProfile = buildVocalStateProfile(scan);
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
  const baselineComparison = buildBaselineComparison(domainResults, options.historicalDomainResults ?? []);
  const atlasRuntime = buildAtlasRuntime(scan, domainResults, baselineComparison);
  const atlasSignature = buildAtlasSignatureModel(atlasRuntime.input, atlasRuntime.result);
  const atlasEvidence = topAtlasEvidence(atlasRuntime.input, limited ? 2 : 4);
  const atlasPresentation = buildAtlasPresentation(atlasRuntime.input, atlasRuntime.result, baselineComparison);
  const canonicalPattern = resolveCanonicalPattern(
    {
      dynamicPattern: base.dynamicPattern,
      atlasInput: atlasRuntime.input,
      atlasResult: atlasRuntime.result,
      primaryPattern,
      supportingPattern,
      emergingPattern,
      completeness: scanWithCompleteness.scanCompleteness,
    },
    atlasPresentation,
  );

  const patternExpression: PatternExpression = canonicalPatternExpression(
    canonicalPattern,
    atlasEvidence.map((evidence) => `${evidence.label} · ${Math.round(evidence.score * 100)}%`),
  );

  const legacyExpression = buildPatternExpression(primaryPattern.id, scan, domainResults);
  if (!limited && legacyExpression.matchedSignals.length) {
    patternExpression.matchedSignals.push(...legacyExpression.matchedSignals.slice(0, 2));
  }

  const modifiers = buildPatternModifiers(scan, domainResults).slice(0, limited ? 2 : 6);
  const presentation = canonicalPresentation(canonicalPattern, atlasPresentation);
  const storyCandidates = base.storyCandidates.map((candidate) => personalizeStoryCandidate(
    candidate,
    presentation,
    modifiers,
    canonicalPattern.secondaryFamily ? canonicalPattern.canonicalDisplayName : undefined,
    baselineComparison,
    scanWithCompleteness.scanCompleteness,
  ));
  const canonicalPrimaryPattern: PatternMatch = {
    ...primaryPattern,
    name: canonicalPattern.canonicalDisplayName,
    theme: canonicalPattern.summary,
    explanation: canonicalPattern.explanation[0],
    whatThisMayFeelLike: canonicalPattern.dailyLife,
    supportiveFactors: canonicalPattern.supportLines,
    whatIsWorkingHardest: canonicalPattern.decisionLedger.supportingEvidence.length
      ? canonicalPattern.decisionLedger.supportingEvidence.map((item) => item.replaceAll("-", " "))
      : primaryPattern.whatIsWorkingHardest,
    whatNeedsAttention: canonicalPattern.reflectionQuestion,
    confidence: canonicalPattern.confidence,
  };

  return {
    ...base,
    primaryPattern: canonicalPrimaryPattern,
    supportingPattern,
    emergingPattern,
    domainResults,
    patternExpression,
    modifiers,
    baselineComparison,
    presentation,
    canonicalPattern,
    scanCompleteness: scanWithCompleteness.scanCompleteness,
    observationPipeline,
    vocalStateProfile,
    storyCandidates,
    atlas: {
      input: atlasRuntime.input,
      result: atlasRuntime.result,
      signature: atlasSignature,
    },
  };
}

export type { PatternMatch, PatternDefinition, PatternId };
export type { PatternExpression, PatternModifier, BaselineComparison } from "./patternPersonalization";
