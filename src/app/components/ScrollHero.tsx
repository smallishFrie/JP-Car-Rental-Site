"use client";

import { useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { HeroMotionContext, type HeroMotionApi } from "./hero-motion-context";

type ScrollHeroProps = {
  children: React.ReactNode;
};

export default function ScrollHero({ children }: ScrollHeroProps) {
  const scrollRootRef = useRef<HTMLDivElement>(null);
  const headerMouseOverrideRef = useRef(false);
  const footerMouseOverrideRef = useRef(false);

  const [heroTextColor, setHeroTextColor] = useState("#ffffff");
  const [viewportH, setViewportH] = useState(800);
  const reduceMotion = useReducedMotion();

  const { scrollY } = useScroll();

  const scrollSpan = useMemo(() => Math.max(1, viewportH), [viewportH]);

  const bgY = useTransform(scrollY, [0, scrollSpan], [0, reduceMotion ? 0 : 36]);
  const bgScale = useTransform(scrollY, [0, scrollSpan], [1, reduceMotion ? 1 : 1.045]);
  const textY = useTransform(scrollY, [0, scrollSpan], [0, reduceMotion ? 0 : -16]);

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

  useEffect(() => {
    const footerActivationMargin = 90;
    const footerNearBottomPx = 420;
    const headerRevealOffsetPx = 0;

    const documentScrollTop = () => scrollY.get() || document.documentElement.scrollTop || 0;

    const headerAccessDepthPx = () => {
      const headerEl = document.querySelector<HTMLElement>(".site-header");
      const h = headerEl?.offsetHeight;
      if (typeof h === "number" && h > 0) {
        return Math.min(200, Math.max(80, h + 28));
      }
      return 112;
    };

    const evaluateHeaderFromLayout = () => {
      const headerScrollTarget =
        document.getElementById("available-cars-header") ??
        document.getElementById("available-cars-scroll-mark");
      if (headerScrollTarget) {
        return headerScrollTarget.getBoundingClientRect().top <= headerRevealOffsetPx;
      }
      return documentScrollTop() >= window.innerHeight;
    };

    const evaluateFooterVisibility = () => {
      const root = document.documentElement;
      const threshold = 80;
      if (root.scrollHeight <= root.clientHeight + 8) {
        return true;
      }
      const y = documentScrollTop();
      return y + window.innerHeight >= root.scrollHeight - threshold;
    };

    const applyChrome = () => {
      const header = headerMouseOverrideRef.current ? true : evaluateHeaderFromLayout();
      const footer = footerMouseOverrideRef.current ? true : evaluateFooterVisibility();
      const el = scrollRootRef.current;
      if (el) {
        el.style.setProperty("--header-visible", header ? "1" : "0");
        el.style.setProperty("--footer-visible", footer ? "1" : "0");
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      const innerH = window.innerHeight;
      const root = document.documentElement;
      const y = documentScrollTop();
      const distanceFromBottom = root.scrollHeight - (y + innerH);
      const isNearDocumentBottom = distanceFromBottom <= footerNearBottomPx;

      const headerEl = document.querySelector<HTMLElement>(".site-header");
      const isHoveringHeader = headerEl?.matches(":hover") ?? false;
      const isInHeaderAccessZone = event.clientY <= headerAccessDepthPx() || isHoveringHeader;
      if (isInHeaderAccessZone && !headerMouseOverrideRef.current) {
        headerMouseOverrideRef.current = true;
      } else if (!isInHeaderAccessZone && headerMouseOverrideRef.current) {
        headerMouseOverrideRef.current = false;
      }

      const isInFooterAccessZone = event.clientY >= innerH - footerActivationMargin;
      if (isInFooterAccessZone && isNearDocumentBottom && !footerMouseOverrideRef.current) {
        footerMouseOverrideRef.current = true;
      } else if ((!isInFooterAccessZone || !isNearDocumentBottom) && footerMouseOverrideRef.current) {
        footerMouseOverrideRef.current = false;
      }

      applyChrome();
    };

    const unsubscribeScrollY = scrollY.on("change", applyChrome);

    const headerScrollTarget =
      document.getElementById("available-cars-header") ??
      document.getElementById("available-cars-scroll-mark");
    let intersectionObserver: IntersectionObserver | undefined;
    if (headerScrollTarget) {
      intersectionObserver = new IntersectionObserver(() => {
        applyChrome();
      }, { threshold: [0, 0.01, 0.25, 0.5, 0.75, 1] });
      intersectionObserver.observe(headerScrollTarget);
    }

    window.addEventListener("scroll", applyChrome, { passive: true });
    document.addEventListener("pointermove", handlePointerMove, { passive: true, capture: true });
    window.visualViewport?.addEventListener("scroll", applyChrome, { passive: true });
    window.visualViewport?.addEventListener("resize", applyChrome, { passive: true });

    applyChrome();

    return () => {
      unsubscribeScrollY();
      intersectionObserver?.disconnect();
      window.removeEventListener("scroll", applyChrome);
      document.removeEventListener("pointermove", handlePointerMove, true);
      window.visualViewport?.removeEventListener("scroll", applyChrome);
      window.visualViewport?.removeEventListener("resize", applyChrome);
    };
  }, [scrollY]);

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
        ref={scrollRootRef}
        className="scroll-hero"
        style={
          {
            /* Header/footer visibility vars are driven imperatively in an effect so React
               reconciliation cannot fight scroll-driven updates. Defaults come from `.scroll-hero`. */
            "--hero-text-color": heroTextColor,
          } as React.CSSProperties
        }
      >
        {children}
      </div>
    </HeroMotionContext.Provider>
  );
}
