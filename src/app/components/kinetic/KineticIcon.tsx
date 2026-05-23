"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { kineticEnterVariantsForScope, kineticReducedVariants } from "@/lib/kinetic-presets";
import { motionTweens } from "@/lib/motion";
import { useKineticMotion } from "./useKineticMotion";

type KineticIconProps = {
  children: React.ReactNode;
  className?: string;
  scope: string;
  index?: number;
  /** When false, rely on parent stagger (no nested observer). */
  inView?: boolean;
};

/** Wraps an icon container; animates enter on scroll. SVG draw handled via CSS class on child paths when needed. */
export default function KineticIcon({ children, className, scope, index = 0, inView = true }: KineticIconProps) {
  const { reduceMotion, hoverEnabled } = useKineticMotion();

  const variants = useMemo(() => {
    if (reduceMotion) return kineticReducedVariants;
    return kineticEnterVariantsForScope(scope, index, false);
  }, [reduceMotion, scope, index]);

  const animateProps = inView
    ? { initial: reduceMotion ? false : ("hidden" as const), whileInView: "visible" as const, viewport: { once: true, amount: 0.2 } }
    : { initial: reduceMotion ? false : ("hidden" as const), animate: "visible" as const };

  return (
    <motion.span
      className={className}
      variants={variants}
      {...animateProps}
      whileHover={
        reduceMotion || !hoverEnabled
          ? undefined
          : {
              rotate: 8,
              scale: 1.08,
              transition: motionTweens.hover,
            }
      }
      style={{ display: "inline-flex" }}
    >
      {children}
    </motion.span>
  );
}
