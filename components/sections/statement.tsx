"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Kicker } from "@/components/ui/kicker";

const LINE = "Ideas are cheap. Craft is what makes them land.";

export function Statement() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const words = LINE.split(" ");

  return (
    <section
      ref={ref}
      id="about"
      className="relative mx-auto max-w-[1600px] px-6 py-[18vh] md:px-10"
    >
      <Kicker accent="text-magenta">The approach</Kicker>

      <p className="mt-10 max-w-5xl text-display text-[clamp(2rem,6vw,5.5rem)] leading-[1.02]">
        {words.map((word, i) => {
          const start = i / words.length;
          const end = start + 1 / words.length;
          return <FadeWord key={i} progress={scrollYProgress} range={[start, end]}>{word}</FadeWord>;
        })}
      </p>

      <div className="mt-16 grid gap-10 border-t border-line/60 pt-12 md:grid-cols-3">
        {[
          {
            n: "01",
            t: "Concepts",
            d: "Strategy and a sharp idea first — the through-line every asset hangs from.",
          },
          {
            n: "02",
            t: "Craft",
            d: "Type, image, motion, and detail obsessed over until the work feels inevitable.",
          },
          {
            n: "03",
            t: "Care",
            d: "Especially in health and science, where what we make has to earn real trust.",
          },
        ].map((c, i) => (
          <motion.div
            key={c.n}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="font-mono text-xs text-fog">{c.n}</span>
            <h3 className="text-display mt-2 text-3xl italic">{c.t}</h3>
            <p className="mt-3 text-sm leading-relaxed text-bone/70">{c.d}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function FadeWord({
  children,
  progress,
  range,
}: {
  children: string;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  range: [number, number];
}) {
  const opacity = useTransform(progress, range, [0.12, 1]);
  return (
    <motion.span style={{ opacity }} className="mr-[0.25em] inline-block">
      {children}
    </motion.span>
  );
}
