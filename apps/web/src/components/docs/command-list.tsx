import { Reveal } from "@/components/reveal";
import { Terminal } from "@/components/terminal";
import { type Command, commandGroups } from "@/docs";

export const commandAnchor = (name: string) => `fvx-${name}`;

/** Every command, grouped, with its flags and a sample run where one helps. */
export function CommandList() {
  return (
    <div className="grid gap-20">
      <ul className="flex flex-wrap gap-x-6 gap-y-2 font-mono md:text-lg">
        {commandGroups.flatMap((group) => group.commands).map((command) => (
          <li key={command.name}>
            <a
              href={`#${commandAnchor(command.name)}`}
              className="underline-offset-4 hover:underline"
            >
              {command.name}
            </a>
          </li>
        ))}
      </ul>
      {commandGroups.map((group) => (
        <div key={group.title}>
          <h3 className="text-2xl font-bold tracking-tight md:text-3xl">{group.title}</h3>
          <ul className="mt-6">
            {group.commands.map((command) => (
              <CommandRow key={command.name} command={command} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function CommandRow({ command }: { command: Command }) {
  return (
    <Reveal
      as="li"
      className="group grid gap-5 border-t border-line py-8 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-10"
    >
      <div id={commandAnchor(command.name)} className="scroll-mt-28">
        <h4 className="font-mono text-xl transition-transform duration-500 ease-glide group-hover:translate-x-2 md:text-2xl">
          fvx {command.name}
          {command.args && <span className="text-dim"> {command.args}</span>}
        </h4>
        {command.aliases && (
          <p className="mt-2 font-mono text-xs text-dim">also {command.aliases.join(", ")}</p>
        )}
      </div>
      <div className="grid min-w-0 content-start gap-4">
        <p className="md:text-lg">{command.summary}</p>
        {command.body && <p className="max-w-[60ch] text-sm text-neutral-300">{command.body}</p>}
        {command.flags && (
          <dl className="grid gap-2 text-sm">
            {command.flags.map((flag) => (
              <div key={flag.flag} className="grid grid-cols-[8rem_1fr] gap-4">
                <dt className="font-mono">{flag.flag}</dt>
                <dd className="text-neutral-300">{flag.body}</dd>
              </div>
            ))}
          </dl>
        )}
        {command.example && <Terminal session={command.example} />}
      </div>
    </Reveal>
  );
}
