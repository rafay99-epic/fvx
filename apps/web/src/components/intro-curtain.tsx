import * as m from "motion/react-m";
import { useState } from "react";
import { EASE_OUT, INTRO, useIntro } from "@/lib/intro";

const SHUTTER = [0.76, 0, 0.24, 1] as const;
const EASE_IN = [0.7, 0, 0.84, 0] as const;

export function IntroCurtain() {
  const { plays, at } = useIntro("curtain");
  const [visible, setVisible] = useState(plays);
  if (!visible) return null;

  return (
    <m.div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center border-b border-white bg-black"
      initial={{ y: "0%" }}
      animate={{ y: ["0%", "0%", "-101%"] }}
      transition={{ duration: INTRO.curtain, delay: at(0), times: [0, 0.62, 1], ease: ["linear", SHUTTER] }}
      onAnimationComplete={() => setVisible(false)}
    >
      <span className="flex overflow-hidden text-[28vw] font-extrabold leading-[1.1] tracking-[-0.06em] md:text-[18vw]">
        {[..."fvx"].map((letter, index) => (
          <m.span
            key={letter}
            initial={{ y: "110%" }}
            animate={{ y: ["110%", "0%", "0%", "-110%"] }}
            transition={{
              delay: at(0.1 + index * 0.05),
              duration: 0.95,
              times: [0, 0.35, 0.72, 1],
              ease: [EASE_OUT, "linear", EASE_IN],
            }}
          >
            {letter}
          </m.span>
        ))}
      </span>
    </m.div>
  );
}
