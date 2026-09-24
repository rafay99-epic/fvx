/**
 * paths: the ONE place HOME is resolved. Everything fvx touches hangs off it:
 * the SDK folder, the shims, the rc files `setup` edits, and the boundary where
 * the pin walk stops. Setting FVX_HOME relocates all of it, which gives tests
 * and manual sandboxes full isolation (`FVX_HOME=/tmp/fvx-sandbox fvx ...`).
 *
 * The SDK folder override is FLUTTER_SDK_HOME, never FLUTTER_ROOT. That one
 * belongs to the flutter tool itself.
 */

import { realpathSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

function canonical(path: string): string {
  try {
    return realpathSync(path);
  } catch {
    return path; // a sandbox dir that doesn't exist yet
  }
}

/** Canonical, so it compares equal to directories reached through symlinks. */
export const HOME = canonical(process.env.FVX_HOME || homedir());
export const SDK_HOME = process.env.FLUTTER_SDK_HOME || join(HOME, ".flutter-sdk");
/** Symlink to the global default SDK. Used when no project pin applies. */
export const DEFAULT_LINK = join(SDK_HOME, "current");
export const SHIMS = join(HOME, ".fvx", "shims");
/**
 * FVX_HOME is a sandbox. On Windows the user PATH lives in the registry, which
 * it can't relocate, so `setup` leaves the registry alone under it.
 */
export const SANDBOXED = Boolean(process.env.FVX_HOME);
/** Windows swaps the sh shims for .cmd twins, rc files for the registry, and the symlink for a junction. */
export const IS_WINDOWS = process.platform === "win32";
