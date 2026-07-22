import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAuthenticatedUser, throwIfError } from "./client";
import type { ScanInterpretationDiagnosticRow } from "./types";

const DIAGNOSTIC_COLUMNS = [
  "scan_id",
  "user_id",
  "subject_id",
  "pattern_signature",
  "display_name",
  "family",
  "canonical_pattern_signature",
  "canonical_display_name",
  "canonical_family",
  "primary_family",
  "secondary_family",
  "confidence",
  "confidence_margin",
  "state_vector",
  "evidence_ledger",
  "dimension_ledger",
  "decision_ledger",
  "baseline",
  "interpretation_limits",
  "reflection_source",
  "engine_version",
  "created_at",
  "updated_at",
].join(",");

export async function listInterpretationDiagnosticsForScans(
  client: SupabaseClient,
  scanIds: string[],
): Promise<ScanInterpretationDiagnosticRow[]> {
  if (!scanIds.length) return [];
  const user = await requireAuthenticatedUser(client);
  const { data, error } = await client
    .from("scan_interpretation_diagnostics")
    .select(DIAGNOSTIC_COLUMNS)
    .eq("user_id", user.id)
    .in("scan_id", scanIds);
  throwIfError(error, "Could not load scan interpretation diagnostics");
  return (data ?? []) as unknown as ScanInterpretationDiagnosticRow[];
}

export async function listInterpretationDiagnosticsForScan(
  client: SupabaseClient,
  scanId: string,
): Promise<ScanInterpretationDiagnosticRow[]> {
  return listInterpretationDiagnosticsForScans(client, [scanId]);
}
