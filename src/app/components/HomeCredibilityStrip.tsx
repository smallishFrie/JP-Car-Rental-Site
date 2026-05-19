"use client";

import { motion } from "framer-motion";
import { KineticIcon, KineticItem, KineticStagger } from "@/app/components/kinetic";
import { KINETIC_CREDIBILITY_PRESETS, homePresetAt } from "@/lib/kinetic-presets";

const CREDIBILITY_ITEMS = [
  {
    label: "Book online in minutes",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    label: "PHP checkout, optional currency view",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    label: "Trips saved to your account",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
] as const;

export default function HomeCredibilityStrip() {
  return (
    <section className="home-credibility" aria-label="At a glance">
      <KineticStagger className="home-credibility-reveal">
        <motion.ul
          className="home-credibility-row"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } }}
        >
          {CREDIBILITY_ITEMS.map((item, i) => (
            <KineticItem
              key={item.label}
              as="motion.li"
              className="home-credibility-item"
              preset={homePresetAt(KINETIC_CREDIBILITY_PRESETS, i)}
            >
              <KineticIcon className="home-credibility-icon" scope="credibility-icon" index={i} inView={false}>
                {item.icon}
              </KineticIcon>
              <span className="home-credibility-label">{item.label}</span>
            </KineticItem>
          ))}
        </motion.ul>
      </KineticStagger>
    </section>
  );
}
