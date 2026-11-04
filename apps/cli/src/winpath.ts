/**
 * winpath: the Windows user PATH, where `fvx setup` puts the shims. It lives in
 * the registry (HKCU\Environment), not in rc files, and every new cmd,
 * PowerShell, Git Bash, editor and agent inherits it. One entry covers them all.
 *
 * Windows puts the system PATH before the user PATH, so a Flutter on the system
 * PATH still wins. `fvx doctor` names it. Moving it needs admin, which fvx
 * never asks for.
 */

import { spawnSync } from "node:child_process";

/** Every entry except `dir`, compared the way Windows does: any case, trailing slash or not. */
function others(path: string, dir: string): string[] {
  const key = (entry: string) => entry.replace(/[\\/]+$/, "").toLowerCase();
  return path.split(";").filter((entry) => entry && key(entry) !== key(dir));
}

/** `path` with `dir` first, exactly once. */
export const withEntryFirst = (path: string, dir: string) => [dir, ...others(path, dir)].join(";");

/** `path` without `dir`. */
export const withoutEntry = (path: string, dir: string) => others(path, dir).join(";");

/**
 * Run a PowerShell script. -EncodedCommand sidesteps command-line quoting, and
 * values go in through `env`, never spliced into the script.
 */
function powershell(script: string, env: Record<string, string> = {}): string {
  const result = spawnSync(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-EncodedCommand", Buffer.from(script, "utf16le").toString("base64")],
    { encoding: "utf8", env: { ...process.env, ...env } },
  );
  if (result.error || result.status !== 0) {
    throw new Error(`could not update your user PATH: ${result.stderr?.trim() || result.error?.message}`);
  }
  return result.stdout.replace(/\r?\n$/, "");
}

/**
 * The raw value, so `%USERPROFILE%\...` entries come back unexpanded. UTF-8
 * output, so a non-ASCII folder name survives the round trip.
 */
export const readUserPath = () =>
  powershell(
    "[Console]::OutputEncoding = New-Object Text.UTF8Encoding $false\n" +
      "(Get-Item 'HKCU:\\Environment').GetValue('Path', '', 'DoNotExpandEnvironmentNames')",
  );

/**
 * ExpandString keeps the value REG_EXPAND_SZ so `%VAR%` entries keep working.
 * Never `setx`: it cuts PATH off at 1024 characters. Clearing a throwaway
 * variable through .NET broadcasts WM_SETTINGCHANGE, so windows opened after
 * this see the new PATH without a sign-out.
 */
function writeUserPath(value: string): void {
  powershell(
    "Set-ItemProperty 'HKCU:\\Environment' -Name Path -Value $env:FVX_USER_PATH -Type ExpandString\n" +
      "[Environment]::SetEnvironmentVariable('FVX_BROADCAST', $null, 'User')",
    { FVX_USER_PATH: value },
  );
}

/** Apply `edit` to the user PATH. Returns false when nothing changed. */
export function editUserPath(edit: (path: string) => string): boolean {
  const before = readUserPath();
  const after = edit(before);
  if (after === before) return false;
  writeUserPath(after);
  return true;
}
