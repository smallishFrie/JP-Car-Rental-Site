"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motionEase } from "@/lib/motion";

type HomeScrollHeaderProps = {
  children: React.ReactNode;
};

export default function HomeScrollHeader({ children }: HomeScrollHeaderProps) {
  const reduceMotion = useReducedMotion();
  const chromeRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [edgeEngaged, setEdgeEngaged] = useState(false);
  const [pastCars, setPastCars] = useState(false);
  const [headerBlockPx, setHeaderBlockPx] = useState(64);

  const updatePastCars = useCallback(() => {
    const header = document.getElementById("available-cars-header");
    if (!(header instanceof HTMLElement)) {
      setPastCars(false);
      return;
    }
    const chrome = chromeRef.current;
    const threshold =
      chrome instanceof HTMLElement ? Math.ceil(chrome.getBoundingClientRect().height) : 44;
    const { bottom } = header.getBoundingClientRect();
    /* Stay hidden at the "Book now" scroll target (block peeking under the strip). Open only after the
       whole title + subtitle block has scrolled up past the sticky chrome band. */
    setPastCars(bottom <= threshold);
  }, []);

  useEffect(() => {
    updatePastCars();
    window.addEventListener("scroll", updatePastCars, { passive: true });
    window.addEventListener("resize", updatePastCars, { passive: true });
    return () => {
      window.removeEventListener("scroll", updatePastCars);
      window.removeEventListener("resize", updatePastCars);
    };
  }, [updatePastCars]);

  const open = pastCars || edgeEngaged;

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) {
      return;
    }

    const measure = () => {
      const inner = panel.querySelector(".site-header");
      const h =
        inner instanceof HTMLElement ? Math.ceil(inner.offsetHeight) : Math.ceil(panel.offsetHeight);
      setHeaderBlockPx(Math.max(48, h));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(panel);
    return () => ro.disconnect();
  }, [children]);

  const handleChromeBlur = (event: React.FocusEvent) => {
    if (pastCars) {
      return;
    }
    const next = event.relatedTarget as Node | null;
    if (!chromeRef.current?.contains(next)) {
      setEdgeEngaged(false);
    }
  };

  /* Tween avoids spring overshoot (felt like the hero “jumped” with the bar when layout reflowed). */
  const transition = reduceMotion === true ? { duration: 0 } : { duration: 0.34, ease: motionEase };

  const hideOffset = headerBlockPx + 2;

  const panelAnimate =
    reduceMotion === true
      ? { y: 0, opacity: open ? 1 : 0 }
      : { y: open ? 0 : -hideOffset, opacity: 1 };

  return (
    <div
      ref={chromeRef}
      className={`home-header-chrome${open ? " home-header-chrome--open" : ""}`}
      onBlurCapture={handleChromeBlur}
      onMouseLeave={() => {
        if (!pastCars) {
          setEdgeEngaged(false);
        }
      }}
    >
      <div className="home-header-chrome-stack">
        <motion.div
          ref={panelRef}
          className="home-header-motion-panel"
          initial={false}
          animate={panelAnimate}
          transition={transition}
          style={{ pointerEvents: open ? "auto" : "none" }}
          onMouseEnter={() => setEdgeEngaged(true)}
        >
          {children}
        </motion.div>
        {!open ? (
          <div
            className="home-header-edge-hit"
            onMouseEnter={() => setEdgeEngaged(true)}
            onFocus={() => setEdgeEngaged(true)}
            tabIndex={0}
            aria-label="Show site navigation"
          />
        ) : null}
      </div>
    </div>
  );
}
