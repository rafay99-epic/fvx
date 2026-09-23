import { InstallPicker } from "@/components/install-picker";
import { Reveal } from "@/components/reveal";
import { install } from "@/content";

export function InstallCta() {
  return (
    <section className="border-t border-line px-[4vw] py-[16vw] md:py-40">
      <Reveal>
        <h2 className="text-[18vw] font-extrabold leading-[0.85] tracking-[-0.06em] md:text-[12vw]">brew it.</h2>
      </Reveal>
      <div className="mt-12">
        <InstallPicker channels={install} />
      </div>
      <p className="mt-4 font-mono text-sm text-dim">then once: fvx setup</p>
    </section>
  );
}
