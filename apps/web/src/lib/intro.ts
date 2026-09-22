import { useEffect, useState } from "react";

export const INTRO = {
  curtain: 1.5,
  hero: 1.05,
} as const;

export const EASE_OUT = [0.2, 0.8, 0.2, 1] as const;

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
