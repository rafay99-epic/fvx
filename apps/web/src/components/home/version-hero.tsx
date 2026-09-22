import { useMotionValueEvent, useScroll } from "motion/react";
import * as m from "motion/react-m";
import { useRef, useState } from "react";
import { Odometer } from "@/components/odometer";
import { hero } from "@/content";

/**
 * Sticky opening scene. Halfway through its scroll the "current folder"
 * switches and the version number rolls to the other project's pin.
 */
export function VersionHero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [switched, setSwitched] = useState(false);
  useMotionValueEvent(scrollYProgress, "change", (progress) => setSwitched(progress > 0.45));
  const pin = switched ? hero.to : hero.from;

  return (
    <section ref={ref} className="relative h-[260svh]">
      <div className="sticky top-0 flex h-svh flex-col justify-center overflow-hidden px-[4vw]">
        <Odometer value={pin.version} className="-my-[0.15em] text-[24vw] font-extrabold tracking-[-0.06em] md:text-[21vw]" />
        <div className="mt-4 flex justify-between gap-4 font-mono text-sm md:text-lg">
          <span>{pin.path}</span>
          <span className="text-dim">{pin.source}</span>
        </div>
        <h1 className="mt-10 max-w-[18ch] text-4xl font-bold leading-[1.02] tracking-tighter md:text-6xl">{hero.title}</h1>
        <p className="mt-6 max-w-[52ch] text-neutral-300 md:text-lg">{hero.lede}</p>
        <div className="absolute inset-x-[4vw] bottom-8 h-px bg-line">
          <m.div style={{ scaleX: scrollYProgress }} className="h-px origin-left bg-white" />
        </div>
      </div>
    </section>
  );
}
