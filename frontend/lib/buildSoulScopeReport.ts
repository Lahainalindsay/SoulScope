import {
  buildSoulScopeReport as buildBaseSoulScopeReport,
  type SoulScopeReport as BaseSoulScopeReport,
  type PatternMatch,
  type PatternDefinition,
  type PatternId,
} from "./resonancePatterns";
import {
  buildBaselineComparison,
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
import { buildAtlasPresentation, buildAtlasRuntime } from "./atlasRuntime";
import { buildAtlasSignatureModel, type AtlasSignatureModel } from "./atlasSignature";
import type { AtlasInput, AtlasResult } from "./patternAtlas";
import {
  canonicalPresentation,
  resolveCanonicalPattern,
  type CanonicalPatternResult,
} from "./canonicalPattern";
import { buildResonanceNarrative } from "./resonanceNarrativeEngineV3";
import {
  buildCanonicalSoulScopeResult,
  type CanonicalSoulScopeResult,
} from "./canonicalResult";
import { buildCanonicalNarrative, type CanonicalNarrative } from "./canonicalNarrativeEngine";
import { buildPhaseCIntelligence, type PhaseCIntelligence } from "./phaseCInsightEngine";

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
  canonicalResult: CanonicalSoulScopeResult;
  canonicalNarrative: CanonicalNarrative;
  phaseCIntelligence: PhaseCIntelligence;
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
  return {
    ...candidate,
    title: "What may be worth noticing",
    summary: `${presentation.explanation[1]} ${presentation.reflectionQuestion} ${qualityLine}`.trim(),
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
  const atlasPresentation = buildAtlasPresentation(atlasRuntime.input, atlasRuntime.result, baselineComparison);
  const resolvedCanonicalPattern = resolveCanonicalPattern(
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
  // The canonical candidate/abstention decision is authoritative. The older
  // coordinate result remains diagnostic input and may never overwrite it.
  const canonicalPattern = resolvedCanonicalPattern;
  const resonanceNarrative = buildResonanceNarrative(
    domainResults,
    canonicalPattern,
    scanWithCompleteness.scanCompleteness,
  );
  const canonicalResult = buildCanonicalSoulScopeResult({
    scanId: options.scanId ?? scan.scanMeta?.completedAt ?? "unsaved-scan",
    scan,
    canonical: canonicalPattern,
    narrative: resonanceNarrative,
    resonanceSignature: atlasSignature,
  });
  const canonicalNarrative = buildCanonicalNarrative(canonicalResult);
  const phaseCIntelligence = buildPhaseCIntelligence(canonicalResult);
  const resultIsUnresolved = canonicalResult.decisionLedger.record.outcome === "unresolved";
  const publishedEvidenceLines = canonicalResult.phaseBDimensions.records.some((dimension) => dimension.evidenceCoverage > 0)
    ? canonicalResult.phaseBDimensions.records
        .filter((dimension) => dimension.evidenceCoverage > 0)
        .sort((left, right) => right.confidence - left.confidence)
        .slice(0, limited ? 2 : 4)
        .map((dimension) => `${dimension.label} carried usable evidence with ${dimension.confidence >= 0.72 ? "strong" : dimension.confidence >= 0.48 ? "moderate" : "developing"} confidence.`)
    : canonicalResult.decisionLedger.record.missingEvidence.length
      ? ["Some evidence was unavailable, so the reflection stays broad."]
      : ["The reflection preserves uncertainty where the signal is less settled."];

  const patternExpression: PatternExpression = {
    id: canonicalResult.pattern.id ?? "signals-still-resolving",
    title: phaseCIntelligence.headlineInsight.title,
    summary: canonicalNarrative.reflection,
    matchedSignals: resultIsUnresolved
      ? canonicalResult.decisionLedger.record.missingEvidence.length
        ? ["Some evidence was unavailable, so the reflection stays broad."]
        : ["SoulScope is keeping the reflection broad instead of forcing a pattern."]
      : publishedEvidenceLines,
  };

  const modifiers = buildPatternModifiers(scan, domainResults).slice(0, limited ? 2 : 6);
  const presentation = {
    ...canonicalPresentation(canonicalPattern, atlasPresentation),
    summary: canonicalNarrative.patternSubtitle
      ? `${canonicalNarrative.patternSubtitle} ${canonicalNarrative.reflection}`
      : canonicalNarrative.reflection,
    explanation: [
      canonicalNarrative.reflection,
      canonicalNarrative.uncertaintyNote ?? canonicalNarrative.worthNoticing,
    ],
    observedBullets: [
      canonicalNarrative.worthNoticing,
      canonicalNarrative.uncertaintyNote ?? "This reflection keeps uncertainty visible where the evidence is less settled.",
      `Confidence: ${canonicalNarrative.confidenceLabel}.`,
    ],
    dailyLife: resultIsUnresolved
      ? [
          canonicalNarrative.howThisMayShowUp,
          "Some signals were present, but the available evidence was limited.",
          canonicalNarrative.gentleNextStep,
          "This result preserves uncertainty instead of substituting a neutral pattern.",
        ]
      : [
          canonicalNarrative.howThisMayShowUp,
          canonicalNarrative.worthNoticing,
          canonicalNarrative.gentleNextStep,
          canonicalNarrative.uncertaintyNote ?? "The reflection should stay connected to the conditions of this scan.",
        ],
    reflectionQuestion: resultIsUnresolved
      ? "What feels most worth noticing before you scan again?"
      : canonicalNarrative.gentleNextStep,
    longitudinalMessage: "No longitudinal change claim was published from this scan.",
  } satisfies PatternPresentation;
  const storyCandidates = base.storyCandidates.map((candidate) => personalizeStoryCandidate(
    candidate,
    presentation,
    modifiers,
    canonicalPattern.secondaryFamily ? canonicalPattern.canonicalDisplayName : undefined,
    scanWithCompleteness.scanCompleteness,
  ));
  const canonicalPrimaryPattern: PatternMatch = {
    ...primaryPattern,
    name: phaseCIntelligence.headlineInsight.title,
    theme: `${phaseCIntelligence.headlineInsight.explanation} ${canonicalNarrative.reflection}`,
    explanation: canonicalNarrative.uncertaintyNote ?? canonicalNarrative.worthNoticing,
    whatThisMayFeelLike: presentation.dailyLife,
    supportiveFactors: resultIsUnresolved
      ? [
          canonicalNarrative.worthNoticing,
          canonicalNarrative.gentleNextStep,
          "Unknown parts of the scan are left open rather than filled in.",
        ]
      : [
          canonicalNarrative.howThisMayShowUp,
          canonicalNarrative.worthNoticing,
          canonicalNarrative.gentleNextStep,
        ],
    whatIsWorkingHardest: canonicalResult.decisionLedger.record.supportingEvidence.length
      ? canonicalResult.decisionLedger.record.supportingEvidence.slice(0, 3).map((item) => item.replaceAll("-", " "))
      : primaryPattern.whatIsWorkingHardest,
    whatNeedsAttention: presentation.reflectionQuestion,
    confidence: canonicalResult.meaningObjects.records[0]?.confidence ?? 0,
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
    canonicalResult,
    canonicalNarrative,
    phaseCIntelligence,
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
