"use client";

import { motion, useReducedMotion } from "framer-motion";

const easeOut = [0.22, 1, 0.36, 1] as const;

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
      transition={{ duration: reduceMotion ? 0 : 0.48, ease: easeOut }}
    >
      {children}
    </motion.div>
  );
}
