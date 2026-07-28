import {
  buildSoulScopeReport,
  type BuildSoulScopeReportOptions,
  type SoulScopeReport,
} from "./buildSoulScopeReport";
import {
  buildResonanceNarrative,
  type ResonanceNarrative,
} from "./resonanceNarrativeEngine";
import type { VoiceAnalysisResult } from "./voiceSpectrum";

export type SoulScopePreviewReport = SoulScopeReport & {
  resonanceNarrative: ResonanceNarrative;
};

/**
 * Preview-only report pipeline.
 *
 * The production report remains untouched on main. This builder treats measured
 * component states as the source of the narrative, preserves a complete evidence
 * ledger, and uses the canonical coordinate result only as the broader territory.
 */
export function buildSoulScopePreviewReport(
  scan: VoiceAnalysisResult,
  options: BuildSoulScopeReportOptions = {},
): SoulScopePreviewReport {
  const report = buildSoulScopeReport(scan, options);
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
      whatNeedsAttention: resonanceNarrative.worthNoticing,
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
