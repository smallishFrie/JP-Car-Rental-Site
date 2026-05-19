"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { useMemo } from "react";
import {
  kineticHoverWhile,
  kineticHoverWhileForScope,
  type KineticHoverPresetName,
} from "@/lib/kinetic-presets";
import { motionSprings } from "@/lib/motion";
import { useKineticMotion } from "./useKineticMotion";

type KineticHoverProps = HTMLMotionProps<"div"> & {
  children: React.ReactNode;
  preset?: KineticHoverPresetName;
  scope?: string;
  index?: number;
};

export default function KineticHover({
  children,
  className,
  preset,
  scope,
  index = 0,
  ...rest
}: KineticHoverProps) {
  const { hoverEnabled, reduceMotion } = useKineticMotion();

  const whileHover = useMemo(() => {
    if (!hoverEnabled) return undefined;
    if (preset) return kineticHoverWhile(preset, { reduceMotion });
    if (scope) return kineticHoverWhileForScope(scope, index, reduceMotion);
    return kineticHoverWhile("liftSoft", { reduceMotion });
  }, [hoverEnabled, reduceMotion, preset, scope, index]);

  return (
    <motion.div
      className={className}
      whileHover={whileHover}
      whileTap={hoverEnabled ? { scale: 0.98 } : undefined}
      transition={motionSprings.snappy}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
