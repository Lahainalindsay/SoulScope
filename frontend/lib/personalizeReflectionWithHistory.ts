import type { SoulScopeReport } from "./buildSoulScopeReport";
import type { LongitudinalAnalysis } from "./longitudinalIntelligence";
import { selectLongitudinalMessage, type LongitudinalMessageKind } from "./patternKnowledge";
import { buildPhaseCIntelligence } from "./phaseCInsightEngine";

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
  const phaseCIntelligence = buildPhaseCIntelligence(report.canonicalResult, analysis);
  const memoryLine = phaseCIntelligence.reflectionMemory[0] ?? "";

  return {
    ...report,
    phaseCIntelligence,
    primaryPattern: {
      ...report.primaryPattern,
      name: phaseCIntelligence.headlineInsight.title,
      theme: `${phaseCIntelligence.headlineInsight.explanation} ${report.canonicalNarrative.reflection}`.trim(),
      confidence: phaseCIntelligence.headlineInsight.confidence,
    },
    patternExpression: {
      ...report.patternExpression,
      title: phaseCIntelligence.headlineInsight.title,
      summary: `${phaseCIntelligence.headlineInsight.explanation} ${report.canonicalNarrative.reflection}`.trim(),
    },
    presentation: {
      ...report.presentation,
      longitudinalMessage,
    },
    storyCandidates: report.storyCandidates.map((candidate) => {
      const historyText = candidate.style === "Direct"
        ? phaseCIntelligence.headlineInsight.explanation
        : candidate.style === "Supportive"
        ? [longitudinalMessage, memoryLine].filter(Boolean).join(" ")
        : [phaseCIntelligence.headlineInsight.explanation, longitudinalMessage, trendLine].filter(Boolean).join(" ");
      return { ...candidate, summary: `${candidate.summary} ${historyText}`.trim() };
    }),
  };
}
