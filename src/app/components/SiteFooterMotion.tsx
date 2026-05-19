"use client";

import Link from "next/link";
import AnalogVisitCounter from "./AnalogVisitCounter";
import { KineticItem, KineticStagger } from "@/app/components/kinetic";

type SiteFooterMotionProps = {
  year: number;
  isSignedIn: boolean;
};

export default function SiteFooterMotion({ year, isSignedIn }: SiteFooterMotionProps) {
  const links = [
    { href: "/#cars", label: "Browse vehicles" },
    ...(!isSignedIn ? [{ href: "/auth/sign-in", label: "Sign in" }] : []),
    { href: "/auth/create-account", label: "Create account" },
    { href: "/privacy-policy", label: "Privacy policy" },
    { href: "/terms-of-service", label: "Terms of service" },
  ];

  return (
    <footer className="site-footer" aria-label="Site footer">
      <KineticStagger className="site-footer-inner">
        <div className="site-footer-main">
          <KineticItem scope="footer-brand" index={0} preset="fadeUpSharp" className="site-footer-brand" as="motion.div">
            <p className="site-footer-title notranslate" translate="no">
              JP Car Rental
            </p>
            <p className="site-footer-tagline">Fast booking. Clean vehicles. Easy travel.</p>
            <p className="site-footer-location" aria-label="Business location">
              <span>Libis Brgy San Perdo</span>
              <span>Puuerto Princesa City</span>
              <span>5300 Palawan Philippines</span>
            </p>
          </KineticItem>

          <div className="site-footer-block">
            <KineticItem scope="footer-explore" index={0} preset="slideUpFade" as="motion.div">
              <p className="site-footer-heading">Explore</p>
            </KineticItem>
            <KineticStagger as="motion.ul" className="site-footer-links">
              {links.map((link, i) => (
                <KineticItem key={link.href} scope="footer-link" index={i} preset="driftInLeft" as="motion.li">
                  <Link href={link.href} className="kinetic-link-sweep">
                    {link.label}
                  </Link>
                </KineticItem>
              ))}
            </KineticStagger>
          </div>

          <div className="site-footer-block site-footer-map-block">
            <KineticItem scope="footer-map" index={0} preset="fadeUpSharp" as="motion.div">
              <p className="site-footer-heading">Location</p>
            </KineticItem>
            <KineticItem scope="footer-map" index={1} preset="clipWipeUp" as="motion.div">
              <div className="site-footer-map-frame kinetic-map-frame" role="presentation">
                <iframe
                  title="JP Car Rental location map"
                  src="https://www.google.com/maps?q=Libis%20Brgy%20San%20Perdo%2C%20Puerto%20Princesa%20City%2C%20Palawan%205300%20Philippines&output=embed"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </KineticItem>
          </div>
        </div>

        <div className="site-footer-meta">
          <KineticItem scope="footer-meta" index={0} preset="peekUp" as="motion.div">
            <p className="site-footer-copy notranslate" translate="no">
              &copy; {year} JP Car Rental. All rights reserved.
            </p>
          </KineticItem>
          <KineticItem scope="footer-meta" index={1} preset="snapScale" as="motion.div">
            <AnalogVisitCounter />
          </KineticItem>
        </div>
      </KineticStagger>
    </footer>
  );
}
