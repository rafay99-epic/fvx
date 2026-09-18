/**
 * commands: one function per subcommand. `resolve`, `which` and `ls --labels`
 * are scripting surfaces: stdout carries the answer and nothing else.
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { delimiter, join } from "node:path";
import { COMMANDS, COMPLETION_SHELLS, completionFor, type CompletionShell } from "./completions";
import { install } from "./install";
import { DEFAULT_LINK, HOME, SDK_HOME, SHIMS } from "./paths";
import { DEFAULT_SOURCE, explain, findPin, resolve, workingDir } from "./resolve";
import { defaultSdk, findSdk, hasDrifted, listSdks, removeSdk, setDefault, type Sdk } from "./sdks";
import { installRc, rcFiles, shimsCurrent, uninstall, writeShims } from "./setup";
import { bold, cyan, die, dim, green, red, yellow } from "./ui";
import { VERSION } from "./version";

const tilde = (path: string) => (path.startsWith(HOME) ? `~${path.slice(HOME.length)}` : path);

/** Resolve or exit with the explanation. Shared by every command that needs an SDK. */
function resolveOrDie() {
  const result = resolve();
  if (result.kind !== "ok") die(explain(result));
  return result;
}

export function cmdResolve(): void {
  console.log(resolveOrDie().sdk.root);
}

export function cmdWhich(): void {
  console.log(join(resolveOrDie().sdk.root, "bin", "flutter"));
}

export function cmdCurrent(): void {
  const { sdk, source } = resolveOrDie();
  const why = source === DEFAULT_SOURCE ? "global default" : `from ${tilde(source)}`;
  console.log(`${bold(sdk.version)}  ${dim(why)}`);
}

export function cmdLs(args: string[]): void {
  const sdks = listSdks();
  if (args.includes("--labels")) {
    for (const sdk of sdks) console.log(sdk.label);
    return;
  }
  if (!sdks.length) {
    console.log(`No SDKs under ${tilde(SDK_HOME)}. Run: fvx install <version>`);
    return;
  }
  const fallback = defaultSdk();
  const here = resolve();
  const width = Math.max(...sdks.map((sdk) => sdk.label.length));
  for (const sdk of sdks) {
    const tags = [
      fallback?.root === sdk.root ? "default" : "",
      here.kind === "ok" && here.sdk.root === sdk.root ? "this folder" : "",
      hasDrifted(sdk) ? `holds ${sdk.version}` : "",
    ].filter(Boolean);
    // Pad before coloring: escape codes would break the column.
    console.log(`${bold(sdk.label.padEnd(width))}  ${dim(sdk.version.padEnd(12))}${tags.length ? green(tags.join(", ")) : ""}`);
  }
}

/** Pick an installed SDK. fzf when there is one, a numbered menu otherwise. */
function pick(prompt: string): Sdk {
  const sdks = listSdks();
  if (!sdks.length) die(`no SDKs under ${tilde(SDK_HOME)}. Run: fvx install <version>`);
  if (!process.stdin.isTTY) die("no version given");

  const fzf = spawnSync("fzf", ["--height=40%", "--reverse", `--prompt=${prompt} `], {
    input: sdks.map((sdk) => `${sdk.label}\t${sdk.version}`).join("\n"),
    stdio: ["pipe", "pipe", "inherit"],
    encoding: "utf8",
  });
  if (!fzf.error) {
    const label = fzf.stdout.split("\t")[0]?.trim();
    const chosen = sdks.find((sdk) => sdk.label === label);
    if (!chosen) die("cancelled", 130);
    return chosen;
  }
  sdks.forEach((sdk, i) => console.log(`  [${i + 1}] ${sdk.label.padEnd(10)} ${dim(sdk.version)}`));
  const answer = globalThis.prompt(`${prompt} [1-${sdks.length}]:`);
  const chosen = sdks[Number.parseInt(answer ?? "", 10) - 1];
  if (!chosen) die("invalid selection");
  return chosen;
}

export function cmdDefault(args: string[]): void {
  const [wanted] = args;
  const sdk = wanted ? findSdk(wanted) : pick("default");
  if (!sdk) die(`Flutter ${wanted} is not installed. Run: fvx install ${wanted}`);
  setDefault(sdk);
  console.log(`${green("✓")} default is now Flutter ${bold(sdk.version)}  ${dim(tilde(sdk.root))}`);
}

/**
 * Pin the current folder by writing `.fvmrc`, the file FVM users already
 * commit. Other keys in an existing file are kept.
 */
export function cmdUse(args: string[]): void {
  const version = args[0] ?? pick("use").label;
  const file = join(workingDir(), ".fvmrc");
  let config: Record<string, unknown> = {};
  if (existsSync(file)) {
    try {
      const parsed: unknown = JSON.parse(readFileSync(file, "utf8"));
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        config = { ...parsed };
      }
    } catch {
      die(`${file} is not valid JSON. Fix or delete it first.`);
    }
  }
  writeFileSync(file, `${JSON.stringify({ ...config, flutter: version }, null, 2)}\n`);
  console.log(`${green("✓")} pinned Flutter ${bold(version)} in ${tilde(file)}`);
  if (!findSdk(version)) {
    console.log(`${yellow("!")} ${version} is not installed yet. Run: fvx install ${version}`);
  } else {
    console.log(dim("  run `flutter pub get` if this project last used another version"));
  }
}

export async function cmdInstall(args: string[]): Promise<void> {
  let [version] = args;
  if (!version) {
    const pin = findPin(workingDir());
    if (pin?.kind !== "exact") die("no version given and this folder has no exact pin");
    version = pin.version;
  }
  if (findSdk(version)) die(`Flutter ${version} is already installed`);
  console.log(`installing Flutter ${bold(version)} into ${tilde(SDK_HOME)}`);
  const root = await install(version);
  console.log(`${green("✓")} installed ${tilde(root)}`);
  if (!defaultSdk()) {
    const sdk = findSdk(version);
    if (sdk) {
      setDefault(sdk);
      console.log(`${green("✓")} first SDK on this machine, set as default`);
    }
  }
}

export function cmdRm(args: string[]): void {
  const [wanted] = args;
  if (!wanted) die("usage: fvx rm <version>");
  const sdk = findSdk(wanted);
  if (!sdk) die(`Flutter ${wanted} is not installed`);
  if (defaultSdk()?.root === sdk.root) die(`${sdk.label} is the default. Pick another with: fvx default <version>`);
  const target = tilde(join(SDK_HOME, sdk.label));
  if (!args.includes("--yes") && !args.includes("-y")) {
    if (!process.stdin.isTTY) die(`refusing to delete ${target} without --yes`);
    if (globalThis.prompt(`Delete ${target}? [y/N]`)?.toLowerCase() !== "y") die("cancelled", 130);
  }
  removeSdk(sdk);
  console.log(`${green("✓")} removed ${target}`);
}

export function cmdSetup(args: string[]): void {
  if (args.includes("--uninstall")) {
    const changed = uninstall();
    console.log(`${green("✓")} removed shims${changed.length ? ` and the PATH block from ${changed.map(tilde).join(", ")}` : ""}`);
    return;
  }
  if (args.includes("--print")) {
    for (const { file, line } of rcFiles()) console.log(`${dim(`# ${tilde(file)}`)}\n${line}`);
    return;
  }
  writeShims();
  console.log(`${green("✓")} shims written to ${tilde(SHIMS)}`);
  const { targets, changed } = installRc();
  if (!targets.length) {
    console.log(`${yellow("!")} no zsh, bash or fish rc file found. Add the shims to PATH yourself:\n  ${rcFiles()[0]?.line}`);
  } else {
    console.log(
      changed.length
        ? `${green("✓")} PATH line added to ${changed.map(tilde).join(", ")}. Restart your shell.`
        : `${green("✓")} PATH line already in place`,
    );
  }
  console.log(`\nFor VS Code and Cursor, add this to your user settings once:\n  ${cyan(`"dart.getFlutterSdkCommand": { "executable": "fvx", "args": ["resolve"] }`)}`);
}

export function cmdDoctor(): void {
  const pathDirs = (process.env.PATH ?? "").split(delimiter);
  const firstFlutter = pathDirs.find((dir) => existsSync(join(dir, "flutter")));
  const here = resolve();
  const drifted = listSdks().filter(hasDrifted);
  const real = (p: string) => {
    try {
      return realpathSync(p);
    } catch {
      return p;
    }
  };

  const checks: { ok: boolean; label: string; fix: string }[] = [
    { ok: shimsCurrent(), label: "shims are written and current", fix: "run: fvx setup" },
    {
      ok: firstFlutter !== undefined && real(firstFlutter) === real(SHIMS),
      label: "shims come first on PATH",
      fix: firstFlutter
        ? `${tilde(firstFlutter)} wins instead. Run fvx setup, restart the shell, and move that entry after the shims`
        : "run: fvx setup, then restart the shell",
    },
    { ok: defaultSdk() !== undefined, label: "a global default is set", fix: `${tilde(DEFAULT_LINK)} is missing or dangling. Run: fvx default <version>` },
    { ok: here.kind === "ok", label: "this folder resolves", fix: here.kind === "ok" ? "" : explain(here) },
    {
      ok: drifted.length === 0,
      label: "SDK folder names match their contents",
      fix: drifted.map((sdk) => `${sdk.label} holds ${sdk.version}`).join(", "),
    },
  ];
  for (const check of checks) {
    console.log(check.ok ? `${green("✓")} ${check.label}` : `${red("✗")} ${check.label}\n    ${check.fix}`);
  }
  if (checks.some((check) => !check.ok)) process.exitCode = 1;
}

export function cmdCompletions(args: string[]): void {
  const shell = COMPLETION_SHELLS.find((s): s is CompletionShell => s === args[0]);
  if (!shell) die(`usage: fvx completions ${COMPLETION_SHELLS.join("|")}`);
  process.stdout.write(completionFor(shell));
}

export function cmdVersion(): void {
  console.log(VERSION);
}

export function help(): void {
  const width = Math.max(...Object.keys(COMMANDS).map((name) => name.length));
  console.log(`${bold("fvx")} ${VERSION}  per-project Flutter SDK switching

Run flutter in any folder and get the Flutter version that folder pins.
Pins are read from .fvmrc, .fvm/fvm_config.json, .tool-versions and pubspec.yaml.

${bold("Commands")}
${Object.entries(COMMANDS).map(([name, desc]) => `  ${cyan(name.padEnd(width))}  ${desc}`).join("\n")}

${bold("Environment")}
  ${cyan("FVX_VERSION")}       use this version in the current shell, whatever the folder says
  ${cyan("FLUTTER_SDK_HOME")}  where SDKs live (default ~/.flutter-sdk)`);
}
