import type { Transition, Variants } from "framer-motion";
import { kineticSprings, motionSprings } from "@/lib/motion";

/**
 * Spring usage: scroll-enter uses `kineticSprings.snap` / `dramatic` / `motionSprings.reveal`.
 * Reserve `kineticSprings.elastic` for badges and micro accents only.
 * `motionSprings.snappy` is for hover/press — not section reveals.
 */

/** Full preset name union (all variant builders remain available). */
export const KINETIC_ALL_ENTER_PRESET_NAMES = [
  "elasticRise",
  "skewSnap",
  "rotateYPop",
  "clipWipeUp",
  "blurStaggerIn",
  "scaleOvershoot",
  "slideMagnetLeft",
  "slideMagnetRight",
  "flipXSoft",
  "dropBounce",
  "maskReveal",
  "fadeUpSharp",
  "slideUpFade",
  "rotateZTick",
  "expandWidth",
  "compressPop",
  "driftInLeft",
  "driftInRight",
  "zoomBlur",
  "flipUp3d",
  "slideDown",
  "wobbleIn",
  "spiralIn",
  "shearReveal",
  "glowFade",
  "bounceLeft",
  "bounceRight",
  "foldOpen",
  "unfoldY",
  "snapScale",
  "liquidRise",
  "tiltReveal",
  "perspectiveSlide",
  "elasticLeft",
  "elasticRight",
  "softBlurUp",
  "hardSnapUp",
  "swingIn",
  "rollIn",
  "peekUp",
] as const;

/** Default hash pool — distinct families, no blur (blur is paint-heavy). */
export const KINETIC_ENTER_PRESETS = [
  "slideMagnetLeft",
  "slideMagnetRight",
  "clipWipeUp",
  "maskReveal",
  "fadeUpSharp",
  "slideUpFade",
  "driftInLeft",
  "driftInRight",
  "flipUp3d",
  "foldOpen",
  "snapScale",
  "glowFade",
  "peekUp",
  "perspectiveSlide",
  "tiltReveal",
  "shearReveal",
] as const;

/** Explicit section presets (avoid identical bounce across blocks). */
export const KINETIC_TRUST_CARD_PRESETS = ["perspectiveSlide", "clipWipeUp", "tiltReveal"] as const;
export const KINETIC_STEPS_PRESETS = ["rotateZTick", "spiralIn", "rollIn"] as const;
export const KINETIC_INCLUDED_CARD_PRESETS = ["driftInLeft", "fadeUpSharp", "glowFade", "slideUpFade"] as const;
export const KINETIC_CREDIBILITY_PRESETS = ["glowFade", "driftInLeft", "peekUp"] as const;

/** Home page — transform/opacity only (no blur) for fleet cards. */
export const HOME_FLEET_CARD_PRESETS = [
  "slideMagnetLeft",
  "slideMagnetRight",
  "fadeUpSharp",
  "snapScale",
  "driftInLeft",
  "driftInRight",
  "rotateZTick",
  "scaleOvershoot",
  "tiltReveal",
  "wobbleIn",
] as const;

export const HOME_FLEET_INTRO_PRESETS = ["slideMagnetLeft", "expandWidth", "rotateZTick"] as const;

export const HOME_CONTACT_CARD_PRESETS = ["driftInLeft", "fadeUpSharp", "glowFade"] as const;

export const HOME_FAQ_ROW_PRESETS = [
  "elasticRise",
  "skewSnap",
  "wobbleIn",
  "foldOpen",
  "swingIn",
  "liquidRise",
] as const;

export const HOME_REVIEWS_HEADER_PRESETS = ["slideDown", "shearReveal", "fadeUpSharp"] as const;

export const HOME_TRUST_HOVER_PRESETS = ["tiltNudge", "liftGlow", "glowPulse"] as const;

export const HOME_FOOTER_LINK_PRESETS = [
  "driftInLeft",
  "slideMagnetRight",
  "fadeUpSharp",
  "peekUp",
  "snapScale",
] as const;

/** Home section-level enter presets (headings / shells). */
export const HOME_SECTION_PRESETS = {
  credibility: "maskReveal",
  trustHeading: "flipUp3d",
  stepsHeading: "hardSnapUp",
  fleetShell: "clipWipeUp",
  reviewsHeading: "shearReveal",
  faqHeading: "unfoldY",
  contactHeading: "slideMagnetLeft",
  includedHeading: "snapScale",
  includedCallout: "perspectiveSlide",
} as const;

/** Calm subset for forms / checkout. */
export const KINETIC_CALM_ENTER_PRESETS = [
  "fadeUpSharp",
  "slideUpFade",
  "softBlurUp",
  "scaleOvershoot",
  "slideMagnetLeft",
  "driftInLeft",
  "glowFade",
  "snapScale",
] as const;

/** Hover presets (fine pointer only). */
export const KINETIC_HOVER_PRESETS = [
  "liftGlow",
  "tiltNudge",
  "underlineSweep",
  "iconWiggle",
  "magneticPull",
  "scalePop",
  "liftSoft",
  "tiltLeft",
  "tiltRight",
  "glowPulse",
] as const;

export type KineticEnterPresetName = (typeof KINETIC_ALL_ENTER_PRESET_NAMES)[number];
export type KineticCalmEnterPresetName = (typeof KINETIC_CALM_ENTER_PRESETS)[number];
export type KineticHoverPresetName = (typeof KINETIC_HOVER_PRESETS)[number];

export function homeFleetCardPreset(carIndex: number): KineticEnterPresetName {
  return pickKineticPreset("fleet-card", carIndex, HOME_FLEET_CARD_PRESETS);
}

export function homePresetAt<T extends KineticEnterPresetName>(pool: readonly T[], index: number): T {
  return pool[index % pool.length]!;
}

function hashSeed(scope: string, index: number): number {
  const s = `${scope}:${index}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function pickKineticPreset<T extends string>(
  scope: string,
  index: number,
  pool: readonly T[],
): T {
  if (pool.length === 0) {
    throw new Error("pickKineticPreset: pool must not be empty");
  }
  return pool[hashSeed(scope, index) % pool.length]!;
}

type BuildOpts = {
  reduceMotion: boolean;
  delay?: number;
};

function enterTransition(reduceMotion: boolean, spring: Transition, delay = 0): Transition {
  if (reduceMotion) return { duration: 0 };
  return { ...spring, ...(delay > 0 ? { delay } : {}) };
}

function baseEnter(preset: KineticEnterPresetName, { reduceMotion, delay = 0 }: BuildOpts): Variants {
  const t = enterTransition(reduceMotion, kineticSprings.snap, delay);
  const tElastic = enterTransition(reduceMotion, kineticSprings.elastic, delay);
  const tGrand = enterTransition(reduceMotion, kineticSprings.dramatic, delay);
  const instant = reduceMotion;

  const hidden = { opacity: instant ? 1 : 0 };
  const visible = { opacity: 1 };

  const presets: Record<KineticEnterPresetName, Variants> = {
    elasticRise: {
      hidden: { ...hidden, y: instant ? 0 : 36 },
      visible: { ...visible, y: 0, transition: tElastic },
    },
    skewSnap: {
      hidden: { ...hidden, y: instant ? 0 : 20, skewX: instant ? 0 : 6 },
      visible: { ...visible, y: 0, skewX: 0, transition: tElastic },
    },
    rotateYPop: {
      hidden: { ...hidden, rotateY: instant ? 0 : -18, x: instant ? 0 : 12, transformPerspective: 900 },
      visible: { ...visible, rotateY: 0, x: 0, transformPerspective: 900, transition: tGrand },
    },
    clipWipeUp: {
      hidden: { ...hidden, y: instant ? 0 : 28, clipPath: instant ? "inset(0 0 0 0)" : "inset(100% 0 0 0)" },
      visible: { ...visible, y: 0, clipPath: "inset(0 0 0 0)", transition: tGrand },
    },
    blurStaggerIn: {
      hidden: { ...hidden, y: instant ? 0 : 18, filter: instant ? "blur(0px)" : "blur(14px)" },
      visible: { ...visible, y: 0, filter: "blur(0px)", transition: tGrand },
    },
    scaleOvershoot: {
      hidden: { ...hidden, scale: instant ? 1 : 0.88, y: instant ? 0 : 10 },
      visible: { ...visible, scale: 1, y: 0, transition: tElastic },
    },
    slideMagnetLeft: {
      hidden: { ...hidden, x: instant ? 0 : 32 },
      visible: { ...visible, x: 0, transition: t },
    },
    slideMagnetRight: {
      hidden: { ...hidden, x: instant ? 0 : -32 },
      visible: { ...visible, x: 0, transition: t },
    },
    flipXSoft: {
      hidden: { ...hidden, rotateX: instant ? 0 : 12, y: instant ? 0 : 16, transformPerspective: 1000 },
      visible: { ...visible, rotateX: 0, y: 0, transformPerspective: 1000, transition: tGrand },
    },
    dropBounce: {
      hidden: { ...hidden, y: instant ? 0 : -24, scale: instant ? 1 : 0.94 },
      visible: { ...visible, y: 0, scale: 1, transition: tElastic },
    },
    maskReveal: {
      hidden: { ...hidden, scaleX: instant ? 1 : 0, originX: 0 },
      visible: { ...visible, scaleX: 1, transition: tGrand },
    },
    fadeUpSharp: {
      hidden: { ...hidden, y: instant ? 0 : 14 },
      visible: { ...visible, y: 0, transition: t },
    },
    slideUpFade: {
      hidden: { ...hidden, y: instant ? 0 : 22, opacity: instant ? 1 : 0 },
      visible: { ...visible, y: 0, opacity: 1, transition: motionSprings.reveal },
    },
    rotateZTick: {
      hidden: { ...hidden, rotate: instant ? 0 : -4, y: instant ? 0 : 12 },
      visible: { ...visible, rotate: 0, y: 0, transition: tElastic },
    },
    expandWidth: {
      hidden: { ...hidden, scaleX: instant ? 1 : 0.6, opacity: instant ? 1 : 0 },
      visible: { ...visible, scaleX: 1, opacity: 1, transition: tGrand },
    },
    compressPop: {
      hidden: { ...hidden, scale: instant ? 1 : 1.08, opacity: instant ? 1 : 0 },
      visible: { ...visible, scale: 1, opacity: 1, transition: tElastic },
    },
    driftInLeft: {
      hidden: { ...hidden, x: instant ? 0 : -20, y: instant ? 0 : 8 },
      visible: { ...visible, x: 0, y: 0, transition: t },
    },
    driftInRight: {
      hidden: { ...hidden, x: instant ? 0 : 20, y: instant ? 0 : 8 },
      visible: { ...visible, x: 0, y: 0, transition: t },
    },
    zoomBlur: {
      hidden: { ...hidden, scale: instant ? 1 : 0.92, filter: instant ? "blur(0px)" : "blur(8px)" },
      visible: { ...visible, scale: 1, filter: "blur(0px)", transition: tGrand },
    },
    flipUp3d: {
      hidden: {
        opacity: instant ? 1 : 0,
        rotateX: instant ? 0 : 14,
        y: instant ? 0 : 18,
        transformPerspective: 1100,
      },
      visible: { opacity: 1, rotateX: 0, y: 0, transformPerspective: 1100, transition: tGrand },
    },
    slideDown: {
      hidden: { ...hidden, y: instant ? 0 : -18 },
      visible: { ...visible, y: 0, transition: t },
    },
    wobbleIn: {
      hidden: { ...hidden, rotate: instant ? 0 : -3, scale: instant ? 1 : 0.96 },
      visible: { ...visible, rotate: 0, scale: 1, transition: tElastic },
    },
    spiralIn: {
      hidden: { ...hidden, rotate: instant ? 0 : 8, scale: instant ? 1 : 0.9, y: instant ? 0 : 16 },
      visible: { ...visible, rotate: 0, scale: 1, y: 0, transition: tElastic },
    },
    shearReveal: {
      hidden: { ...hidden, skewY: instant ? 0 : 4, y: instant ? 0 : 20 },
      visible: { ...visible, skewY: 0, y: 0, transition: tGrand },
    },
    glowFade: {
      hidden: { ...hidden, y: instant ? 0 : 10, opacity: instant ? 1 : 0 },
      visible: { ...visible, y: 0, opacity: 1, transition: { ...t, duration: reduceMotion ? 0 : 0.5 } },
    },
    bounceLeft: {
      hidden: { ...hidden, x: instant ? 0 : 40 },
      visible: { ...visible, x: 0, transition: tElastic },
    },
    bounceRight: {
      hidden: { ...hidden, x: instant ? 0 : -40 },
      visible: { ...visible, x: 0, transition: tElastic },
    },
    foldOpen: {
      hidden: { ...hidden, scaleY: instant ? 1 : 0, originY: 0 },
      visible: { ...visible, scaleY: 1, transition: tGrand },
    },
    unfoldY: {
      hidden: { ...hidden, scaleY: instant ? 1 : 0.4, y: instant ? 0 : 12 },
      visible: { ...visible, scaleY: 1, y: 0, transition: tElastic },
    },
    snapScale: {
      hidden: { ...hidden, scale: instant ? 1 : 0.95 },
      visible: { ...visible, scale: 1, transition: t },
    },
    liquidRise: {
      hidden: { ...hidden, y: instant ? 0 : 40, scale: instant ? 1 : 0.98 },
      visible: { ...visible, y: 0, scale: 1, transition: tElastic },
    },
    tiltReveal: {
      hidden: { ...hidden, rotate: instant ? 0 : 2, y: instant ? 0 : 24 },
      visible: { ...visible, rotate: 0, y: 0, transition: tGrand },
    },
    perspectiveSlide: {
      hidden: { ...hidden, x: instant ? 0 : 24, rotateY: instant ? 0 : 8, transformPerspective: 800 },
      visible: { ...visible, x: 0, rotateY: 0, transformPerspective: 800, transition: tGrand },
    },
    elasticLeft: {
      hidden: { ...hidden, x: instant ? 0 : 48 },
      visible: { ...visible, x: 0, transition: tElastic },
    },
    elasticRight: {
      hidden: { ...hidden, x: instant ? 0 : -48 },
      visible: { ...visible, x: 0, transition: tElastic },
    },
    softBlurUp: {
      hidden: { ...hidden, y: instant ? 0 : 12, filter: instant ? "blur(0px)" : "blur(6px)" },
      visible: { ...visible, y: 0, filter: "blur(0px)", transition: t },
    },
    hardSnapUp: {
      hidden: { ...hidden, y: instant ? 0 : 20 },
      visible: { ...visible, y: 0, transition: { ...t, type: "spring", stiffness: 620, damping: 24 } },
    },
    swingIn: {
      hidden: { ...hidden, rotate: instant ? 0 : -6, x: instant ? 0 : -8 },
      visible: { ...visible, rotate: 0, x: 0, transition: tElastic },
    },
    rollIn: {
      hidden: { ...hidden, rotate: instant ? 0 : 12, x: instant ? 0 : 16 },
      visible: { ...visible, rotate: 0, x: 0, transition: tElastic },
    },
    peekUp: {
      hidden: { ...hidden, y: instant ? 0 : 8, opacity: instant ? 1 : 0.4 },
      visible: { ...visible, y: 0, opacity: 1, transition: t },
    },
  };

  return presets[preset];
}

export function kineticEnterVariants(
  preset: KineticEnterPresetName,
  reduceMotion: boolean,
  delay = 0,
): Variants {
  return baseEnter(preset, { reduceMotion, delay });
}

export function kineticEnterVariantsForScope(
  scope: string,
  index: number,
  reduceMotion: boolean,
  pool: readonly KineticEnterPresetName[] = KINETIC_ENTER_PRESETS,
  delay = 0,
): Variants {
  const preset = pickKineticPreset(scope, index, pool);
  return kineticEnterVariants(preset, reduceMotion, delay);
}

export const kineticReducedVariants: Variants = {
  hidden: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    rotate: 0,
    rotateX: 0,
    rotateY: 0,
    skewX: 0,
    skewY: 0,
    filter: "blur(0px)",
    clipPath: "inset(0 0 0 0)",
    scaleX: 1,
    scaleY: 1,
  },
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    rotate: 0,
    rotateX: 0,
    rotateY: 0,
    skewX: 0,
    skewY: 0,
    filter: "blur(0px)",
    clipPath: "inset(0 0 0 0)",
    scaleX: 1,
    scaleY: 1,
    transition: { duration: 0 },
  },
};

export const kineticStaggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

/** Faster stagger for long lists (fleet grid). */
export const kineticFleetStaggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.04,
    },
  },
};

export const kineticReducedStaggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0, delayChildren: 0 } },
};

type HoverBuildOpts = { reduceMotion: boolean };

export function kineticHoverWhile(preset: KineticHoverPresetName, opts: HoverBuildOpts) {
  if (opts.reduceMotion) return undefined;

  const map: Record<KineticHoverPresetName, Record<string, number>> = {
    liftGlow: { y: -4, scale: 1.02 },
    tiltNudge: { rotateX: -4, rotateY: 4, y: -2 },
    underlineSweep: { y: -1 },
    iconWiggle: { rotate: 8, scale: 1.06 },
    magneticPull: { scale: 1.02 },
    scalePop: { scale: 1.04 },
    liftSoft: { y: -3 },
    tiltLeft: { rotate: -2, y: -2 },
    tiltRight: { rotate: 2, y: -2 },
    glowPulse: { scale: 1.02 },
  };

  return map[preset];
}

export function kineticHoverWhileForScope(
  scope: string,
  index: number,
  reduceMotion: boolean,
  pool: readonly KineticHoverPresetName[] = KINETIC_HOVER_PRESETS,
) {
  if (reduceMotion) return undefined;
  const preset = pickKineticPreset(scope, index, pool);
  return kineticHoverWhile(preset, { reduceMotion });
}

export function needsPerspective(preset: KineticEnterPresetName): boolean {
  return (
    preset === "rotateYPop" ||
    preset === "flipXSoft" ||
    preset === "flipUp3d" ||
    preset === "perspectiveSlide"
  );
}
