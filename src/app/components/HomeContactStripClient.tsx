"use client";

import Link from "next/link";
import type { ContactOptionPublic } from "@/lib/contact-options-types";
import { KineticHover, KineticItem, KineticReveal, KineticStagger } from "@/app/components/kinetic";
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
      <KineticReveal scope="contact-heading" index={0} preset="slideMagnetLeft">
        <h2 className="home-section-heading" id="home-contact-heading">
          Contact &amp; hours
        </h2>
      </KineticReveal>
      <div className="home-contact-grid">
        {cards.map((card, i) => (
          <KineticItem key={card.label} scope="contact-card" index={i} as="motion.div" className="home-contact-card">
            <p className="home-contact-label">{card.label}</p>
            <p className="home-contact-body">{card.body}</p>
            {card.link ? (
              <KineticHover scope="contact-link" index={i}>
                <Link href={card.link.href} className="home-contact-link kinetic-link-sweep">
                  {card.link.label}
                </Link>
              </KineticHover>
            ) : null}
          </KineticItem>
        ))}
      </div>
      {contactChannels.length > 0 ? <HomeContactChannels channels={contactChannels} /> : null}
    </KineticStagger>
  );
}
