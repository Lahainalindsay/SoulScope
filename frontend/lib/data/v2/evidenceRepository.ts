import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAuthenticatedUser, throwIfError } from "./client";
import type { EvidenceSignalResultInsert, EvidenceSignalResultRow } from "./types";

export async function insertEvidenceSignals(client: SupabaseClient, rows: EvidenceSignalResultInsert[]): Promise<EvidenceSignalResultRow[]> {
  if (!rows.length) return [];
  const user = await requireAuthenticatedUser(client, rows[0].user_id);
  if (rows.some((row) => row.user_id !== user.id)) throw new Error("Not authorized.");
  const { data, error } = await client.from("evidence_signal_results").upsert(rows, { onConflict: "scan_id,evidence_id,rule_version" }).select("*");
  throwIfError(error, "Could not save evidence signals");
  return (data ?? []) as EvidenceSignalResultRow[];
}

export async function listEvidenceForScan(client: SupabaseClient, scanId: string): Promise<EvidenceSignalResultRow[]> {
  const user = await requireAuthenticatedUser(client);
  const { data, error } = await client.from("evidence_signal_results").select("*").eq("scan_id", scanId).eq("user_id", user.id).order("created_at");
  throwIfError(error, "Could not load evidence signals");
  return (data ?? []) as EvidenceSignalResultRow[];
}
