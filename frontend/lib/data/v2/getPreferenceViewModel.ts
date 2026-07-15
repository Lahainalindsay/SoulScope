import type { SupabaseClient } from "@supabase/supabase-js";
import { getScanReflectionPreference, getUserNarrativePreference } from "./preferenceRepository";
import type { ReflectionStyle } from "./types";

export interface PreferenceViewModel {
  selectedStyle: ReflectionStyle | null;
  preferredStyle: ReflectionStyle | null;
  established: boolean;
  totalSelections: number;
  counts: Record<ReflectionStyle, number>;
}

export async function getPreferenceViewModel(client: SupabaseClient, scanId: string): Promise<PreferenceViewModel> {
  const [scanPreference, aggregate] = await Promise.all([
    getScanReflectionPreference(client, scanId),
    getUserNarrativePreference(client),
  ]);
  return {
    selectedStyle: scanPreference?.selected_style ?? null,
    preferredStyle: aggregate?.preferred_style ?? null,
    established: Boolean(aggregate?.preferred_style && (aggregate.total_selections ?? 0) >= 3),
    totalSelections: aggregate?.total_selections ?? 0,
    counts: {
      direct: aggregate?.direct_count ?? 0,
      supportive: aggregate?.supportive_count ?? 0,
      insight: aggregate?.insight_count ?? 0,
    },
  };
}
