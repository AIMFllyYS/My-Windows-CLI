const ALLOWED_COMMANDS = new Set([
  'state',
  'api',
  'pay',
  'help',
]);

export function isAllowedDesktopCommand(command: string): boolean {
  return ALLOWED_COMMANDS.has(command);
}

export function normalizeDesktopCommand(command: string): string {
  return command.trim().replace(/^--/, '').toLowerCase();
}
