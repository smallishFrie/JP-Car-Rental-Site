"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionStyle,
} from "framer-motion";
import { motionSprings } from "@/lib/motion";
import { useCallback, useRef } from "react";

type TiltSurfaceProps = {
  children: React.ReactNode;
  className?: string;
  /** Max tilt in degrees (pointer-driven). */
  maxTilt?: number;
  /** Show subtle moving glare (pointer-driven). */
  glare?: boolean;
};

/**
 * 3D tilt + optional gradient glare. Pointer only; disabled for reduced motion / coarse pointer.
 */
export default function TiltSurface({ children, className, maxTilt = 5, glare = true }: TiltSurfaceProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, motionSprings.tilt);
  const sy = useSpring(my, motionSprings.tilt);

  const rotateX = useTransform(sy, [-0.5, 0.5], [maxTilt, -maxTilt]);
  const rotateY = useTransform(sx, [-0.5, 0.5], [-maxTilt, maxTilt]);

  const glareX = useTransform(sx, [-0.5, 0.5], [18, 82]);
  const glareY = useTransform(sy, [-0.5, 0.5], [18, 82]);
  const glareBackground = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, color-mix(in srgb, var(--accent) 24%, transparent), transparent 58%)`;

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (reduce) return;
      if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) return;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      mx.set(Math.max(-0.5, Math.min(0.5, px)));
      my.set(Math.max(-0.5, Math.min(0.5, py)));
    },
    [mx, my, reduce],
  );

  const onPointerLeave = useCallback(() => {
    mx.set(0);
    my.set(0);
  }, [mx, my]);

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  const style: MotionStyle = {
    position: "relative",
    rotateX,
    rotateY,
    transformStyle: "preserve-3d",
    transformPerspective: 900,
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      {glare ? (
        <motion.span aria-hidden className="tilt-surface-glare" style={{ background: glareBackground }} />
      ) : null}
      <div style={{ position: "relative", zIndex: 2, transform: "translateZ(0)" }}>{children}</div>
    </motion.div>
  );
}
