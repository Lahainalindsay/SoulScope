import type { SupabaseClient } from "@supabase/supabase-js";
import { listDomainHistory } from "./domainRepository";
import { upsertPersonalBaselines } from "./baselineRepository";
import { stableUuid } from "./stableId";
import type { ConfidenceLevel, PersonalBaselineRow } from "./types";

const BASELINE_VERSION = "1.0.0";
const DOMAIN_IDS = [
  "energy_vitality",
  "recovery_restoration",
  "focus_mental_demand",
  "expression_communication",
  "emotional_flexibility",
  "regulation_stability",
  "adaptability_direction",
] as const;

function confidenceFor(scansUsed: number): ConfidenceLevel {
  if (scansUsed >= 5) return "high";
  if (scansUsed >= 3) return "moderate";
  return "exploratory";
}

export async function refreshPersonalBaselines(client: SupabaseClient, userId: string): Promise<PersonalBaselineRow[]> {
  const rows = await Promise.all(DOMAIN_IDS.map(async (domainId) => {
    const history = await listDomainHistory(client, domainId, 5);
    if (history.length < 2) return null;
    const baselineScore = history.reduce((sum, row) => sum + row.score, 0) / history.length;
    return {
      id: stableUuid(userId, "baseline", domainId, BASELINE_VERSION),
      user_id: userId,
      domain_id: domainId,
      calculation_version: BASELINE_VERSION,
      baseline_score: Number(baselineScore.toFixed(3)),
      scans_used: history.length,
      source_scan_ids: history.map((row) => row.scan_id),
      confidence: confidenceFor(history.length),
      summary: null,
      metadata: { eligibility: "completed or good-quality partial scans only" },
      calculated_at: new Date().toISOString(),
    };
  }));
  return upsertPersonalBaselines(client, rows.filter((row): row is NonNullable<typeof row> => Boolean(row)));
}
