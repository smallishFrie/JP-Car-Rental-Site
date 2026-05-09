"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CONTACT_TYPE_LABELS, type ContactOptionPublic, type ContactType } from "@/lib/contact-options-types";

function ContactChannelIcon({ type }: { type: ContactType }) {
  const common = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", "aria-hidden": true as const };

  switch (type) {
    case "email":
      return (
        <svg {...common}>
          <path
            d="M4 6h16v12H4V6zm2 2 6 4 6-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "phone":
      return (
        <svg {...common}>
          <path
            d="M8.5 3a1 1 0 0 0-1.1.85L6.5 9l3 2 2-2 3 3-2 2 2 3 5.1-1c.5-.09.9-.5.9-1v-1a16 16 0 0 0-12-12h-1Z"
            stroke="currentColor"
            strokeWidth="1.35"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "whatsapp":
      return (
        <svg {...common}>
          <path
            fill="currentColor"
            d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
          />
        </svg>
      );
    case "sms":
      return (
        <svg {...common}>
          <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 10h6M8 13h4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
        </svg>
      );
    case "website":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.35" />
          <path d="M4 12h16M12 4c2.2 2.6 3.5 6 3.5 8s-1.3 5.4-3.5 8c-2.2-2.6-3.5-6-3.5-8s1.3-5.4 3.5-8Z" stroke="currentColor" strokeWidth="1.25" />
        </svg>
      );
    case "facebook":
      return (
        <svg {...common}>
          <path
            fill="currentColor"
            d="M13.5 22v-8h2.7l.4-3h-3.1V9.3c0-.9.2-1.5 1.6-1.5H17V5.1A23 23 0 0 0 14 5c-2.7 0-4.6 1.6-4.6 5v2.8H7v3h2.4V22h4.1Z"
          />
        </svg>
      );
    case "instagram":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="17" cy="7" r="1.2" fill="currentColor" />
        </svg>
      );
    case "telegram":
      return (
        <svg {...common}>
          <path
            fill="currentColor"
            d="m4.5 11 16.8-6.5c.7-.3 1.4.2 1.2 1l-2.8 13.2c-.2.9-1 1.2-1.7.7l-5-3.7-2.4 2.3c-.2.2-.6.4-1 .3-.4-.1-.6-.5-.5-1l1.2-7.3-8-2.4c-.9-.2-.9-1.3.1-1.6Z"
          />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.35" />
          <path d="M9.5 10.5a2.5 2.5 0 1 1 5 0c0 2-2.5 2.5-2.5 5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
          <circle cx="12" cy="17.5" r=".75" fill="currentColor" />
        </svg>
      );
  }
}

function tileClassName(canLink: boolean) {
  return `home-contact-channel-tile${canLink ? "" : " home-contact-channel-tile--inert"}`;
}

export default function HomeContactChannels({ channels }: { channels: ContactOptionPublic[] }) {
  const reduce = useReducedMotion();

  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduce ? 0 : 0.07, delayChildren: reduce ? 0 : 0.08 },
    },
  };

  const child = {
    hidden: { opacity: 0, y: reduce ? 0 : 14 },
    show: {
      opacity: 1,
      y: 0,
      transition: reduce ? { duration: 0 } : { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
    },
  };

  return (
    <div className="home-contact-channels">
      <p className="home-contact-channels-eyebrow">Reach us</p>
      <motion.ul
        className="home-contact-channels-grid"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-40px" }}
        role="list"
      >
        {channels.map((ch) => {
          const typeLabel = CONTACT_TYPE_LABELS[ch.contactType];
          const opensNewTab = Boolean(ch.href && (ch.isExternal || ch.href.startsWith("http")));

          const inner = (
            <>
              <span className="home-contact-channel-icon" aria-hidden="true">
                <ContactChannelIcon type={ch.contactType} />
              </span>
              <span className="home-contact-channel-text">
                <span className="home-contact-channel-pill">{typeLabel}</span>
                <span className="home-contact-channel-title">{ch.title}</span>
                <span className="home-contact-channel-detail">{ch.detail}</span>
              </span>
              {ch.href ? (
                <span className="home-contact-channel-chev" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M9 6l6 6-6 6"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              ) : null}
            </>
          );

          return (
            <motion.li key={ch.id} className="home-contact-channel-item" variants={child}>
              {ch.href ? (
                <a
                  href={ch.href}
                  className={tileClassName(true)}
                  data-contact-type={ch.contactType}
                  {...(opensNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  {inner}
                </a>
              ) : (
                <div className={tileClassName(false)} data-contact-type={ch.contactType}>
                  {inner}
                </div>
              )}
            </motion.li>
          );
        })}
      </motion.ul>
    </div>
  );
}
