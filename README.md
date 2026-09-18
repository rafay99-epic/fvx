# fvx

Run `flutter` in any folder and get the Flutter version that folder pins. Two terminals in two projects can run two versions at the same moment.

```sh
cd ~/code/client-app   && flutter --version   # 3.22.3, from .fvmrc
cd ~/code/new-package  && flutter --version   # 3.47.2, from pubspec.yaml
```

## How it works

`fvx setup` puts two small scripts named `flutter` and `dart` first on your PATH. Each one asks `fvx resolve` which SDK the current folder wants, then `exec`s the real binary from that SDK.

There is no cd hook. The version gets resolved when `flutter` runs, from the folder it runs in. That is why it also works in places a shell hook never reaches: scripts, Makefiles, git hooks, CI, and coding agents that run commands in non-interactive shells.

The lookup takes about 10 ms.

## Install

```sh
brew install rafay99-epic/apps/fvx
# or
npm i -g @rafay99/fvx
```

Both ship a prebuilt binary. Nothing gets compiled on your machine. Homebrew is the faster of the two at runtime, because the npm package starts through a small Node launcher.

Then, once:

```sh
fvx setup      # writes the shims, adds one PATH line to your zsh, bash and fish startup files
```

Restart your shell. If you manage your rc files yourself, `fvx setup --print` shows the lines and edits nothing.

For zsh the line goes into both `.zshenv` and `.zshrc`. `.zshenv` is the only file a non-interactive zsh reads, which is what scripts and coding agents run in. The shim also records where `fvx` was installed, so it still finds it in a shell whose PATH lacks `/opt/homebrew/bin`.

## Where versions come from

fvx starts in the current folder and walks up to `$HOME`. The nearest folder with an answer wins, so a package inside a monorepo can pin differently from the root.

| Order | Source | Example |
| --- | --- | --- |
| 0 | `FVX_VERSION` env var | `FVX_VERSION=3.22.3 flutter build apk` |
| 1 | `.fvmrc` | `{"flutter": "3.22.3"}` |
| 2 | `.fvm/fvm_config.json` | `{"flutterSdkVersion": "3.22.3"}` |
| 3 | `.tool-versions` | `flutter 3.22.3-stable` |
| 4 | `pubspec.yaml` | `environment: flutter: ">=3.19.0 <4.0.0"` |
| 5 | global default | `~/.flutter-sdk/current` |

`fvx use` writes `.fvmrc`, the file FVM users already commit, so a teammate on FVM reads the same pin.

A `pubspec.yaml` range only changes anything when your default would fail it. Then fvx picks the highest installed version that fits.

If a folder pins a version you don't have, `flutter` stops with the `fvx install` command to run. It never falls back to a different version.

## Commands

| Command | What it does |
| --- | --- |
| `fvx setup` | Write the shims and the PATH line. `--print` to only show it, `--uninstall` to remove both. |
| `fvx use [version]` | Pin this folder. No argument opens a picker. |
| `fvx default [version]` | Set the global default. |
| `fvx current` | The version this folder resolves to, and which file said so. |
| `fvx which` | The real `flutter` binary for this folder. |
| `fvx ls` | Installed SDKs. |
| `fvx install [version]` | Download an official SDK, checksum verified. No argument installs what this folder pins. |
| `fvx rm <version>` | Delete an SDK. |
| `fvx doctor` | Check shims, PATH order, the default, and this folder. |
| `fvx upgrade` | Update fvx through Homebrew or npm, whichever installed it. `--check` only reports. |
| `fvx completions zsh\|bash\|fish` | Shell completions. Homebrew installs them for you. |

SDKs live in `~/.flutter-sdk/<version>/flutter`. Set `FLUTTER_SDK_HOME` to move them. `fvx install` honors `FLUTTER_STORAGE_BASE_URL` if you use a mirror.

## Editors

VS Code and Cursor don't read PATH to find the SDK. Add this to your user settings once and every workspace follows its own pin:

```json
"dart.getFlutterSdkCommand": { "executable": "fvx", "args": ["resolve"] }
```

Android Studio keeps its own SDK path per project. Xcode and Gradle use the path Flutter wrote on the last `flutter pub get`, which through fvx is the pinned SDK.

## Development

```sh
bun install
bun test            # runs inside a throwaway FVX_HOME
bun run typecheck
bun run build       # dist/fvx
```

To try it without touching your real setup:

```sh
export FVX_HOME=$(mktemp -d) FLUTTER_SDK_HOME=~/.flutter-sdk
```

## Releasing

A merge to `main` that touches `bin/`, `src/`, `man/` or `package.json` builds four binaries, publishes a GitHub release, bumps the Homebrew formula and publishes to npm. The version is `0.<commit count>`. It needs two repo secrets, `TAP_TOKEN` and `NPM_TOKEN`. Without them the release still ships to GitHub and skips that channel with a warning.

## Not yet

Windows. Channel pins that track `stable` or `beta`. `mise.toml` and `.puro.json`.

MIT
