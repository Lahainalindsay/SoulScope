import type { SupabaseClient } from "@supabase/supabase-js";
import type { SoulScopeReport } from "./buildSoulScopeReport";
import type { ScanCompleteness } from "./partialScan";
import { persistSoulScopeV2Result } from "./data/v2/persistSoulScopeV2Result";
import { getUserNarrativePreference as getV2NarrativePreference } from "./data/v2/preferenceRepository";

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

type PersistReportArgs = {
  scanId: string;
  userId: string;
  report: SoulScopeReport;
  completeness: ScanCompleteness;
  rawResult: unknown;
  startedAt?: string | null;
};

/** @deprecated Prefer persistSoulScopeV2Result for new callers. */
export async function persistCanonicalReport(
  client: SupabaseClient,
  args: PersistReportArgs,
) {
  return persistSoulScopeV2Result({ client, ...args });
}

function displayStyle(style: string | null): StoryStyle | null {
  if (style === "direct") return "Direct";
  if (style === "supportive") return "Supportive";
  if (style === "insight") return "Insight";
  return null;
}

/** @deprecated Prefer getPreferenceViewModel for new callers. */
export async function getUserNarrativePreference(
  client: SupabaseClient,
  _userId?: string,
): Promise<UserNarrativePreferenceRow | null> {
  const row = await getV2NarrativePreference(client);
  return row ? {
    ...row,
    preferred_style: displayStyle(row.preferred_style),
    last_selected_style: displayStyle(row.last_selected_style),
  } : null;
}
