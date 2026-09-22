import { createFileRoute } from "@tanstack/react-router";
import { Reveal } from "@/components/reveal";
import { about, footerLinks } from "@/content";

export const Route = createFileRoute("/about")({ component: About });

function About() {
  return (
    <article className="px-[4vw] pt-40 pb-32">
      <Reveal>
        <h1 className="text-[18vw] font-extrabold leading-[0.85] tracking-[-0.06em] md:text-[12vw]">
          Why
          <br />
          fvx.
        </h1>
      </Reveal>

      <div className="mt-20 grid max-w-5xl gap-6 md:ml-[calc(25%+1.5rem)]">
        {about.product.map((paragraph) => (
          <Reveal key={paragraph}>
            <p className="text-lg leading-relaxed md:text-2xl">{paragraph}</p>
          </Reveal>
        ))}
      </div>

      <section className="mt-24 grid gap-6 border-t border-line pt-10 md:grid-cols-[25%_1fr]">
        <h2 className="text-2xl font-bold tracking-tight">Not yet</h2>
        <ul className="grid gap-2 md:text-lg">
          {about.notYet.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="mt-16 grid gap-6 border-t border-line pt-10 md:grid-cols-[25%_1fr]">
        <h2 className="text-2xl font-bold tracking-tight">Who builds it</h2>
        <div className="grid gap-4 md:text-lg">
          {about.author.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <ul className="mt-2 flex flex-wrap gap-6 text-base">
            {footerLinks.map((link) => (
              <li key={link.label}>
                {"href" in link ? (
                  <a href={link.href} className="underline underline-offset-4">
                    {link.label}
                  </a>
                ) : (
                  link.label
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </article>
  );
}
