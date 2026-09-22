import { footerLinks } from "@/content";

export function SiteFooter() {
  return (
    <footer className="flex flex-wrap justify-between gap-4 border-t border-line px-[4vw] py-8 text-sm">
      <span>fvx · MIT</span>
      <ul className="flex flex-wrap gap-6">
        {footerLinks.map((link) => (
          <li key={link.label}>{"href" in link ? <a href={link.href}>{link.label}</a> : link.label}</li>
        ))}
      </ul>
    </footer>
  );
}
