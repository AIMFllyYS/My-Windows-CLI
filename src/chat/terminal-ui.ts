import chalk from 'chalk';

// === Box Drawing ===

export function drawBox(title: string, subtitle?: string): string {
  const w = 60;
  const lines: string[] = [];
  lines.push(chalk.cyan('╔' + '═'.repeat(w) + '╗'));
  const pad = Math.max(0, Math.floor((w - title.length) / 2));
  lines.push(chalk.cyan('║') + ' '.repeat(pad) + chalk.bold.white(title) + ' '.repeat(w - pad - title.length) + chalk.cyan('║'));
  if (subtitle) {
    const sp = Math.max(0, Math.floor((w - subtitle.length) / 2));
    lines.push(chalk.cyan('║') + ' '.repeat(sp) + chalk.gray(subtitle) + ' '.repeat(w - sp - subtitle.length) + chalk.cyan('║'));
  }
  lines.push(chalk.cyan('╚' + '═'.repeat(w) + '╝'));
  return lines.join('\n');
}

// === Status Messages ===

export function printSuccess(msg: string): void {
  console.log(chalk.green('  ✓ ') + msg);
}

export function printError(msg: string): void {
  console.log(chalk.red('  ✗ ') + msg);
}

export function printInfo(msg: string): void {
  console.log(chalk.blue('  ℹ ') + msg);
}

export function printWarning(msg: string): void {
  console.log(chalk.yellow('  ⚠ ') + msg);
}

export function printDivider(): void {
  console.log(chalk.gray('  ' + '─'.repeat(56)));
}
