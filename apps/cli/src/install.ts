/**
 * install: download an official Flutter SDK into SDK_HOME.
 *
 * Source is Google's release index, the same one flutter.dev uses. The archive
 * is checksummed while it streams to disk, unpacked into `<version>.partial`,
 * and only renamed into place once complete, so an interrupted install never
 * looks installed. Official archives unpack to a `flutter/` folder, which is
 * already the layout SDK_HOME uses.
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, renameSync, rmSync } from "node:fs";
import { join } from "node:path";
import { SDK_HOME } from "./paths";
import { isLabel } from "./sdks";

// FLUTTER_STORAGE_BASE_URL is Flutter's own mirror switch (used in China), so
// fvx honors it too. Read per call, not at import, so it can change at runtime.
const indexBase = () =>
  `${process.env.FLUTTER_STORAGE_BASE_URL || "https://storage.googleapis.com"}/flutter_infra_release/releases`;

export type Release = { version: string; channel: string; archive: string; sha256: string };
export type ReleaseIndex = { baseUrl: string; releases: Release[] };

type Platform = { os: "macos" | "linux"; arch: "arm64" | "x64" };

export function hostPlatform(): Platform {
  const os = process.platform === "darwin" ? "macos" : process.platform === "linux" ? "linux" : undefined;
  if (!os) throw new Error(`fvx install supports macOS and Linux, not ${process.platform}`);
  return { os, arch: process.arch === "arm64" ? "arm64" : "x64" };
}

function isRelease(value: unknown): value is Release {
  if (typeof value !== "object" || value === null) return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.version === "string" &&
    typeof r.channel === "string" &&
    typeof r.archive === "string" &&
    typeof r.sha256 === "string"
  );
}

/** Validate the index at the boundary. Inside fvx it is a typed ReleaseIndex. */
export function parseIndex(data: unknown): ReleaseIndex {
  if (typeof data === "object" && data !== null && "base_url" in data && "releases" in data) {
    const { base_url: baseUrl, releases } = data;
    if (typeof baseUrl === "string" && Array.isArray(releases)) {
      return { baseUrl, releases: releases.filter(isRelease) };
    }
  }
  throw new Error("unexpected Flutter release index format");
}

/**
 * One version shows up several times: per channel, and on macOS per CPU.
 * Stable beats beta. Apple Silicon takes the `_arm64_` archive and falls back
 * to x64 (Rosetta) for releases older than the arm64 builds.
 */
export function pickRelease(index: ReleaseIndex, version: string, platform: Platform): Release | undefined {
  const isArm = (r: Release) => r.archive.includes("_arm64_");
  const rank = (r: Release) =>
    (r.channel === "stable" ? 0 : 2) + (isArm(r) === (platform.arch === "arm64") ? 0 : 1);
  return index.releases
    .filter((r) => r.version === version || r.version === `v${version}`)
    .filter((r) => platform.arch === "arm64" || !isArm(r))
    .sort((a, b) => rank(a) - rank(b))[0];
}

async function fetchIndex(platform: Platform): Promise<ReleaseIndex> {
  const res = await fetch(`${indexBase()}/releases_${platform.os}.json`);
  if (!res.ok) throw new Error(`release index returned HTTP ${res.status}`);
  return parseIndex(await res.json());
}

/** Stream to disk, hashing as it goes. Returns the hex sha256. */
async function download(url: string, dest: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`download failed: HTTP ${res.status}`);
  const total = Number(res.headers.get("content-length")) || 0;
  const hasher = new Bun.CryptoHasher("sha256");
  const writer = Bun.file(dest).writer();
  const showProgress = Boolean(process.stderr.isTTY);
  let done = 0;
  let lastPct = -1;
  for await (const chunk of res.body) {
    hasher.update(chunk);
    writer.write(chunk);
    done += chunk.length;
    const pct = total ? Math.floor((done / total) * 100) : 0;
    if (showProgress && pct !== lastPct) {
      lastPct = pct;
      process.stderr.write(`\r  downloading ${pct}% of ${Math.round(total / 1e6)} MB`);
    }
  }
  await writer.end();
  if (showProgress) process.stderr.write("\n");
  return hasher.digest("hex");
}

function unpack(archive: string, dest: string): void {
  const [cmd, args] = archive.endsWith(".zip")
    ? ["unzip", ["-q", archive, "-d", dest]]
    : ["tar", ["-xJf", archive, "-C", dest]];
  const result = spawnSync(cmd, args, { stdio: "inherit" });
  if (result.error || result.status !== 0) throw new Error(`${cmd} failed to unpack ${archive}`);
}

/** Install `version`. Returns the new SDK root. Throws when already present. */
export async function install(version: string): Promise<string> {
  if (!isLabel(version)) throw new Error(`"${version}" is not a Flutter version`);
  const target = join(SDK_HOME, version);
  if (existsSync(target)) throw new Error(`${target} already exists`);

  const platform = hostPlatform();
  const index = await fetchIndex(platform);
  const release = pickRelease(index, version, platform);
  if (!release) throw new Error(`Flutter ${version} is not in the ${platform.os} release index`);

  mkdirSync(SDK_HOME, { recursive: true });
  // Same volume as the final location: the rename stays atomic and a small
  // system temp dir can't fill up on a 1.5 GB archive.
  const archive = join(SDK_HOME, `${version}.download${release.archive.endsWith(".zip") ? ".zip" : ".tar.xz"}`);
  const partial = `${target}.partial`;
  rmSync(partial, { recursive: true, force: true });
  try {
    const sha = await download(`${index.baseUrl}/${release.archive}`, archive);
    if (sha !== release.sha256) throw new Error(`checksum mismatch for ${release.archive}, nothing installed`);
    mkdirSync(partial);
    unpack(archive, partial);
    if (!existsSync(join(partial, "flutter", "bin", "flutter"))) {
      throw new Error("archive did not contain flutter/bin/flutter");
    }
    renameSync(partial, target);
  } finally {
    rmSync(archive, { force: true });
    rmSync(partial, { recursive: true, force: true });
  }
  return join(target, "flutter");
}
