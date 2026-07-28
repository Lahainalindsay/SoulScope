import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReferenceSignature } from "./referenceSignature";

export type ReferenceSignatureRow = {
  id: string;
  user_id: string;
  subject_id: string | null;
  status: "active" | "retired";
  prompt_id: string;
  prompt_text: string;
  duration_ms: number;
  signature: ReferenceSignature;
  quality: Record<string, unknown>;
  engine_version: string;
  created_at: string;
  retired_at: string | null;
};

export async function getActiveReferenceSignature(client: SupabaseClient, userId: string) {
  const { data, error } = await client
    .from("reference_signatures")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw new Error(`Could not load your Reference Signature: ${error.message}`);
  return (data ?? null) as ReferenceSignatureRow | null;
}

export async function replaceActiveReferenceSignature(
  client: SupabaseClient,
  input: Omit<ReferenceSignatureRow, "id" | "created_at" | "retired_at" | "status">,
) {
  const retiredAt = new Date().toISOString();
  const retire = await client
    .from("reference_signatures")
    .update({ status: "retired", retired_at: retiredAt })
    .eq("user_id", input.user_id)
    .eq("status", "active");
  if (retire.error) throw new Error(`Could not update your previous Reference Signature: ${retire.error.message}`);

  const { data, error } = await client
    .from("reference_signatures")
    .insert({ ...input, status: "active" })
    .select("*")
    .single();
  if (error || !data) throw new Error(`Could not save your Reference Signature: ${error?.message ?? "no row returned"}`);
  return data as ReferenceSignatureRow;
}
