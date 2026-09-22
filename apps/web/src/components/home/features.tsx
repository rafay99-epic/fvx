import { Reveal } from "@/components/reveal";
import { features } from "@/content";

export function Features() {
  return (
    <section className="px-[4vw] pb-[12vw] md:pb-32">
      <h2 className="sr-only">Features</h2>
      {features.map((feature) => (
        <Reveal key={feature.title}>
          <div className="grid gap-4 border-t border-line py-10 md:grid-cols-[1fr_1.2fr] md:gap-12">
            <h3 className="text-3xl font-bold leading-none tracking-[-0.04em] md:text-5xl">{feature.title}</h3>
            <p className="max-w-[48ch] text-neutral-300 md:text-lg">{feature.body}</p>
          </div>
        </Reveal>
      ))}
    </section>
  );
}
