import { useState } from "react";
import { INTRO, useIntro } from "@/lib/intro";

export function IntroCurtain() {
  const { plays, at } = useIntro("curtain");
  const [visible, setVisible] = useState(plays);
  if (!visible) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60] flex animate-curtain items-center justify-center border-b border-white bg-black"
      style={{ animationDelay: `${at(INTRO.shutter)}s` }}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) setVisible(false);
      }}
    >
      <span className="flex overflow-hidden text-[28vw] font-extrabold leading-[1.1] tracking-[-0.06em] md:text-[18vw]">
        {[..."fvx"].map((letter, index) => (
          <span key={letter} className="animate-curtain-letter" style={{ animationDelay: `${at(0.1 + index * 0.05)}s` }}>
            {letter}
          </span>
        ))}
      </span>
    </div>
  );
}
