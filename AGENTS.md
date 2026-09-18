# fvx

Per-project Flutter SDK switching. Shims named `flutter` and `dart` sit first on
PATH, call `fvx resolve`, then `exec` the SDK the current folder pins.

## Stack

Bun + TypeScript, zero runtime dependencies. Shipped as `bun build --compile`
binaries through GitHub Releases, Homebrew (`rafay99-epic/homebrew-apps`) and npm
(`@rafay99/fvx`). The pipeline is a port of `~/Code/cvx`. macOS and Linux only.

## Commands

- `bun test` runs everything inside a throwaway `FVX_HOME` (see `tests/preload.ts`).
- `bun run typecheck`
- `bun run build` compiles `dist/fvx` and re-signs it ad hoc. On macOS a locally
  compiled binary with a stale signature gets SIGKILLed (exit 137).

## Conventions

- `src/paths.ts` is the only place HOME is resolved. `FVX_HOME` relocates the
  SDK folder, the shims, the rc files and the pin-walk boundary.
- `fvx resolve` is the hot path. It runs on every `flutter` and `dart` call: no
  network, no child processes, stdout carries the SDK root and nothing else.
- `resolve`, `which` and `ls --labels` are scripting surfaces. No decoration.
- A pinned version that isn't installed is an error. Never fall back to another
  version silently.
- The shim text lives in `src/setup.ts` and records the absolute fvx path at setup
  time, because non-login shells have the shims on PATH but not Homebrew. `doctor` compares it byte for byte, so
  changing it means users re-run `fvx setup`.
- A pin is untrusted text from any cloned repo, and a label becomes a path under
  the SDK folder. Everything goes through `isLabel` in `src/sdks.ts`. `fvx rm ..`
  once resolved to the home directory. Keep that guard.
- Colors gate on `stdout.isTTY && !NO_COLOR`. Pad before coloring.

## Gotchas

- Never run `fvx setup`, `fvx default`, `fvx install` or `fvx rm` against the real
  home during development. Set `FVX_HOME` to a temp dir. Add
  `FLUTTER_SDK_HOME=~/.flutter-sdk` on top to read the real SDKs from a sandbox.
- Do not push to `main`. A push touching `bin/`, `src/`, `man/` or `package.json`
  is a real release (GitHub, Homebrew, npm). All changes go through PRs.
- The version is `0.<commit count>`, stamped into `src/version.ts` by
  `release.yml`. Keep that line's shape.
- No AI attribution anywhere: commits, PRs, comments, docs.
