"use client";

import { motion, useReducedMotion } from "framer-motion";

import { motionDurations, motionEase } from "@/lib/motion";

type AuthShellMotionProps = {
  children: React.ReactNode;
};

export default function AuthShellMotion({ children }: AuthShellMotionProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="auth-shell-reveal"
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : motionDurations.section, ease: motionEase.out }}
    >
      {children}
    </motion.div>
  );
}
