import { useState } from "react";
import { CopyButton } from "@/components/copy-button";

type Channel = { id: string; label: string; command: string; note?: string };

/**
 * Segmented picker over install channels and the white command block for the chosen one. The white
 * block under the tabs slides with transform and inverts the label through mix-blend-difference.
 */
export function InstallPicker({ channels }: { channels: readonly [Channel, ...Channel[]] }) {
  const [selected, setSelected] = useState(channels[0].id);
  const index = Math.max(0, channels.findIndex((channel) => channel.id === selected));
  const channel = channels[index] ?? channels[0];

  return (
    <div>
      <div
        role="group"
        aria-label="Install with"
        className="relative isolate grid w-full border border-border sm:w-fit"
        style={{ gridTemplateColumns: `repeat(${channels.length}, minmax(0, 1fr))` }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 bg-white mix-blend-difference transition-transform duration-500 ease-glide motion-reduce:transition-none"
          style={{ width: `${100 / channels.length}%`, transform: `translateX(${index * 100}%)` }}
        />
        {channels.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={option.id === selected}
            onClick={() => setSelected(option.id)}
            className="h-10 px-1 text-xs font-medium sm:px-5 sm:text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring md:px-5"
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="mt-4 flex max-w-3xl items-center justify-between bg-white pl-5 font-mono text-black md:text-lg">
        <code key={channel.id} className="animate-rise overflow-x-auto motion-reduce:animate-none whitespace-nowrap py-4 [--rise:10px]">
          {channel.command}
        </code>
        <div className="text-black [&_button:hover]:bg-neutral-200 [&_button:hover]:text-black">
          <CopyButton text={channel.command} />
        </div>
      </div>
      {channel.note && (
        <p key={channel.id} className="mt-4 max-w-[60ch] animate-rise text-sm motion-reduce:animate-none text-neutral-300 [--rise:6px]">
          {channel.note}
        </p>
      )}
    </div>
  );
}
