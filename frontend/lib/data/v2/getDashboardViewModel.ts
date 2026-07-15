import type { SupabaseClient } from "@supabase/supabase-js";
import { getScanHistoryViewModel, type ScanHistoryItemViewModel } from "./getScanHistoryViewModel";
import { listPatternMatchesForScan } from "./patternRepository";
import type { JsonObject } from "./types";

export interface DashboardViewModel {
  latestScanId: string | null;
  latestPattern: string | null;
  patternExpression: string | null;
  conciseReflection: string | null;
  resonanceMapSource: JsonObject | null;
  baselineChanges: string[];
  recentScans: ScanHistoryItemViewModel[];
}

function extractBaselineChanges(value: JsonObject | null): string[] {
  if (!value) return [];
  const changes = value.changes;
  if (!Array.isArray(changes)) return [];
  return changes
    .map((item) => item && typeof item === "object" && !Array.isArray(item) ? item.userFacingSummary : null)
    .filter((item): item is string => typeof item === "string")
    .slice(0, 2);
}

export async function getDashboardViewModel(client: SupabaseClient): Promise<DashboardViewModel> {
  const history = await getScanHistoryViewModel(client, 3);
  const latest = history.items[0] ?? null;
  const primary = latest ? (await listPatternMatchesForScan(client, latest.scanId)).find((row) => row.role === "primary") ?? null : null;
  return {
    latestScanId: latest?.scanId ?? null,
    latestPattern: latest?.patternName ?? null,
    patternExpression: latest?.expressionTitle ?? null,
    conciseReflection: latest?.conciseSummary ?? null,
    resonanceMapSource: latest?.rawResult ?? null,
    baselineChanges: extractBaselineChanges(primary?.baseline_comparison ?? null),
    recentScans: history.items.slice(0, 3),
  };
}
