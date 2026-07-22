import type { PatternMatchInsert, PatternRole } from "../types";
import { stableUuid } from "../stableId";
import { toJsonObject, toJsonValue } from "../json";
import type { V2MappingContext } from "./context";

function confidenceLevel(score: number): PatternMatchInsert["confidence"] {
  if (score >= 0.72) return "high";
  if (score >= 0.48) return "moderate";
  return "exploratory";
}

export function mapPatternMatches(context: V2MappingContext): PatternMatchInsert[] {
  const matches: Array<{ role: PatternRole; pattern: V2MappingContext["report"]["primaryPattern"] }> = [
    { role: "primary", pattern: context.report.primaryPattern },
  ];
  if (context.report.supportingPattern) matches.push({ role: "supporting", pattern: context.report.supportingPattern });
  if (context.report.emergingPattern) matches.push({ role: "emerging", pattern: context.report.emergingPattern });
  const canonical = context.report.canonicalPattern;

  return matches.map(({ role, pattern }) => {
    const isPrimary = role === "primary";
    const confidence = isPrimary ? canonical.confidence : pattern.confidence;
    return {
      id: stableUuid(context.scanId, "pattern", role),
      scan_id: context.scanId,
      user_id: context.userId,
      role,
      pattern_id: pattern.id,
      pattern_name: isPrimary ? canonical.canonicalDisplayName : pattern.name,
      pattern_theme: isPrimary ? canonical.summary : pattern.theme ?? null,
      explanation: isPrimary ? canonical.explanation[0] : pattern.explanation,
      confidence: confidenceLevel(confidence),
      confidence_score: confidence,
      pattern_expression_id: isPrimary ? canonical.canonicalPatternSignature : null,
      pattern_expression_title: isPrimary ? canonical.canonicalDisplayName : null,
      pattern_expression_summary: isPrimary ? canonical.summary : null,
      modifiers: isPrimary ? context.report.modifiers.map(toJsonValue) : [],
      evidence_provenance: isPrimary
        ? [
            ...context.report.patternExpression.matchedSignals.map(toJsonValue),
            toJsonValue({ canonicalDecision: canonical.decisionLedger.selected }),
          ]
        : [],
      baseline_comparison: isPrimary ? toJsonObject(context.report.baselineComparison) : null,
    };
  });
}
