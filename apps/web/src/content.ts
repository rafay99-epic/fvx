/**
 * Every string on the site lives here. Components only lay it out, so copy
 * changes never touch JSX. Facts must match the CLI in apps/cli.
 */

type ExternalLink = { label: string; href?: string };
type Pin = { version: string; path: string; source: string };
type Titled = { title: string; body: string };

export const links = {
  repo: "https://github.com/rafay99-epic/fvx",
  github: "https://github.com/rafay99-epic",
  website: "https://rafay99.com",
} as const;

export const footerLinks = [
  { label: "GitHub", href: links.github },
  { label: "Syntax Lab Technology" }, // TODO: add href once the company URL is known
  { label: "rafay99.com", href: links.website },
] as const satisfies readonly ExternalLink[];

export const install = [
  { id: "brew", label: "Homebrew", command: "brew install rafay99-epic/apps/fvx" },
  { id: "npm", label: "npm", command: "npm i -g @rafay99/fvx" },
] as const;

export type InstallId = (typeof install)[number]["id"];

/** The hero rolls from `from` to `to` halfway through its scroll. */
export const hero = {
  title: "Same command. The folder decides.",
  lede: "fvx puts small flutter and dart shims first on your PATH. Each call reads the pin in the current folder and runs that SDK.",
  from: { version: "3.22.3", path: "~/code/client-app", source: ".fvmrc" },
  to: { version: "3.47.2", path: "~/code/new-package", source: "pubspec.yaml" },
} as const satisfies { title: string; lede: string; from: Pin; to: Pin };

/**
 * The pin walk. `tree` is listed from $HOME down to the working folder, and
 * each step points at the folder being checked by its index in `tree`.
 */
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

/** Resolution order inside one folder, then the fallbacks around the walk. */
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

export const commands = [
  { name: "fvx install [v]", body: "Download an official SDK, checksum verified." },
  { name: "fvx current", body: "The version this folder resolves to, and which file said so." },
  { name: "fvx which", body: "The real flutter binary for this folder." },
  { name: "fvx default [v]", body: "Set the global default." },
  { name: "fvx ls", body: "Installed SDKs." },
  { name: "fvx rm <v>", body: "Delete an SDK." },
  { name: "fvx doctor", body: "Check shims, PATH order, the default and this folder." },
  { name: "fvx upgrade", body: "Update fvx through Homebrew or npm." },
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
