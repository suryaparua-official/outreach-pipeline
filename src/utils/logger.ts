const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

export const logger = {
  info: (msg: string) =>
    console.log(`${colors.cyan}[INFO]${colors.reset} ${msg}`),

  success: (msg: string) =>
    console.log(`${colors.green}[✓]${colors.reset} ${msg}`),

  warn: (msg: string) =>
    console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),

  error: (msg: string) => console.log(`${colors.red}[✗]${colors.reset} ${msg}`),

  stage: (n: number, msg: string) =>
    console.log(
      `\n${colors.bright}${colors.cyan}── Stage ${n}: ${msg} ──${colors.reset}`,
    ),

  dim: (msg: string) => console.log(`${colors.gray}${msg}${colors.reset}`),
};
