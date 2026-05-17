"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import CurrencyProvider from "@/app/components/CurrencyProvider";
import { pageShellReducedVariants, pageShellVariants } from "@/lib/motion";

type AppMotionShellProps = {
  children: React.ReactNode;
};

export default function AppMotionShell({ children }: AppMotionShellProps) {
  const pathname = usePathname() ?? "";
  const reduceMotion = useReducedMotion();

  const variants = reduceMotion ? pageShellReducedVariants : pageShellVariants;

  const shell =
    pathname.startsWith("/admin") ? (
      <>{children}</>
    ) : (
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          className="flex min-h-full w-full flex-1 flex-col"
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    );

  return <CurrencyProvider>{shell}</CurrencyProvider>;
}
