import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAuthenticatedUser, throwIfError } from "./client";
import type { PersonalBaselineInsert, PersonalBaselineRow } from "./types";

export async function getPersonalBaselines(client: SupabaseClient): Promise<PersonalBaselineRow[]> {
  const user = await requireAuthenticatedUser(client);
  const { data, error } = await client.from("personal_baselines").select("*").eq("user_id", user.id).order("domain_id");
  throwIfError(error, "Could not load personal baselines");
  return (data ?? []) as PersonalBaselineRow[];
}

export async function upsertPersonalBaselines(client: SupabaseClient, rows: PersonalBaselineInsert[]): Promise<PersonalBaselineRow[]> {
  if (!rows.length) return [];
  const user = await requireAuthenticatedUser(client, rows[0].user_id);
  if (rows.some((row) => row.user_id !== user.id)) throw new Error("Not authorized.");
  const { data, error } = await client.from("personal_baselines").upsert(rows, { onConflict: "user_id,domain_id,calculation_version" }).select("*");
  throwIfError(error, "Could not save personal baselines");
  return (data ?? []) as PersonalBaselineRow[];
}
