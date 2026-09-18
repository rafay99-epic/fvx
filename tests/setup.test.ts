import { expect, test } from "bun:test";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { HOME, SHIMS } from "../src/paths";
import { installRc, shimsCurrent, uninstall, withBlock, writeShims } from "../src/setup";

test("withBlock appends, replaces in place, and removes, leaving other text alone", () => {
  const added = withBlock("alias ll='ls -l'\n", "export A=1");
  expect(added).toBe("alias ll='ls -l'\n\n# --- fvx ---\nexport A=1\n# --- end fvx ---\n");
  const replaced = withBlock(`${added}echo after\n`, "export A=2");
  expect(replaced).toBe("alias ll='ls -l'\n\n# --- fvx ---\nexport A=2\n# --- end fvx ---\necho after\n");
  expect(withBlock(replaced, null)).toBe("alias ll='ls -l'\n\necho after\n");
  expect(withBlock("plain\n", null)).toBe("plain\n");
});

test("withBlock refuses damaged markers instead of eating the lines between them", () => {
  const orphan = "export EDITOR=vim\n# --- fvx ---\nalias foo=bar\n";
  expect(() => withBlock(orphan, "export A=1")).toThrow("damaged");
  const doubled = `${orphan}# --- fvx ---\nexport A=1\n# --- end fvx ---\n`;
  expect(() => withBlock(doubled, "export A=2")).toThrow("damaged");
  expect(() => withBlock("# --- end fvx ---\nx\n# --- fvx ---\n", null)).toThrow("damaged");
});

test("setup twice leaves one block per rc file, uninstall removes it", () => {
  const zshrc = join(HOME, ".zshrc");
  const fish = join(HOME, ".config", "fish", "config.fish");
  mkdirSync(join(HOME, ".config", "fish"), { recursive: true });
  writeFileSync(zshrc, "export EDITOR=vim\n");
  writeFileSync(fish, "");

  writeShims();
  expect(installRc().changed.sort()).toEqual([fish, zshrc].sort());
  expect(installRc()).toMatchObject({ changed: [] }); // second run changes nothing
  expect(installRc().targets).toHaveLength(2);
  expect(shimsCurrent()).toBe(true);
  expect(readFileSync(zshrc, "utf8").match(/# --- fvx ---/g)).toHaveLength(1);
  expect(readFileSync(zshrc, "utf8")).toContain(`export PATH='${SHIMS}':"$PATH"`);
  expect(readFileSync(fish, "utf8")).toContain(`fish_add_path --prepend '${SHIMS}'`);
  expect(existsSync(join(HOME, ".bashrc"))).toBe(false); // absent rc files stay absent

  uninstall();
  expect(readFileSync(zshrc, "utf8")).toBe("export EDITOR=vim\n\n");
  expect(existsSync(SHIMS)).toBe(false);
});
