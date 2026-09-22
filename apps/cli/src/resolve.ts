/**
 * resolve: which Flutter SDK does this folder want?
 *
 * Runs on every `flutter` and `dart` call through the shims, so it is a hot
 * path: no network, no child processes, nothing printed from here.
 *
 * Order: FVX_VERSION env, then walk up from the working directory. The nearest
 * folder with an answer wins. Inside one folder the sources rank:
 *   .fvmrc > .fvm/fvm_config.json > .tool-versions > pubspec.yaml
 * No answer anywhere falls back to the global default symlink.
 */

import { existsSync, readFileSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import { HOME } from "./paths";
import { defaultSdk, findSdk, listSdks, type Sdk } from "./sdks";

export type Pin =
  | { kind: "exact"; version: string; source: string }
  | { kind: "range"; range: string; source: string };

export type Resolution =
  | { kind: "ok"; sdk: Sdk; source: string }
  | { kind: "missing"; pin: Pin }
  | { kind: "invalid"; reason: string }
  | { kind: "none" };

/** Source label used when nothing pinned the folder. */
export const DEFAULT_SOURCE = "default";

/**
 * The directory the user sees in their prompt. $PWD keeps symlinked paths
 * intact, but a parent that spawned us with a `cwd` option leaves it stale, so
 * it only counts when it points at the real working directory.
 */
export function workingDir(): string {
  const cwd = process.cwd();
  const pwd = process.env.PWD;
  if (!pwd || !isAbsolute(pwd)) return cwd;
  try {
    return realpathSync(pwd) === realpathSync(cwd) ? pwd : cwd;
  } catch {
    return cwd;
  }
}

function readJson(file: string): unknown {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    // A broken pin file must stop the run. Guessing a version is worse.
    throw new Error(`${file} is not valid JSON`);
  }
}

/** One property of parsed JSON or YAML, which arrives as `unknown`. */
function field(data: unknown, key: string): unknown {
  return typeof data === "object" && data !== null && key in data
    ? (data as Record<string, unknown>)[key]
    : undefined;
}

function stringField(data: unknown, key: string): string | undefined {
  const value = field(data, key);
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

/** `flutter 3.22.3-stable` in an asdf/mise file. The channel suffix is dropped. */
function fromToolVersions(file: string): string | undefined {
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const [tool, version] = line.trim().split(/\s+/);
    if (tool === "flutter" && version) return version.replace(/-(stable|beta|dev|master)$/, "");
  }
  return undefined;
}

/** `environment: flutter:` constraint. A broken pubspec is flutter's to report. */
function fromPubspec(file: string): string | undefined {
  try {
    const doc: unknown = Bun.YAML.parse(readFileSync(file, "utf8"));
    const range = stringField(field(doc, "environment"), "flutter");
    return range && range !== "any" ? range : undefined;
  } catch {
    return undefined;
  }
}

/** The pin declared by one folder, or undefined when it has no answer. */
function pinIn(dir: string): Pin | undefined {
  const fvmrc = join(dir, ".fvmrc");
  if (existsSync(fvmrc)) {
    const version = stringField(readJson(fvmrc), "flutter");
    if (version) return { kind: "exact", version, source: fvmrc };
  }
  const fvmLegacy = join(dir, ".fvm", "fvm_config.json");
  if (existsSync(fvmLegacy)) {
    const version = stringField(readJson(fvmLegacy), "flutterSdkVersion");
    if (version) return { kind: "exact", version, source: fvmLegacy };
  }
  const toolVersions = join(dir, ".tool-versions");
  if (existsSync(toolVersions)) {
    const version = fromToolVersions(toolVersions);
    if (version) return { kind: "exact", version, source: toolVersions };
  }
  const pubspec = join(dir, "pubspec.yaml");
  if (existsSync(pubspec)) {
    const range = fromPubspec(pubspec);
    if (range) return { kind: "range", range, source: pubspec };
  }
  return undefined;
}

function isHome(dir: string): boolean {
  if (dir === HOME) return true;
  try {
    return realpathSync(dir) === HOME; // `dir` may be a logical path through a symlink
  } catch {
    return false;
  }
}

/** Walk up from `start`. Stops after HOME, or at the filesystem root. */
export function findPin(start: string): Pin | undefined {
  for (let dir = start; ; dir = dirname(dir)) {
    const pin = pinIn(dir);
    if (pin) return pin;
    if (isHome(dir) || dirname(dir) === dir) return undefined;
  }
}

/**
 * semver hides pre-releases from plain ranges, so a beta SDK like
 * `3.24.0-0.2.pre` would fail `^3.22.0`. For "can this SDK build the project"
 * the beta counts, so the tag is dropped before the check.
 */
function satisfies(version: string, range: string): boolean {
  try {
    return Bun.semver.satisfies(version.replace(/-.*$/, ""), range);
  } catch {
    return false;
  }
}

/**
 * A range only steps in when the default would fail it. Then the highest
 * installed version that fits wins.
 */
function sdkForRange(range: string): Sdk | undefined {
  const fallback = defaultSdk();
  if (fallback && satisfies(fallback.version, range)) return fallback;
  return listSdks()
    .filter((sdk) => satisfies(sdk.version, range))
    .sort((a, b) => Bun.semver.order(b.version, a.version))[0];
}

export function resolve(start: string = workingDir()): Resolution {
  const override = process.env.FVX_VERSION?.trim();
  let pin: Pin | undefined;
  try {
    pin = override ? { kind: "exact", version: override, source: "FVX_VERSION" } : findPin(start);
  } catch (e) {
    // A broken pin file is an answer too: stop, and say which file.
    return { kind: "invalid", reason: e instanceof Error ? e.message : String(e) };
  }

  if (!pin) {
    const sdk = defaultSdk();
    return sdk ? { kind: "ok", sdk, source: DEFAULT_SOURCE } : { kind: "none" };
  }
  const sdk = pin.kind === "exact" ? findSdk(pin.version) : sdkForRange(pin.range);
  return sdk ? { kind: "ok", sdk, source: pin.source } : { kind: "missing", pin };
}

/** The message shown when a folder can't be resolved. Never falls back silently. */
export function explain(result: Exclude<Resolution, { kind: "ok" }>): string {
  if (result.kind === "none") {
    return "no Flutter version pinned here and no default set. Run: fvx default <version>";
  }
  if (result.kind === "invalid") return result.reason;
  const { pin } = result;
  if (pin.kind === "exact") {
    return `Flutter ${pin.version} pinned by ${pin.source} is not installed. Run: fvx install ${pin.version}`;
  }
  const installed =
    listSdks()
      .map((sdk) => sdk.version)
      .filter((version) => version !== "unknown")
      .join(", ") || "none";
  return `no installed Flutter satisfies "${pin.range}" from ${pin.source} (installed: ${installed}). Run: fvx install <version>`;
}
