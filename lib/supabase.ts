import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js";

export function createClient(): SupabaseClient {
  return createSupabaseClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
}
