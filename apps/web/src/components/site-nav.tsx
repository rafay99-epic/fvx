import { Link } from "@tanstack/react-router";
import { links } from "@/content";

const active = { className: "underline underline-offset-4" };

/** Fixed top bar on solid black, so scrolled content never shows through it. */
export function SiteNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-black">
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
    </header>
  );
}
