import { type ReactNode, useRef } from "react";
import { useSeen } from "@/lib/in-view";
import { cn } from "@/lib/utils";

/** Rises and fades children in the first time 30% of them scrolls into view. */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "li";
}) {
  // One ref that fits both tags `as` allows.
  const ref = useRef<HTMLDivElement & HTMLLIElement>(null);
  const shown = useSeen(ref);

  return (
    <Tag
      ref={ref}
      className={cn(
        "transition duration-800 ease-glide",
        !shown && "translate-y-8 scale-97 opacity-0 motion-reduce:translate-none motion-reduce:scale-100",
        className,
      )}
      style={{ transitionDelay: `${delay}s` }}
    >
      {children}
    </Tag>
  );
}
