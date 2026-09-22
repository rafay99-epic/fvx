import { chmodSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { HOME, SDK_HOME } from "../src/paths";

/**
 * A fake SDK: bin/flutter and bin/dart echo their label and arguments, and
 * exit 7 when the first argument is `fail`, so tests can see which SDK answered
 * and that exit codes pass through.
 */
export function fakeSdk(label: string, version = label): string {
  const root = join(SDK_HOME, label, "flutter");
  mkdirSync(join(root, "bin", "cache"), { recursive: true });
  for (const tool of ["flutter", "dart"]) {
    const file = join(root, "bin", tool);
    writeFileSync(file, `#!/bin/sh\n[ "$1" = fail ] && exit 7\necho "${tool} ${label} $*"\n`);
    chmodSync(file, 0o755);
  }
  writeFileSync(join(root, "bin", "cache", "flutter.version.json"), JSON.stringify({ frameworkVersion: version }));
  return root;
}

/** Create a project folder under the sandbox HOME holding the given files. */
export function project(name: string, files: Record<string, string> = {}): string {
  const dir = join(HOME, "code", name);
  mkdirSync(dir, { recursive: true });
  for (const [rel, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), content);
  }
  return dir;
}
