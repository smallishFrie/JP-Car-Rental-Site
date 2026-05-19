"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import {
  kineticEnterVariants,
  kineticEnterVariantsForScope,
  kineticReducedVariants,
  KINETIC_CALM_ENTER_PRESETS,
  KINETIC_ENTER_PRESETS,
  type KineticEnterPresetName,
} from "@/lib/kinetic-presets";
import { useKineticMotion } from "./useKineticMotion";

type KineticItemProps = {
  children: React.ReactNode;
  className?: string;
  scope: string;
  index?: number;
  calm?: boolean;
  preset?: KineticEnterPresetName;
  as?: "motion.li" | "motion.div" | "motion.article" | "motion.span" | "motion.p";
};

const motionTags = {
  "motion.li": motion.li,
  "motion.div": motion.div,
  "motion.article": motion.article,
  "motion.span": motion.span,
  "motion.p": motion.p,
} as const;

/** Stagger child — pair with `KineticStagger`. */
export default function KineticItem({
  children,
  className,
  scope,
  index = 0,
  calm = false,
  preset,
  as = "motion.div",
}: KineticItemProps) {
  const { reduceMotion } = useKineticMotion();

  const variants = useMemo(() => {
    if (reduceMotion) return kineticReducedVariants;
    if (preset) return kineticEnterVariants(preset, false);
    const pool = calm ? KINETIC_CALM_ENTER_PRESETS : KINETIC_ENTER_PRESETS;
    return kineticEnterVariantsForScope(scope, index, false, pool);
  }, [reduceMotion, scope, index, calm, preset]);

  const Component = motionTags[as];

  return (
    <Component className={className} variants={variants}>
      {children}
    </Component>
  );
}
