/**
 * completions: `fvx completions zsh|bash|fish` prints a completion script.
 * Homebrew runs this at install time. Version arguments complete from
 * `fvx ls --labels`, which prints one installed label per line.
 */

export const COMMANDS = {
  setup: "write the shims and add them to PATH",
  use: "pin this project to a Flutter version",
  default: "set the global default version",
  current: "show the version this folder resolves to, and why",
  which: "print the real flutter binary for this folder",
  ls: "list installed SDKs",
  install: "download a Flutter SDK",
  rm: "delete an installed SDK",
  doctor: "check the setup",
  upgrade: "update fvx itself",
  completions: "print a shell completion script",
  resolve: "print the SDK root for this folder",
  version: "print the fvx version",
  help: "show help",
} as const;

export const COMPLETION_SHELLS = ["zsh", "bash", "fish"] as const;
export type CompletionShell = (typeof COMPLETION_SHELLS)[number];

/** Commands whose first argument is an installed SDK label. */
const TAKES_LABEL = ["use", "default", "rm"];

export function completionFor(shell: CompletionShell): string {
  const names = Object.keys(COMMANDS);
  switch (shell) {
    case "zsh":
      return `#compdef fvx
_fvx() {
  if (( CURRENT == 2 )); then
    local -a cmds
    cmds=(
${Object.entries(COMMANDS).map(([name, desc]) => `      '${name}:${desc}'`).join("\n")}
    )
    _describe 'command' cmds
  elif (( CURRENT == 3 )); then
    case $words[2] in
      ${TAKES_LABEL.join("|")}) compadd -- \${(f)"$(fvx ls --labels 2>/dev/null)"} ;;
      completions) compadd -- ${COMPLETION_SHELLS.join(" ")} ;;
    esac
  fi
}
_fvx "$@"
`;
    case "bash":
      return `_fvx() {
  local cur=\${COMP_WORDS[COMP_CWORD]}
  if (( COMP_CWORD == 1 )); then
    COMPREPLY=($(compgen -W "${names.join(" ")}" -- "$cur"))
  elif (( COMP_CWORD == 2 )); then
    case \${COMP_WORDS[1]} in
      ${TAKES_LABEL.join("|")}) COMPREPLY=($(compgen -W "$(fvx ls --labels 2>/dev/null)" -- "$cur")) ;;
      completions) COMPREPLY=($(compgen -W "${COMPLETION_SHELLS.join(" ")}" -- "$cur")) ;;
    esac
  fi
}
complete -F _fvx fvx
`;
    case "fish":
      return `complete -c fvx -f
${Object.entries(COMMANDS).map(([name, desc]) => `complete -c fvx -n __fish_use_subcommand -a ${name} -d '${desc}'`).join("\n")}
complete -c fvx -n '__fish_seen_subcommand_from ${TAKES_LABEL.join(" ")}' -a '(fvx ls --labels 2>/dev/null)'
complete -c fvx -n '__fish_seen_subcommand_from completions' -a '${COMPLETION_SHELLS.join(" ")}'
`;
    default: {
      const _exhaustive: never = shell;
      return _exhaustive;
    }
  }
}
