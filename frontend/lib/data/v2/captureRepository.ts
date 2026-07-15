import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAuthenticatedUser, throwIfError } from "./client";
import type { SensorCaptureInsert, SensorCaptureRow } from "./types";

export async function insertSensorCaptures(client: SupabaseClient, rows: SensorCaptureInsert[]): Promise<SensorCaptureRow[]> {
  if (!rows.length) return [];
  const user = await requireAuthenticatedUser(client, rows[0].user_id);
  if (rows.some((row) => row.user_id !== user.id)) throw new Error("Not authorized.");
  const { data, error } = await client.from("sensor_captures").upsert(rows, { onConflict: "scan_id,sensor_type,task_id,attempt_number" }).select("*");
  throwIfError(error, "Could not save sensor captures");
  return (data ?? []) as SensorCaptureRow[];
}

export async function listCapturesForScan(client: SupabaseClient, scanId: string): Promise<SensorCaptureRow[]> {
  const user = await requireAuthenticatedUser(client);
  const { data, error } = await client.from("sensor_captures").select("*").eq("scan_id", scanId).eq("user_id", user.id).order("created_at");
  throwIfError(error, "Could not load sensor captures");
  return (data ?? []) as SensorCaptureRow[];
}
