/**
 * setup: the shims and the one PATH line that puts them first.
 *
 * A shim is a tiny POSIX sh script named `flutter` or `dart`. It asks
 * `fvx resolve` for the SDK root, then `exec`s the real binary, so no fvx
 * process stays alive under flutter. zsh, bash and fish all run the same file.
 * The only per-shell piece is how the PATH line is spelled.
 *
 * On Windows a `.cmd` twin sits next to each sh shim, the way Flutter's own
 * bin folder pairs `flutter` with `flutter.bat`. cmd and PowerShell pick the
 * `.cmd`, Git Bash picks the sh script. The PATH entry lives in the registry
 * (see winpath.ts), not in rc files.
 */

import { chmodSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join } from "node:path";
import { DEFAULT_LINK, HOME, IS_WINDOWS, SHIMS } from "./paths";

export const TOOLS = ["flutter", "dart"] as const;
export type Tool = (typeof TOOLS)[number];

const BLOCK_START = "# --- fvx ---";
const BLOCK_END = "# --- end fvx ---";

const shellQuote = (s: string) => `'${s.replaceAll("'", `'\\''`)}'`;

/**
 * Where fvx lives, as PATH spells it at setup time (`/opt/homebrew/bin/fvx`, a
 * symlink that survives upgrades, not the versioned Cellar path behind it).
 *
 * Windows wants a real `fvx.exe`. npm puts only `fvx.cmd` on PATH, which would
 * start Node on every flutter call, so there the running binary is recorded
 * instead. Its path in node_modules stays the same across npm upgrades.
 */
export function fvxOnPath(): string {
  const found = Bun.which("fvx") ?? "";
  if (!IS_WINDOWS || found.toLowerCase().endsWith(".exe")) return found;
  return basename(process.execPath).toLowerCase() === "fvx.exe" ? process.execPath : "";
}

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

/** Inside a batch `set "name=value"` only `%` needs escaping. Windows paths can't hold `"`. */
const batchEscape = (s: string) => s.replaceAll("%", "%%");

/**
 * The Windows twin of `shimFor`, for cmd and PowerShell. Same fallback: no fvx
 * at the recorded path runs the global default. `for /f` drops the exit code of
 * `fvx resolve`, but a failed resolve prints nothing on stdout (its error goes
 * to stderr untouched), so an empty result is the failure signal.
 *
 * `%%fvx_exe%%` reaches the inner `cmd /c` as `%fvx_exe%` and expands there,
 * inside quotes, so spaces, `&` and `)` in the path can't break the line.
 * The last line has no `call`: cmd hands control to flutter.bat for good, the
 * batch version of `exec`, and the arguments reach it exactly as typed.
 */
export function cmdShimFor(tool: Tool, fvxPath: string = fvxOnPath()): string {
  return [
    "@echo off",
    `rem fvx shim. Resolve the SDK for this folder, then hand off to the real ${tool}.bat.`,
    "setlocal",
    `set "fvx_exe=${batchEscape(fvxPath)}"`,
    `set "fvx_sdk=${batchEscape(DEFAULT_LINK)}"`,
    'if exist "%fvx_exe%" (',
    '  set "fvx_sdk="',
    `  for /f "delims=" %%s in ('""%%fvx_exe%%" resolve"') do set "fvx_sdk=%%s"`,
    ")",
    "if not defined fvx_sdk exit /b 1",
    `"%fvx_sdk%\\bin\\${tool}.bat" %*`,
    "",
  ].join("\r\n");
}

/** Every shim file this platform needs, with its contents. */
function shimFiles(fvxPath: string): { file: string; text: string }[] {
  return TOOLS.flatMap((tool) => {
    const sh = { file: join(SHIMS, tool), text: shimFor(tool, fvxPath) };
    return IS_WINDOWS ? [sh, { file: join(SHIMS, `${tool}.cmd`), text: cmdShimFor(tool, fvxPath) }] : [sh];
  });
}

export function writeShims(fvxPath: string = fvxOnPath()): void {
  mkdirSync(SHIMS, { recursive: true });
  for (const { file, text } of shimFiles(fvxPath)) {
    writeFileSync(file, text);
    chmodSync(file, 0o755);
  }
}

/** True when every shim on disk matches what this version would write. */
export function shimsCurrent(): boolean {
  return shimFiles(fvxOnPath()).every(({ file, text }) => existsSync(file) && readFileSync(file, "utf8") === text);
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
