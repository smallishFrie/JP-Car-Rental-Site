"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import { revealParentVariants, type RevealVariantName } from "@/lib/motion";

export type RevealVariant = RevealVariantName;

type RevealOnScrollProps = {
  children: React.ReactNode;
  className?: string;
  /** Default matches legacy fade-up reveal. */
  variant?: RevealVariant;
  /** Delay before reveal (seconds). */
  delay?: number;
  once?: boolean;
  /** Intersection ratio or preset for `viewport.amount`. */
  amount?: number | "some" | "all";
  /** `viewport.margin` (Framer Motion). */
  margin?: string;
};

export default function RevealOnScroll({
  children,
  className,
  variant = "fadeUp",
  delay = 0,
  once = true,
  amount = 0.12,
  margin = "0px 0px -5% 0px",
}: RevealOnScrollProps) {
  const reduceMotion = useReducedMotion();
  const variants = useMemo(() => revealParentVariants(variant, reduceMotion, delay), [variant, reduceMotion, delay]);

  const viewport = useMemo(() => ({ once, amount, margin }), [once, amount, margin]);

  const perspectiveStyle = variant === "flipUp3d" ? ({ perspective: 1200 } as const) : undefined;

  return (
    <motion.div
      className={className}
      style={perspectiveStyle}
      variants={variants}
      initial={reduceMotion ? false : "hidden"}
      whileInView="visible"
      viewport={viewport}
    >
      {children}
    </motion.div>
  );
}
