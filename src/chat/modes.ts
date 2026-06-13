import { AiMode } from './session';

export interface ModeCommand {
  mode: AiMode;
}

export function resolveModeCommand(input: string): ModeCommand | null {
  const command = input.trim().split(/\s+/)[0].toLowerCase();
  if (command === '/chat') return { mode: 'chat' };
  if (command === '/agent') return { mode: 'agent' };
  if (command === '/plan') return { mode: 'plan' };
  return null;
}
