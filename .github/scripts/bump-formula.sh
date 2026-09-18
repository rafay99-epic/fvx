#!/usr/bin/env bash
#
# Regenerate the `fvx` Homebrew formula in the rafay99-epic/homebrew-apps tap for
# a freshly published release, so the tap never goes stale and nobody hand-edits
# a sha256. Called from release.yml right after `gh release create`.
#
# Unlike the cask bumper (one dmg, one sha), the CLI ships four per-platform
# tarballs, so this recomputes all four sha256s and rewrites the whole formula
# from a template, deterministic, no fragile multi-sha sed.
#
# Usage:  VERSION=0.42 TAP_TOKEN=… bash bump-formula.sh [dist-dir]
#         (dist-dir defaults to ./dist and must hold the four fvx-*.tar.gz)
#
# Requires: git, shasum. TAP_TOKEN is a fine-grained PAT with Contents: Read &
# Write on rafay99-epic/homebrew-apps.

set -euo pipefail

VERSION="${VERSION:?VERSION env var required}"
: "${TAP_TOKEN:?TAP_TOKEN env var required}"
DIST="${1:-dist}"
REPO="rafay99-epic/fvx"
TAP="rafay99-epic/homebrew-apps"

sha() { shasum -a 256 "$DIST/fvx-$1.tar.gz" | awk '{print $1}'; }
SHA_DARWIN_ARM64=$(sha darwin-arm64)
SHA_DARWIN_X64=$(sha darwin-x64)
SHA_LINUX_ARM64=$(sha linux-arm64)
SHA_LINUX_X64=$(sha linux-x64)

base="https://github.com/${REPO}/releases/download/v${VERSION}"

read -r -d '' FORMULA <<EOF || true
class Fvx < Formula
  desc "Per-project Flutter SDK switching. Run flutter in any folder, get the version that folder pins"
  homepage "https://github.com/${REPO}"
  version "${VERSION}"
  license "MIT"

  # Standalone binaries compiled with \`bun build --compile\` (bundle the Bun
  # runtime, so there is no dependency to install). release.yml regenerates this
  # whole formula each release via .github/scripts/bump-formula.sh, do not
  # hand-edit the version or sha256 lines.
  on_macos do
    on_arm do
      url "${base}/fvx-darwin-arm64.tar.gz"
      sha256 "${SHA_DARWIN_ARM64}"
    end
    on_intel do
      url "${base}/fvx-darwin-x64.tar.gz"
      sha256 "${SHA_DARWIN_X64}"
    end
  end

  on_linux do
    on_arm do
      url "${base}/fvx-linux-arm64.tar.gz"
      sha256 "${SHA_LINUX_ARM64}"
    end
    on_intel do
      url "${base}/fvx-linux-x64.tar.gz"
      sha256 "${SHA_LINUX_X64}"
    end
  end

  def install
    bin.install "fvx"
    man1.install "fvx.1"
    # Tab completion out of the box: runs \`fvx completions <shell>\` at
    # install time and places each script where the shell expects it.
    generate_completions_from_executable(bin/"fvx", "completions", shells: [:zsh, :bash, :fish])
  end

  def caveats
    <<~CAVEATS
      One-time setup to enable automatic per-project Flutter SDK switching:

        fvx setup     # writes the shims, adds them to PATH

      Then restart your shell.

      Pin a project with:  fvx use <version>
    CAVEATS
  end

  test do
    assert_match "Flutter", shell_output("#{bin}/fvx help")
  end
end
EOF

echo "Regenerating fvx formula → ${VERSION}"
echo "  darwin-arm64 ${SHA_DARWIN_ARM64}"
echo "  darwin-x64   ${SHA_DARWIN_X64}"
echo "  linux-arm64  ${SHA_LINUX_ARM64}"
echo "  linux-x64    ${SHA_LINUX_X64}"

REMOTE="https://x-access-token:${TAP_TOKEN}@github.com/${TAP}.git"
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

git clone --quiet "$REMOTE" "$WORK"
cd "$WORK"
mkdir -p Formula
printf '%s\n' "$FORMULA" > Formula/fvx.rb

# Stage first, then check the staged diff, `git diff` alone ignores a brand-new
# untracked file, which would silently skip the very first publish.
git add Formula/fvx.rb
if git diff --cached --quiet -- Formula/fvx.rb; then
  echo "::notice::fvx formula already at ${VERSION}, nothing to push."
  exit 0
fi

git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git commit --quiet -m "fvx ${VERSION}"

# Push to the tap's main, re-syncing if a sibling repo pushed first.
for attempt in 1 2 3 4 5; do
  if git push --quiet "$REMOTE" HEAD:main 2>/dev/null; then
    echo "::notice::Pushed fvx ${VERSION} to the homebrew-apps tap."
    exit 0
  fi
  echo "Push rejected (attempt ${attempt}/5), re-syncing with tap main…"
  git pull --rebase --quiet "$REMOTE" main || { git rebase --abort 2>/dev/null || true; }
done

echo "::error::Could not push fvx ${VERSION} to the tap after 5 attempts."
exit 1
