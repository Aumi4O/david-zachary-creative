"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

const CLIENTS = [
  "BGB Group",
  "Genentech",
  "Pfizer",
  "Amgen",
  "Celgene",
  "Baxalta",
  "Agios",
  "Global Genes",
  "BMS",
  "Beyond Basics",
];

const WORDS = ["Concepts", "+", "Craft"];

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "35%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section
      ref={ref}
      id="top"
      className="relative flex min-h-[100svh] flex-col justify-between overflow-hidden pb-10 pt-32"
    >
      {/* Ambient field */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/3 h-[60vmax] w-[60vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,10,120,0.10),transparent_60%)] blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[40vmax] w-[40vmax] rounded-full bg-[radial-gradient(circle,rgba(41,171,226,0.08),transparent_60%)] blur-3xl" />
        <Grain />
      </div>

      <motion.div style={{ y, opacity }} className="mx-auto w-full max-w-[1600px] flex-1 px-6 md:px-10">
        <div className="flex h-full flex-col justify-center">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 1 }}
            className="mb-8 flex items-center gap-3 text-[0.72rem] font-medium uppercase tracking-[0.35em] text-fog"
          >
            <span className="h-px w-10 bg-fog/50" />
            Creative Director · Designer · Brand Builder
          </motion.p>

          <h1 className="text-display text-[clamp(3.5rem,13vw,13rem)] font-normal">
            {WORDS.map((word, i) => (
              <span key={word} className="mr-[0.25em] inline-block overflow-hidden align-bottom">
                <motion.span
                  initial={{ y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{
                    delay: 0.5 + i * 0.12,
                    duration: 1,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className={
                    word === "+"
                      ? "inline-block text-magenta"
                      : "inline-block italic"
                  }
                >
                  {word}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 1 }}
            className="mt-10 max-w-xl text-lg leading-relaxed text-bone/80"
          >
            I&rsquo;m <span className="text-paper">David Zachary</span> — I build brands and
            campaigns for the places where science, health, and culture meet. Twenty
            years turning complex ideas into work people feel.
          </motion.p>
        </div>
      </motion.div>

      {/* Client marquee */}
      <div className="relative border-y border-line/60 py-4">
        <Marquee items={CLIENTS} />
      </div>

      <ScrollHint />
    </section>
  );
}

function Marquee({ items }: { items: string[] }) {
  const row = [...items, ...items];
  return (
    <div className="flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
      <motion.div
        className="flex shrink-0 items-center gap-12 pr-12 text-sm uppercase tracking-[0.25em] text-fog"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 28, ease: "linear", repeat: Infinity }}
      >
        {row.map((item, i) => (
          <span key={i} className="flex items-center gap-12">
            {item}
            <span className="text-magenta">✦</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

function ScrollHint() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.6, duration: 1 }}
      className="mx-auto mt-8 flex w-full max-w-[1600px] items-center justify-between px-6 text-[0.7rem] uppercase tracking-[0.3em] text-fog md:px-10"
    >
      <span>Selected Work — 2005 → 2026</span>
      <span className="flex items-center gap-2">
        Scroll
        <motion.span
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          ↓
        </motion.span>
      </span>
    </motion.div>
  );
}

/** Subtle film grain via inline SVG noise. */
function Grain() {
  return (
    <div
      className="absolute inset-0 opacity-[0.035] mix-blend-screen"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }}
    />
  );
}
