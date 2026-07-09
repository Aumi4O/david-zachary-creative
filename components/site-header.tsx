"use client";

import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Work", href: "#work" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export function SiteHeader() {
  const { scrollY } = useScroll();
  const [condensed, setCondensed] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => setCondensed(y > 40));

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-500",
        condensed
          ? "bg-ink/70 backdrop-blur-xl border-b border-line/60"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-4 md:px-10">
        <a href="#top" className="group flex items-center gap-3" aria-label="David Zachary Creative — home">
          <Monogram />
          <span className="hidden text-[0.7rem] font-medium uppercase tracking-[0.3em] text-fog transition-colors group-hover:text-paper sm:inline">
            David Zachary Creative
          </span>
        </a>

        <nav className="flex items-center gap-1">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-[0.72rem] font-medium uppercase tracking-[0.2em] text-fog transition-colors hover:text-paper"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </motion.header>
  );
}

/** The "dz" mark, redrawn as an SVG so it scales crisply. */
function Monogram() {
  return (
    <svg
      width="34"
      height="20"
      viewBox="0 0 68 40"
      fill="none"
      className="text-paper"
      aria-hidden
    >
      <path
        d="M2 6h18c9 0 15 6 15 14s-6 14-15 14H2V26h16c3 0 5-2 5-6s-2-6-5-6H2V6Z"
        fill="currentColor"
      />
      <path
        d="M40 6h26v8H54l12 12v6H40v-8h12L40 12V6Z"
        fill="currentColor"
      />
    </svg>
  );
}
