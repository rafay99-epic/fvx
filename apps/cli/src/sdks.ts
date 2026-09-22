/**
 * sdks: what is installed under SDK_HOME and which one is the global default.
 *
 * Layout: <SDK_HOME>/<label>/flutter/bin/flutter, plus <SDK_HOME>/current, a
 * symlink to the default SDK root. The label is usually the version number but
 * can be anything (`stable`, `work`), so matching falls back to the real
 * version read from the SDK itself.
 */

import { existsSync, readdirSync, readFileSync, realpathSync, rmSync, symlinkSync, renameSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_LINK, SDK_HOME } from "./paths";

export type Sdk = {
  label: string;
  /** The SDK root, the folder that holds bin/flutter. */
  root: string;
  /** Framework version read from disk, or "unknown". */
  version: string;
};

/**
 * A label becomes a path segment under SDK_HOME, and pins come from files in
 * any repo you clone, so this is a trust boundary. One plain segment only:
 * `..` would walk out of SDK_HOME (and `rm` would then delete its parent).
 */
export const isLabel = (s: string) => /^[A-Za-z0-9][A-Za-z0-9._+-]*$/.test(s) && s !== "current";

const sdkRoot = (label: string) => join(SDK_HOME, label, "flutter");
const hasFlutter = (root: string) => existsSync(join(root, "bin", "flutter"));

/**
 * Read the framework version without running flutter (which takes seconds).
 * The legacy `<root>/version` file is empty on current SDKs, so only the JSON
 * is trusted.
 */
export function readVersion(root: string): string {
  try {
    const parsed: unknown = JSON.parse(
      readFileSync(join(root, "bin", "cache", "flutter.version.json"), "utf8"),
    );
    if (typeof parsed === "object" && parsed !== null && "frameworkVersion" in parsed) {
      const { frameworkVersion } = parsed;
      if (typeof frameworkVersion === "string" && frameworkVersion) return frameworkVersion;
    }
  } catch {
    // Fresh or broken SDK. Callers show "unknown".
  }
  return "unknown";
}

function toSdk(label: string): Sdk {
  const root = sdkRoot(label);
  return { label, root, version: readVersion(root) };
}

/**
 * True when a version-named folder holds a different version, which happens
 * after `flutter upgrade` runs inside it. Unknown versions (SDKs too old to
 * carry the version file) and named labels like `work` never count.
 */
export const hasDrifted = (sdk: Sdk) =>
  /^\d/.test(sdk.label) && sdk.version !== "unknown" && sdk.version !== sdk.label;

/** Every installed SDK, sorted by label. Half-finished installs are skipped. */
export function listSdks(): Sdk[] {
  if (!existsSync(SDK_HOME)) return [];
  return readdirSync(SDK_HOME, { withFileTypes: true })
    .filter((e) => e.isDirectory() && isLabel(e.name) && !e.name.endsWith(".partial") && hasFlutter(sdkRoot(e.name)))
    .map((e) => toSdk(e.name))
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
}

/**
 * Find the SDK for a pin. An exact label hit costs one stat, which keeps the
 * shim path cheap. Only a miss scans every SDK for a matching real version.
 */
export function findSdk(pin: string): Sdk | undefined {
  if (!isLabel(pin)) return undefined;
  if (hasFlutter(sdkRoot(pin))) return toSdk(pin);
  return listSdks().find((sdk) => sdk.version === pin);
}

/** The SDK the `current` symlink points at, if it points at a real one. */
export function defaultSdk(): Sdk | undefined {
  try {
    const target = realpathSync(DEFAULT_LINK);
    if (!hasFlutter(target)) return undefined;
    const known = listSdks().find((sdk) => realpathSync(sdk.root) === target);
    // A default outside SDK_HOME is still usable, it just has no label.
    return known ?? { label: "current", root: target, version: readVersion(target) };
  } catch {
    return undefined; // missing or dangling symlink
  }
}

/** Repoint the default symlink. Link-then-rename so it is never absent. */
export function setDefault(sdk: Sdk): void {
  const staging = `${DEFAULT_LINK}.next`;
  rmSync(staging, { force: true });
  symlinkSync(sdk.root, staging);
  renameSync(staging, DEFAULT_LINK);
}

export function removeSdk(sdk: Sdk): void {
  // Second lock on the same door: never build a delete path from a bad label.
  if (!isLabel(sdk.label)) throw new Error(`refusing to delete "${sdk.label}": not an SDK label`);
  rmSync(join(SDK_HOME, sdk.label), { recursive: true, force: true });
}
