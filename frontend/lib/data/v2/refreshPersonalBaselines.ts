import type { SupabaseClient } from "@supabase/supabase-js";
import { buildRollingBaselines, type BaselineWindowId } from "../../longitudinalIntelligence";
import { upsertPersonalBaselines } from "./baselineRepository";
import { listLongitudinalSnapshots } from "./longitudinalRepository";
import { stableUuid } from "./stableId";
import type { ConfidenceLevel, JsonObject, PersonalBaselineRow } from "./types";

const BASELINE_VERSION = "2.0.0";
const WINDOWS: BaselineWindowId[] = ["recent", "intermediate", "long_term"];

function confidenceFor(scansUsed: number): ConfidenceLevel {
  if (scansUsed >= 15) return "high";
  if (scansUsed >= 5) return "moderate";
  return "exploratory";
}

export async function refreshPersonalBaselines(client: SupabaseClient, userId: string): Promise<PersonalBaselineRow[]> {
  const history = await listLongitudinalSnapshots(client, { limit: 500 });
  const windows = buildRollingBaselines(history);
  const rows = WINDOWS.flatMap((windowId) => {
    const baseline = windows[windowId];
    if (!baseline.available) return [];
    return Object.entries(baseline.domainAverages).map(([domainId, baselineScore]) => ({
      id: stableUuid(userId, "baseline", windowId, domainId, BASELINE_VERSION),
      user_id: userId,
      domain_id: domainId,
      calculation_version: `${BASELINE_VERSION}:${windowId}`,
      baseline_score: Number(baselineScore.toFixed(3)),
      scans_used: baseline.scansUsed,
      source_scan_ids: baseline.sourceScanIds,
      confidence: confidenceFor(baseline.scansUsed),
      summary: null,
      metadata: {
        window: windowId,
        eligibility: "completed and good-quality partial scans only",
        evidence_averages: baseline.evidenceAverages,
        observation_frequency: baseline.observationFrequency,
        pattern_frequency: baseline.patternFrequency,
        confidence_trend: baseline.confidenceTrend,
        signal_distribution: baseline.signalDistribution,
        resonance_distribution: baseline.resonanceDistribution,
      } as JsonObject,
      calculated_at: new Date().toISOString(),
    }));
  });
  return upsertPersonalBaselines(client, rows);
}
