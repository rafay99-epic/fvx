import { cn } from "@/lib/utils";

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
const CELL_EM = 1.3;

export function Odometer({ value, className }: { value: string; className?: string }) {
  return (
    <div role="img" aria-label={value} className={cn("flex leading-[1.3] tabular-nums", className)}>
      {[...value].map((char, position) =>
        char === "." ? (
          <span key={position} aria-hidden>
            .
          </span>
        ) : (
          <span key={position} aria-hidden className="inline-block h-[1.3em] overflow-hidden">
            <span
              className="flex flex-col transition-transform duration-1100 ease-[cubic-bezier(.7,0,.2,1)] motion-reduce:transition-none"
              style={{ transform: `translateY(${-Number(char) * CELL_EM}em)`, transitionDelay: `${position * 0.06}s` }}
            >
              {DIGITS.map((digit) => (
                <span key={digit} className="h-[1.3em]">
                  {digit}
                </span>
              ))}
            </span>
          </span>
        ),
      )}
    </div>
  );
}
