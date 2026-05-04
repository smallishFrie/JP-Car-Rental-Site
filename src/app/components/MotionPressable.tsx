"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import Link from "next/link";
import { motionSprings } from "@/lib/motion";

const MotionLink = motion(Link);

export type MotionPressableButtonProps = HTMLMotionProps<"button">;

/** Primary CTAs: spring hover/tap; respects reduced motion. */
export function MotionPressableButton({ className, disabled, type = "button", ...rest }: MotionPressableButtonProps) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      type={type}
      className={className}
      disabled={disabled}
      whileHover={reduce || disabled ? undefined : { scale: 1.02 }}
      whileTap={reduce || disabled ? undefined : { scale: 0.97 }}
      transition={motionSprings.snappy}
      {...rest}
    />
  );
}

export type MotionPressableLinkProps = HTMLMotionProps<"a"> & {
  href: string;
};

export function MotionPressableLink({ className, href, ...rest }: MotionPressableLinkProps) {
  const reduce = useReducedMotion();
  return (
    <MotionLink
      href={href}
      className={className}
      whileHover={reduce ? undefined : { scale: 1.02 }}
      whileTap={reduce ? undefined : { scale: 0.97 }}
      transition={motionSprings.snappy}
      {...rest}
    />
  );
}
