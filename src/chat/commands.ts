import { ModelInfo } from '../types';
import { AiSettings } from './config';

export interface ParsedSlashCommand {
  command: string;
  args: string;
}

export interface SlashMenuItem {
  command: string;
  description: string;
  mode?: 'chat' | 'agent' | 'plan' | 'all';
}

export const SLASH_MENU_ITEMS: SlashMenuItem[] = [
  { command: '/chat', description: 'Switch to read-only code conversation mode', mode: 'chat' },
  { command: '/agent', description: 'Switch to tool-using agent mode', mode: 'agent' },
  { command: '/plan', description: 'Plan work without editing files', mode: 'plan' },
  { command: '/agent spawn <task>', description: 'Start a scoped local subagent', mode: 'agent' },
  { command: '/agent list', description: 'Show queued and running subagents', mode: 'agent' },
  { command: '/setting', description: 'Configure URL, API key, and model IDs', mode: 'all' },
  { command: '/model', description: 'Choose a configured model', mode: 'all' },
  { command: '/model info', description: 'Show active model metadata', mode: 'all' },
  { command: '/skills', description: 'List runtime skills', mode: 'all' },
  { command: '/skill <id|name>', description: 'Load a skill into the AI context', mode: 'all' },
  { command: '/search <query>', description: 'Search the web and summarize results', mode: 'all' },
  { command: '/clear', description: 'Clear conversation history', mode: 'all' },
  { command: '/exit', description: 'Exit after confirmation', mode: 'all' },
];

export function parseSlashCommand(input: string): ParsedSlashCommand | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) return null;
  const [command, ...rest] = trimmed.split(/\s+/);
  return { command: command.toLowerCase(), args: rest.join(' ') };
}

export function getSlashMenuItems(mode: 'chat' | 'agent' | 'plan' = 'chat'): SlashMenuItem[] {
  return SLASH_MENU_ITEMS.filter((item) => item.mode === 'all' || item.mode === mode);
}

export function formatSlashMenu(mode: 'chat' | 'agent' | 'plan' = 'chat'): string {
  const items = getSlashMenuItems(mode);
  const commandWidth = Math.max(...items.map((item) => item.command.length), 0);
  return items
    .map((item) => `${item.command.padEnd(commandWidth)}  ${item.description}`)
    .join('\n');
}

export function formatModelOptions(models: ModelInfo[], activeId: string): string[] {
  return models.map((model) => `${model.id}${model.id === activeId ? ' (current)' : ''}`);
}

export function applyModelSelection(id: string, settings: AiSettings): AiSettings {
  const selected = id.trim();
  if (!settings.modelIds.includes(selected)) {
    throw new Error(`Unknown model: ${selected}`);
  }
  return { ...settings, activeModelId: selected };
}

export type ModelCommand =
  | { kind: 'selector' }
  | { kind: 'info' }
  | { kind: 'select'; modelId: string };

export function resolveModelCommand(args: string): ModelCommand {
  const trimmed = args.trim();
  if (!trimmed) return { kind: 'selector' };
  if (trimmed.toLowerCase() === 'info') return { kind: 'info' };
  return { kind: 'select', modelId: trimmed };
}
