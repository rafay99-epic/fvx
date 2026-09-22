import { afterAll, beforeAll, expect, test } from "bun:test";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { hostPlatform, install, parseIndex, pickRelease, type Release } from "../src/install";
import { HOME, SDK_HOME } from "../src/paths";
import { findSdk } from "../src/sdks";

const release = (archive: string, channel = "stable", version = "3.22.3"): Release => ({
  version,
  channel,
  archive,
  sha256: "x",
});

test("pickRelease prefers stable, and the arm64 archive only on arm64", () => {
  const index = {
    baseUrl: "",
    releases: [
      release("beta/macos/flutter_macos_arm64_3.22.3-beta.zip", "beta"),
      release("stable/macos/flutter_macos_3.22.3-stable.zip"),
      release("stable/macos/flutter_macos_arm64_3.22.3-stable.zip"),
      release("stable/macos/flutter_macos_2.0.0-stable.zip", "stable", "2.0.0"),
    ],
  };
  const pick = (version: string, arch: "arm64" | "x64") => pickRelease(index, version, { os: "macos", arch })?.archive;
  expect(pick("3.22.3", "arm64")).toBe("stable/macos/flutter_macos_arm64_3.22.3-stable.zip");
  expect(pick("3.22.3", "x64")).toBe("stable/macos/flutter_macos_3.22.3-stable.zip");
  expect(pick("2.0.0", "arm64")).toBe("stable/macos/flutter_macos_2.0.0-stable.zip"); // x64 fallback
  expect(pick("9.9.9", "arm64")).toBeUndefined();
});

test("parseIndex rejects anything that isn't the release index", () => {
  expect(() => parseIndex({ releases: "nope" })).toThrow("unexpected");
  expect(parseIndex({ base_url: "u", releases: [{ junk: 1 }, release("a.zip")] }).releases).toHaveLength(1);
});

// A real HTTP server with a real zip: the full download, checksum, unpack path.
let server: ReturnType<typeof Bun.serve>;
const shas: Record<string, string> = {};

beforeAll(async () => {
  const stage = join(HOME, "stage");
  mkdirSync(join(stage, "flutter", "bin"), { recursive: true });
  writeFileSync(join(stage, "flutter", "bin", "flutter"), "#!/bin/sh\n");
  Bun.spawnSync(["zip", "-qr", "sdk.zip", "flutter"], { cwd: stage });
  const zip = await Bun.file(join(stage, "sdk.zip")).bytes();
  shas.good = new Bun.CryptoHasher("sha256").update(zip).digest("hex");

  const { os } = hostPlatform();
  server = Bun.serve({
    port: 0,
    fetch(req) {
      const { pathname, origin } = new URL(req.url);
      if (pathname.endsWith(`releases_${os}.json`)) {
        return Response.json({
          base_url: origin,
          releases: [
            { version: "1.0.0", channel: "stable", archive: "sdk.zip", sha256: shas.good },
            { version: "1.0.1", channel: "stable", archive: "sdk.zip", sha256: "bad" },
          ],
        });
      }
      return pathname === "/sdk.zip" ? new Response(zip) : new Response("no", { status: 404 });
    },
  });
  process.env.FLUTTER_STORAGE_BASE_URL = server.url.origin;
});

afterAll(() => {
  delete process.env.FLUTTER_STORAGE_BASE_URL;
  server.stop(true);
});

test("install downloads, verifies, unpacks and leaves no temp files", async () => {
  expect(await install("1.0.0")).toBe(join(SDK_HOME, "1.0.0", "flutter"));
  expect(findSdk("1.0.0")?.label).toBe("1.0.0");
  expect(readdirSync(SDK_HOME).filter((name) => /download|partial/.test(name))).toEqual([]);
});

test("a checksum mismatch installs nothing", async () => {
  await expect(install("1.0.1")).rejects.toThrow("checksum mismatch");
  expect(existsSync(join(SDK_HOME, "1.0.1"))).toBe(false);
});
