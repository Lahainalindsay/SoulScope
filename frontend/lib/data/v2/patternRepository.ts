import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAuthenticatedUser, throwIfError } from "./client";
import type { PatternMatchInsert, PatternMatchRow } from "./types";

export async function insertPatternMatches(client: SupabaseClient, rows: PatternMatchInsert[]): Promise<PatternMatchRow[]> {
  if (!rows.length) return [];
  const user = await requireAuthenticatedUser(client, rows[0].user_id);
  if (rows.some((row) => row.user_id !== user.id)) throw new Error("Not authorized.");
  const { data, error } = await client.from("pattern_matches").upsert(rows, { onConflict: "scan_id,role" }).select("*");
  throwIfError(error, "Could not save pattern matches");
  return (data ?? []) as PatternMatchRow[];
}

export async function listPatternMatchesForScan(client: SupabaseClient, scanId: string): Promise<PatternMatchRow[]> {
  const user = await requireAuthenticatedUser(client);
  const { data, error } = await client.from("pattern_matches").select("*").eq("scan_id", scanId).eq("user_id", user.id).order("role");
  throwIfError(error, "Could not load pattern matches");
  return (data ?? []) as PatternMatchRow[];
}
