import { Reveal } from "@/components/reveal";
import { pinSources } from "@/content";

/** The resolution order, one large numbered row per source. */
export function PinSources() {
  return (
    <section className="border-t border-line px-[4vw] py-[12vw] md:py-32">
      <Reveal>
        <h2 className="max-w-[16ch] text-5xl font-extrabold leading-none tracking-[-0.05em] md:text-7xl">
          Where the version comes from.
        </h2>
      </Reveal>
      <ol className="mt-16">
        {pinSources.map((source, order) => (
          <Reveal
            as="li"
            key={source.file}
            delay={order * 0.04}
            className="grid grid-cols-[3rem_1fr] items-baseline gap-y-1 border-t border-line py-5 md:grid-cols-[6rem_1fr_1fr]"
          >
            <span className="text-4xl font-extrabold tracking-tighter md:text-6xl">{order}</span>
            <code className="font-mono md:text-lg">{source.file}</code>
            <span className="col-start-2 font-mono text-sm text-dim md:col-start-3">{source.example}</span>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}
