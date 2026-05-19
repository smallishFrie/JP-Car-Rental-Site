"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { ContactOptionPublic } from "@/lib/contact-options-types";
import { KineticHover, KineticItem, KineticReveal, KineticStagger } from "@/app/components/kinetic";
import {
  HOME_CONTACT_CARD_PRESETS,
  HOME_SECTION_PRESETS,
  homePresetAt,
} from "@/lib/kinetic-presets";
import HomeContactChannels from "./HomeContactChannels";

type HomeContactStripClientProps = {
  isSignedIn: boolean;
  contactChannels: ContactOptionPublic[];
};

export default function HomeContactStripClient({ isSignedIn, contactChannels }: HomeContactStripClientProps) {
  const cards = [
    {
      label: "Hours",
      body: "Mon–Sat 8:00 a.m.–6:00 p.m. · Sunday by appointment. Pickup and return times are confirmed with each booking.",
    },
    {
      label: "After you book",
      body: "Your confirmation email includes pickup instructions and the best way to reach us for that reservation.",
    },
    {
      label: "Account",
      body: "Signed-in customers can review trips and messages in one place.",
      link: !isSignedIn ? { href: "/auth/sign-in", label: "Sign in" } : null,
    },
  ];

  return (
    <KineticStagger>
      <KineticReveal
        as="motion.h2"
        className="home-section-heading"
        id="home-contact-heading"
        preset={HOME_SECTION_PRESETS.contactHeading}
        inView={false}
      >
        Contact &amp; hours
      </KineticReveal>
      <motion.div
        className="home-contact-grid"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } }}
      >
        {cards.map((card, i) => (
          <KineticItem
            key={card.label}
            as="motion.div"
            className="home-contact-card"
            preset={homePresetAt(HOME_CONTACT_CARD_PRESETS, i)}
          >
            <p className="home-contact-label">{card.label}</p>
            <p className="home-contact-body">{card.body}</p>
            {card.link ? (
              <KineticHover preset="underlineSweep">
                <Link href={card.link.href} className="home-contact-link kinetic-link-sweep">
                  {card.link.label}
                </Link>
              </KineticHover>
            ) : null}
          </KineticItem>
        ))}
      </motion.div>
      {contactChannels.length > 0 ? <HomeContactChannels channels={contactChannels} /> : null}
    </KineticStagger>
  );
}
