"use client";

import { motion } from "framer-motion";
import { useHeroMotion } from "./hero-motion-context";

export default function HeroParallaxBg() {
  const ctx = useHeroMotion();
  if (!ctx) {
    return <div className="hero-image-parallax-fill" aria-hidden />;
  }
  return <motion.div className="hero-image-parallax-fill" style={{ y: ctx.bgY, scale: ctx.bgScale }} aria-hidden />;
}
