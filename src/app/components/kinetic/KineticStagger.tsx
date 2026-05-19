"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import {
  kineticReducedStaggerContainer,
  kineticStaggerContainer,
} from "@/lib/kinetic-presets";
import { kineticViewportDefaults } from "@/lib/motion";
import { useKineticMotion } from "./useKineticMotion";

type KineticStaggerProps = {
  children: React.ReactNode;
  className?: string;
  as?: "motion.div" | "motion.ul" | "motion.ol" | "motion.section";
  once?: boolean;
  amount?: number | "some" | "all";
  margin?: string;
};

const motionTags = {
  "motion.div": motion.div,
  "motion.ul": motion.ul,
  "motion.ol": motion.ol,
  "motion.section": motion.section,
} as const;

export default function KineticStagger({
  children,
  className,
  as = "motion.div",
  once = kineticViewportDefaults.once,
  amount = kineticViewportDefaults.amount,
  margin = kineticViewportDefaults.margin,
}: KineticStaggerProps) {
  const { reduceMotion } = useKineticMotion();

  const variants = useMemo(
    () => (reduceMotion ? kineticReducedStaggerContainer : kineticStaggerContainer),
    [reduceMotion],
  );

  const viewport = useMemo(() => ({ once, amount, margin }), [once, amount, margin]);

  const Component = motionTags[as];

  return (
    <Component
      className={className}
      variants={variants}
      initial={reduceMotion ? false : "hidden"}
      whileInView="visible"
      viewport={viewport}
    >
      {children}
    </Component>
  );
}
