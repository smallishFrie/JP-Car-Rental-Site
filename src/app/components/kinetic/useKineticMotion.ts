"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

export function useKineticMotion() {
  const reduceMotion = useReducedMotion() ?? false;
  const [coarsePointer, setCoarsePointer] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const update = () => setCoarsePointer(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const hoverEnabled = !reduceMotion && !coarsePointer;

  return { reduceMotion, coarsePointer, hoverEnabled };
}
