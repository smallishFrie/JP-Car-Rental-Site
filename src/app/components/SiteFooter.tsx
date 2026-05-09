import Link from "next/link";
import AnalogVisitCounter from "./AnalogVisitCounter";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export default async function SiteFooter() {
  const year = new Date().getFullYear();
  let isSignedIn = false;

  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    isSignedIn = Boolean(data.user);
  }

  return (
    <footer className="site-footer" aria-label="Site footer">
      <div className="site-footer-inner">
        <div className="site-footer-main">
          <div className="site-footer-brand">
            <p className="site-footer-title notranslate" translate="no">
              JP Car Rental
            </p>
            <p className="site-footer-tagline">Fast booking. Clean vehicles. Easy travel.</p>
          </div>

          <div className="site-footer-block">
            <p className="site-footer-heading">Explore</p>
            <ul className="site-footer-links">
              <li>
                <Link href="/#cars">Browse vehicles</Link>
              </li>
              {!isSignedIn ? (
                <li>
                  <Link href="/auth/sign-in">Sign in</Link>
                </li>
              ) : null}
              <li>
                <Link href="/auth/create-account">Create account</Link>
              </li>
              <li>
                <Link href="/privacy-policy">Privacy policy</Link>
              </li>
              <li>
                <Link href="/terms-of-service">Terms of service</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="site-footer-meta">
          <p className="site-footer-copy notranslate" translate="no">
            &copy; {year} JP Car Rental. All rights reserved.
          </p>
          <AnalogVisitCounter />
        </div>
      </div>
    </footer>
  );
}
