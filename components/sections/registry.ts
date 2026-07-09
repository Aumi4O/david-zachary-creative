import type { ComponentType } from "react";
import { Hero } from "./hero";
import { Statement } from "./statement";
import { Contact } from "./contact";

/**
 * ─────────────────────────────────────────────────────────────
 *  SECTION REGISTRY  —  the running order of the whole site.
 *
 *  To reorder the page: move a line.
 *  To hide a section:   comment a line out.
 *  To add one:          build components/sections/<name>.tsx and
 *                       drop it in here where you want it.
 * ─────────────────────────────────────────────────────────────
 */
export type Section = {
  id: string;
  label: string;
  Component: ComponentType;
};

export const SECTIONS: Section[] = [
  { id: "hero", label: "Intro", Component: Hero },
  { id: "statement", label: "Approach", Component: Statement },
  // ── project case studies land here (added one by one) ──
  { id: "contact", label: "Contact", Component: Contact },
];
