import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Copies `text`. The icon flips to a check, a ring bursts once and a "Copied" tag rises above. */
export function CopyButton({ text, label = "Copy command" }: { text: string; label?: string }) {
  // Bumped per copy so a second click replays the burst.
  const [copies, setCopies] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timer);
  }, [copied, copies]);

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      className="relative"
      onClick={() =>
        navigator.clipboard.writeText(text).then(() => {
          setCopies((count) => count + 1);
          setCopied(true);
        })
      }
    >
      <Copy
        className={cn(
          "absolute transition duration-300 ease-glide",
          copied && "scale-0 -rotate-90 opacity-0",
        )}
      />
      <Check
        className={cn(
          "absolute transition duration-500 ease-spring",
          !copied && "scale-0 rotate-90 opacity-0",
        )}
      />
      {copied && (
        <span key={copies} aria-hidden className="absolute inset-1.5 border border-current animate-burst" />
      )}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute -top-8 bg-white px-1.5 py-0.5 font-mono text-xs text-black transition duration-300 ease-glide",
          !copied && "translate-y-2 opacity-0",
        )}
      >
        Copied
      </span>
      <span className="sr-only" aria-live="polite">
        {copied ? "Copied" : ""}
      </span>
    </Button>
  );
}
