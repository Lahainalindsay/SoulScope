import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAuthenticatedUser, throwIfError } from "./client";
import type { RawFeatureMeasurementInsert, RawFeatureMeasurementRow } from "./types";

export async function insertRawFeatureMeasurements(client: SupabaseClient, rows: RawFeatureMeasurementInsert[]): Promise<RawFeatureMeasurementRow[]> {
  if (!rows.length) return [];
  const user = await requireAuthenticatedUser(client, rows[0].user_id);
  if (rows.some((row) => row.user_id !== user.id)) throw new Error("Not authorized.");
  const { data, error } = await client.from("raw_feature_measurements").upsert(rows, { onConflict: "id" }).select("*");
  throwIfError(error, "Could not save raw features");
  return (data ?? []) as RawFeatureMeasurementRow[];
}

export async function listFeaturesForScan(client: SupabaseClient, scanId: string): Promise<RawFeatureMeasurementRow[]> {
  const user = await requireAuthenticatedUser(client);
  const { data, error } = await client.from("raw_feature_measurements").select("*").eq("scan_id", scanId).eq("user_id", user.id).order("created_at");
  throwIfError(error, "Could not load raw features");
  return (data ?? []) as RawFeatureMeasurementRow[];
}
