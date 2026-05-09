"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

const DISPLAY_LEN = 7;
const PLACEHOLDER = "—";

function padVisits(n: number): string {
  const s = Math.max(0, Math.floor(Number(n))).toString();
  if (s.length >= DISPLAY_LEN) {
    return s.slice(-DISPLAY_LEN);
  }
  return s.padStart(DISPLAY_LEN, "0");
}

function DigitSlot({
  symbol,
  reducedMotion,
}: {
  symbol: string;
  reducedMotion: boolean;
}) {
  return (
    <span className="analog-visit-counter-digit" aria-hidden={symbol === PLACEHOLDER}>
      {reducedMotion ? (
        <span className="analog-visit-counter-digit-face analog-visit-counter-digit-face--static">{symbol}</span>
      ) : (
        <span className="analog-visit-counter-digit-window">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={symbol}
              className="analog-visit-counter-digit-face"
              initial={{ y: "75%" }}
              animate={{ y: 0 }}
              exit={{ y: "-75%" }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
            >
              {symbol}
            </motion.span>
          </AnimatePresence>
        </span>
      )}
    </span>
  );
}

const COUNT_DURATION_MS = 1000;
const FOOTER_SYNC_DELAY_MS = 120;

export default function AnalogVisitCounter() {
  const reducedMotion = useReducedMotion() ?? false;
  const rootRef = useRef<HTMLDivElement>(null);
  const visitsRef = useRef<number | null>(null);
  const animatingRef = useRef(false);

  const [visits, setVisits] = useState<number | null>(null);
  const [hidden, setHidden] = useState(false);
  const [revealed, setRevealed] = useState(true);
  const [footerSession, setFooterSession] = useState(0);
  const [displayVisits, setDisplayVisits] = useState(0);
  const [countAnimating, setCountAnimating] = useState(false);

  visitsRef.current = visits;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const getRes = await fetch("/api/site-visits");
        if (!getRes.ok) {
          if (getRes.status === 501) {
            if (!cancelled) setHidden(true);
          }
          return;
        }
        const getJson = (await getRes.json()) as { visits?: number };
        if (!cancelled) setVisits(typeof getJson.visits === "number" ? getJson.visits : 0);

        const postRes = await fetch("/api/site-visits", { method: "POST" });
        if (!postRes.ok) return;
        const postJson = (await postRes.json()) as { visits?: number };
        if (!cancelled && typeof postJson.visits === "number") {
          setVisits(postJson.visits);
        }
      } catch {
        if (!cancelled) setHidden(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || typeof MutationObserver === "undefined") {
      return undefined;
    }

    const scrollHero = root.closest(".scroll-hero");
    const prevAttr = { current: null as string | null };

    if (!scrollHero) {
      prevAttr.current = "1";
      setRevealed(true);
      setFooterSession((s) => s + 1);
      return undefined;
    }

    const readReveal = () => {
      const v = scrollHero.getAttribute("data-footer-reveal") ?? "0";
      const isShown = v === "1";
      setRevealed(isShown);

      const prev = prevAttr.current;
      prevAttr.current = v;
      /* First read: `prev` is null and footer can already be open (mobile). Later: bump on hide→show. */
      if (isShown && prev !== "1") {
        setFooterSession((s) => s + 1);
      }
    };

    prevAttr.current = null;
    readReveal();

    const mo = new MutationObserver(readReveal);
    mo.observe(scrollHero, { attributes: true, attributeFilter: ["data-footer-reveal"] });
    window.addEventListener("resize", readReveal, { passive: true });

    return () => {
      mo.disconnect();
      window.removeEventListener("resize", readReveal);
    };
  }, []);

  const visitsReady = visits !== null;

  useEffect(() => {
    if (!revealed || reducedMotion) return;
    if (!visitsReady) {
      animatingRef.current = false;
      setCountAnimating(false);
      return undefined;
    }

    let rafId = 0;
    let cancelled = false;

    animatingRef.current = true;
    setCountAnimating(true);

    const startTs = typeof performance !== "undefined" ? performance.now() : 0;
    setDisplayVisits(0);

    const step = (now: number) => {
      if (cancelled) return;
      const raw = visitsRef.current;
      if (raw === null) {
        animatingRef.current = false;
        setCountAnimating(false);
        return;
      }

      const elapsed = Math.max(0, now - startTs - FOOTER_SYNC_DELAY_MS);
      const t = Math.min(1, elapsed / COUNT_DURATION_MS);
      const eased = 1 - (1 - t) ** 3;
      const nextVal = Math.round(eased * raw);

      setDisplayVisits(Math.min(raw, Math.max(0, nextVal)));

      if (t < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        const finalTarget = visitsRef.current ?? raw;
        setDisplayVisits(finalTarget);
        animatingRef.current = false;
        setCountAnimating(false);
      }
    };

    rafId = requestAnimationFrame(step);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
    // Do not depend on `visits` — POST increments should not restart the roll; `visitsRef` supplies the live target.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [footerSession, visitsReady, revealed, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) {
      animatingRef.current = false;
      setCountAnimating(false);
      if (visits !== null) setDisplayVisits(visits);
      return;
    }
    if (!revealed) {
      animatingRef.current = false;
      setCountAnimating(false);
      setDisplayVisits(0);
    }
  }, [reducedMotion, revealed, visits]);

  useEffect(() => {
    if (reducedMotion || visits === null || !revealed) return;
    if (animatingRef.current) return;
    setDisplayVisits(visits);
  }, [visits, revealed, reducedMotion]);

  const chars = useMemo(() => {
    if (visits === null) {
      return Array.from({ length: DISPLAY_LEN }, () => PLACEHOLDER);
    }
    const n = revealed ? displayVisits : 0;
    return padVisits(n).split("");
  }, [visits, revealed, displayVisits]);

  const labelVisits = visits === null ? "Loading" : visits.toLocaleString();

  if (hidden) {
    return null;
  }

  return (
    <div
      ref={rootRef}
      className="analog-visit-counter"
      aria-label={`Site visits. ${labelVisits}.`}
      aria-busy={countAnimating}
      role="group"
    >
      <p className="analog-visit-counter-label">Site visits</p>
      <div
        className="analog-visit-counter-digits"
        aria-live={countAnimating || reducedMotion ? "off" : "polite"}
      >
        {chars.map((c, i) => (
          <DigitSlot key={`slot-${i}`} symbol={c} reducedMotion={reducedMotion} />
        ))}
      </div>
    </div>
  );
}
