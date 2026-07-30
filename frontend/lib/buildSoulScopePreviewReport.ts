import {
  buildSoulScopeReport,
  type BuildSoulScopeReportOptions,
  type SoulScopeReport,
} from "./buildSoulScopeReport";
import { type ResonanceNarrative } from "./resonanceNarrativeEngineV3";
import type { VoiceAnalysisResult } from "./voiceSpectrum";

export type SoulScopePreviewReport = SoulScopeReport & {
  resonanceNarrative: ResonanceNarrative;
};

export function applyResonanceNarrative(report: SoulScopeReport): SoulScopePreviewReport {
  const resonanceNarrative = report.canonicalResult.narrative;
  const canonicalNarrative = report.canonicalNarrative;
  const phaseC = report.phaseCIntelligence;

  return {
    ...report,
    resonanceNarrative,
    primaryPattern: {
      ...report.primaryPattern,
      name: phaseC.headlineInsight.title,
      theme: `${phaseC.headlineInsight.explanation} ${canonicalNarrative.reflection}`.trim(),
      explanation: canonicalNarrative.uncertaintyNote ?? canonicalNarrative.worthNoticing,
      whatThisMayFeelLike: report.presentation.dailyLife,
      supportiveFactors: [
        canonicalNarrative.howThisMayShowUp,
        canonicalNarrative.worthNoticing,
        canonicalNarrative.gentleNextStep,
      ],
      whatIsWorkingHardest: resonanceNarrative.components
        .filter((component) => component.orientation === "resource")
        .slice(0, 3)
        .map((component) => `${component.domain}: ${component.band}`),
      whatNeedsAttention: canonicalNarrative.gentleNextStep,
      confidence: phaseC.headlineInsight.confidence,
    },
    storyCandidates: report.storyCandidates.map((candidate, index) => ({
      ...candidate,
      title: index === 0 ? "Your resonance today" : candidate.title,
      summary: index === 0
        ? `${phaseC.headlineInsight.explanation} ${canonicalNarrative.reflection}`.trim()
        : index === 1
        ? canonicalNarrative.howThisMayShowUp
        : canonicalNarrative.worthNoticing,
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
