import { useEffect, useState } from "react";
import { type SectionId, sections } from "@/docs";

export const sectionNumber = (index: number) => String(index + 1).padStart(2, "0");

/**
 * The page's table of contents. A white bar slides to the section in the reading band and inverts
 * its row through mix-blend-difference. The rail under it fills on the --docs scroll timeline.
 */
export function DocIndex() {
  const [active, setActive] = useState<SectionId>(sections[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const section = sections.find(({ id }) => id === entry.target.id);
          if (entry.isIntersecting && section) setActive(section.id);
        }
      },
      // A thin band a third of the way down the viewport: whichever section crosses it is being read.
      { rootMargin: "-33% 0px -62% 0px" },
    );
    for (const { id } of sections) {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, []);

  const activeIndex = sections.findIndex(({ id }) => id === active);

  return (
    <nav aria-label="On this page" className="md:sticky md:top-28">
      <ol className="relative isolate">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-white mix-blend-difference transition-transform duration-500 ease-glide motion-reduce:transition-none"
          style={{ transform: `translateY(${activeIndex * 100}%)` }}
        />
        {sections.map((section, index) => (
          <li key={section.id} className="h-10">
            <a
              href={`#${section.id}`}
              aria-current={section.id === active ? "location" : undefined}
              className="flex h-full items-center gap-4 px-3 text-sm"
            >
              <span className="font-mono text-dim tabular-nums">{sectionNumber(index)}</span>
              {section.title}
            </a>
          </li>
        ))}
      </ol>
      <div aria-hidden className="mt-6 h-px bg-line">
        <div className="docs-progress h-px origin-left bg-white" />
      </div>
    </nav>
  );
}
