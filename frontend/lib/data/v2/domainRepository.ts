import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAuthenticatedUser, throwIfError } from "./client";
import type { DomainResultInsert, DomainResultRow } from "./types";

export async function insertDomainResults(client: SupabaseClient, rows: DomainResultInsert[]): Promise<DomainResultRow[]> {
  if (!rows.length) return [];
  const user = await requireAuthenticatedUser(client, rows[0].user_id);
  if (rows.some((row) => row.user_id !== user.id)) throw new Error("Not authorized.");
  const { data, error } = await client.from("domain_results").upsert(rows, { onConflict: "scan_id,domain_id,rule_version" }).select("*");
  throwIfError(error, "Could not save domain results");
  return (data ?? []) as DomainResultRow[];
}

export async function listDomainsForScans(client: SupabaseClient, scanIds: string[]): Promise<DomainResultRow[]> {
  if (!scanIds.length) return [];
  const user = await requireAuthenticatedUser(client);
  const { data, error } = await client.from("domain_results").select("*").eq("user_id", user.id).in("scan_id", scanIds).order("created_at");
  throwIfError(error, "Could not load domain results");
  return (data ?? []) as DomainResultRow[];
}

export async function listDomainsForScan(client: SupabaseClient, scanId: string): Promise<DomainResultRow[]> {
  return listDomainsForScans(client, [scanId]);
}

export async function listDomainHistory(client: SupabaseClient, domainId: string, limit = 5): Promise<DomainResultRow[]> {
  const user = await requireAuthenticatedUser(client);
  const { data, error } = await client.from("domain_results").select("*, scan_sessions!inner(status, capture_quality, created_at)").eq("user_id", user.id).eq("domain_id", domainId).in("scan_sessions.status", ["completed", "partial"]).neq("scan_sessions.capture_quality", "limited").neq("scan_sessions.capture_quality", "poor").order("created_at", { ascending: false }).limit(limit);
  throwIfError(error, "Could not load domain history");
  return (data ?? []) as DomainResultRow[];
}
