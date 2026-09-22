/**
 * upgrade: `fvx upgrade` checks GitHub for a newer release, then runs the
 * right package manager for however this binary was installed. It never
 * replaces the running binary by hand. A raw tarball install gets the release
 * URL instead. Only this command touches the network for updates: there is no
 * background check and the shim path stays offline.
 */

import { spawnSync } from "node:child_process";
import { bold, die, green } from "./ui";
import { VERSION } from "./version";

const REPO = "rafay99-epic/fvx";
const RELEASES_URL = `https://github.com/${REPO}/releases/latest`;
const NPM_PACKAGE = "@rafay99/fvx";

export type Channel = "homebrew" | "bun" | "pnpm" | "npm" | "github";

/** Guess the install channel from where the binary lives. */
export function detectChannel(execPath: string): Channel {
  if (/[\\/](Cellar|homebrew|linuxbrew)[\\/]/.test(execPath)) return "homebrew";
  if (/[\\/]\.bun[\\/]/.test(execPath)) return "bun";
  // Before the node_modules check: pnpm's global store has node_modules in it too.
  if (/[\\/]\.?pnpm[\\/]/.test(execPath)) return "pnpm";
  if (/[\\/](node_modules|npm)[\\/]/.test(execPath)) return "npm";
  return "github";
}

/** The shell command that upgrades a channel, or undefined when there is none. */
export function upgradeCommand(channel: Channel): string | undefined {
  switch (channel) {
    case "homebrew":
      return "brew update && brew upgrade fvx";
    case "bun":
      return `bun add -g ${NPM_PACKAGE}@latest`;
    case "pnpm":
      return `pnpm add -g ${NPM_PACKAGE}@latest`;
    case "npm":
      return `npm install -g ${NPM_PACKAGE}@latest`;
    case "github":
      return undefined;
    default: {
      const _exhaustive: never = channel;
      return _exhaustive;
    }
  }
}

/** Dotted numeric compare: "0.42" vs "0.43.1". Non-numeric parts count as 0. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map((n) => Number.parseInt(n, 10) || 0);
  const pb = b.split(".").map((n) => Number.parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return Math.sign(diff);
  }
  return 0;
}

async function latestVersion(): Promise<string | undefined> {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { Accept: "application/vnd.github+json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return undefined;
    const data: unknown = await res.json();
    if (typeof data === "object" && data !== null && "tag_name" in data && typeof data.tag_name === "string") {
      return data.tag_name.replace(/^v/, "");
    }
  } catch {
    // offline or timed out
  }
  return undefined;
}

export async function cmdUpgrade(args: string[]): Promise<void> {
  const checkOnly = args.includes("--check");
  const latest = await latestVersion();
  if (!latest) die("couldn't check for updates. Are you online?");

  if (VERSION === "0.0.0-dev") {
    console.log(`latest release is ${bold(latest)}. This is a dev build, so there is nothing to compare.`);
    return;
  }
  if (compareVersions(VERSION, latest) >= 0) {
    console.log(`${green("✓")} fvx ${VERSION} is up to date`);
    return;
  }
  console.log(`fvx ${VERSION} is installed, ${bold(latest)} is available`);
  if (checkOnly) return;

  const command = upgradeCommand(detectChannel(process.execPath));
  if (!command) {
    console.log(`This binary didn't come from Homebrew or npm. Download the new one:\n  ${RELEASES_URL}`);
    return;
  }
  console.log(`running: ${command}`);
  const result = spawnSync("sh", ["-c", command], { stdio: "inherit" });
  if (result.error || result.status !== 0) die("upgrade command failed", result.status ?? 1);
}
