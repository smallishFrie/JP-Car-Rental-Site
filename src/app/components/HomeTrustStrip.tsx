"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { KineticHover, KineticItem, KineticReveal, KineticStagger } from "@/app/components/kinetic";
import {
  HOME_SECTION_PRESETS,
  HOME_TRUST_HOVER_PRESETS,
  KINETIC_TRUST_CARD_PRESETS,
  homePresetAt,
} from "@/lib/kinetic-presets";
import { motionStagger } from "@/lib/motion";
import TiltSurface from "./TiltSurface";

const TRUST_CARDS = [
  {
    title: "Simple online booking",
    text: "Reserve from your phone or laptop with an account you can return to anytime.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Flexible pickup locations",
    text: "Choose the spot that fits your trip—office, airport, or city drop point when you book.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    title: "Trip history in one place",
    text: "Signed-in customers can review past and upcoming rentals from their account.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 6h13" />
        <path d="M8 12h13" />
        <path d="M8 18h13" />
        <path d="M3 6h.01" />
        <path d="M3 12h.01" />
        <path d="M3 18h.01" />
      </svg>
    ),
  },
] as const;

export default function HomeTrustStrip() {
  return (
    <section className="home-trust" aria-labelledby="home-trust-heading">
      <KineticStagger className="home-trust-reveal">
        <KineticReveal as="motion.h2" className="home-trust-heading" id="home-trust-heading" preset={HOME_SECTION_PRESETS.trustHeading} inView={false}>
          Why renters choose JP
        </KineticReveal>
        <motion.div
          className="home-trust-grid"
          variants={{ hidden: {}, visible: { transition: motionStagger.section } }}
        >
          {TRUST_CARDS.map((card, i) => (
            <KineticItem
              key={card.title}
              as="motion.div"
              className="home-trust-card-tilt-shell"
              preset={homePresetAt(KINETIC_TRUST_CARD_PRESETS, i)}
            >
              <KineticHover preset={HOME_TRUST_HOVER_PRESETS[i % HOME_TRUST_HOVER_PRESETS.length]}>
                <TiltSurface maxTilt={4}>
                  <article className="home-trust-card">
                    <motion.div className="home-trust-icon" aria-hidden>
                      {card.icon}
                    </motion.div>
                    <h3 className="home-trust-title">{card.title}</h3>
                    <p className="home-trust-text">{card.text}</p>
                  </article>
                </TiltSurface>
              </KineticHover>
            </KineticItem>
          ))}
        </motion.div>
        <KineticReveal
          as="motion.div"
          className="home-trust-spotlight"
          preset="driftInLeft"
          inView={false}
        >
          <div className="home-trust-spotlight-inner">
            <div className="home-trust-spotlight-copy">
              <p className="home-trust-spotlight-text">
                Experience convenience, comfort, and confidence every time you rent with us. From compact city cars to
                luxury SUVs, we provide vehicles that match your lifestyle and travel needs. With quick booking,
                flexible rental plans, and dependable customer support, your perfect drive is always just a few clicks
                away.
              </p>
            </div>
            <figure className="home-trust-spotlight-media">
              <Image
                src="/images/rental-luggage.png"
                alt="Traveler loading luggage into a rental car"
                width={800}
                height={530}
                className="home-trust-spotlight-img"
                sizes="(max-width: 768px) 100vw, min(520px, 46vw)"
              />
            </figure>
          </div>
        </KineticReveal>
      </KineticStagger>
    </section>
  );
}
