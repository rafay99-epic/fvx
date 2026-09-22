import type { Plugin } from "vite";
import { links, notFound, pages, site } from "./src/content";

type Path = keyof typeof pages;

const isPath = (value: string): value is Path => value in pages;

const paths = Object.keys(pages).filter(isPath);

const attr = (value: string) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

const urlFor = (path: Path) => `${site.url}${path === "/" ? "/" : path}`;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: site.name,
  description: pages["/"].description,
  url: site.url,
  image: `${site.url}${site.image}`,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "macOS, Linux",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  license: "https://opensource.org/licenses/MIT",
  author: { "@type": "Person", name: "Abdul Rafay", url: links.website },
  sameAs: [links.repo],
};

function headTags(path: Path | null): string {
  if (path === null) {
    return [`<title>${attr(notFound.title)}</title>`, `<meta name="robots" content="noindex" />`]
      .map((tag) => `    ${tag}\n`)
      .join("");
  }
  const { title, description } = pages[path];
  const url = urlFor(path);
  const image = `${site.url}${site.image}`;
  const tags = [
    `<title>${attr(title)}</title>`,
    `<meta name="description" content="${attr(description)}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${site.name}" />`,
    `<meta property="og:title" content="${attr(title)}" />`,
    `<meta property="og:description" content="${attr(description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${attr(site.imageAlt)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${attr(title)}" />`,
    `<meta name="twitter:description" content="${attr(description)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
  ];
  if (path === "/") {
    tags.push(`<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>`);
  }
  return tags.map((tag) => `    ${tag}\n`).join("");
}

function sitemap(): string {
  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = paths.map((path) => `  <url>\n    <loc>${urlFor(path)}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

const robots = `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`;

export function seo(): Plugin {
  return {
    name: "fvx-seo",
    enforce: "post",
    transformIndexHtml: {
      order: "post",
      handler(html, ctx) {
        const requested = (ctx.originalUrl ?? "/").split("?")[0]?.replace(/\/$/, "") || "/";
        return html.replace("</head>", `${headTags(isPath(requested) ? requested : "/")}  </head>`);
      },
    },
    generateBundle(_, bundle) {
      const index = bundle["index.html"];
      if (index?.type !== "asset" || typeof index.source !== "string") {
        this.error("index.html was not emitted before the seo plugin ran");
      }
      const html = index.source;
      const home = headTags("/");
      if (!html.includes(home)) this.error("home head tags not found in index.html");
      for (const path of paths) {
        if (path === "/") continue;
        this.emitFile({ type: "asset", fileName: `${path.slice(1)}/index.html`, source: html.replace(home, headTags(path)) });
      }
      this.emitFile({ type: "asset", fileName: "404.html", source: html.replace(home, headTags(null)) });
      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: sitemap() });
      this.emitFile({ type: "asset", fileName: "robots.txt", source: robots });
    },
  };
}
