import { beforeAll, expect, test } from "bun:test";
import { join } from "node:path";
import { chmodSync, mkdirSync, symlinkSync, writeFileSync } from "node:fs";
import { explain, resolve } from "../src/resolve";
import { HOME, SDK_HOME } from "../src/paths";
import { findSdk, isLabel, removeSdk, setDefault } from "../src/sdks";
import { fakeSdk, project } from "./helpers";

beforeAll(() => {
  fakeSdk("3.22.3");
  fakeSdk("3.47.2");
  fakeSdk("work", "3.30.0"); // label differs from the version it holds
  fakeSdk("beta", "3.50.0-0.1.pre");
  setDefault(findSdk("3.47.2")!);
});

const pubspec = (range: string) => `name: app\nenvironment:\n  sdk: ^3.0.0\n  flutter: "${range}"\n`;

// [case, files in the project, expected SDK label]
const cases: [string, Record<string, string>, string][] = [
  [".fvmrc", { ".fvmrc": `{"flutter":"3.22.3"}` }, "3.22.3"],
  ["legacy fvm config", { ".fvm/fvm_config.json": `{"flutterSdkVersion":"3.22.3"}` }, "3.22.3"],
  [".tool-versions with channel suffix", { ".tool-versions": "nodejs 20\nflutter 3.22.3-stable\n" }, "3.22.3"],
  [".fvmrc beats .tool-versions", { ".fvmrc": `{"flutter":"3.22.3"}`, ".tool-versions": "flutter 3.47.2" }, "3.22.3"],
  ["pin matched by real version, not label", { ".fvmrc": `{"flutter":"3.30.0"}` }, "work"],
  ["range the default satisfies keeps the default", { "pubspec.yaml": pubspec(">=3.19.0 <4.0.0") }, "3.47.2"],
  ["range the default fails picks the highest fit", { "pubspec.yaml": pubspec(">=3.20.0 <3.40.0") }, "work"],
  ["pubspec without a flutter constraint is no answer", { "pubspec.yaml": "name: app\n" }, "3.47.2"],
  [".fvmrc without a flutter key is no answer", { ".fvmrc": `{"flavors":{}}` }, "3.47.2"],
  ["nothing pinned uses the default", {}, "3.47.2"],
  ["a beta SDK satisfies a plain range", { "pubspec.yaml": pubspec(">=3.50.0 <3.51.0") }, "beta"],
];

test.each(cases)("%s", (name, files, expected) => {
  const result = resolve(project(`case-${name.replaceAll(/\W+/g, "-")}`, files));
  expect(result.kind === "ok" && result.sdk.label).toBe(expected);
});

test("nearest folder wins, and a subfolder inherits from above", () => {
  const root = project("mono", { ".fvmrc": `{"flutter":"3.47.2"}` });
  project("mono/packages/old", { ".fvmrc": `{"flutter":"3.22.3"}` });
  project("mono/packages/old/lib/src");
  const from = (rel: string) => {
    const result = resolve(join(root, rel));
    return result.kind === "ok" && result.sdk.label;
  };
  expect(from("packages/old/lib/src")).toBe("3.22.3");
  expect(from("packages")).toBe("3.47.2");
});

test("FVX_VERSION overrides every file", () => {
  process.env.FVX_VERSION = "3.22.3";
  try {
    const result = resolve(project("override", { ".fvmrc": `{"flutter":"3.47.2"}` }));
    expect(result).toMatchObject({ kind: "ok", source: "FVX_VERSION", sdk: { label: "3.22.3" } });
  } finally {
    delete process.env.FVX_VERSION;
  }
});

test("a pinned version that isn't installed never falls back", () => {
  const result = resolve(project("missing", { ".fvmrc": `{"flutter":"3.10.0"}` }));
  expect(result.kind).toBe("missing");
  if (result.kind === "missing") expect(explain(result)).toContain("fvx install 3.10.0");
});

test("a range nothing satisfies is reported with what is installed", () => {
  const result = resolve(project("no-fit", { "pubspec.yaml": pubspec(">=9.0.0") }));
  expect(result.kind).toBe("missing");
  // Other test files add SDKs to the shared sandbox, so don't assert the full list.
  if (result.kind === "missing") expect(explain(result)).toMatch(/installed: .*3\.22\.3, 3\.47\.2/);
});

test("malformed .fvmrc stops the run and names the file", () => {
  const dir = project("broken", { ".fvmrc": "{nope" });
  const result = resolve(dir);
  expect(result.kind).toBe("invalid");
  if (result.kind === "invalid") expect(explain(result)).toContain(join(dir, ".fvmrc"));
});

// A pin is text from whatever repo you cloned. It must never name a path.
test("a pin can't walk out of the SDK folder", () => {
  // The common manual install at ~/flutter is what `..` would land on.
  mkdirSync(join(HOME, "flutter", "bin"), { recursive: true });
  writeFileSync(join(HOME, "flutter", "bin", "flutter"), "#!/bin/sh\n");
  chmodSync(join(HOME, "flutter", "bin", "flutter"), 0o755);

  for (const pin of ["..", ".", "", "current", "../flutter", "3.22.3/../.."]) {
    expect(isLabel(pin)).toBe(false);
    expect(findSdk(pin)).toBeUndefined();
  }
  expect(resolve(project("traversal", { ".fvmrc": `{"flutter":".."}` })).kind).toBe("missing");
  expect(() => removeSdk({ label: "..", root: join(SDK_HOME, "..", "flutter"), version: "x" })).toThrow("refusing");
  expect(isLabel("1.12.13+hotfix.9") && isLabel("3.24.0-0.2.pre") && isLabel("stable")).toBe(true);
});

test("the walk stops at HOME even when HOME is reached through a symlink", () => {
  // Layout: <base>/.fvmrc (stray, above home) and <base>/real-home, with
  // FVX_HOME pointing at a symlink to it. Needs its own process: HOME binds at import.
  const base = join(HOME, "symlink-case");
  const realHome = join(base, "real-home");
  mkdirSync(join(realHome, "proj"), { recursive: true });
  mkdirSync(join(realHome, ".flutter-sdk"), { recursive: true });
  writeFileSync(join(base, ".fvmrc"), `{"flutter":"9.9.9"}`);
  symlinkSync(realHome, join(base, "link-home"));

  const result = Bun.spawnSync([process.execPath, join(import.meta.dir, "..", "bin", "fvx.ts"), "resolve"], {
    cwd: join(realHome, "proj"),
    env: { FVX_HOME: join(base, "link-home"), NO_COLOR: "1" },
  });
  // Not "9.9.9 is not installed": the stray pin above HOME was never read.
  expect(result.stderr.toString()).toContain("no Flutter version pinned here");
});
