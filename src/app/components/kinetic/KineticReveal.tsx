"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import {
  kineticEnterVariants,
  kineticEnterVariantsForScope,
  kineticReducedVariants,
  needsPerspective,
  pickKineticPreset,
  KINETIC_CALM_ENTER_PRESETS,
  KINETIC_ENTER_PRESETS,
  type KineticEnterPresetName,
} from "@/lib/kinetic-presets";
import { kineticViewportDefaults } from "@/lib/motion";
import { useKineticMotion } from "./useKineticMotion";

type KineticRevealProps = {
  children: React.ReactNode;
  className?: string;
  id?: string;
  "aria-label"?: string;
  as?: "motion.div" | "motion.section" | "motion.article" | "motion.aside" | "motion.li" | "motion.span" | "motion.p" | "motion.h2" | "motion.h3";
  preset?: KineticEnterPresetName;
  scope?: string;
  index?: number;
  delay?: number;
  once?: boolean;
  amount?: number | "some" | "all";
  margin?: string;
  /** Use calmer presets for forms / checkout. */
  calm?: boolean;
  /** When false, skip `whileInView` (use inside `KineticStagger` children). */
  inView?: boolean;
};

const motionTags = {
  "motion.div": motion.div,
  "motion.section": motion.section,
  "motion.article": motion.article,
  "motion.aside": motion.aside,
  "motion.li": motion.li,
  "motion.span": motion.span,
  "motion.p": motion.p,
  "motion.h2": motion.h2,
  "motion.h3": motion.h3,
} as const;

export default function KineticReveal({
  children,
  className,
  id,
  "aria-label": ariaLabel,
  as = "motion.div",
  preset,
  scope,
  index = 0,
  delay = 0,
  once = kineticViewportDefaults.once,
  amount = kineticViewportDefaults.amount,
  margin = kineticViewportDefaults.margin,
  calm = false,
  inView = true,
}: KineticRevealProps) {
  const { reduceMotion } = useKineticMotion();

  const resolvedPreset = useMemo((): KineticEnterPresetName => {
    if (preset) return preset;
    if (scope) return pickKineticPreset(scope, index, calm ? KINETIC_CALM_ENTER_PRESETS : KINETIC_ENTER_PRESETS);
    return "fadeUpSharp";
  }, [preset, scope, index]);

  const variants = useMemo(() => {
    if (reduceMotion) return kineticReducedVariants;
    if (preset) return kineticEnterVariants(preset, false, delay);
    if (scope) {
      return kineticEnterVariantsForScope(scope, index, false, calm ? KINETIC_CALM_ENTER_PRESETS : undefined, delay);
    }
    return kineticEnterVariants("fadeUpSharp", false, delay);
  }, [reduceMotion, preset, scope, index, delay]);

  const viewport = useMemo(() => ({ once, amount, margin }), [once, amount, margin]);

  const style = !reduceMotion && needsPerspective(resolvedPreset) ? ({ perspective: 1200 } as const) : undefined;

  const Component = motionTags[as];

  const animateProps = inView
    ? { initial: reduceMotion ? false : ("hidden" as const), whileInView: "visible" as const, viewport }
    : {};

  return (
    <Component id={id} aria-label={ariaLabel} className={className} style={style} variants={variants} {...animateProps}>
      {children}
    </Component>
  );
}
