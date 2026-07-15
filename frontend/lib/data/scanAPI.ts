import { supabase } from "../supabaseClient";
import { getLatestScanSession } from "./v2/scanRepository";
import type { JsonObject } from "./v2/types";

type ScanRecord = {
  id: string;
  user_id: string;
  result: JsonObject | null;
  created_at: string;
};

export async function getLatestScan(): Promise<ScanRecord | null> {
  try {
    const session = await getLatestScanSession(supabase);
    return session ? {
      id: session.id,
      user_id: session.user_id,
      result: session.raw_result,
      created_at: session.created_at,
    } : null;
  } catch (error) {
    console.error("Error fetching latest V2 scan:", error);
    return null;
  }
}
