import { useState } from "react";
import { CopyButton } from "@/components/copy-button";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { type InstallId, install } from "@/content";

export function InstallCta() {
  const [selected, setSelected] = useState<InstallId>("brew");
  const command = install.find((option) => option.id === selected)?.command ?? install[0].command;

  return (
    <section className="border-t border-line px-[4vw] py-[16vw] md:py-40">
      <Reveal>
        <h2 className="text-[18vw] font-extrabold leading-[0.85] tracking-[-0.06em] md:text-[12vw]">brew it.</h2>
      </Reveal>
      <div className="mt-12 flex" role="group" aria-label="Package manager">
        {install.map((option) => (
          <Button
            key={option.id}
            variant={option.id === selected ? "default" : "outline"}
            aria-pressed={option.id === selected}
            onClick={() => setSelected(option.id)}
          >
            {option.label}
          </Button>
        ))}
      </div>
      <div className="mt-4 flex max-w-2xl items-center justify-between bg-white pl-5 font-mono text-black md:text-lg">
        <code className="overflow-x-auto py-4">{command}</code>
        <div className="text-black [&_button:hover]:bg-neutral-200 [&_button:hover]:text-black">
          <CopyButton text={command} />
        </div>
      </div>
      <p className="mt-4 font-mono text-sm text-dim">then once: fvx setup</p>
    </section>
  );
}
