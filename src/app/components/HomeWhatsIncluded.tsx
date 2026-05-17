"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  revealListContainerVariants,
  revealListItemVariants,
  revealReducedItem,
  revealReducedStaggerContainer,
} from "@/lib/motion";

const INCLUDED: { title: string; text: string; icon: ReactNode }[] = [
  {
    title: "Daily rate (PHP at checkout)",
    text: "Switch display currency in the header for a rough equivalent. Pricing updates with the vehicle and dates you pick—no mystery subtotal.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    title: "Total before you pay",
    text: "Trip cost updates live as you adjust dates so you always approve the same number at checkout.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    title: "Secure checkout",
    text: "Payments run through our partner (Xendit) on an encrypted flow—never emailed card numbers.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Booking in your account",
    text: "After sign-in, revisit confirmations and trip details whenever you need them.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

export default function HomeWhatsIncluded() {
  const reduce = useReducedMotion();
  const item = reduce ? revealReducedItem : revealListItemVariants;
  const gridStagger = reduce ? revealReducedStaggerContainer : revealListContainerVariants;

  return (
    <section className="home-bottom-section home-included" aria-labelledby="home-included-heading">
      <motion.div
        className="home-included-reveal"
        initial={reduce ? false : "hidden"}
        whileInView="visible"
        viewport={{ once: true, amount: 0.1, margin: "0px 0px -5% 0px" }}
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
        }}
      >
        <motion.h2 className="home-section-heading" id="home-included-heading" variants={item}>
          What&apos;s included in the rate
        </motion.h2>
        <motion.p className="home-included-subline" variants={item}>
          Four things you get on every quote—then the fine print lives where you book.
        </motion.p>

        <motion.div className="home-included-grid" variants={gridStagger}>
          {INCLUDED.map((itemData) => (
            <motion.article key={itemData.title} className="home-included-card" variants={item}>
              <div className="home-included-icon">{itemData.icon}</div>
              <h3 className="home-included-card-title">{itemData.title}</h3>
              <p className="home-included-card-text">{itemData.text}</p>
            </motion.article>
          ))}
        </motion.div>

        <motion.aside className="home-included-callout" aria-label="Additional charges" variants={item}>
          <div className="home-included-callout-icon" aria-hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
          </div>
          <p>
            <strong>Mileage, fuel, tolls, and add-ons</strong> are itemized on each car page and again at checkout—nothing
            hidden for pickup day.
          </p>
        </motion.aside>
      </motion.div>
    </section>
  );
}
