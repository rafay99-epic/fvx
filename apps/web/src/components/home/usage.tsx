import { CopyButton } from "@/components/copy-button";
import { Reveal } from "@/components/reveal";
import { Link } from "@tanstack/react-router";
import { editorSetting, usage } from "@/content";
import { commandGroups } from "@/docs";

const commands = commandGroups.flatMap((group) => group.commands);

export function Usage() {
  return (
    <section className="border-t border-line px-[4vw] py-[12vw] md:py-32">
      <Reveal>
        <h2 className="text-5xl font-extrabold leading-none tracking-[-0.05em] md:text-7xl">Three commands.</h2>
      </Reveal>
      <ol className="mt-16 grid gap-10 md:grid-cols-3 md:gap-6">
        {usage.map((step, index) => (
          <Reveal as="li" key={step.command} delay={index * 0.08}>
            <div className="flex items-center justify-between border border-border pl-4 font-mono text-sm">
              <code className="overflow-x-auto py-3">{step.command}</code>
              <CopyButton text={step.command} />
            </div>
            <p className="mt-4 max-w-[36ch] text-sm text-neutral-300">{step.note}</p>
          </Reveal>
        ))}
      </ol>

      <div className="mt-24 flex flex-wrap items-baseline justify-between gap-4">
        <h3 className="text-2xl font-bold tracking-tight md:text-3xl">Every command</h3>
        <Link to="/docs" hash="commands" className="text-sm underline underline-offset-4">
          Flags and examples
        </Link>
      </div>
      <dl className="mt-6 grid md:grid-cols-2 md:gap-x-12">
        {commands.map((command) => (
          <div key={command.name} className="grid grid-cols-[10rem_1fr] gap-4 border-t border-line py-3 text-sm">
            <dt className="font-mono">fvx {command.name}</dt>
            <dd className="text-neutral-300">{command.summary}</dd>
          </div>
        ))}
      </dl>

      <h3 className="mt-24 text-2xl font-bold tracking-tight md:text-3xl">VS Code and Cursor</h3>
      <p className="mt-3 max-w-[52ch] text-sm text-neutral-300">
        Add this to your user settings once and every workspace follows its own pin.
      </p>
      <div className="mt-6 flex items-start justify-between border border-border pl-4 font-mono text-sm">
        <pre className="overflow-x-auto py-3">
          <code>{editorSetting}</code>
        </pre>
        <CopyButton text={editorSetting} />
      </div>
    </section>
  );
}
