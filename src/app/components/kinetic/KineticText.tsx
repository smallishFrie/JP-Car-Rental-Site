"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import {
  kineticEnterVariantsForScope,
  kineticReducedVariants,
} from "@/lib/kinetic-presets";
import { kineticSprings } from "@/lib/motion";
import { useKineticMotion } from "./useKineticMotion";

type KineticTextProps = {
  text: string;
  className?: string;
  as?: "motion.span" | "motion.p" | "motion.h1" | "motion.h2";
  scope: string;
  split?: "words" | "chars";
};

const motionTags = {
  "motion.span": motion.span,
  "motion.p": motion.p,
  "motion.h1": motion.h1,
  "motion.h2": motion.h2,
} as const;

export default function KineticText({
  text,
  className,
  as = "motion.span",
  scope,
  split = "words",
}: KineticTextProps) {
  const { reduceMotion } = useKineticMotion();
  const tokens = useMemo(
    () => (split === "chars" ? text.split("") : text.split(/\s+/).filter(Boolean)),
    [text, split],
  );

  const containerVariants = useMemo(
    () =>
      reduceMotion
        ? kineticReducedVariants
        : {
            hidden: {},
            visible: {
              transition: { staggerChildren: 0.04, delayChildren: 0.02 },
            },
          },
    [reduceMotion],
  );

  const Component = motionTags[as];

  if (reduceMotion) {
    return <Component className={className}>{text}</Component>;
  }

  return (
    <Component
      className={className}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
    >
      {tokens.map((token, i) => {
        const itemVariants = kineticEnterVariantsForScope(`${scope}-token`, i, false);
        return (
          <motion.span
            key={`${scope}-${i}-${token}`}
            variants={itemVariants}
            style={{ display: "inline-block", marginRight: split === "words" ? "0.22em" : undefined }}
            transition={kineticSprings.snap}
          >
            {token}
            {split === "chars" ? null : null}
          </motion.span>
        );
      })}
    </Component>
  );
}
