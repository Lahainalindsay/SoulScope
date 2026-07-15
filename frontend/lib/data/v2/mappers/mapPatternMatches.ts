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

  return matches.map(({ role, pattern }) => ({
    id: stableUuid(context.scanId, "pattern", role),
    scan_id: context.scanId,
    user_id: context.userId,
    role,
    pattern_id: pattern.id,
    pattern_name: pattern.name,
    pattern_theme: pattern.theme ?? null,
    explanation: pattern.explanation,
    confidence: confidenceLevel(pattern.confidence),
    confidence_score: pattern.confidence,
    pattern_expression_id: role === "primary" ? context.report.patternExpression.id : null,
    pattern_expression_title: role === "primary" ? context.report.patternExpression.title : null,
    pattern_expression_summary: role === "primary" ? context.report.patternExpression.summary : null,
    modifiers: role === "primary" ? context.report.modifiers.map(toJsonValue) : [],
    evidence_provenance: role === "primary" ? context.report.patternExpression.matchedSignals.map(toJsonValue) : [],
    baseline_comparison: role === "primary" ? toJsonObject(context.report.baselineComparison) : null,
  }));
}
