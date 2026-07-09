"use client";

import { motion } from "motion/react";

export function Contact() {
  return (
    <section
      id="contact"
      className="relative flex min-h-[80vh] flex-col justify-center overflow-hidden px-6 py-24 md:px-10"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute bottom-0 left-1/2 h-[50vmax] w-[80vmax] -translate-x-1/2 translate-y-1/3 rounded-full bg-[radial-gradient(circle,rgba(255,10,120,0.12),transparent_60%)] blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-[1600px]">
        <p className="text-[0.72rem] font-medium uppercase tracking-[0.35em] text-fog">
          Let&rsquo;s make something
        </p>
        <a
          href="mailto:hello@davidzachary.co"
          className="group mt-6 block"
        >
          <h2 className="text-display text-[clamp(2.5rem,11vw,10rem)] leading-[0.95]">
            <span className="italic">Start a</span>{" "}
            <span className="relative inline-block">
              conversation
              <motion.span
                className="absolute -bottom-2 left-0 h-[3px] w-full origin-left bg-magenta"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              />
            </span>
          </h2>
          <span className="mt-8 inline-flex items-center gap-3 text-lg text-bone/80 transition-colors group-hover:text-paper">
            hello@davidzachary.co
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </span>
        </a>

        <div className="mt-24 flex flex-col justify-between gap-6 border-t border-line/60 pt-8 text-sm text-fog md:flex-row md:items-center">
          <span>© {new Date().getFullYear()} David Zachary Creative</span>
          <nav className="flex gap-6">
            <a className="transition-colors hover:text-paper" href="#">LinkedIn</a>
            <a className="transition-colors hover:text-paper" href="#">Instagram</a>
            <a className="transition-colors hover:text-paper" href="#">Behance</a>
          </nav>
          <span>Concepts + Craft</span>
        </div>
      </div>
    </section>
  );
}
