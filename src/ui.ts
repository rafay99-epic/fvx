/**
 * ui: color gating and the fatal-error helper. Piped output stays plain text,
 * so `fvx resolve`, `fvx which` and `fvx ls` are safe to script against.
 */

const useColor = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;
const wrap = (code: number) => (s: string) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : s);

export const bold = wrap(1);
export const dim = wrap(2);
export const red = wrap(31);
export const green = wrap(32);
export const yellow = wrap(33);
export const cyan = wrap(36);

/** Print `fvx: <message>` to stderr and exit non-zero. */
export function die(message: string, code = 1): never {
  process.stderr.write(`fvx: ${message}\n`);
  process.exit(code);
}
