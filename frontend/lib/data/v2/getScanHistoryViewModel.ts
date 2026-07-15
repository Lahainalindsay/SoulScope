import type { SupabaseClient } from "@supabase/supabase-js";
import { listScanHistory } from "./scanRepository";
import { listPatternMatchesForScans } from "./patternRepository";
import { listReflectionVariantsForScans } from "./reflectionRepository";
import { listScanReflectionPreferences } from "./preferenceRepository";
import type { JsonObject, QualityLevel, ReflectionStyle, ScanStatus } from "./types";

export interface ScanHistoryItemViewModel {
  scanId: string;
  createdAt: string;
  status: ScanStatus;
  quality: QualityLevel;
  patternName: string;
  patternId: string;
  expressionTitle: string | null;
  conciseSummary: string;
  selectedStyle: ReflectionStyle | null;
  rawResult: JsonObject | null;
}

export interface ScanHistoryViewModel {
  items: ScanHistoryItemViewModel[];
}

export async function getScanHistoryViewModel(
  client: SupabaseClient,
  limit = 100,
): Promise<ScanHistoryViewModel> {
  const sessions = await listScanHistory(client, limit);
  const scanIds = sessions.map((session) => session.id);
  const [patterns, reflections, preferences] = await Promise.all([
    listPatternMatchesForScans(client, scanIds),
    listReflectionVariantsForScans(client, scanIds),
    listScanReflectionPreferences(client, scanIds),
  ]);

  const items = sessions.map((session) => {
    const primary = patterns.find((row) => row.scan_id === session.id && row.role === "primary");
    const preference = preferences.find((row) => row.scan_id === session.id);
    const selected = preference
      ? reflections.find((row) => row.scan_id === session.id && row.style === preference.selected_style)
      : reflections.find((row) => row.scan_id === session.id && row.style === "direct")
        ?? reflections.find((row) => row.scan_id === session.id);
    return {
      scanId: session.id,
      createdAt: session.created_at,
      status: session.status,
      quality: session.capture_quality,
      patternName: primary?.pattern_name ?? "Current Pattern",
      patternId: primary?.pattern_id ?? "unknown",
      expressionTitle: primary?.pattern_expression_title ?? null,
      conciseSummary: selected?.summary ?? primary?.explanation ?? "Open this scan to view your reflection.",
      selectedStyle: preference?.selected_style ?? selected?.style ?? null,
      rawResult: session.raw_result,
    };
  });
  return { items };
}
