import { anywhere } from "@/content";
import { cn } from "@/lib/utils";

export function AnywhereBand() {
  return (
    <section className="overflow-hidden border-t border-line py-[12vw] [view-timeline:--band] md:py-32">
      <h2 className="sr-only">Works wherever flutter runs</h2>
      <div
        aria-hidden
        className="scroll-band flex gap-[6vw] whitespace-nowrap text-[14vw] font-extrabold leading-none tracking-[-0.05em] md:text-[11vw]"
      >
        {anywhere.words.map((word, index) => (
          <span key={word} className={cn(index % 2 === 1 && "text-outline")}>
            {word}
          </span>
        ))}
      </div>
      <p className="mt-12 max-w-[52ch] px-[4vw] text-neutral-300 md:text-lg">{anywhere.body}</p>
    </section>
  );
}
