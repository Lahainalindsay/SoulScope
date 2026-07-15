import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAuthenticatedUser, throwIfError } from "./client";
import type { ObservationResultInsert, ObservationResultRow } from "./types";

export async function insertObservations(client: SupabaseClient, rows: ObservationResultInsert[]): Promise<ObservationResultRow[]> {
  if (!rows.length) return [];
  const user = await requireAuthenticatedUser(client, rows[0].user_id);
  if (rows.some((row) => row.user_id !== user.id)) throw new Error("Not authorized.");
  const { data, error } = await client.from("observation_results").upsert(rows, { onConflict: "scan_id,observation_id,rule_version" }).select("*");
  throwIfError(error, "Could not save observations");
  return (data ?? []) as ObservationResultRow[];
}

export async function listObservationsForScan(client: SupabaseClient, scanId: string): Promise<ObservationResultRow[]> {
  const user = await requireAuthenticatedUser(client);
  const { data, error } = await client.from("observation_results").select("*").eq("scan_id", scanId).eq("user_id", user.id).order("created_at");
  throwIfError(error, "Could not load observations");
  return (data ?? []) as ObservationResultRow[];
}
