"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useId, useState } from "react";
import { KineticItem, KineticReveal, KineticStagger } from "@/app/components/kinetic";
import {
  HOME_FAQ_ROW_PRESETS,
  HOME_SECTION_PRESETS,
  homePresetAt,
} from "@/lib/kinetic-presets";
import { motionDurations, motionEase, motionStagger } from "@/lib/motion";

const FAQ_ITEMS: { question: string; answer: string }[] = [
  {
    question: "What do I need to bring at pickup?",
    answer:
      "A valid driver’s license, a matching ID, and proof of insurance for the rental period. Minimum age and deposit rules are confirmed during checkout.",
  },
  {
    question: "How does pricing work?",
    answer:
      "Rates are stored in Philippine pesos (PHP). Pick another currency in the site header for an approximate conversion. Your card is charged in PHP at checkout—same totals as shown before payment.",
  },
  {
    question: "Can I change or cancel a booking?",
    answer:
      "Use your account to review upcoming trips. Change and cancellation rules depend on the vehicle and dates you selected—see the policy callout on the car page before you confirm.",
  },
  {
    question: "Where can I pick up the car?",
    answer:
      "Pickup options depend on the vehicle and availability. You’ll choose or confirm a location as part of booking. Sunday pickups may be by appointment.",
  },
  {
    question: "How do I pay?",
    answer:
      "Checkout is handled through our payment partner (Xendit). You’ll complete payment on a secure flow after you confirm trip details.",
  },
  {
    question: "What if I need help after I book?",
    answer:
      "Sign in and open Account to see booking status and messages. For urgent pickup-day issues, use the contact details on your confirmation email.",
  },
];

export default function HomeFaq() {
  const baseId = useId();
  const [openRows, setOpenRows] = useState<ReadonlySet<number>>(() => new Set());
  const reduce = useReducedMotion();

  function toggleRow(index: number) {
    setOpenRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  return (
    <section className="home-bottom-section home-faq" aria-labelledby="home-faq-heading">
      <KineticStagger>
        <KineticReveal
          as="motion.h2"
          className="home-section-heading"
          id="home-faq-heading"
          preset={HOME_SECTION_PRESETS.faqHeading}
          inView={false}
        >
          Frequently asked questions
        </KineticReveal>
        <motion.div
          className="home-faq-list"
          variants={{ hidden: {}, visible: { transition: motionStagger.section } }}
        >
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openRows.has(index);
            const triggerId = `${baseId}-t-${index}`;
            const panelId = `${baseId}-p-${index}`;
            return (
              <KineticItem
                key={item.question}
                as="motion.div"
                className={`home-faq-item${isOpen ? " home-faq-item--open" : ""}`}
                preset={homePresetAt(HOME_FAQ_ROW_PRESETS, index)}
              >
                <button
                  type="button"
                  id={triggerId}
                  className="home-faq-trigger"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggleRow(index)}
                >
                  <span className="home-faq-trigger-label">{item.question}</span>
                </button>
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={triggerId}
                  aria-hidden={!isOpen}
                  className="home-faq-panel"
                  initial={false}
                  animate={{
                    height: isOpen ? "auto" : 0,
                    opacity: isOpen ? 1 : 0,
                  }}
                  transition={
                    reduce
                      ? { duration: 0 }
                      : {
                          height: { type: "tween", duration: motionDurations.reveal, ease: motionEase.out },
                          opacity: { duration: motionDurations.micro, ease: motionEase.out },
                        }
                  }
                  style={{ overflow: "hidden" }}
                >
                  <div className="home-faq-panel-inner">
                    <p className="home-faq-answer">{item.answer}</p>
                  </div>
                </motion.div>
              </KineticItem>
            );
          })}
        </motion.div>
      </KineticStagger>
    </section>
  );
}
