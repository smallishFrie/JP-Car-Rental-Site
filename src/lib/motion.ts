import type { Variants } from "framer-motion";

/** Shared springs — prefer hardware-friendly props only. */
export const motionSprings = {
  /** Snappy UI press / hover settle */
  snappy: { type: "spring" as const, stiffness: 520, damping: 28, mass: 0.85 },
  /** Section reveals */
  reveal: { type: "spring" as const, stiffness: 380, damping: 32, mass: 0.9 },
  /** Dramatic / hero */
  grand: { type: "spring" as const, stiffness: 280, damping: 30, mass: 1 },
  /** Soft card tilt follow */
  tilt: { type: "spring" as const, stiffness: 220, damping: 22, mass: 0.75 },
};

export const motionDurations = {
  page: 0.38,
  micro: 0.22,
};

export const motionEase = [0.22, 1, 0.36, 1] as const;

/** Kinetic scroll-enter springs (see kinetic-presets). */
export const kineticSprings = {
  snap: { type: "spring" as const, stiffness: 480, damping: 30, mass: 0.9 },
  elastic: { type: "spring" as const, stiffness: 400, damping: 22, mass: 0.85 },
  dramatic: motionSprings.grand,
};

/** Shared `whileInView` defaults for kinetic primitives. */
export const kineticViewportDefaults = {
  once: true,
  amount: 0.12,
  margin: "0px 0px -5% 0px",
} as const;

/** Container for staggerChildren lists */
export const staggerContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.06,
    },
  },
};

export const staggerItemFadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: motionSprings.reveal,
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
    transition: { duration: motionDurations.page, ease: motionEase },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.28, ease: motionEase },
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
  const t = instant ? { duration: 0 } : { ...motionSprings.reveal, ...(delay > 0 ? { delay } : {}) };
  const tGrand = instant ? { duration: 0 } : { ...motionSprings.grand, ...(delay > 0 ? { delay } : {}) };

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
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.05,
    },
  },
};

export const revealListItemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: motionSprings.reveal,
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
