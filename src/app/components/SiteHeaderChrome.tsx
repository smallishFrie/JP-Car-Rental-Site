"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import HeaderPreferences from "@/app/components/HeaderPreferences";
import { motionTweens } from "@/lib/motion";

type SiteHeaderChromeProps = {
  isSignedIn: boolean;
  isAdmin: boolean;
  signOutAction: () => Promise<void>;
};

export default function SiteHeaderChrome({ isSignedIn, isAdmin, signOutAction }: SiteHeaderChromeProps) {
  return (
    <header className="site-header">
      <motion.div
        className="site-header-inner"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={motionTweens.reveal}
      >
        <Link href="/" className="site-header-brand">
          <h1 className="site-header-title notranslate" translate="no">
            JP Car Rental
          </h1>
        </Link>

        <nav aria-label="User navigation" className="header-auth-nav">
          {isSignedIn ? (
            <>
              <Link href="/account/bookings" className="header-auth-link">
                Account
              </Link>
              {isAdmin ? (
                <Link href="/admin" className="header-auth-link">
                  Admin
                </Link>
              ) : null}
              <form action={signOutAction}>
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
      </motion.div>
    </header>
  );
}
