import { useScroll, useTransform } from "motion/react";
import * as m from "motion/react-m";
import { useRef } from "react";
import { anywhere } from "@/content";
import { cn } from "@/lib/utils";

export function AnywhereBand() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], ["5%", "-60%"]);

  return (
    <section ref={ref} className="overflow-hidden border-t border-line py-[12vw] md:py-32">
      <h2 className="sr-only">Works wherever flutter runs</h2>
      <m.div
        style={{ x }}
        aria-hidden
        className="flex gap-[6vw] whitespace-nowrap text-[14vw] font-extrabold leading-none tracking-[-0.05em] md:text-[11vw]"
      >
        {anywhere.words.map((word, index) => (
          <span key={word} className={cn(index % 2 === 1 && "text-outline")}>
            {word}
          </span>
        ))}
      </m.div>
      <p className="mt-12 max-w-[52ch] px-[4vw] text-neutral-300 md:text-lg">{anywhere.body}</p>
    </section>
  );
}
