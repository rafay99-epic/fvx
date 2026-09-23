import { Link } from "@tanstack/react-router";
import { links } from "@/content";
import { INTRO, useIntro } from "@/lib/intro";
import { cn } from "@/lib/utils";

const active = { className: "underline underline-offset-4" };

export function SiteNav() {
  const { plays, at } = useIntro("nav");
  return (
    <header
      className={cn("fixed inset-x-0 top-0 z-50 bg-black", plays && "animate-rise [--rise:-12px]")}
      style={{ animationDelay: `${at(INTRO.hero + 0.6)}s`, animationDuration: "0.6s" }}
    >
      <nav className="flex items-center justify-between px-[4vw] py-5">
        <Link to="/" className="text-xl font-extrabold tracking-tighter">
          fvx
        </Link>
        <div className="flex gap-6 text-sm">
          <Link to="/" activeOptions={{ exact: true }} activeProps={active}>
            Home
          </Link>
          <Link to="/docs" activeProps={active}>
            Docs
          </Link>
          <Link to="/about" activeProps={active}>
            About
          </Link>
          <a href={links.repo}>GitHub</a>
        </div>
      </nav>
    </header>
  );
}
