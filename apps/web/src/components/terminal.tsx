import { Fragment, useRef } from "react";
import { CopyButton } from "@/components/copy-button";
import type { Session } from "@/docs";
import { useSeen } from "@/lib/in-view";
import { cn } from "@/lib/utils";

const PER_CHAR = 0.028;
const LINE_GAP = 0.07;

/**
 * A transcript that plays once when it scrolls into view. Each command is hidden under a black
 * cover with a caret on its edge; the cover slides right one character per step, so typing runs on
 * the compositor. Output lines rise in after their command finishes.
 */
export function Terminal({ session, className }: { session: Session; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useSeen(ref, 0.5);

  let clock = 0.15;
  const steps = session.map(({ command, output = [] }) => {
    const start = clock;
    const typing = command.length * PER_CHAR;
    const outputAt = start + typing + 0.12;
    clock = outputAt + output.length * LINE_GAP + 0.3;
    return { command, output, start, typing, outputAt };
  });

  return (
    <div ref={ref} className={cn("relative border border-border bg-black font-mono text-sm", className)}>
      <div className="absolute top-1 right-1">
        <CopyButton text={session.map((step) => step.command).join("\n")} label="Copy commands" />
      </div>
      <div className="grid gap-1 overflow-x-auto py-4 pr-14 pl-4 leading-relaxed">
        {steps.map((step) => (
          <Fragment key={step.command}>
            <p className="flex gap-3 whitespace-nowrap">
              <span aria-hidden className="select-none text-dim">
                $
              </span>
              <span className="relative inline-block overflow-hidden align-top">
                {step.command}
                <span
                  aria-hidden
                  className={cn("absolute inset-0 bg-black motion-reduce:hidden", seen && "animate-type")}
                  style={{
                    animationDuration: `${step.typing}s`,
                    animationDelay: `${step.start}s`,
                    animationTimingFunction: `steps(${step.command.length})`,
                  }}
                >
                  <span
                    className={cn("absolute inset-y-0.5 left-0 w-[0.6em] bg-white opacity-0", seen && "animate-caret")}
                    style={{ animationDuration: `${step.typing}s`, animationDelay: `${step.start}s` }}
                  />
                </span>
              </span>
            </p>
            {step.output.map((line, index) => (
              <p
                key={line}
                className={cn(
                  "whitespace-pre-wrap pl-6 text-neutral-300 [--rise:6px] motion-reduce:animate-none motion-reduce:opacity-100",
                  seen ? "animate-rise" : "opacity-0",
                )}
                style={{ animationDelay: `${step.outputAt + index * LINE_GAP}s` }}
              >
                {line}
              </p>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
