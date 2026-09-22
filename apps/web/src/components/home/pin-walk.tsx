import { useRef } from "react";
import { walk } from "@/content";
import { useScrollProgress } from "@/lib/scroll";
import { cn } from "@/lib/utils";

const stepAt = (progress: number) => Math.min(walk.steps.length - 1, Math.floor(progress * walk.steps.length));

export function PinWalk() {
  const ref = useRef<HTMLElement>(null);
  const step = useScrollProgress(ref, stepAt);
  const current = walk.steps[step] ?? walk.steps[0];
  const found = current.at === walk.foundAt;

  return (
    <section ref={ref} className="relative h-[340svh]">
      <div className="sticky top-0 grid h-svh content-center gap-12 overflow-hidden px-[4vw] md:grid-cols-2">
        <ol className="font-mono text-base leading-[2.2] md:text-xl" aria-label="Folders from home to the working folder">
          {walk.tree.map((dir, depth) => (
            <li
              key={dir}
              style={{ paddingLeft: `${depth * 1.25}em` }}
              className={cn(
                "whitespace-nowrap opacity-30 transition duration-300",
                depth === current.at && "translate-x-3 opacity-100",
                found && depth === walk.foundAt && "opacity-100",
              )}
            >
              {dir}
              {found && depth === walk.foundAt && <span className="ml-3 bg-white px-1.5 text-black">{walk.foundFile}</span>}
            </li>
          ))}
        </ol>
        <div>
          <h2 className="text-5xl font-extrabold leading-none tracking-[-0.05em] md:text-7xl">{walk.title}</h2>
          <p className="mt-6 max-w-[38ch] text-neutral-300 md:text-lg">{walk.body}</p>
          <p
            key={step}
            className="mt-6 min-h-[3em] animate-rise font-mono text-sm [--rise:8px] md:text-base"
            style={{ animationDuration: "0.4s" }}
          >
            {current.log}
          </p>
        </div>
      </div>
    </section>
  );
}
