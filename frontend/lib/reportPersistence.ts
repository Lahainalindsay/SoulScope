import type { SupabaseClient } from "@supabase/supabase-js";
import type { SoulScopeReport } from "./buildSoulScopeReport";

export type StoryStyle = SoulScopeReport["storyCandidates"][number]["style"];

export type UserNarrativePreferenceRow = {
  user_id: string;
  direct_count: number;
  supportive_count: number;
  insight_count: number;
  preferred_style: StoryStyle | null;
  total_selections: number;
  last_selected_style: StoryStyle | null;
  created_at: string;
  updated_at: string;
};

type PersistReportArgs = { scanId: string; userId: string; report: SoulScopeReport };
type SaveSelectionArgs = { scanId: string; userId: string; style: StoryStyle; title: string; summary: string };

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
  { scanId, userId, report }: PersistReportArgs,
) {
  const patterns = [
    {
      role: "primary",
      ...patternPayload(report.primaryPattern),
      pattern_expression_id: report.patternExpression.id,
      pattern_expression_title: report.patternExpression.title,
      pattern_expression_summary: report.patternExpression.summary,
      modifiers: report.modifiers,
      expression_evidence: report.patternExpression.matchedSignals,
      baseline_comparison: report.baselineComparison,
    },
    report.supportingPattern ? { role: "supporting", ...patternPayload(report.supportingPattern) } : null,
    report.emergingPattern ? { role: "emerging", ...patternPayload(report.emergingPattern) } : null,
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

  const [patternResponse, variantResponse, pipelineResponse] = await Promise.all([
    client.from("scan_pattern_matches").upsert(
      patterns.map((pattern) => ({ scan_id: scanId, user_id: userId, ...pattern })),
      { onConflict: "scan_id,role" },
    ),
    client.from("scan_story_variants").upsert(variants, { onConflict: "scan_id,style" }),
    report.observationPipeline
      ? client.from("scans").update({
          observation_engine_version: report.observationPipeline.engineVersion,
          observation_pipeline: report.observationPipeline,
          observation_pipeline_created_at: report.observationPipeline.generatedAt,
        }).eq("id", scanId).eq("user_id", userId)
      : Promise.resolve({ error: null }),
  ]);

  if (patternResponse.error) throw patternResponse.error;
  if (variantResponse.error) throw variantResponse.error;
  if (pipelineResponse.error) throw pipelineResponse.error;
}

export async function saveFavoriteStory(
  client: SupabaseClient,
  { scanId, userId, style, title, summary }: SaveSelectionArgs,
) {
  const response = await client.rpc("set_scan_story_preference", {
    p_scan_id: scanId,
    p_user_id: userId,
    p_selected_style: style,
    p_selected_title: title,
    p_selected_summary: summary,
  });
  if (response.error) throw response.error;
}

export async function getUserNarrativePreference(
  client: SupabaseClient,
  userId: string,
): Promise<UserNarrativePreferenceRow | null> {
  const response = await client
    .from("user_narrative_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle<UserNarrativePreferenceRow>();
  if (response.error) throw response.error;
  return response.data ?? null;
}
