import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAuthenticatedUser, throwIfError } from "./client";
import type { ScanSessionInsert, ScanSessionRow, ScanSessionUpdate } from "./types";

export async function createScanSession(client: SupabaseClient, row: ScanSessionInsert): Promise<ScanSessionRow> {
  const user = await requireAuthenticatedUser(client, row.user_id);
  const { data, error } = await client
    .from("scan_sessions")
    .upsert({ ...row, user_id: user.id }, { onConflict: "id" })
    .select("*")
    .single<ScanSessionRow>();
  throwIfError(error, "Could not create scan session");
  if (!data) throw new Error("Could not create scan session: no row returned.");
  return data;
}

export async function updateScanSession(client: SupabaseClient, scanId: string, updates: ScanSessionUpdate): Promise<ScanSessionRow> {
  const user = await requireAuthenticatedUser(client);
  const { data, error } = await client.from("scan_sessions").update(updates).eq("id", scanId).eq("user_id", user.id).select("*").single<ScanSessionRow>();
  throwIfError(error, "Could not update scan session");
  if (!data) throw new Error("Could not update scan session: no row returned.");
  return data;
}

export async function getScanSession(client: SupabaseClient, scanId: string): Promise<ScanSessionRow | null> {
  const user = await requireAuthenticatedUser(client);
  const { data, error } = await client.from("scan_sessions").select("*").eq("id", scanId).eq("user_id", user.id).maybeSingle<ScanSessionRow>();
  throwIfError(error, "Could not load scan session");
  return data ?? null;
}

export async function getLatestScanSession(client: SupabaseClient): Promise<ScanSessionRow | null> {
  const user = await requireAuthenticatedUser(client);
  const { data, error } = await client.from("scan_sessions").select("*").eq("user_id", user.id).in("status", ["completed", "partial"]).order("created_at", { ascending: false }).limit(1).maybeSingle<ScanSessionRow>();
  throwIfError(error, "Could not load latest scan");
  return data ?? null;
}

export async function listRecentScanSessions(client: SupabaseClient, limit = 3): Promise<ScanSessionRow[]> {
  const user = await requireAuthenticatedUser(client);
  const { data, error } = await client.from("scan_sessions").select("*").eq("user_id", user.id).in("status", ["completed", "partial"]).order("created_at", { ascending: false }).limit(limit);
  throwIfError(error, "Could not load recent scans");
  return (data ?? []) as ScanSessionRow[];
}

export async function listScanHistory(client: SupabaseClient, limit = 100): Promise<ScanSessionRow[]> {
  return listRecentScanSessions(client, limit);
}

export async function deleteScanSession(client: SupabaseClient, scanId: string): Promise<void> {
  const user = await requireAuthenticatedUser(client);
  const { error } = await client.from("scan_sessions").delete().eq("id", scanId).eq("user_id", user.id);
  throwIfError(error, "Could not delete scan session");
}
