import { useMotionValueEvent, useScroll } from "motion/react";
import * as m from "motion/react-m";
import { useEffect, useRef, useState } from "react";
import { Odometer } from "@/components/odometer";
import { hero } from "@/content";
import { EASE_OUT, INTRO, useIntro } from "@/lib/intro";
import { cn } from "@/lib/utils";

const TITLE_WORDS = hero.title.split(" ");

export function VersionHero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [switched, setSwitched] = useState(false);
  useMotionValueEvent(scrollYProgress, "change", (progress) => setSwitched(progress > 0.45));
  const pin = switched ? hero.to : hero.from;

  const { plays, at } = useIntro("hero");
  const [rolled, setRolled] = useState(!plays);
  useEffect(() => {
    if (rolled) return;
    const timer = setTimeout(() => setRolled(true), at(INTRO.hero) * 1000);
    return () => clearTimeout(timer);
  }, [rolled, at]);

  const rise = (seconds: number) => ({
    initial: plays ? { opacity: 0, y: 16 } : false,
    animate: { opacity: 1, y: 0 },
    transition: { delay: at(INTRO.hero + seconds), duration: 0.7, ease: EASE_OUT },
  });

  return (
    <section ref={ref} className="relative h-[260svh]">
      <div className="sticky top-0 flex h-svh flex-col justify-center overflow-hidden px-[4vw]">
        <Odometer
          value={rolled ? pin.version : pin.version.replace(/\d/g, "0")}
          className="-my-[0.15em] text-[24vw] font-extrabold tracking-[-0.06em] md:text-[21vw]"
        />
        <div className="mt-4 flex justify-between gap-4 font-mono text-sm md:text-lg">
          <span
            className={cn(plays && "intro-type")}
            style={
              plays
                ? {
                    width: `${pin.path.length}ch`,
                    animationTimingFunction: `steps(${pin.path.length})`,
                    animationDelay: `${at(INTRO.hero + 0.1)}s, ${at(INTRO.hero + 1.05)}s`,
                  }
                : undefined
            }
          >
            {pin.path}
          </span>
          <m.span className="text-dim" {...rise(0.8)}>
            {pin.source}
          </m.span>
        </div>
        <h1 className="mt-10 max-w-[18ch] text-4xl font-bold leading-[1.02] tracking-tighter md:text-6xl">
          {TITLE_WORDS.map((word, index) => (
            <span key={word} className="inline-block overflow-hidden pb-[0.1em] align-top">
              <m.span
                className="inline-block"
                initial={plays ? { y: "110%" } : false}
                animate={{ y: 0 }}
                transition={{ delay: at(INTRO.hero + 0.25 + index * 0.05), duration: 0.8, ease: EASE_OUT }}
              >
                {word}
                {index < TITLE_WORDS.length - 1 && " "}
              </m.span>
            </span>
          ))}
        </h1>
        <m.p className="mt-6 max-w-[52ch] text-neutral-300 md:text-lg" {...rise(0.6)}>
          {hero.lede}
        </m.p>
        <m.div
          className="absolute inset-x-[4vw] bottom-8 h-px origin-left bg-line"
          initial={plays ? { scaleX: 0 } : false}
          animate={{ scaleX: 1 }}
          transition={{ delay: at(INTRO.hero + 0.7), duration: 1, ease: EASE_OUT }}
        >
          <m.div style={{ scaleX: scrollYProgress }} className="h-px origin-left bg-white" />
        </m.div>
      </div>
    </section>
  );
}
