# fvx

Per-project Flutter SDK switching. Shims named `flutter` and `dart` sit first on
PATH, call `fvx resolve`, then `exec` the SDK the current folder pins.

## Layout

Bun workspaces. One lockfile at the root.

- `apps/cli` is fvx itself. Bun + TypeScript, zero runtime dependencies. Shipped as
  `bun build --compile` binaries through GitHub Releases, Homebrew
  (`rafay99-epic/homebrew-apps`) and npm (`@rafay99/fvx`). The pipeline is a port
  of `~/Code/cvx`. macOS and Linux only.
- `apps/web` is the marketing site at fvx.rafay99.com. Vite, React 19, TanStack
  Router (file routes), Tailwind v4, shadcn/ui, motion and lenis. Deployed on
  Vercel with `apps/web` as the root directory.

## Commands

All from the repo root.

- `bun test` runs the CLI suite inside a throwaway `FVX_HOME`. The root
  `bunfig.toml` points it at `apps/cli` with `apps/cli/tests/preload.ts`.
- `bun run typecheck` checks both apps.
- `bun run build` compiles `apps/cli/dist/fvx` and re-signs it ad hoc. On macOS a
  locally compiled binary with a stale signature gets SIGKILLed (exit 137).
- `bun run dev:web` and `bun run build:web` for the site.

## Conventions (CLI, paths relative to `apps/cli`)

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

## Conventions (web)

- Every string on the site lives in `apps/web/src/content.ts`. Facts there must
  match the CLI. Update it when a command, pin source or install channel changes.
- Black and white only. Colors come from the `@theme` block in `src/styles.css`.
- Motion runs on scroll or on view, never on a loop.

## Gotchas

- Never run `fvx setup`, `fvx default`, `fvx install` or `fvx rm` against the real
  home during development. Set `FVX_HOME` to a temp dir. Add
  `FLUTTER_SDK_HOME=~/.flutter-sdk` on top to read the real SDKs from a sandbox.
- Do not push to `main`. A push touching `apps/cli/**` is a real release
  (GitHub, Homebrew, npm). Site-only changes are not. All changes go through PRs.
- The version is `0.<commit count>` of the whole repo, stamped into
  `apps/cli/src/version.ts` by `release.yml`. Keep that line's shape.
- No AI attribution anywhere: commits, PRs, comments, docs.
