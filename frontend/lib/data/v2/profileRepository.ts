import type { SupabaseClient, User } from "@supabase/supabase-js";

export interface ProfileRow {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  timezone: string | null;
  created_at: string;
  updated_at: string;
}

export const PROFILE_NAME_MAX_LENGTH = 50;

export function normalizeProfileName(value: string): string {
  return value.trim().replace(/\s+/g, " ").slice(0, PROFILE_NAME_MAX_LENGTH);
}

async function requireUser(client: SupabaseClient): Promise<User> {
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error("You must be signed in to update your profile.");
  return data.user;
}

export async function getOwnProfile(client: SupabaseClient): Promise<ProfileRow | null> {
  const user = await requireUser(client);
  const { data, error } = await client
    .from("profiles")
    .select("user_id,display_name,avatar_url,timezone,created_at,updated_at")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new Error(`Could not load your profile: ${error.message}`);
  return data as ProfileRow | null;
}

export async function upsertOwnProfileName(client: SupabaseClient, value: string): Promise<ProfileRow> {
  const user = await requireUser(client);
  const displayName = normalizeProfileName(value);
  if (!displayName) throw new Error("Please enter the name you would like SoulScope to use.");
  const { data, error } = await client
    .from("profiles")
    .upsert({ user_id: user.id, display_name: displayName }, { onConflict: "user_id" })
    .select("user_id,display_name,avatar_url,timezone,created_at,updated_at")
    .single();
  if (error) throw new Error(`Could not save your profile name: ${error.message}`);
  return data as ProfileRow;
}
