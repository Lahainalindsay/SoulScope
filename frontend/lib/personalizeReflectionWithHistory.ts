import type { SoulScopeReport } from "./buildSoulScopeReport";
import type { LongitudinalAnalysis } from "./longitudinalIntelligence";

function stabilityLine(analysis: LongitudinalAnalysis): string {
  const consistent = analysis.observationStability.find((item) => item.stability === "consistent");
  if (consistent) return "This observation has appeared consistently across your recent eligible scans.";
  const recurring = analysis.observationStability.find((item) => item.stability === "recurring");
  if (recurring) return "A similar observation has recurred in your recent scan history.";
  const emerging = analysis.observationStability.find((item) => item.stability === "emerging");
  return emerging ? "This observation is emerging rather than established in your personal history." : "";
}

export function personalizeReportWithHistory(report: SoulScopeReport, analysis: LongitudinalAnalysis): SoulScopeReport {
  const recentSimilarity = analysis.similarity.recent;
  const similarityLine = recentSimilarity.available
    ? recentSimilarity.category === "Very Similar"
      ? "Current observations remain similar to your recent baseline."
      : recentSimilarity.category === "Moderately Different"
      ? "Today's scan is moderately different from your recent baseline."
      : recentSimilarity.category === "Noticeably Different"
      ? "Today's scan differs noticeably from your recent baseline."
      : "Today's scan shows a significant shift from your recent baseline."
    : "There is not yet enough eligible history to compare this scan with a personal baseline.";
  const trendLine = analysis.trends.find((trend) => trend.direction !== "stable")?.summary ?? analysis.trends[0]?.summary ?? "";
  const recurringLine = stabilityLine(analysis);
  const evolutionLine = analysis.patternEvolution.available ? analysis.patternEvolution.summary : "";

  return {
    ...report,
    storyCandidates: report.storyCandidates.map((candidate) => {
      const historyText = candidate.style === "Direct"
        ? [similarityLine, trendLine].filter(Boolean).join(" ")
        : candidate.style === "Supportive"
        ? [recurringLine, similarityLine].filter(Boolean).join(" ")
        : [evolutionLine, trendLine, recurringLine].filter(Boolean).join(" ");
      return { ...candidate, summary: `${candidate.summary} ${historyText}`.trim() };
    }),
  };
}
