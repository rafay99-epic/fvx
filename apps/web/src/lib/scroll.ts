import { type RefObject, useEffect, useState } from "react";

/**
 * Tracks how far the page has scrolled through `ref`: 0 when its top meets the viewport top, 1 when
 * its bottom meets the viewport bottom. Returns `pick(progress)` and re-renders only when that changes,
 * so pick something coarse like a step index. `pick` must be stable (define it at module level).
 */
export function useScrollProgress<T extends number | boolean>(
  ref: RefObject<HTMLElement | null>,
  pick: (progress: number) => T,
): T {
  const [value, setValue] = useState(() => pick(0));

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const { top, height } = element.getBoundingClientRect();
      setValue(pick(Math.min(1, Math.max(0, -top / (height - innerHeight)))));
    };
    const schedule = () => {
      frame ||= requestAnimationFrame(measure);
    };
    measure();
    addEventListener("scroll", schedule, { passive: true });
    addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("scroll", schedule);
      removeEventListener("resize", schedule);
    };
  }, [ref, pick]);

  return value;
}
