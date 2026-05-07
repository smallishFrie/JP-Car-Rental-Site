import Link from "next/link";
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
        <div className="site-footer-brand">
          <p className="site-footer-title notranslate" translate="no">
            JP Car Rental
          </p>
          <p className="site-footer-tagline">Fast booking. Clean vehicles. Easy travel.</p>
        </div>

        <div className="site-footer-columns">
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

          <div className="site-footer-block">
            <p className="site-footer-heading">Hours &amp; pickup</p>
            <p className="site-footer-text">
              Mon–Sat 8:00 a.m.–6:00 p.m. · Sun by appointment. Pickup and return times are confirmed with each
              booking.
            </p>
          </div>

          <div className="site-footer-block">
            <p className="site-footer-heading">Support</p>
            <p className="site-footer-text">
              Driver&apos;s license and proof of insurance required. Minimum age and deposit terms apply at checkout.
            </p>
            <p className="site-footer-text site-footer-note">Questions about a reservation? Use Account after you sign in.</p>
          </div>
        </div>

        <p className="site-footer-copy notranslate" translate="no">
          &copy; {year} JP Car Rental. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
