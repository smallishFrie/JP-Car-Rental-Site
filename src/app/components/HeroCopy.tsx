"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { KineticHover } from "@/app/components/kinetic";
import { kineticEnterVariants } from "@/lib/kinetic-presets";
import { motionStagger } from "@/lib/motion";
import { useHeroMotion } from "./hero-motion-context";
import { MotionPressableLink } from "./MotionPressable";
import { scrollToAvailableCarsHeader } from "@/lib/scrollToAvailableCars";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/client";

function scrollToCars(event: React.MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
  scrollToAvailableCarsHeader();
}

const heroContainer = {
  hidden: {},
  visible: {
    transition: motionStagger.hero,
  },
};

function SplitWords({ text, reduce }: { text: string; reduce: boolean | null }) {
  const wv = useMemo(() => kineticEnterVariants("fadeUpSharp", reduce === true), [reduce]);
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <>
      {words.map((w, i) => (
        <motion.span
          key={`${i}-${w}`}
          variants={wv}
          style={{ display: "inline-block", marginRight: "0.22em" }}
        >
          {w}
        </motion.span>
      ))}
    </>
  );
}

export default function HeroCopy() {
  const reduce = useReducedMotion();
  const heroMotion = useHeroMotion();
  const [user, setUser] = useState<User | null | undefined>(() => (hasSupabaseEnv() ? undefined : null));

  const eyebrowVariants = useMemo(() => kineticEnterVariants("maskReveal", reduce === true), [reduce]);
  const sublineVariants = useMemo(() => kineticEnterVariants("driftInRight", reduce === true), [reduce]);
  const ctaVariants = useMemo(() => kineticEnterVariants("glowFade", reduce === true), [reduce]);

  useEffect(() => {
    if (!hasSupabaseEnv()) return;

    const supabase = createClient();
    void supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const showSignInCta = !hasSupabaseEnv() || user === null;

  return (
    <motion.div className="hero-copy" style={heroMotion ? { y: heroMotion.textY } : undefined}>
      <motion.div
        className="hero-copy-inner"
        variants={heroContainer}
        initial={reduce ? false : "hidden"}
        animate="visible"
      >
        <motion.span className="hero-eyebrow" variants={eyebrowVariants}>
          Drive with confidence
        </motion.span>

        <motion.h2
          className="hero-title notranslate"
          translate="no"
          variants={{
            hidden: {},
            visible: { transition: motionStagger.words },
          }}
        >
          <SplitWords text="JP Car Rental" reduce={reduce} />
        </motion.h2>

        <motion.div
          className="hero-sublines"
          variants={{ hidden: {}, visible: { transition: motionStagger.section } }}
        >
          <motion.p className="hero-subline" variants={sublineVariants}>
            Clean cars. Clear rates. Booking that takes minutes.
          </motion.p>
          <motion.p className="hero-subline" variants={sublineVariants}>
            Pick the dates, choose a location, and you are on your way.
          </motion.p>
        </motion.div>

        <motion.div className="hero-ctas" variants={ctaVariants}>
          <KineticHover preset="magneticPull">
            <MotionPressableLink href="#cars" className="learn-more-box" onClick={scrollToCars}>
              Book now
            </MotionPressableLink>
          </KineticHover>
          {showSignInCta ? (
            <KineticHover preset="liftGlow">
              <MotionPressableLink href="/auth/sign-in" className="hero-cta-secondary">
                Sign in
              </MotionPressableLink>
            </KineticHover>
          ) : null}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
