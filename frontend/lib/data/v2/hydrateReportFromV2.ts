import type { SoulScopeReport } from "../../buildSoulScopeReport";
import type { UserResultDomain, UserResultDomainName, UserResultFunctionalState } from "../../systemDimensions";
import type { DomainResultRow, PatternMatchRow, ReflectionVariantRow } from "./types";

const DOMAIN_NAMES: Record<string, UserResultDomainName> = {
  energy_vitality: "Energy & Vitality",
  recovery_restoration: "Recovery & Restoration",
  focus_mental_demand: "Focus & Mental Load",
  expression_communication: "Communication & Clarity",
  emotional_flexibility: "Emotional Expression",
  regulation_stability: "Regulation",
  adaptability_direction: "Direction & Adaptability",
};

function functionalState(domain: DomainResultRow): UserResultFunctionalState {
  if (domain.state === "working_hard") return "Working Hard";
  if (domain.state === "asking_for_support") return "Asking for Support";
  if (domain.state === "available") return "Readily Available";
  return "Recovering";
}

function hydrateDomains(rows: DomainResultRow[], fallback: UserResultDomain[]): UserResultDomain[] {
  if (!rows.length) return fallback;
  return rows.flatMap((row) => {
    const title = DOMAIN_NAMES[row.domain_id];
    if (!title) return [];
    return [{
      title,
      score: row.score,
      activityLevel: row.score >= 62 ? "High" : row.score <= 38 ? "Low" : "Moderate",
      functionalState: functionalState(row),
      currentPattern: row.user_facing_summary,
      thisCouldExpressAs: [row.user_facing_summary],
      itCanAlsoShowUpAs: [],
      supportiveReframe: row.orientation === "demand" ? "Demand can shift from scan to scan." : "Availability can shift from scan to scan.",
      signalSources: row.contributing_observation_ids,
    }];
  });
}

function hydratePattern(
  role: PatternMatchRow["role"],
  rows: PatternMatchRow[],
  report: SoulScopeReport,
): SoulScopeReport["primaryPattern"] | undefined {
  const row = rows.find((item) => item.role === role);
  if (!row) return role === "primary" ? report.primaryPattern : role === "supporting" ? report.supportingPattern : report.emergingPattern;
  const candidates = [report.primaryPattern, report.supportingPattern, report.emergingPattern].filter(Boolean) as SoulScopeReport["primaryPattern"][];
  const base = candidates.find((item) => item.id === row.pattern_id) ?? report.primaryPattern;
  return {
    ...base,
    id: row.pattern_id as typeof base.id,
    name: row.pattern_name,
    theme: row.pattern_theme ?? base.theme,
    explanation: row.explanation,
    confidence: row.confidence_score ?? base.confidence,
  };
}

function getStringArray(content: ReflectionVariantRow["content"], key: string): string[] {
  const value = content[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function hydrateStories(rows: ReflectionVariantRow[], report: SoulScopeReport): SoulScopeReport["storyCandidates"] {
  if (!rows.length) return report.storyCandidates;
  return rows.map((row) => {
    const style = row.style === "direct" ? "Direct" : row.style === "supportive" ? "Supportive" : "Insight";
    const fallback = report.storyCandidates.find((item) => item.style === style) ?? report.storyCandidates[0];
    const strongestResources = getStringArray(row.content, "strongestResources");
    const areasWorkingHard = getStringArray(row.content, "areasWorkingHard");
    const areasAskingForSupport = getStringArray(row.content, "areasAskingForSupport");
    return {
      style,
      title: row.title,
      summary: row.summary,
      strongestResources: strongestResources.length ? strongestResources : fallback.strongestResources,
      areasWorkingHard: areasWorkingHard.length ? areasWorkingHard : fallback.areasWorkingHard,
      areasAskingForSupport: areasAskingForSupport.length ? areasAskingForSupport : fallback.areasAskingForSupport,
    };
  });
}

export function hydrateReportFromV2(
  report: SoulScopeReport,
  rows: { domains: DomainResultRow[]; patterns: PatternMatchRow[]; reflections: ReflectionVariantRow[] },
): SoulScopeReport {
  const primaryPattern = hydratePattern("primary", rows.patterns, report) ?? report.primaryPattern;
  const supportingPattern = hydratePattern("supporting", rows.patterns, report);
  const emergingPattern = hydratePattern("emerging", rows.patterns, report);
  const primaryRow = rows.patterns.find((item) => item.role === "primary");
  return {
    ...report,
    primaryPattern,
    supportingPattern,
    emergingPattern,
    domainResults: hydrateDomains(rows.domains, report.domainResults),
    storyCandidates: hydrateStories(rows.reflections, report),
    patternExpression: primaryRow?.pattern_expression_id ? {
      id: primaryRow.pattern_expression_id,
      title: primaryRow.pattern_expression_title ?? report.patternExpression.title,
      summary: primaryRow.pattern_expression_summary ?? report.patternExpression.summary,
      matchedSignals: primaryRow.evidence_provenance.filter((item): item is string => typeof item === "string"),
    } : report.patternExpression,
  };
}
