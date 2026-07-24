import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAuthenticatedUser, throwIfError } from "./client";
import type { ScanInterpretationDiagnosticRow } from "./types";

const MATRIX_DIAGNOSTIC_COLUMNS = [
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
  "organizing_quality",
  "result_type",
  "naming_matrix_version",
  "confidence",
  "confidence_margin",
  "state_vector",
  "evidence_ledger",
  "dimension_ledger",
  "decision_ledger",
  "baseline",
  "interpretation_limits",
  "reflection_source",
  "subpattern_scores",
  "engine_version",
  "created_at",
  "updated_at",
].join(",");

const CANONICAL_DIAGNOSTIC_COLUMNS = [
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

const LEGACY_DIAGNOSTIC_COLUMNS = [
  "scan_id",
  "user_id",
  "subject_id",
  "pattern_signature",
  "display_name",
  "family",
  "confidence",
  "state_vector",
  "evidence_ledger",
  "dimension_ledger",
  "decision_ledger",
  "baseline",
  "interpretation_limits",
  "engine_version",
  "created_at",
  "updated_at",
].join(",");

export function isDiagnosticsSchemaDriftError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: string; message?: string };
  return (
    candidate.code === "PGRST204" ||
    candidate.code === "42703" ||
    /schema cache.*column|column.*schema cache|column .* does not exist/i.test(candidate.message ?? "")
  );
}

export async function listInterpretationDiagnosticsForScans(
  client: SupabaseClient,
  scanIds: string[],
): Promise<ScanInterpretationDiagnosticRow[]> {
  if (!scanIds.length) return [];
  const user = await requireAuthenticatedUser(client);
  let lastSchemaError: unknown = null;
  for (const columns of [MATRIX_DIAGNOSTIC_COLUMNS, CANONICAL_DIAGNOSTIC_COLUMNS, LEGACY_DIAGNOSTIC_COLUMNS]) {
    const { data, error } = await client
      .from("scan_interpretation_diagnostics")
      .select(columns)
      .eq("user_id", user.id)
      .in("scan_id", scanIds);
    if (!error) return (data ?? []) as unknown as ScanInterpretationDiagnosticRow[];
    if (!isDiagnosticsSchemaDriftError(error)) throwIfError(error, "Could not load scan interpretation diagnostics");
    lastSchemaError = error;
  }
  console.warn("Scan interpretation diagnostics were not loaded because the deployed database schema is behind the application.", lastSchemaError);
  return [];
}

export async function listInterpretationDiagnosticsForScan(
  client: SupabaseClient,
  scanId: string,
): Promise<ScanInterpretationDiagnosticRow[]> {
  return listInterpretationDiagnosticsForScans(client, [scanId]);
}
