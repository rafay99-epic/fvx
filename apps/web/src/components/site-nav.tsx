import { Link } from "@tanstack/react-router";
import * as m from "motion/react-m";
import { links } from "@/content";
import { EASE_OUT, INTRO, useIntro } from "@/lib/intro";

const active = { className: "underline underline-offset-4" };

export function SiteNav() {
  const { plays, at } = useIntro("nav");
  return (
    <m.header
      className="fixed inset-x-0 top-0 z-50 bg-black"
      initial={plays ? { opacity: 0, y: -12 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: at(INTRO.hero + 0.6), duration: 0.6, ease: EASE_OUT }}
    >
      <nav className="flex items-center justify-between px-[4vw] py-5">
        <Link to="/" className="text-xl font-extrabold tracking-tighter">
          fvx
        </Link>
        <div className="flex gap-6 text-sm">
          <Link to="/" activeOptions={{ exact: true }} activeProps={active}>
            Home
          </Link>
          <Link to="/about" activeProps={active}>
            About
          </Link>
          <a href={links.repo}>GitHub</a>
        </div>
      </nav>
    </m.header>
  );
}
