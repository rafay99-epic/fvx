import { expect, test } from "bun:test";
import { compareVersions, detectChannel, upgradeCommand } from "../src/upgrade";

test("detectChannel reads the install channel off the binary path", () => {
  expect(detectChannel("/opt/homebrew/Cellar/fvx/0.12/bin/fvx")).toBe("homebrew");
  expect(detectChannel("/home/linuxbrew/.linuxbrew/bin/fvx")).toBe("homebrew");
  expect(detectChannel("/Users/x/.bun/install/global/node_modules/@rafay99/fvx-darwin-arm64/fvx")).toBe("bun");
  expect(detectChannel("/usr/local/lib/node_modules/@rafay99/fvx-linux-x64/fvx")).toBe("npm");
  expect(detectChannel("/usr/local/Cellar/fvx/0.12/bin/fvx")).toBe("homebrew"); // Intel macOS
  expect(detectChannel("/Users/x/Library/pnpm/global/5/node_modules/@rafay99/fvx-darwin-arm64/fvx")).toBe("pnpm");
  expect(detectChannel("/home/x/.local/share/pnpm/global/5/.pnpm/node_modules/@rafay99/fvx-linux-x64/fvx")).toBe("pnpm");
  expect(detectChannel("/Users/x/.nvm/versions/node/v22.1.0/lib/node_modules/@rafay99/fvx-darwin-arm64/fvx")).toBe("npm");
  expect(detectChannel("/usr/local/bin/fvx")).toBe("github");
  expect(upgradeCommand("github")).toBeUndefined();
});

test("compareVersions orders commit-count versions numerically", () => {
  expect(compareVersions("0.9", "0.10")).toBe(-1);
  expect(compareVersions("0.42", "0.42.0")).toBe(0);
  expect(compareVersions("1.0", "0.99")).toBe(1);
});
