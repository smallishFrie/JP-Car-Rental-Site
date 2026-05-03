import Link from "next/link";

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer" aria-label="Site footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <p className="site-footer-title">JP Car Rental</p>
          <p className="site-footer-tagline">Fast booking. Clean vehicles. Easy travel.</p>
        </div>

        <div className="site-footer-columns">
          <div className="site-footer-block">
            <p className="site-footer-heading">Explore</p>
            <ul className="site-footer-links">
              <li>
                <Link href="/#cars">Browse vehicles</Link>
              </li>
              <li>
                <Link href="/auth/sign-in">Sign in</Link>
              </li>
              <li>
                <Link href="/auth/create-account">Create account</Link>
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

        <p className="site-footer-copy">&copy; {year} JP Car Rental. All rights reserved.</p>
      </div>
    </footer>
  );
}
