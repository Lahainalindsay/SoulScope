import type { SoulScopeReport } from "./buildSoulScopeReport";
import type { LongitudinalAnalysis } from "./longitudinalIntelligence";
import { selectLongitudinalMessage, type LongitudinalMessageKind } from "./patternKnowledge";

function messageKind(analysis: LongitudinalAnalysis): LongitudinalMessageKind {
  const recent = analysis.similarity.recent;
  if (!recent.available) return "firstObservation";
  if (recent.category === "Noticeably Different" || recent.category === "Significant Shift") return "noticeablyDifferent";
  if (analysis.observationStability.some((item) => item.stability === "consistent")) return "consistent";
  if (analysis.observationStability.some((item) => item.stability === "recurring")) return "recurring";
  return "emerging";
}

export function personalizeReportWithHistory(report: SoulScopeReport, analysis: LongitudinalAnalysis): SoulScopeReport {
  const kind = messageKind(analysis);
  const historySeed = analysis.baselines.recent.sourceScanIds.join(":") || report.primaryPattern.id;
  const longitudinalMessage = selectLongitudinalMessage(report.primaryPattern.id, kind, historySeed);
  const trendLine = analysis.trends.find((trend) => trend.direction !== "stable")?.summary ?? "";

  return {
    ...report,
    presentation: {
      ...report.presentation,
      longitudinalMessage,
    },
    storyCandidates: report.storyCandidates.map((candidate) => {
      const historyText = candidate.style === "Direct"
        ? trendLine
        : candidate.style === "Supportive"
        ? longitudinalMessage
        : [longitudinalMessage, trendLine].filter(Boolean).join(" ");
      return { ...candidate, summary: `${candidate.summary} ${historyText}`.trim() };
    }),
  };
}
