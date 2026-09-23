import { type RefObject, useEffect, useState } from "react";

/** True from the first time `threshold` of `ref` scrolls into view. Never flips back. */
export function useSeen(ref: RefObject<Element | null>, threshold = 0.3): boolean {
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setSeen(true);
        observer.disconnect();
      },
      { threshold },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, threshold]);

  return seen;
}
