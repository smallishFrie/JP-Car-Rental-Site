"use client";

import Link from "next/link";
import { KineticHover, KineticReveal } from "@/app/components/kinetic";

type KineticBackLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

export default function KineticBackLink({ href, children, className }: KineticBackLinkProps) {
  return (
    <KineticReveal scope="back-link" index={0} preset="driftInLeft">
      <KineticHover scope="back-link-hover" index={0} preset="underlineSweep">
        <Link href={href} className={className}>
          {children}
        </Link>
      </KineticHover>
    </KineticReveal>
  );
}
