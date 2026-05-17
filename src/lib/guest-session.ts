import type { SupabaseClient, User } from "@supabase/supabase-js";

export type EnsureUserResult = { user: User } | { error: string };

/**
 * Ensures a Supabase session exists for booking/checkout RLS.
 * Uses anonymous sign-in when no user is present (enable in Supabase Dashboard → Authentication → Providers).
 */
export async function ensureAuthenticatedUser(supabase: SupabaseClient): Promise<EnsureUserResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return { user };
  }

  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    return { error: error.message || "Unable to start checkout. Please try again." };
  }

  if (!data.user) {
    return { error: "Unable to start checkout. Please try again." };
  }

  return { user: data.user };
}
