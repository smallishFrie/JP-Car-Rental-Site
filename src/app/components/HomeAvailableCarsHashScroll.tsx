"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { AVAILABLE_CARS_HEADER_ID, scrollToAvailableCarsHeader } from "@/lib/scrollToAvailableCars";

/** Native `/#available-cars-header` aligns the header flush to the top; hero “Book now” uses a small offset. */
export default function HomeAvailableCarsHashScroll() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    if (pathname !== "/") {
      return;
    }
    const apply = () => {
      if (window.location.hash !== `#${AVAILABLE_CARS_HEADER_ID}`) {
        return;
      }
      scrollToAvailableCarsHeader({ behavior: "auto", variant: "hash" });
    };

    apply();
    const id = window.requestAnimationFrame(() => window.requestAnimationFrame(apply));
    /* Next can restore scroll after paint; one late pass keeps the hash target aligned. */
    const late = window.setTimeout(apply, 120);
    return () => {
      window.cancelAnimationFrame(id);
      window.clearTimeout(late);
    };
  }, [pathname]);

  return null;
}
