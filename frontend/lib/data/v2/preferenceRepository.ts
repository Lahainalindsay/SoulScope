import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAuthenticatedUser, throwIfError } from "./client";
import type { ReflectionStyle, ScanReflectionPreferenceRow, UserNarrativePreferenceRow } from "./types";

export async function setScanReflectionPreference(
  client: SupabaseClient,
  scanId: string,
  style: ReflectionStyle,
): Promise<UserNarrativePreferenceRow> {
  await requireAuthenticatedUser(client);
  const { data, error } = await client.rpc("set_scan_reflection_preference", {
    p_scan_id: scanId,
    p_selected_style: style,
  });
  throwIfError(error, "Could not save reflection preference");
  if (!data) throw new Error("Could not save reflection preference: no row returned.");
  return data as UserNarrativePreferenceRow;
}

export async function listScanReflectionPreferences(
  client: SupabaseClient,
  scanIds: string[],
): Promise<ScanReflectionPreferenceRow[]> {
  if (!scanIds.length) return [];
  const user = await requireAuthenticatedUser(client);
  const { data, error } = await client.from("scan_reflection_preferences").select("*").eq("user_id", user.id).in("scan_id", scanIds);
  throwIfError(error, "Could not load scan preferences");
  return (data ?? []) as ScanReflectionPreferenceRow[];
}

export async function getScanReflectionPreference(
  client: SupabaseClient,
  scanId: string,
): Promise<ScanReflectionPreferenceRow | null> {
  return (await listScanReflectionPreferences(client, [scanId]))[0] ?? null;
}

export async function getUserNarrativePreference(
  client: SupabaseClient,
): Promise<UserNarrativePreferenceRow | null> {
  const user = await requireAuthenticatedUser(client);
  const { data, error } = await client.from("user_narrative_preferences").select("*").eq("user_id", user.id).maybeSingle<UserNarrativePreferenceRow>();
  throwIfError(error, "Could not load narrative preference");
  return data ?? null;
}
