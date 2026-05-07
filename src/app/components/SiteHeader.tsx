import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { signOut } from "@/app/auth/actions";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import HeaderPreferences from "@/app/components/HeaderPreferences";

export default async function SiteHeader() {
  let user: User | null = null;

  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const response = await supabase.auth.getUser();
    user = response.data.user;
  }

  const role = user?.app_metadata?.role;
  const isAdmin = role === "admin";

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="site-header-brand">
          <h1 className="site-header-title notranslate" translate="no">
            JP Car Rental
          </h1>
        </Link>

        <nav aria-label="User navigation" className="header-auth-nav">
          {user ? (
            <>
              <Link href="/account/bookings" className="header-auth-link">
                Account
              </Link>
              {isAdmin ? (
                <Link href="/admin" className="header-auth-link">
                  Admin
                </Link>
              ) : null}
              <form action={signOut}>
                <button type="submit" className="header-auth-button">
                  Sign out
                </button>
              </form>
              <HeaderPreferences />
            </>
          ) : (
            <>
              <Link href="/auth/sign-in" className="header-auth-link">
                Sign in
              </Link>
              <Link href="/auth/create-account" className="header-auth-button header-auth-cta">
                Create account
              </Link>
              <HeaderPreferences />
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
