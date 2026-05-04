"use client";

import { useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { HeroMotionContext, type HeroMotionApi } from "./hero-motion-context";

type ScrollHeroProps = {
  children: React.ReactNode;
};

export default function ScrollHero({ children }: ScrollHeroProps) {
  const [heroTextColor, setHeroTextColor] = useState("#ffffff");
  const [viewportH, setViewportH] = useState(800);
  const [footerReveal, setFooterReveal] = useState(false);
  const reduceMotion = useReducedMotion();

  const { scrollY } = useScroll();

  const scrollSpan = useMemo(() => Math.max(1, viewportH), [viewportH]);

  const bgY = useTransform(scrollY, [0, scrollSpan], [0, reduceMotion ? 0 : 28]);
  const bgScale = useTransform(scrollY, [0, scrollSpan], [1, reduceMotion ? 1 : 1.024]);
  const textY = useTransform(scrollY, [0, scrollSpan], [0, reduceMotion ? 0 : -14]);

  const heroMotionValue = useMemo<HeroMotionApi>(
    () => ({
      bgY,
      bgScale,
      textY,
    }),
    [bgY, bgScale, textY],
  );

  useEffect(() => {
    const updateVh = () => setViewportH(typeof window !== "undefined" ? window.innerHeight : 800);
    updateVh();
    window.addEventListener("resize", updateVh, { passive: true });
    return () => window.removeEventListener("resize", updateVh);
  }, []);

  const syncFooterReveal = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }
    /* In-flow footer (mobile): no fixed chrome — attribute unused by CSS; keep “revealed”. */
    if (window.matchMedia("(max-width: 780px)").matches) {
      setFooterReveal(true);
      return;
    }

    const doc = document.documentElement;
    const body = document.body;
    const scrollBottom = scrollY.get() + window.innerHeight;
    const fullHeight = Math.max(doc.scrollHeight, doc.offsetHeight, body.scrollHeight, body.offsetHeight);
    /* Tight “at the end of the page” band (subpixel + browser slack). */
    const slackPx = 24;
    setFooterReveal(scrollBottom >= fullHeight - slackPx);
  }, [scrollY]);

  useLayoutEffect(() => {
    syncFooterReveal();
    const unsub = scrollY.on("change", syncFooterReveal);
    window.addEventListener("resize", syncFooterReveal, { passive: true });
    const mq = window.matchMedia("(max-width: 780px)");
    mq.addEventListener("change", syncFooterReveal);
    const ro = new ResizeObserver(() => syncFooterReveal());
    ro.observe(document.documentElement);
    ro.observe(document.body);
    return () => {
      unsub();
      window.removeEventListener("resize", syncFooterReveal);
      mq.removeEventListener("change", syncFooterReveal);
      ro.disconnect();
    };
  }, [scrollY, syncFooterReveal]);

  useEffect(() => {
    const image = new Image();
    image.src = "/hero.jpg";

    image.onload = () => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) {
        return;
      }

      const sampleWidth = 80;
      const sampleHeight = 80;
      canvas.width = sampleWidth;
      canvas.height = sampleHeight;
      context.drawImage(image, 0, 0, sampleWidth, sampleHeight);

      const imageData = context.getImageData(0, 0, sampleWidth, sampleHeight).data;
      let luminanceTotal = 0;
      const pixelCount = sampleWidth * sampleHeight;

      for (let i = 0; i < imageData.length; i += 4) {
        const r = imageData[i];
        const g = imageData[i + 1];
        const b = imageData[i + 2];
        luminanceTotal += (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      }

      const averageLuminance = luminanceTotal / pixelCount;
      setHeroTextColor(averageLuminance > 0.58 ? "#111827" : "#ffffff");
    };
  }, []);

  return (
    <HeroMotionContext.Provider value={heroMotionValue}>
      <div
        className="scroll-hero"
        data-footer-reveal={footerReveal ? "1" : "0"}
        style={
          {
            "--hero-text-color": heroTextColor,
          } as React.CSSProperties
        }
      >
        {children}
      </div>
    </HeroMotionContext.Provider>
  );
}
