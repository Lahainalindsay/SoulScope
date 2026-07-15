import type { SupabaseClient } from "@supabase/supabase-js";

export async function requireAuthenticatedUser(client: SupabaseClient, expectedUserId?: string) {
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error("A signed-in user is required.");
  if (expectedUserId && expectedUserId !== data.user.id) throw new Error("Not authorized.");
  return data.user;
}

export function throwIfError(error: { message?: string } | null, context: string): void {
  if (error) throw new Error(`${context}: ${error.message ?? "Unknown Supabase error"}`);
}
