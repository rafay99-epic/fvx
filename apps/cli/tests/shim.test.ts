/**
 * End to end through the real shim: sh script (or the .cmd twin under cmd.exe
 * on Windows), `fvx resolve` as a child process, exec into a fake SDK. This is
 * the path every `flutter` call takes.
 */
import { beforeAll, expect, test } from "bun:test";
import { chmodSync, copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { delimiter, join, resolve as absolute } from "node:path";
import { HOME, IS_WINDOWS, SHIMS } from "../src/paths";
import { findSdk, setDefault } from "../src/sdks";
import { writeShims } from "../src/setup";
import { fakeSdk, project } from "./helpers";

const fvxBin = join(HOME, "bin");
/** Stand-in for the installed binary: `fvx` on PATH, running the source. */
const standIn = join(fvxBin, IS_WINDOWS ? "fvx.cmd" : "fvx");
/**
 * sh shims look fvx up on PATH, so they record nothing: a real fvx installed on
 * this machine must not leak in. The .cmd shims use only the recorded path.
 */
const recorded = IS_WINDOWS ? standIn : "";
const systemRoot = process.env.SystemRoot ?? "C:\\Windows";

beforeAll(() => {
  fakeSdk("3.22.3");
  fakeSdk("3.47.2");
  setDefault(findSdk("3.47.2")!);
  writeShims(recorded);
  mkdirSync(fvxBin, { recursive: true });
  const entry = absolute(import.meta.dir, "..", "bin", "fvx.ts");
  writeFileSync(
    standIn,
    IS_WINDOWS
      ? `@"${process.execPath}" "${entry}" %*\r\n`
      : `#!/bin/sh\nexec '${process.execPath}' '${entry}' "$@"\n`,
  );
  chmodSync(standIn, 0o755);
});

/** Rewrite the shims with a given recorded fvx path, restoring the default after. */
function withRecordedFvx<T>(fvxPath: string, body: () => T): T {
  writeShims(fvxPath);
  try {
    return body();
  } finally {
    writeShims(recorded);
  }
}

function run(tool: "flutter" | "dart", args: string[], cwd: string, { withFvx = true } = {}) {
  const system = IS_WINDOWS ? [join(systemRoot, "System32")] : ["/usr/bin", "/bin"];
  const path = [SHIMS, ...(withFvx ? [fvxBin] : []), ...system].join(delimiter);
  // On Windows cmd finds flutter.cmd through PATHEXT, the way a user's terminal does.
  const argv = IS_WINDOWS ? [process.env.ComSpec ?? "cmd.exe", "/d", "/c", tool, ...args] : [tool, ...args];
  const result = Bun.spawnSync(argv, {
    cwd,
    // A shell sets PWD itself. Dropping it here mirrors a non-interactive spawn.
    env: { FVX_HOME: HOME, PATH: path, NO_COLOR: "1", ...(IS_WINDOWS ? { SystemRoot: systemRoot } : {}) },
  });
  return { code: result.exitCode, out: result.stdout.toString().trim(), err: result.stderr.toString().trim() };
}

test("two folders get two SDKs from the same shim, arguments intact", () => {
  const old = project("shim-old", { ".fvmrc": `{"flutter":"3.22.3"}` });
  const fresh = project("shim-new", { ".tool-versions": "flutter 3.47.2-stable\n" });
  expect(run("flutter", ["build", "apk", "--release"], old).out).toBe("flutter 3.22.3 build apk --release");
  expect(run("flutter", ["--version"], fresh).out).toBe("flutter 3.47.2 --version");
  // A .bat sees arguments as typed, so its echo keeps the quotes.
  expect(run("dart", ["format", "a b"], old).out).toBe(IS_WINDOWS ? 'dart 3.22.3 format "a b"' : "dart 3.22.3 format a b");
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

test("fvx missing from PATH but present at its recorded path still honors the pin", () => {
  // A non-login shell: shims on PATH through ~/.zshenv, /opt/homebrew/bin not.
  const dir = project("shim-recorded", { ".fvmrc": `{"flutter":"3.22.3"}` });
  const out = withRecordedFvx(standIn, () => run("flutter", ["doctor"], dir, { withFvx: false }).out);
  expect(out).toBe("flutter 3.22.3 doctor");
});

test("with fvx gone entirely the shim falls back to the default SDK", () => {
  const dir = project("shim-nofvx", { ".fvmrc": `{"flutter":"3.22.3"}` });
  const out = withRecordedFvx("/nonexistent/fvx", () => run("flutter", ["doctor"], dir, { withFvx: false }).out);
  expect(out).toBe("flutter 3.47.2 doctor");
});

test.skipIf(!IS_WINDOWS)("a recorded path with spaces and cmd's special characters still resolves", () => {
  const odd = join(HOME, "odd dir & 100% (x)");
  mkdirSync(odd, { recursive: true });
  copyFileSync(standIn, join(odd, "fvx.cmd"));
  const dir = project("shim-odd", { ".fvmrc": `{"flutter":"3.22.3"}` });
  const out = withRecordedFvx(join(odd, "fvx.cmd"), () => run("flutter", ["doctor"], dir, { withFvx: false }).out);
  expect(out).toBe("flutter 3.22.3 doctor");
});
