import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js";
import { JobSearchSettings } from "@/lib/jobs/types";

export function createClient(): SupabaseClient {
  return createSupabaseClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
}

export async function getSettings(): Promise<JobSearchSettings> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("job_search_settings")
    .select("*")
    .eq("id", 1)
    .single();
  if (error) {
    throw error;
  }
  return data as JobSearchSettings;
}

export async function updateSettings(patch: Partial<JobSearchSettings>): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("job_search_settings")
    .update(patch)
    .eq("id", 1);
  if (error) {
    throw error;
  }
}
