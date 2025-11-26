import { supabase } from "../supabaseClient";

type ScanRecord = {
  id: string;
  user_id: string;
  fftData: number[];
  sampleRate: number | null;
  created_at: string;
};

export async function getLatestScan(): Promise<ScanRecord | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return null;
  }

  const { data, error } = await supabase
    .from("scans")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single<ScanRecord>();

  if (error) {
    console.error("Error fetching scan:", error);
    return null;
  }

  return data;
}
