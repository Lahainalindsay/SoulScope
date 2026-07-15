import type { SupabaseClient } from "@supabase/supabase-js";
import type { SoulScopeReport } from "./buildSoulScopeReport";
import type { ScanCompleteness } from "./partialScan";
import { persistSoulScopeV2Result } from "./data/v2/persistSoulScopeV2Result";
import {
  getUserNarrativePreference as getV2NarrativePreference,
  setScanReflectionPreference,
} from "./data/v2/preferenceRepository";
import { toReflectionStyle } from "./data/v2/mappers/mapReflectionVariants";

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
type SaveSelectionArgs = { scanId: string; userId: string; style: StoryStyle; title?: string; summary?: string };

/** @deprecated Prefer persistSoulScopeV2Result for new callers. */
export async function persistCanonicalReport(
  client: SupabaseClient,
  args: PersistReportArgs,
) {
  return persistSoulScopeV2Result({ client, ...args });
}

/** @deprecated Preserved while result components migrate to the V2 preference repository. */
export async function saveFavoriteStory(
  client: SupabaseClient,
  { scanId, style }: SaveSelectionArgs,
) {
  return setScanReflectionPreference(client, scanId, toReflectionStyle(style));
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
