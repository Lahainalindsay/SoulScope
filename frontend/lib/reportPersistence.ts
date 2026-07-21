import type { SupabaseClient } from "@supabase/supabase-js";
import type { SoulScopeReport } from "./buildSoulScopeReport";
import type { ScanCompleteness } from "./partialScan";
import { persistSoulScopeV2Result } from "./data/v2/persistSoulScopeV2Result";
import { getUserNarrativePreference as getV2NarrativePreference } from "./data/v2/preferenceRepository";
import { linkCheckInToScan } from "./data/v2/checkInRepository";

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
  const result = await persistSoulScopeV2Result({ client, ...args });
  try {
    const diagnosticsResponse = await client.from("scan_interpretation_diagnostics").upsert(
      {
        scan_id: args.scanId,
        user_id: args.userId,
        subject_id: args.report.dynamicPattern.baseline.subjectId,
        pattern_signature: args.report.dynamicPattern.patternSignature,
        display_name: args.report.dynamicPattern.displayName,
        family: args.report.dynamicPattern.family,
        confidence: args.report.dynamicPattern.confidence,
        state_vector: args.report.dynamicPattern.stateVector,
        evidence_ledger: args.report.dynamicPattern.evidenceLedger,
        dimension_ledger: args.report.dynamicPattern.dimensions,
        decision_ledger: args.report.dynamicPattern.decisionLedger,
        baseline: args.report.dynamicPattern.baseline,
        interpretation_limits: args.report.dynamicPattern.interpretationLimits,
      },
      { onConflict: "scan_id" },
    );
    if (diagnosticsResponse.error) throw diagnosticsResponse.error;
  } catch (error) {
    console.warn("Scan interpretation diagnostics were not persisted.", error);
  }
  try {
    await linkCheckInToScan(client, args.scanId);
  } catch (error) {
    // Check-in context is optional and must never block or alter scan persistence.
    console.warn("Could not link today's optional check-in to this scan", error);
  }
  return result;
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
