"use client";

import { useEffect, useRef, type DependencyList } from "react";
import gsap from "gsap";

type GsapContext = {
  /** The element the hook ref is attached to. */
  self: HTMLElement;
  /** The gsap instance. */
  gsap: typeof gsap;
  /** Scoped selector — `q(".item")` only matches descendants of `self`. */
  q: (selector: string) => Element[];
};

/**
 * Orchestrated-motion hook. Use ONLY for entrance reveals, modal/toast/drawer
 * enter-exit, scroll/section reveals and list stagger — never for hover/focus/
 * active micro-states (those are CSS transitions).
 *
 * - Scopes every animation to the returned ref via `gsap.context` so cleanup is
 *   automatic (`ctx.revert()` on unmount / dep change).
 * - Respects `prefers-reduced-motion`: the setup never runs when the user opts out,
 *   so elements stay in their natural (final) layout.
 *
 * @example
 * const ref = useGsap(({ self, gsap }) => {
 *   gsap.from(self, { autoAlpha: 0, y: 24, duration: 0.6, ease: "power3.out" });
 * }, []);
 * return <section ref={ref}>…</section>;
 */
export function useGsap<T extends HTMLElement = HTMLDivElement>(
  setup: (ctx: GsapContext) => void | (() => void),
  deps: DependencyList = []
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    let userCleanup: void | (() => void);
    const ctx = gsap.context(() => {
      userCleanup = setup({
        self: el,
        gsap,
        q: (selector: string) => gsap.utils.toArray(selector, el) as Element[],
      });
    }, el);

    return () => {
      if (typeof userCleanup === "function") userCleanup();
      ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}
