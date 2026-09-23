import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { CopyButton } from "@/components/copy-button";
import { CommandList } from "@/components/docs/command-list";
import { DocIndex, sectionNumber } from "@/components/docs/doc-index";
import { InstallPicker } from "@/components/install-picker";
import { Reveal } from "@/components/reveal";
import { Terminal } from "@/components/terminal";
import { pinSources } from "@/content";
import {
  docs,
  editors,
  environment,
  installChannels,
  pin,
  releases,
  resolution,
  type SectionId,
  sections,
  setup,
  upgrade,
} from "@/docs";

export const Route = createFileRoute("/docs")({ component: Docs });

function Docs() {
  return (
    <article className="px-[4vw] pt-36 pb-16">
      <header className="pb-20 md:pb-28">
        <h1 className="flex overflow-hidden pb-[0.05em] text-[26vw] font-extrabold leading-[0.85] tracking-[-0.06em] md:text-[17vw]">
          {[...docs.title].map((char, index) => (
            <span
              key={`${char}${index}`}
              className="inline-block animate-slide-up motion-reduce:animate-none"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {char}
            </span>
          ))}
        </h1>
        <div className="mt-8 grid gap-6 md:grid-cols-[22%_1fr] md:gap-12">
          <ul
            className="flex flex-wrap gap-x-4 font-mono text-sm text-dim md:flex-col animate-rise motion-reduce:animate-none"
            style={{ animationDelay: "0.35s" }}
          >
            {docs.facts.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
          <p
            className="max-w-[30ch] text-2xl font-bold leading-tight tracking-tight animate-rise motion-reduce:animate-none md:text-4xl"
            style={{ animationDelay: "0.25s" }}
          >
            {docs.lede}
          </p>
        </div>
      </header>

      <div className="grid gap-12 [view-timeline:--docs] md:grid-cols-[22%_1fr]">
        <aside>
          <DocIndex />
        </aside>

        <div className="min-w-0">
          <DocSection id="install">
            <InstallPicker channels={installChannels} />
          </DocSection>

          <DocSection id="setup">
            <Lede>{setup.body}</Lede>
            <Terminal session={setup.session} className="mt-10" />
            <dl className="mt-12">
              {setup.files.map((row) => (
                <Row key={row.file} term={row.file}>
                  {row.body}
                </Row>
              ))}
            </dl>
            <Note>{setup.note}</Note>
          </DocSection>

          <DocSection id="pin">
            <Lede>{pin.body}</Lede>
            <Terminal session={pin.session} className="mt-10" />
            <ul className="mt-10 grid gap-3 md:text-lg">
              {pin.notes.map((note) => (
                <li key={note} className="flex gap-4">
                  <span aria-hidden className="text-dim">
                    ·
                  </span>
                  {note}
                </li>
              ))}
            </ul>
          </DocSection>

          <DocSection id="resolution">
            <ol>
              {pinSources.map((source, order) => (
                <Reveal
                  as="li"
                  key={source.file}
                  delay={order * 0.04}
                  className="grid grid-cols-[3rem_1fr] items-baseline gap-y-1 border-t border-line py-4 md:grid-cols-[4rem_1fr_1.2fr]"
                >
                  <span className="text-3xl font-extrabold tracking-tighter md:text-4xl">{order}</span>
                  <code className="font-mono md:text-lg">{source.file}</code>
                  <span className="col-start-2 font-mono text-sm break-all text-dim md:col-start-3">{source.example}</span>
                </Reveal>
              ))}
            </ol>
            <div className="mt-16 grid gap-10 md:grid-cols-2 md:gap-x-12">
              {resolution.rules.map((rule, index) => (
                <Reveal key={rule.title} delay={(index % 2) * 0.08}>
                  <h3 className="text-xl font-bold tracking-tight md:text-2xl">{rule.title}</h3>
                  <p className="mt-2 text-neutral-300">{rule.body}</p>
                </Reveal>
              ))}
            </div>
            <Terminal session={resolution.missing} className="mt-12" />
          </DocSection>

          <DocSection id="commands">
            <CommandList />
          </DocSection>

          <DocSection id="environment">
            <dl>
              {environment.map((variable) => (
                <Reveal key={variable.name} className="grid gap-2 border-t border-line py-5 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-10">
                  <dt className="font-mono font-bold break-all md:text-lg">{variable.name}</dt>
                  <dd>
                    <p>{variable.body}</p>
                    <p className="mt-1 font-mono text-sm break-all text-dim">{variable.example}</p>
                  </dd>
                </Reveal>
              ))}
            </dl>
          </DocSection>

          <DocSection id="editors">
            <h3 className="text-2xl font-bold tracking-tight md:text-3xl">{editors.vscode.title}</h3>
            <Lede>{editors.vscode.body}</Lede>
            <CodeLine text={editors.vscode.setting} />
            <dl className="mt-12">
              {editors.others.map((editor) => (
                <Row key={editor.title} term={editor.title}>
                  {editor.body}
                </Row>
              ))}
            </dl>
          </DocSection>

          <DocSection id="upgrade">
            <Lede>{upgrade.body}</Lede>
            <Terminal session={upgrade.session} className="mt-10" />
            <h3 className="mt-16 text-2xl font-bold tracking-tight md:text-3xl">{upgrade.removeTitle}</h3>
            <Lede>{upgrade.removeBody}</Lede>
            <Terminal session={upgrade.remove} className="mt-10" />
          </DocSection>

          <DocSection id="releases">
            <Lede>{releases.body}</Lede>
            <ul className="mt-12">
              {releases.links.map((link) => (
                <li key={link.label} className="border-t border-line last:border-b">
                  <a
                    href={link.href}
                    className="group flex items-center justify-between py-4 text-4xl font-extrabold tracking-[-0.05em] md:text-6xl"
                  >
                    <span className="transition-transform duration-500 ease-glide group-hover:translate-x-3">
                      {link.label}
                    </span>
                    <ArrowUpRight
                      aria-hidden
                      className="size-[0.8em] transition-transform duration-500 ease-glide group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:rotate-45"
                    />
                  </a>
                </li>
              ))}
            </ul>
            <h3 className="mt-16 text-2xl font-bold tracking-tight md:text-3xl">{releases.verifyTitle}</h3>
            <Lede>{releases.verifyBody}</Lede>
            <CodeLine text={releases.verify} />
          </DocSection>
        </div>
      </div>
    </article>
  );
}

/** A numbered section. Title and number come from `sections`, so the index and the page can't disagree. */
function DocSection({ id, children }: { id: SectionId; children: ReactNode }) {
  const index = sections.findIndex((section) => section.id === id);
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24 border-t border-line pt-8 pb-24 md:pb-32">
      <Reveal>
        <h2
          id={`${id}-title`}
          className="flex items-baseline gap-4 text-5xl font-extrabold leading-none tracking-[-0.05em] md:gap-6 md:text-7xl"
        >
          <span className="text-outline">{sectionNumber(index)}</span>
          {sections[index]?.title}
        </h2>
      </Reveal>
      <div className="mt-12">{children}</div>
    </section>
  );
}

function Lede({ children }: { children: ReactNode }) {
  return <p className="mt-4 max-w-[58ch] text-neutral-300 md:text-lg">{children}</p>;
}

function Note({ children }: { children: ReactNode }) {
  return <p className="mt-8 max-w-[58ch] text-sm text-neutral-300">{children}</p>;
}

function Row({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 border-t border-line py-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-10">
      <dt className="font-mono">{term}</dt>
      <dd className="text-neutral-300">{children}</dd>
    </div>
  );
}

function CodeLine({ text }: { text: string }) {
  return (
    <div className="mt-8 flex items-start justify-between border border-border pl-4 font-mono text-sm">
      <pre className="overflow-x-auto py-3">
        <code>{text}</code>
      </pre>
      <CopyButton text={text} />
    </div>
  );
}
