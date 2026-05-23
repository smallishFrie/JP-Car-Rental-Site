import type { Transition, Variants } from "framer-motion";

/** Premium ease curves — transform/opacity only in hot paths. */
export const motionEase = {
  out: [0.16, 1, 0.3, 1] as const,
  inOut: [0.65, 0, 0.35, 1] as const,
  soft: [0.25, 0.46, 0.45, 0.94] as const,
};

export const motionDurations = {
  page: 0.65,
  section: 0.95,
  reveal: 0.85,
  hover: 0.55,
  micro: 0.45,
  exit: 0.45,
};

/** Tween transitions for reveals, hovers, and press feedback. */
export const motionTweens = {
  reveal: {
    type: "tween" as const,
    duration: motionDurations.reveal,
    ease: motionEase.out,
  },
  grand: {
    type: "tween" as const,
    duration: motionDurations.section,
    ease: motionEase.out,
  },
  hover: {
    type: "tween" as const,
    duration: motionDurations.hover,
    ease: motionEase.inOut,
  },
  press: {
    type: "tween" as const,
    duration: motionDurations.micro,
    ease: motionEase.inOut,
  },
};

/** Shared stagger choreography for lists and hero sequences. */
export const motionStagger = {
  hero: { staggerChildren: 0.14, delayChildren: 0.2 },
  section: { staggerChildren: 0.14, delayChildren: 0.16 },
  list: { staggerChildren: 0.12, delayChildren: 0.12 },
  fleet: { staggerChildren: 0.1, delayChildren: 0.1 },
  words: { staggerChildren: 0.09, delayChildren: 0.04 },
} as const;

/** Pointer-follow tilt only — physics spring kept intentionally. */
export const motionSprings = {
  tilt: { type: "spring" as const, stiffness: 160, damping: 28, mass: 0.9 },
};

/** @deprecated Use motionTweens — kept for kinetic-presets migration. */
export const kineticSprings = {
  snap: motionTweens.reveal,
  elastic: motionTweens.reveal,
  dramatic: motionTweens.grand,
};

/** Shared `whileInView` defaults for kinetic primitives. */
export const kineticViewportDefaults = {
  once: true,
  amount: 0.12,
  margin: "0px 0px -5% 0px",
} as const;

function tweenWithDelay(reduceMotion: boolean, tween: Transition, delay = 0): Transition {
  if (reduceMotion) return { duration: 0 };
  return { ...tween, ...(delay > 0 ? { delay } : {}) };
}

/** Container for staggerChildren lists */
export const staggerContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: motionStagger.section,
  },
};

export const staggerItemFadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: motionTweens.reveal,
  },
};

/**
 * Page shell transitions must not use transform, filter, or perspective on the
 * wrapper: those create a fixed-position containing block, so `position: fixed`
 * (e.g. `.site-header`) would scroll with the page instead of the viewport.
 */
export const pageShellVariants: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: { duration: motionDurations.page, ease: motionEase.out },
  },
  exit: {
    opacity: 0,
    transition: { duration: motionDurations.exit, ease: motionEase.out },
  },
};

export const pageShellReducedVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0 } },
  exit: { opacity: 0, transition: { duration: 0 } },
};

export type RevealVariantName =
  | "fadeUp"
  | "slideLeft"
  | "scaleFade"
  | "flipUp3d"
  | "dramaticBlurIn";

export function revealParentVariants(
  variant: RevealVariantName,
  reduceMotion: boolean | null,
  delay = 0,
): Variants {
  const instant = reduceMotion === true;
  const t = tweenWithDelay(instant, motionTweens.reveal, delay);
  const tGrand = tweenWithDelay(instant, motionTweens.grand, delay);

  const baseHidden = { opacity: 0, transition: t };
  const baseVisible = { opacity: 1, transition: t };

  switch (variant) {
    case "slideLeft":
      return {
        hidden: { ...baseHidden, x: 28 },
        visible: { ...baseVisible, x: 0, transition: tGrand },
      };
    case "scaleFade":
      return {
        hidden: { ...baseHidden, scale: 0.96, y: 12 },
        visible: { ...baseVisible, scale: 1, y: 0, transition: tGrand },
      };
    case "flipUp3d":
      return {
        hidden: {
          opacity: instant ? 1 : 0,
          rotateX: instant ? 0 : 10,
          y: instant ? 0 : 14,
          transformPerspective: 1100,
        },
        visible: {
          opacity: 1,
          rotateX: 0,
          y: 0,
          transformPerspective: 1100,
          transition: tGrand,
        },
      };
    case "dramaticBlurIn":
      return {
        hidden: {
          opacity: instant ? 1 : 0,
          y: instant ? 0 : 22,
          filter: instant ? "blur(0px)" : "blur(12px)",
        },
        visible: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: tGrand,
        },
      };
    case "fadeUp":
    default:
      return {
        hidden: { ...baseHidden, y: 16 },
        visible: { ...baseVisible, y: 0, transition: tGrand },
      };
  }
}

/** Stagger list items (use on `motion.ul` / `motion.ol` parent). */
export const revealListContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: motionStagger.list,
  },
};

export const revealListItemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: motionTweens.reveal,
  },
};

/** Instant / static when `useReducedMotion()` is true. */
export const revealReducedItem: Variants = {
  hidden: { opacity: 1, y: 0, filter: "blur(0px)", rotateX: 0 },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", rotateX: 0, transition: { duration: 0 } },
};

export const revealReducedStaggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0, delayChildren: 0 } },
};
