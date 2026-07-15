import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAuthenticatedUser, throwIfError } from "./client";
import type { ReflectionVariantInsert, ReflectionVariantRow } from "./types";

export async function insertReflectionVariants(client: SupabaseClient, rows: ReflectionVariantInsert[]): Promise<ReflectionVariantRow[]> {
  if (rows.length === 0) return [];
  const user = await requireAuthenticatedUser(client, rows[0].user_id);
  if (rows.some((row) => row.user_id !== user.id)) throw new Error("Not authorized.");
  const response = await client.from("reflection_variants").upsert(rows, { onConflict: "scan_id,style" }).select("*");
  throwIfError(response.error, "Could not save reflection variants");
  return (response.data ?? []) as ReflectionVariantRow[];
}

export async function listReflectionVariantsForScan(client: SupabaseClient, scanId: string): Promise<ReflectionVariantRow[]> {
  const user = await requireAuthenticatedUser(client);
  const response = await client.from("reflection_variants").select("*").eq("scan_id", scanId).eq("user_id", user.id).order("style");
  throwIfError(response.error, "Could not load reflection variants");
  return (response.data ?? []) as ReflectionVariantRow[];
}
