import type { SupabaseClient, User } from "@supabase/supabase-js";

export const CHECK_IN_EMOTIONS = [
  "Calm","Focused","Hopeful","Energized","Connected","Grounded",
  "Restless","Uncertain","Tense","Distracted","Sensitive","Pressured",
  "Overwhelmed","Drained","Low","Frustrated","Disconnected","Exhausted",
] as const;

export type CheckInEmotion = (typeof CHECK_IN_EMOTIONS)[number];

export interface DailyCheckInRow {
  id: string;
  user_id: string;
  check_in_date: string;
  emotions: CheckInEmotion[];
  note: string | null;
  linked_scan_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyCheckInInput {
  date: string;
  emotions: CheckInEmotion[];
  note?: string | null;
  linkedScanId?: string | null;
}

const emotionSet = new Set<string>(CHECK_IN_EMOTIONS);

export function toLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function validateCheckInInput(input: DailyCheckInInput): DailyCheckInInput {
  const emotions = Array.from(new Set(input.emotions));
  if (emotions.length > 3) throw new Error("Choose up to three emotions.");
  if (emotions.some((emotion) => !emotionSet.has(emotion))) throw new Error("One or more selected emotions are not available.");
  const note = input.note?.trim() || null;
  if (note && note.length > 2000) throw new Error("Keep your note under 2,000 characters.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new Error("A valid local calendar date is required.");
  return { ...input, emotions, note };
}

async function requireUser(client: SupabaseClient): Promise<User> {
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error("You must be signed in to use daily check-ins.");
  return data.user;
}

export async function getCheckInForDate(client: SupabaseClient, date: string): Promise<DailyCheckInRow | null> {
  const user = await requireUser(client);
  const { data, error } = await client.from("daily_check_ins").select("*").eq("user_id", user.id).eq("check_in_date", date).maybeSingle();
  if (error) throw new Error(`Could not load this check-in: ${error.message}`);
  return data as DailyCheckInRow | null;
}

export async function getTodayCheckIn(client: SupabaseClient, now = new Date()): Promise<DailyCheckInRow | null> {
  return getCheckInForDate(client, toLocalDateKey(now));
}

export async function upsertDailyCheckIn(client: SupabaseClient, input: DailyCheckInInput): Promise<DailyCheckInRow> {
  const user = await requireUser(client);
  const validated = validateCheckInInput(input);
  const { data, error } = await client.from("daily_check_ins").upsert({
    user_id: user.id,
    check_in_date: validated.date,
    emotions: validated.emotions,
    note: validated.note ?? null,
    linked_scan_id: validated.linkedScanId ?? null,
  }, { onConflict: "user_id,check_in_date" }).select("*").single();
  if (error) throw new Error(`Could not save your check-in: ${error.message}`);
  return data as DailyCheckInRow;
}

export async function listCheckInsForRange(client: SupabaseClient, startDate: string, endDate: string): Promise<DailyCheckInRow[]> {
  const user = await requireUser(client);
  const { data, error } = await client.from("daily_check_ins").select("*").eq("user_id", user.id).gte("check_in_date", startDate).lte("check_in_date", endDate).order("check_in_date", { ascending: false });
  if (error) throw new Error(`Could not load your check-ins: ${error.message}`);
  return (data ?? []) as DailyCheckInRow[];
}

export async function linkCheckInToScan(client: SupabaseClient, scanId: string, date = toLocalDateKey()): Promise<void> {
  const user = await requireUser(client);
  const { error } = await client.from("daily_check_ins").update({ linked_scan_id: scanId }).eq("user_id", user.id).eq("check_in_date", date);
  if (error) throw new Error(`Could not link today's check-in to this scan: ${error.message}`);
}

export async function deleteDailyCheckIn(client: SupabaseClient, id: string): Promise<void> {
  const user = await requireUser(client);
  const { error } = await client.from("daily_check_ins").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(`Could not delete this check-in: ${error.message}`);
}
