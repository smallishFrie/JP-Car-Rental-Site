"use client";

import { createContext, useContext } from "react";
import type { MotionValue } from "framer-motion";

export type HeroMotionApi = {
  bgY: MotionValue<number>;
  bgScale: MotionValue<number>;
  textY: MotionValue<number>;
};

export const HeroMotionContext = createContext<HeroMotionApi | null>(null);

export function useHeroMotion(): HeroMotionApi | null {
  return useContext(HeroMotionContext);
}
