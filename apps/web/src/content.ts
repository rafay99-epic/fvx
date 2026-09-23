import type { FileRoutesByFullPath } from "./routeTree.gen";

type ExternalLink = { label: string; href?: string };
type Page = { title: string; description: string };
type Pin = { version: string; path: string; source: string };
type Titled = { title: string; body: string };

export const site = {
  url: "https://fvx.rafay99.com",
  name: "fvx",
  image: "/og.png",
  imageAlt: "fvx. Same command. The folder decides.",
} as const;

export const pages = {
  "/": {
    title: "fvx: per-project Flutter SDK switching",
    description:
      "fvx runs the Flutter version each folder pins. Shims on PATH, no cd hook, about 10 ms per lookup. Works in scripts, CI and coding agents.",
  },
  "/docs": {
    title: "fvx docs: install, setup and every command",
    description:
      "Install fvx with Homebrew, npm or a binary, set up the shims once, pin a folder. Every command, flag, pin file and environment variable.",
  },
  "/about": {
    title: "About fvx",
    description:
      "Why fvx resolves the Flutter version when flutter runs instead of on cd, what is not done yet, and who builds it.",
  },
} as const satisfies Record<keyof FileRoutesByFullPath, Page>;

export const notFound = { title: "Not found · fvx" } as const;

const pagesByPath: Partial<Record<string, Page>> = pages;

export function titleFor(pathname: string): string {
  return pagesByPath[pathname.replace(/\/$/, "") || "/"]?.title ?? notFound.title;
}

export const links = {
  repo: "https://github.com/rafay99-epic/fvx",
  github: "https://github.com/rafay99-epic",
  website: "https://rafay99.com",
} as const;

export const footerLinks = [
  { label: "GitHub", href: links.github },
  { label: "Syntax Lab Technology" },
  { label: "rafay99.com", href: links.website },
] as const satisfies readonly ExternalLink[];

export const install = [
  { id: "brew", label: "Homebrew", command: "brew install rafay99-epic/apps/fvx" },
  { id: "npm", label: "npm", command: "npm i -g @rafay99/fvx" },
] as const;

export const hero = {
  title: "Same command. The folder decides.",
  lede: "fvx puts small flutter and dart shims first on your PATH. Each call reads the pin in the current folder and runs that SDK.",
  from: { version: "3.22.3", path: "~/code/client-app", source: ".fvmrc" },
  to: { version: "3.47.2", path: "~/code/new-package", source: "pubspec.yaml" },
} as const satisfies { title: string; lede: string; from: Pin; to: Pin };

export const walk = {
  title: "It walks up until it finds a pin.",
  body: "The nearest folder with an answer wins, so a package inside a monorepo can pin differently from the root.",
  tree: ["~", "code/", "monorepo/", "packages/app/", "lib/"],
  foundAt: 2,
  foundFile: ".fvmrc",
  steps: [
    { at: 4, log: "lib/  no pin, keep walking" },
    { at: 3, log: "packages/app/  pubspec.yaml sets no flutter range" },
    { at: 2, log: "monorepo/  .fvmrc says 3.22.3" },
    { at: 2, log: "exec ~/.flutter-sdk/3.22.3/flutter/bin/flutter" },
  ],
} as const;

export const pinSources = [
  { file: "FVX_VERSION", example: "FVX_VERSION=3.22.3 flutter build apk" },
  { file: ".fvmrc", example: '{"flutter": "3.22.3"}' },
  { file: ".fvm/fvm_config.json", example: '{"flutterSdkVersion": "3.22.3"}' },
  { file: ".tool-versions", example: "flutter 3.22.3-stable" },
  { file: "pubspec.yaml", example: 'flutter: ">=3.19.0 <4.0.0"' },
  { file: "global default", example: "~/.flutter-sdk/current" },
] as const;

export const anywhere = {
  words: ["scripts", "Makefiles", "git hooks", "CI", "coding agents"],
  body: "There is no cd hook. The shim runs wherever flutter runs, so every one of these gets the pinned SDK.",
} as const;

export const features = [
  { title: "No silent fallback.", body: "A folder that pins a missing version stops and prints the fvx install command to run." },
  { title: "Reads the pins you have.", body: "fvx use writes .fvmrc, so teammates on FVM read the same pin." },
  { title: "Checksum-verified installs.", body: "Official SDKs only. Mirrors work through FLUTTER_STORAGE_BASE_URL." },
  { title: "About 10 ms.", body: "No network and no child processes on the hot path." },
] as const satisfies readonly Titled[];

export const usage = [
  { command: "brew install rafay99-epic/apps/fvx", note: "Or npm i -g @rafay99/fvx. Both ship a prebuilt binary." },
  { command: "fvx setup", note: "Writes the shims and one PATH line for zsh, bash and fish. Restart the shell." },
  { command: "fvx use 3.22.3", note: "Pins this folder. Run it without a version to pick from a list." },
] as const;

export const editorSetting = `"dart.getFlutterSdkCommand": { "executable": "fvx", "args": ["resolve"] }`;

export const about = {
  product: [
    "fvx is a Flutter version switcher for macOS and Linux. It is one Bun binary with no runtime dependencies, shipped through Homebrew, npm and GitHub Releases.",
    "Switchers that hook cd only work in an interactive shell. Scripts, CI and coding agents never run that hook, so they pick up whatever SDK is on PATH. fvx resolves the version when flutter runs instead.",
    "fvx use writes .fvmrc, the file FVM users already commit, so moving over does not break a team.",
  ],
  notYet: ["Windows", "Channel pins that track stable or beta", "mise.toml and .puro.json"],
  author: [
    "Built by Abdul Rafay, a full-stack developer at Syntax Lab Technology.",
    "Other projects and writing live on rafay99.com.",
  ],
} as const;
