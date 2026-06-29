import type { SupabaseClient } from "@supabase/supabase-js";
import type { SoulScopeReport } from "./buildSoulScopeReport";

type StoryStyle = SoulScopeReport["storyCandidates"][number]["style"];

type PersistReportArgs = {
  scanId: string;
  userId: string;
  report: SoulScopeReport;
};

type SaveSelectionArgs = {
  scanId: string;
  userId: string;
  style: StoryStyle;
  title: string;
  summary: string;
  primaryPatternSelected: string;
  selectedAt?: string;
};

function patternPayload(pattern: SoulScopeReport["primaryPattern"]) {
  return {
    pattern_id: pattern.id,
    pattern_name: pattern.name,
    pattern_theme: pattern.theme,
    explanation: pattern.explanation,
    what_this_may_feel_like: pattern.whatThisMayFeelLike,
    supportive_factors: pattern.supportiveFactors,
    what_is_working_hardest: pattern.whatIsWorkingHardest,
    what_needs_attention: pattern.whatNeedsAttention,
    confidence: pattern.confidence,
  };
}

export async function persistCanonicalReport(
  client: SupabaseClient,
  { scanId, userId, report }: PersistReportArgs
) {
  const patterns = [
    {
      role: "primary",
      ...patternPayload(report.primaryPattern),
    },
    report.supportingPattern
      ? {
          role: "supporting",
          ...patternPayload(report.supportingPattern),
        }
      : null,
    report.emergingPattern
      ? {
          role: "emerging",
          ...patternPayload(report.emergingPattern),
        }
      : null,
  ].filter(Boolean) as Array<Record<string, unknown>>;

  const variants = report.storyCandidates.map((variant) => ({
    scan_id: scanId,
    user_id: userId,
    style: variant.style,
    title: variant.title,
    summary: variant.summary,
    strongest_resources: variant.strongestResources,
    areas_working_hard: variant.areasWorkingHard,
    areas_asking_for_support: variant.areasAskingForSupport,
  }));

  const [patternResponse, variantResponse] = await Promise.all([
    client.from("scan_pattern_matches").upsert(
      patterns.map((pattern) => ({
        scan_id: scanId,
        user_id: userId,
        ...pattern,
      })),
      { onConflict: "scan_id,role" }
    ),
    client.from("scan_story_variants").upsert(variants, { onConflict: "scan_id,style" }),
  ]);

  if (patternResponse.error) {
    throw patternResponse.error;
  }
  if (variantResponse.error) {
    throw variantResponse.error;
  }
}

export async function saveFavoriteStory(
  client: SupabaseClient,
  { scanId, userId, style, title, summary, primaryPatternSelected, selectedAt }: SaveSelectionArgs
) {
  const response = await client.from("scan_story_preferences").upsert(
    {
      scan_id: scanId,
      user_id: userId,
      selected_style: style,
      selected_title: title,
      selected_summary: summary,
      selected_primary_pattern: primaryPatternSelected,
      selected_at: selectedAt ?? new Date().toISOString(),
    },
    { onConflict: "scan_id" }
  );

  if (response.error) {
    throw response.error;
  }
}
