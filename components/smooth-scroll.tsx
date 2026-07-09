"use client";

import { ReactLenis } from "lenis/react";
import type { ReactNode } from "react";

/**
 * Global buttery smooth-scroll (the "Perplexity/Claude" glide).
 * Wraps the whole app; Motion's scroll hooks read from this automatically
 * because Lenis drives the native scroll position.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        lerp: 0.09,
        duration: 1.2,
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.5,
      }}
    >
      {children}
    </ReactLenis>
  );
}
