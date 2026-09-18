/**
 * End to end through the real shim: sh script, `fvx resolve` as a child
 * process, exec into a fake SDK. This is the path every `flutter` call takes.
 */
import { beforeAll, expect, test } from "bun:test";
import { chmodSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve as absolute } from "node:path";
import { HOME, SHIMS } from "../src/paths";
import { findSdk, setDefault } from "../src/sdks";
import { writeShims } from "../src/setup";
import { fakeSdk, project } from "./helpers";

const fvxBin = join(HOME, "bin");

beforeAll(() => {
  fakeSdk("3.22.3");
  fakeSdk("3.47.2");
  setDefault(findSdk("3.47.2")!);
  writeShims();
  // Stand-in for the installed binary: `fvx` on PATH, running the source.
  mkdirSync(fvxBin, { recursive: true });
  const entry = absolute(import.meta.dir, "..", "bin", "fvx.ts");
  writeFileSync(join(fvxBin, "fvx"), `#!/bin/sh\nexec '${process.execPath}' '${entry}' "$@"\n`);
  chmodSync(join(fvxBin, "fvx"), 0o755);
});

function run(tool: "flutter" | "dart", args: string[], cwd: string, { withFvx = true } = {}) {
  const path = [SHIMS, ...(withFvx ? [fvxBin] : []), "/usr/bin", "/bin"].join(":");
  const result = Bun.spawnSync([tool, ...args], {
    cwd,
    // A shell sets PWD itself. Dropping it here mirrors a non-interactive spawn.
    env: { FVX_HOME: HOME, PATH: path, NO_COLOR: "1" },
  });
  return { code: result.exitCode, out: result.stdout.toString().trim(), err: result.stderr.toString().trim() };
}

test("two folders get two SDKs from the same shim, arguments intact", () => {
  const old = project("shim-old", { ".fvmrc": `{"flutter":"3.22.3"}` });
  const fresh = project("shim-new", { ".tool-versions": "flutter 3.47.2-stable\n" });
  expect(run("flutter", ["build", "apk", "--release"], old).out).toBe("flutter 3.22.3 build apk --release");
  expect(run("flutter", ["--version"], fresh).out).toBe("flutter 3.47.2 --version");
  expect(run("dart", ["format", "a b"], old).out).toBe("dart 3.22.3 format a b");
});

test("the real binary's exit code passes through", () => {
  expect(run("flutter", ["fail"], project("shim-exit")).code).toBe(7);
});

test("a missing pinned version fails loudly and runs nothing", () => {
  const result = run("flutter", ["doctor"], project("shim-missing", { ".fvmrc": `{"flutter":"3.10.0"}` }));
  expect(result.code).toBe(1);
  expect(result.out).toBe("");
  expect(result.err).toContain("fvx install 3.10.0");
});

test("without fvx on PATH the shim falls back to the default SDK", () => {
  const dir = project("shim-nofvx", { ".fvmrc": `{"flutter":"3.22.3"}` });
  expect(run("flutter", ["doctor"], dir, { withFvx: false }).out).toBe("flutter 3.47.2 doctor");
});
