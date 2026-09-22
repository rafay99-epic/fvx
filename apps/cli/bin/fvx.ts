#!/usr/bin/env bun
/**
 * fvx: per-project Flutter SDK switching. Shims named `flutter` and `dart` sit
 * first on PATH and ask `fvx resolve` which SDK the current folder pins, so
 * every shell, script and agent gets the right version with no cd hook.
 *
 * This file is just the entry point + dispatch. Logic lives in src/.
 */

import {
  cmdCompletions,
  cmdCurrent,
  cmdDefault,
  cmdDoctor,
  cmdInstall,
  cmdLs,
  cmdResolve,
  cmdRm,
  cmdSetup,
  cmdUse,
  cmdVersion,
  cmdWhich,
  help,
} from "../src/commands";
import { die } from "../src/ui";
import { cmdUpgrade } from "../src/upgrade";

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  switch (cmd) {
    case "resolve":
      return cmdResolve();
    case "which":
      return cmdWhich();
    case "current":
      return cmdCurrent();
    case "ls":
    case "list":
      return cmdLs(rest);
    case "use":
      return cmdUse(rest);
    case "default":
      return cmdDefault(rest);
    case "install":
      return cmdInstall(rest);
    case "rm":
    case "remove":
      return cmdRm(rest);
    case "setup":
      return cmdSetup(rest);
    case "doctor":
      return cmdDoctor();
    case "upgrade":
      return cmdUpgrade(rest);
    case "completions":
    case "completion":
      return cmdCompletions(rest);
    case "version":
    case "-v":
    case "--version":
      return cmdVersion();
    case "help":
    case "-h":
    case "--help":
    case undefined:
      return help();
    default:
      die(`unknown command: ${cmd}. Run: fvx help`);
  }
}

main().catch((e: unknown) => {
  // One clean line for users. Full stack only when FVX_DEBUG is set.
  if (process.env.FVX_DEBUG) console.error(e);
  die(e instanceof Error ? e.message : String(e));
});
