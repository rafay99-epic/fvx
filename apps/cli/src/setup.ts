/**
 * setup: the shims and the one PATH line that puts them first.
 *
 * A shim is a tiny POSIX sh script named `flutter` or `dart`. It asks
 * `fvx resolve` for the SDK root, then `exec`s the real binary, so no fvx
 * process stays alive under flutter. zsh, bash and fish all run the same file.
 * The only per-shell piece is how the PATH line is spelled.
 */

import { chmodSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join } from "node:path";
import { DEFAULT_LINK, HOME, SHIMS } from "./paths";

export const TOOLS = ["flutter", "dart"] as const;
export type Tool = (typeof TOOLS)[number];

const BLOCK_START = "# --- fvx ---";
const BLOCK_END = "# --- end fvx ---";

const shellQuote = (s: string) => `'${s.replaceAll("'", `'\\''`)}'`;

/**
 * Where fvx lives, as PATH spells it at setup time (`/opt/homebrew/bin/fvx`, a
 * symlink that survives upgrades, not the versioned Cellar path behind it).
 */
export const fvxOnPath = () => Bun.which("fvx") ?? "";

/**
 * The shim looks fvx up on PATH first, then at the absolute path recorded at
 * setup time. The second lookup matters: a non-login shell has the shims on
 * PATH (via ~/.zshenv) but not /opt/homebrew/bin, and without it every agent
 * and script in such a shell would silently get the default SDK.
 * Only when fvx is truly gone (uninstalled) does the shim run the global
 * default, so `flutter` keeps working.
 */
export function shimFor(tool: Tool, fvxPath: string = fvxOnPath()): string {
  const fallback = shellQuote(join(DEFAULT_LINK, "bin", tool));
  return `#!/bin/sh
# fvx shim. Resolve the SDK for $PWD, then become the real binary.
fvx=$(command -v fvx) || fvx=${shellQuote(fvxPath)}
[ -x "$fvx" ] || exec ${fallback} "$@"
sdk=$("$fvx" resolve) || exit $?
exec "$sdk/bin/${tool}" "$@"
`;
}

export function writeShims(fvxPath: string = fvxOnPath()): void {
  mkdirSync(SHIMS, { recursive: true });
  for (const tool of TOOLS) {
    const file = join(SHIMS, tool);
    writeFileSync(file, shimFor(tool, fvxPath));
    chmodSync(file, 0o755);
  }
}

/** True when every shim on disk matches what this version would write. */
export function shimsCurrent(): boolean {
  return TOOLS.every((tool) => {
    const file = join(SHIMS, tool);
    return existsSync(file) && readFileSync(file, "utf8") === shimFor(tool);
  });
}

type RcFile = {
  file: string;
  line: string;
  /** Create `file` when this sibling exists, even if `file` itself doesn't. */
  createIfExists?: string;
};

/**
 * The shims dir as the rc line spells it. Under the real home it is written
 * as $HOME/..., so one dotfiles repo works on machines with different users.
 */
function shimsForRc(): string {
  const home = homedir();
  return SHIMS.startsWith(`${home}/`) ? `"$HOME${SHIMS.slice(home.length)}"` : shellQuote(SHIMS);
}

/** The rc files fvx knows, with the PATH line in each shell's own syntax. */
export function rcFiles(): RcFile[] {
  const shims = shimsForRc();
  const posix = `export PATH=${shims}:"$PATH"`;
  const zshrc = join(HOME, ".zshrc");
  return [
    // .zshenv is the only file every zsh reads, including the non-interactive
    // ones agents and scripts run in. .zshrc still needs the line too: it runs
    // later, and anything it prepends to PATH would otherwise beat the shims.
    { file: join(HOME, ".zshenv"), line: posix, createIfExists: zshrc },
    { file: zshrc, line: posix },
    { file: join(HOME, ".bashrc"), line: posix },
    // Login bash (macOS Terminal) reads this one and skips .bashrc.
    { file: join(HOME, ".bash_profile"), line: posix },
    { file: join(HOME, ".config", "fish", "config.fish"), line: `fish_add_path --prepend ${shims}` },
  ];
}

/**
 * Pure rc-file edit. Replaces the marked block, appends one when absent, or
 * removes it when `line` is null. Text outside the markers is never touched.
 */
export function withBlock(text: string, line: string | null): string {
  const start = text.indexOf(BLOCK_START);
  const end = text.indexOf(BLOCK_END);
  const block = line === null ? "" : `${BLOCK_START}\n${line}\n${BLOCK_END}\n`;
  // Splicing between mismatched markers would eat the user's own lines.
  const count = (marker: string) => text.split(marker).length - 1;
  const paired = count(BLOCK_START) === 1 && count(BLOCK_END) === 1 && end > start;
  if (!paired && (start !== -1 || end !== -1)) {
    throw new Error(`found a damaged "${BLOCK_START}" block. Remove those marker lines by hand, then run fvx setup again`);
  }
  if (paired) {
    const after = text.slice(end + BLOCK_END.length).replace(/^\n/, "");
    return text.slice(0, start) + block + after;
  }
  if (line === null) return text;
  const gap = text === "" || text.endsWith("\n\n") ? "" : text.endsWith("\n") ? "\n" : "\n\n";
  return text + gap + block;
}

/** The rc file for $SHELL, used when the user has none of the known ones yet. */
function rcForLoginShell(all: RcFile[]): RcFile | undefined {
  const shell = basename(process.env.SHELL ?? "");
  return all.find(({ file }) => file.includes(shell === "fish" ? "config.fish" : `.${shell}rc`));
}

/**
 * Add the PATH block to every rc file that exists, or to the one for $SHELL
 * when none do. `targets` is empty when there was nothing fvx knows how to
 * edit (an unknown shell with no rc file), which is not the same as "already
 * in place".
 */
export function installRc(): { targets: string[]; changed: string[] } {
  const all = rcFiles();
  const existing = all.filter(
    ({ file, createIfExists }) => existsSync(file) || (createIfExists !== undefined && existsSync(createIfExists)),
  );
  const fallback = rcForLoginShell(all);
  const targets = existing.length ? existing : fallback ? [fallback] : [];
  const changed = targets.flatMap(({ file, line }) => {
    const before = existsSync(file) ? readFileSync(file, "utf8") : "";
    let after: string;
    try {
      after = withBlock(before, line);
    } catch (e) {
      throw new Error(`${file}: ${e instanceof Error ? e.message : e}`);
    }
    if (after === before) return [];
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, after);
    return [file];
  });
  return { targets: targets.map(({ file }) => file), changed };
}

/** Remove the PATH block and the shims. Returns the rc files changed. */
export function uninstall(): string[] {
  rmSync(SHIMS, { recursive: true, force: true });
  return rcFiles().flatMap(({ file }) => {
    if (!existsSync(file)) return [];
    const before = readFileSync(file, "utf8");
    const after = withBlock(before, null);
    if (after === before) return [];
    writeFileSync(file, after);
    return [file];
  });
}
