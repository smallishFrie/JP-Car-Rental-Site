"use client";

import { useEffect, useRef, useState } from "react";

/** Toggles `kinetic-section--live` when the section intersects the viewport (pauses CSS marquees/grain off-screen). */
export function useKineticSectionLive<T extends HTMLElement = HTMLElement>(rootMargin = "0px 0px 12% 0px") {
  const ref = useRef<T>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) setLive(entry.isIntersecting);
      },
      { rootMargin, threshold: 0.05 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return { ref, liveClass: live ? " kinetic-section--live" : "" };
}
