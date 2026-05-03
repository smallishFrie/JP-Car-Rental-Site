"use client";

import { useEffect, useRef, useState } from "react";

export type RevealVariant = "fadeUp" | "slideLeft" | "scaleFade";

type RevealOnScrollProps = {
  children: React.ReactNode;
  className?: string;
  /** Default `fadeUp` matches legacy `.reveal-on-scroll` motion. */
  variant?: RevealVariant;
};

const variantClass: Record<Exclude<RevealVariant, "fadeUp">, string> = {
  slideLeft: "reveal-on-scroll--slide-left",
  scaleFade: "reveal-on-scroll--scale-fade",
};

export default function RevealOnScroll({ children, className, variant = "fadeUp" }: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const el = ref.current;
    if (!el) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -5% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const modifier = variant !== "fadeUp" ? variantClass[variant] : "";
  const classes = ["reveal-on-scroll", modifier, revealed ? "is-revealed" : "", className].filter(Boolean).join(" ");

  return (
    <div ref={ref} className={classes}>
      {children}
    </div>
  );
}
