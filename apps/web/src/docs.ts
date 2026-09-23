/**
 * Every string on /docs. Facts here must match apps/cli: command names, flags and the output
 * samples come from src/commands.ts and friends. Update this file when a command changes.
 */

import { editorSetting, install, links } from "./content";

/** A terminal transcript. Each command types itself out, then its output rises in. */
export type Session = readonly { command: string; output?: readonly string[] }[];

type Flag = { flag: string; body: string };

export type Command = {
  name: string;
  args?: string;
  aliases?: readonly string[];
  summary: string;
  body?: string;
  flags?: readonly Flag[];
  example?: Session;
};

export const docs = {
  title: "Docs.",
  lede: "Install, set up once, pin a folder. Every command, flag and file fvx reads.",
  facts: ["macOS and Linux", "arm64 and x64", "MIT"],
} as const;

export const sections = [
  { id: "install", title: "Install" },
  { id: "setup", title: "Set up once" },
  { id: "pin", title: "Pin a project" },
  { id: "resolution", title: "How it picks" },
  { id: "commands", title: "Commands" },
  { id: "environment", title: "Environment" },
  { id: "editors", title: "Editors" },
  { id: "upgrade", title: "Upgrade and remove" },
  { id: "releases", title: "Releases" },
] as const;

export type SectionId = (typeof sections)[number]["id"];

export const installChannels = [
  { ...install[0], note: "Prebuilt binary. Shell completions install with it." },
  { ...install[1], note: "Prebuilt binary per platform, started through a small Node launcher." },
  { id: "pnpm", label: "pnpm", command: "pnpm add -g @rafay99/fvx", note: "Same package as npm." },
  { id: "bun", label: "bun", command: "bun add -g @rafay99/fvx", note: "Same package as npm. No postinstall, so it works with scripts disabled." },
  {
    id: "binary",
    label: "Binary",
    command: `curl -fsSL ${links.repo}/releases/latest/download/fvx-darwin-arm64.tar.gz | tar -xz`,
    note: "Swap darwin-arm64 for darwin-x64, linux-x64 or linux-arm64, then move fvx onto your PATH.",
  },
] as const;

export const setup = {
  body: "fvx setup writes two small scripts, flutter and dart, and puts their folder first on PATH. Restart the shell once and every flutter call goes through fvx.",
  session: [
    {
      command: "fvx setup",
      output: ["✓ shims written to ~/.fvx/shims", "✓ PATH line added to ~/.zshenv, ~/.zshrc. Restart your shell."],
    },
    { command: "fvx doctor", output: ["✓ shims are written and current", "✓ shims come first on PATH"] },
  ],
  files: [
    { file: "~/.zshenv", body: "The only file a non-interactive zsh reads. Scripts and coding agents run there." },
    { file: "~/.zshrc", body: "Runs later, so anything it prepends would otherwise beat the shims." },
    { file: "~/.bashrc and ~/.bash_profile", body: "Login bash, like macOS Terminal, reads only the profile." },
    { file: "~/.config/fish/config.fish", body: "fish_add_path --prepend." },
  ],
  note: "Each file gets one marked block and nothing else. fvx setup --print shows the lines and edits nothing, for people who keep their own dotfiles.",
} as const;

export const pin = {
  body: "fvx use writes .fvmrc in the current folder. Commit it and everyone who clones the repo gets the same Flutter.",
  session: [
    {
      command: "fvx use 3.22.3",
      output: ["✓ pinned Flutter 3.22.3 in ~/code/client-app/.fvmrc", "! 3.22.3 is not installed yet. Run: fvx install 3.22.3"],
    },
    {
      command: "fvx install",
      output: ["installing Flutter 3.22.3 into ~/.flutter-sdk", "✓ installed ~/.flutter-sdk/3.22.3/flutter"],
    },
    { command: "flutter --version", output: ["Flutter 3.22.3 • channel stable • https://github.com/flutter/flutter.git"] },
  ],
  notes: [
    "fvx install with no version installs what this folder pins.",
    "fvx use with no version opens a picker. fzf when it is installed, a numbered menu otherwise.",
    "Other keys in an existing .fvmrc are kept, so FVM users lose nothing.",
  ],
} as const;

export const resolution = {
  rules: [
    { title: "Nearest folder wins.", body: "fvx walks up from the current folder and stops at $HOME. A package in a monorepo can pin differently from the root." },
    { title: "One folder, one order.", body: "Inside a folder the sources rank as listed. FVX_VERSION beats them all." },
    { title: "Ranges only step in when needed.", body: "A pubspec.yaml range changes nothing while your default fits it. When it doesn't, fvx picks the highest installed version that does." },
    { title: "No silent fallback.", body: "A pinned version that is not installed is an error with the fix in it. fvx never runs a different version quietly." },
  ],
  missing: [
    {
      command: "flutter --version",
      output: ["fvx: Flutter 3.24.0 pinned by /Users/you/code/app/.fvmrc is not installed. Run: fvx install 3.24.0"],
    },
  ],
} as const;

export const commandGroups: readonly { title: string; commands: readonly Command[] }[] = [
  {
    title: "Everyday",
    commands: [
      {
        name: "use",
        args: "[version]",
        summary: "Pin this folder by writing .fvmrc.",
        body: "No version opens a picker of installed SDKs.",
        example: [{ command: "fvx use 3.22.3", output: ["✓ pinned Flutter 3.22.3 in ~/code/client-app/.fvmrc"] }],
      },
      {
        name: "install",
        args: "[version]",
        summary: "Download an official SDK, checksum verified.",
        body: "No version installs this folder's pin. The first SDK on a machine becomes the default. Honors FLUTTER_STORAGE_BASE_URL.",
        example: [
          {
            command: "fvx install 3.47.2",
            output: ["installing Flutter 3.47.2 into ~/.flutter-sdk", "✓ installed ~/.flutter-sdk/3.47.2/flutter"],
          },
        ],
      },
      {
        name: "current",
        summary: "The version this folder resolves to, and which file said so.",
        example: [{ command: "fvx current", output: ["3.22.3  from ~/code/client-app/.fvmrc"] }],
      },
      {
        name: "ls",
        aliases: ["list"],
        summary: "Installed SDKs, with the default and this folder's pick marked.",
        flags: [{ flag: "--labels", body: "One label per line and nothing else, for scripts." }],
        example: [{ command: "fvx ls", output: ["3.22.3  3.22.3      this folder", "3.47.2  3.47.2      default"] }],
      },
      {
        name: "default",
        args: "[version]",
        summary: "Set the global default, used where nothing is pinned.",
        example: [{ command: "fvx default 3.47.2", output: ["✓ default is now Flutter 3.47.2  ~/.flutter-sdk/3.47.2/flutter"] }],
      },
      {
        name: "rm",
        args: "<version>",
        aliases: ["remove"],
        summary: "Delete an installed SDK. Asks first.",
        body: "The default can't be removed. Pick another default first.",
        flags: [{ flag: "--yes, -y", body: "Skip the prompt. Required outside a terminal." }],
      },
    ],
  },
  {
    title: "Setup and upkeep",
    commands: [
      {
        name: "setup",
        summary: "Write the shims and the PATH line for zsh, bash and fish.",
        flags: [
          { flag: "--print", body: "Show the PATH lines and edit nothing." },
          { flag: "--uninstall", body: "Remove the shims and the PATH block." },
        ],
      },
      {
        name: "doctor",
        summary: "Check the shims, PATH order, the default and this folder.",
        body: "Every failed check prints its fix. Exits 1 when anything fails.",
        example: [
          {
            command: "fvx doctor",
            output: [
              "✓ shims are written and current",
              "✓ shims come first on PATH",
              "✓ a global default is set",
              "✓ this folder resolves",
              "✓ SDK folder names match their contents",
            ],
          },
        ],
      },
      {
        name: "upgrade",
        summary: "Update fvx through whichever of Homebrew, npm, pnpm or bun installed it.",
        body: "The only command that checks for updates. Nothing runs in the background.",
        flags: [{ flag: "--check", body: "Only report whether a newer release exists." }],
      },
      {
        name: "completions",
        args: "zsh|bash|fish",
        aliases: ["completion"],
        summary: "Print a shell completion script. Homebrew installs them for you.",
        example: [{ command: "fvx completions fish > ~/.config/fish/completions/fvx.fish" }],
      },
    ],
  },
  {
    title: "Scripting",
    commands: [
      {
        name: "resolve",
        summary: "Print the SDK root for this folder. What the shims call.",
        body: "No network, no child processes, about 10 ms. Stdout carries the path and nothing else.",
        example: [{ command: "fvx resolve", output: ["/Users/you/.flutter-sdk/3.22.3/flutter"] }],
      },
      {
        name: "which",
        summary: "Print the real flutter binary for this folder.",
        example: [{ command: "fvx which", output: ["/Users/you/.flutter-sdk/3.22.3/flutter/bin/flutter"] }],
      },
      { name: "version", aliases: ["-v", "--version"], summary: "Print the fvx version." },
      { name: "help", aliases: ["-h", "--help"], summary: "Show help." },
    ],
  },
];

export const environment = [
  { name: "FVX_VERSION", body: "Use this version for one command or one shell, whatever the folder pins.", example: "FVX_VERSION=3.22.3 flutter build apk" },
  { name: "FLUTTER_SDK_HOME", body: "Where SDKs live.", example: "~/.flutter-sdk" },
  { name: "FLUTTER_STORAGE_BASE_URL", body: "Flutter's own mirror switch. fvx install downloads through it.", example: "https://storage.flutter-io.cn" },
  { name: "NO_COLOR", body: "Plain output in a terminal too. Piped output is always plain.", example: "NO_COLOR=1 fvx ls" },
  { name: "FVX_DEBUG", body: "Print the full stack trace when a command fails.", example: "FVX_DEBUG=1 fvx install 3.22.3" },
  { name: "FVX_HOME", body: "Moves the shims, the rc files, the SDK folder and where the pin walk stops. For sandboxes.", example: "FVX_HOME=$(mktemp -d) fvx setup" },
] as const;

export const editors = {
  vscode: {
    title: "VS Code and Cursor",
    body: "They don't read PATH to find the SDK. Add this to your user settings once and every workspace follows its own pin.",
    setting: editorSetting,
  },
  others: [
    { title: "Android Studio", body: "Keeps its own SDK path per project. Set it to what fvx resolve prints." },
    { title: "Xcode and Gradle", body: "Use the path Flutter wrote on the last flutter pub get. Through fvx that is the pinned SDK." },
  ],
} as const;

export const upgrade = {
  body: "fvx upgrade asks GitHub for the latest release and runs the right package manager. A binary from a tarball gets the release link instead, fvx never replaces itself.",
  session: [{ command: "fvx upgrade" }],
  removeTitle: "Remove it",
  removeBody: "Take the shims and the PATH block out first, then the binary. Installed with npm? The second line is npm rm -g @rafay99/fvx. SDKs stay in ~/.flutter-sdk until you delete them.",
  remove: [{ command: "fvx setup --uninstall" }, { command: "brew uninstall fvx" }],
} as const;

export const releases = {
  body: "Every merge that touches the CLI ships to GitHub, Homebrew and npm at once. The version is 0.N, where N is the commit count of the repo.",
  links: [
    { label: "Source", href: links.repo },
    { label: "Releases", href: `${links.repo}/releases` },
    { label: "npm", href: "https://www.npmjs.com/package/@rafay99/fvx" },
    { label: "Homebrew tap", href: "https://github.com/rafay99-epic/homebrew-apps" },
    { label: "Issues", href: `${links.repo}/issues` },
  ],
  verifyTitle: "Verify a download",
  verifyBody: "Each tarball carries signed build provenance. This proves it came from the release workflow on this repo.",
  verify: `gh attestation verify fvx-darwin-arm64.tar.gz --repo rafay99-epic/fvx`,
} as const;
