import chalk from 'chalk';

export const UI_WIDTH = 64;

export const ui = {
  brand: chalk.hex('#7dd3fc'),
  accent: chalk.hex('#a7f3d0'),
  muted: chalk.gray,
  warning: chalk.yellow,
  danger: chalk.red,
  success: chalk.green,
  strong: chalk.bold.white,
};

export function line(width = UI_WIDTH): string {
  return ui.muted('-'.repeat(width));
}

export function visibleLength(value: string): number {
  const clean = value.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '');
  let width = 0;
  for (const char of clean) {
    width += /[^\x00-\xff]/.test(char) ? 2 : 1;
  }
  return width;
}

export function truncateVisible(value: string, maxWidth: number): string {
  if (visibleLength(value) <= maxWidth) return value;
  const ellipsis = '…';
  const ellipsisWidth = visibleLength(ellipsis);
  if (maxWidth <= ellipsisWidth) return ellipsis.slice(0, Math.max(0, maxWidth));
  let width = 0;
  let output = '';
  for (const char of value) {
    const charWidth = /[^\x00-\xff]/.test(char) ? 2 : 1;
    if (width + charWidth > maxWidth - ellipsisWidth) break;
    output += char;
    width += charWidth;
  }
  return output + ellipsis;
}
