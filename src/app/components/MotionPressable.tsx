"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import Link from "next/link";
import { motionTweens } from "@/lib/motion";

const MotionLink = motion(Link);

export type MotionPressableButtonProps = HTMLMotionProps<"button">;

/** Primary CTAs: tween hover/tap; respects reduced motion. */
export function MotionPressableButton({ className, disabled, type = "button", ...rest }: MotionPressableButtonProps) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      type={type}
      className={className}
      disabled={disabled}
      whileHover={reduce || disabled ? undefined : { scale: 1.01 }}
      whileTap={reduce || disabled ? undefined : { scale: 0.99 }}
      transition={motionTweens.hover}
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
      whileHover={reduce ? undefined : { scale: 1.01 }}
      whileTap={reduce ? undefined : { scale: 0.99 }}
      transition={motionTweens.hover}
      {...rest}
    />
  );
}
