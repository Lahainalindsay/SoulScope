import type { SoulScopeReport } from "./buildSoulScopeReport";
import type { LongitudinalAnalysis, LongitudinalScanSnapshot } from "./longitudinalIntelligence";
import { buildPhaseCIntelligence } from "./phaseCInsightEngine";
import { buildTodaysStory } from "./todaysStoryEngine";

export function personalizeReportWithHistory(report: SoulScopeReport, analysis: LongitudinalAnalysis, history: LongitudinalScanSnapshot[] = []): SoulScopeReport {
  const phaseCIntelligence = buildPhaseCIntelligence(report.canonicalResult, analysis, [], history);
  const todaysStory = buildTodaysStory(report.canonicalResult, phaseCIntelligence);

  return {
    ...report,
    phaseCIntelligence,
    todaysStory,
    primaryPattern: {
      ...report.primaryPattern,
      name: todaysStory.title,
      theme: todaysStory.reflection,
      confidence: phaseCIntelligence.headlineInsight.confidence,
    },
    patternExpression: {
      ...report.patternExpression,
      title: todaysStory.title,
      summary: todaysStory.reflection,
    },
    presentation: {
      ...report.presentation,
      summary: todaysStory.reflection,
      explanation: [todaysStory.reflection, todaysStory.worthNoticing],
      observedBullets: [
        todaysStory.essence,
        todaysStory.worthNoticing,
        report.presentation.observedBullets[2] ?? "Confidence remains connected to the evidence available today.",
      ],
      dailyLife: [
        todaysStory.howThisMayShowUp[0] ?? todaysStory.essence,
        todaysStory.howThisMayShowUp[1] ?? todaysStory.worthNoticing,
        todaysStory.howThisMayShowUp[2] ?? todaysStory.gentleNextStep,
        todaysStory.howThisMayShowUp[3] ?? todaysStory.worthNoticing,
      ],
      reflectionQuestion: todaysStory.gentleNextStep,
      longitudinalMessage: todaysStory.worthNoticing,
    },
    storyCandidates: report.storyCandidates.map((candidate) => {
      const historyText = candidate.style === "Direct"
        ? todaysStory.essence
        : candidate.style === "Supportive"
        ? todaysStory.worthNoticing
        : todaysStory.gentleNextStep;
      return { ...candidate, summary: `${candidate.summary} ${historyText}`.trim() };
    }),
  };
}
