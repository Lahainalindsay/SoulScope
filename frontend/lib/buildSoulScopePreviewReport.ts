import {
  buildSoulScopeReport,
  type BuildSoulScopeReportOptions,
  type SoulScopeReport,
} from "./buildSoulScopeReport";
import {
  buildResonanceNarrative,
  type ResonanceNarrative,
} from "./resonanceNarrativeEngineV3";
import type { VoiceAnalysisResult } from "./voiceSpectrum";

export type SoulScopePreviewReport = SoulScopeReport & {
  resonanceNarrative: ResonanceNarrative;
};

export function applyResonanceNarrative(report: SoulScopeReport): SoulScopePreviewReport {
  const resonanceNarrative = buildResonanceNarrative(
    report.domainResults,
    report.canonicalPattern,
    report.scanCompleteness,
  );

  return {
    ...report,
    resonanceNarrative,
    primaryPattern: {
      ...report.primaryPattern,
      name: resonanceNarrative.generatedPattern.title,
      theme: resonanceNarrative.introduction,
      explanation: resonanceNarrative.beneathTheSurface,
      whatThisMayFeelLike: resonanceNarrative.howThisOftenFeels.slice(0, 4) as [string, string, string, string],
      supportiveFactors: resonanceNarrative.whatOthersMayNotice.slice(0, 3) as [string, string, string],
      whatIsWorkingHardest: resonanceNarrative.components
        .filter((component) => component.orientation === "resource")
        .slice(0, 3)
        .map((component) => `${component.domain}: ${component.band}`),
      whatNeedsAttention: resonanceNarrative.reflectionQuestion,
      confidence: resonanceNarrative.generatedPattern.confidence,
    },
    storyCandidates: report.storyCandidates.map((candidate, index) => ({
      ...candidate,
      title: index === 0 ? "Your resonance today" : candidate.title,
      summary: index === 0
        ? resonanceNarrative.introduction
        : index === 1
        ? resonanceNarrative.strengthToday
        : resonanceNarrative.worthNoticing,
    })),
  };
}

/**
 * Evidence-weighted report pipeline. Raw domains first become named pair states,
 * pair states become higher-order meaning nodes, and the strongest supported
 * nodes provide the human storyline. The user-facing pattern title remains a
 * replaceable presentation layer while the meaning graph stays stable.
 */
export function buildSoulScopePreviewReport(
  scan: VoiceAnalysisResult,
  options: BuildSoulScopeReportOptions = {},
): SoulScopePreviewReport {
  return applyResonanceNarrative(buildSoulScopeReport(scan, options));
}
