import "server-only";

import { createClient } from "@supabase/supabase-js";
import { readServerEnv } from "@/lib/env";

export function createAdminClient() {
  const supabaseUrl = readServerEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = readServerEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
