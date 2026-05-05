import Link from "next/link";
import RevealOnScroll from "./RevealOnScroll";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export default async function HomeContactStrip() {
  let isSignedIn = false;

  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    isSignedIn = Boolean(data.user);
  }

  return (
    <section className="home-bottom-section home-contact-strip" aria-labelledby="home-contact-heading">
      <RevealOnScroll variant="slideLeft">
        <h2 className="home-section-heading" id="home-contact-heading">
          Contact &amp; hours
        </h2>
        <div className="home-contact-grid">
          <div className="home-contact-card">
            <p className="home-contact-label">Hours</p>
            <p className="home-contact-body">
              Mon–Sat 8:00 a.m.–6:00 p.m. · Sunday by appointment. Pickup and return times are confirmed with each booking.
            </p>
          </div>
          <div className="home-contact-card">
            <p className="home-contact-label">After you book</p>
            <p className="home-contact-body">
              Your confirmation email includes pickup instructions and the best way to reach us for that reservation.
            </p>
          </div>
          <div className="home-contact-card">
            <p className="home-contact-label">Account</p>
            <p className="home-contact-body">
              Signed-in customers can review trips and messages in one place.
            </p>
            {!isSignedIn ? (
              <Link href="/auth/sign-in" className="home-contact-link">
                Sign in
              </Link>
            ) : null}
          </div>
        </div>
      </RevealOnScroll>
    </section>
  );
}
