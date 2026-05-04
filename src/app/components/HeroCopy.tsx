"use client";

import { motion, useReducedMotion } from "framer-motion";
import { motionSprings } from "@/lib/motion";
import { useHeroMotion } from "./hero-motion-context";
import { MotionPressableLink } from "./MotionPressable";
import { scrollToAvailableCarsHeader } from "@/lib/scrollToAvailableCars";

function scrollToCars(event: React.MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
  scrollToAvailableCarsHeader();
}

const heroContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

function lineItem(reduce: boolean | null) {
  if (reduce) {
    return { hidden: { opacity: 1, y: 0, filter: "blur(0px)" }, visible: { opacity: 1, y: 0, filter: "blur(0px)" } };
  }
  return {
    hidden: { opacity: 0, y: 14, filter: "blur(8px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: motionSprings.grand,
    },
  };
}

function wordItem(reduce: boolean | null) {
  if (reduce) {
    return { hidden: { opacity: 1, y: 0, filter: "blur(0px)" }, visible: { opacity: 1, y: 0, filter: "blur(0px)" } };
  }
  return {
    hidden: { opacity: 0, y: "0.4em", filter: "blur(6px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: motionSprings.grand,
    },
  };
}

function SplitWords({ text, reduce }: { text: string; reduce: boolean | null }) {
  const words = text.split(/\s+/).filter(Boolean);
  const wv = wordItem(reduce);
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
  const lv = lineItem(reduce);

  return (
    <motion.div className="hero-copy" style={heroMotion ? { y: heroMotion.textY } : undefined}>
      <motion.div className="hero-copy-inner" variants={heroContainer} initial="hidden" animate="visible">
        <motion.span className="hero-eyebrow" variants={lv}>
          Drive with confidence
        </motion.span>

        <motion.h2
          className="hero-title"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.07, delayChildren: 0.06 } },
          }}
        >
          <SplitWords text="JP Car Rental" reduce={reduce} />
        </motion.h2>

        <motion.div className="hero-sublines" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: 0.12 } } }}>
          <motion.p className="hero-subline" variants={lv}>
            Clean cars. Clear rates. Booking that takes minutes.
          </motion.p>
          <motion.p className="hero-subline" variants={lv}>
            Pick the dates, choose a location, and you are on your way.
          </motion.p>
        </motion.div>

        <motion.div
          className="hero-ctas"
          variants={{
            hidden: { opacity: reduce ? 1 : 0, y: reduce ? 0 : 10 },
            visible: {
              opacity: 1,
              y: 0,
              transition: reduce ? { duration: 0 } : motionSprings.grand,
            },
          }}
        >
          <MotionPressableLink href="#cars" className="learn-more-box" onClick={scrollToCars}>
            Book now
          </MotionPressableLink>
          <MotionPressableLink href="/auth/sign-in" className="hero-cta-secondary">
            Sign in
          </MotionPressableLink>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
