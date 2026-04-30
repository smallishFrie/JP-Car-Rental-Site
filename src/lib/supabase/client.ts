import { createBrowserClient } from "@supabase/ssr";
import { readEnv } from "@/lib/supabase/env";

export function createClient() {
  const supabaseUrl = readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabasePublishableKey = readEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}
