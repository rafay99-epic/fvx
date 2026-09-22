import { useEffect, useState } from "react";

/** Seconds from page load. The curtain starts lifting at `shutter`, the hero starts at `hero`. Durations and curves live in the @theme animations in styles.css. */
export const INTRO = {
  shutter: 0.93,
  hero: 1.05,
} as const;

type Part = "curtain" | "nav" | "hero";

const SEEN_KEY = "fvx:intro-seen";
const t0 = performance.now();

function shouldPlay(): boolean {
  if (location.pathname !== "/" || matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (import.meta.env.DEV) return true;
  try {
    if (sessionStorage.getItem(SEEN_KEY)) return false;
    sessionStorage.setItem(SEEN_KEY, "1");
  } catch {}
  return true;
}

const playsOnLoad = shouldPlay();
const played = new Set<Part>();

/** Whether `part` should play the opening animation, and `at(seconds)`, the delay that lands on `seconds` after page load. */
export function useIntro(part: Part) {
  const [intro] = useState(() => {
    const elapsed = (performance.now() - t0) / 1000;
    return {
      plays: playsOnLoad && !played.has(part),
      at: (seconds: number) => Math.max(0, seconds - elapsed),
    };
  });
  useEffect(() => {
    played.add(part);
  }, [part]);
  return intro;
}
