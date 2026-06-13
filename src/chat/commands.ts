import { ModelInfo } from '../types';
import { AiSettings } from './config';

export interface ParsedSlashCommand {
  command: string;
  args: string;
  rawCommand?: string;
}

export interface SlashMenuItem {
  command: string;
  description: string;
  aliases?: string[];
  argumentHint?: string;
  isHidden?: boolean;
  mode?: 'chat' | 'agent' | 'plan' | 'all';
}

export interface SlashCommandDefinition extends SlashMenuItem {
  type: 'local';
  loadedFrom: 'builtin';
}

const COMMAND_DEFINITIONS: SlashCommandDefinition[] = [
  { command: '/chat', type: 'local', loadedFrom: 'builtin', description: 'Switch to read-only code conversation mode', mode: 'all' },
  { command: '/agent', type: 'local', loadedFrom: 'builtin', description: 'Switch to tool-using agent mode', mode: 'all' },
  { command: '/plan', type: 'local', loadedFrom: 'builtin', description: 'Plan work without editing files', mode: 'all' },
  { command: '/agent spawn <task>', type: 'local', loadedFrom: 'builtin', description: 'Start a scoped local subagent', argumentHint: 'task', mode: 'agent' },
  { command: '/agent list', type: 'local', loadedFrom: 'builtin', description: 'Show queued and running subagents', mode: 'agent' },
  { command: '/setting', aliases: ['/settings'], type: 'local', loadedFrom: 'builtin', description: 'Configure URL, API key, and model IDs', argumentHint: 'URL / API Key / Model IDs', mode: 'all' },
  { command: '/model', aliases: ['/m'], type: 'local', loadedFrom: 'builtin', description: 'Choose a configured model', argumentHint: 'model id', mode: 'all' },
  { command: '/model info', type: 'local', loadedFrom: 'builtin', description: 'Show active model metadata', mode: 'all' },
  { command: '/skills', type: 'local', loadedFrom: 'builtin', description: 'List runtime skills', mode: 'all' },
  { command: '/skill <id|name>', type: 'local', loadedFrom: 'builtin', description: 'Load a skill into the AI context', argumentHint: 'id|name', mode: 'all' },
  { command: '/search <query>', aliases: ['/s'], type: 'local', loadedFrom: 'builtin', description: 'Search the web and summarize results', argumentHint: 'query', mode: 'all' },
  { command: '/clear', aliases: ['/c'], type: 'local', loadedFrom: 'builtin', description: 'Clear conversation history', mode: 'all' },
  { command: '/help', aliases: ['/h'], type: 'local', loadedFrom: 'builtin', description: 'Show help and slash commands', mode: 'all' },
  { command: '/exit', aliases: ['/quit', '/q'], type: 'local', loadedFrom: 'builtin', description: 'Exit after confirmation', mode: 'all' },
];

export const SLASH_MENU_ITEMS: SlashMenuItem[] = COMMAND_DEFINITIONS;

export function parseSlashCommand(input: string): ParsedSlashCommand | null {
  const resolved = resolveSlashCommand(input);
  if (resolved) return resolved;

  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) return null;
  const [command, ...rest] = trimmed.split(/\s+/);
  return { command: command.toLowerCase(), args: rest.join(' ') };
}

export function resolveSlashCommand(input: string): ParsedSlashCommand | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) return null;
  if (trimmed === '/') return { command: '/', args: '' };
  const [command, ...rest] = trimmed.split(/\s+/);
  const rawCommand = command.toLowerCase();
  const canonical = COMMAND_DEFINITIONS.find((item) => {
    const names = [commandToken(item.command), ...(item.aliases || [])];
    return names.map((name) => name.toLowerCase()).includes(rawCommand);
  });
  if (!canonical) return null;
  const canonicalCommand = commandToken(canonical.command);
  return {
    command: canonicalCommand,
    args: rest.join(' '),
    ...(rawCommand !== canonicalCommand ? { rawCommand } : {}),
  };
}

function commandToken(command: string): string {
  return command.split(/\s+/)[0].toLowerCase();
}

function modeAllows(item: SlashMenuItem, mode: 'chat' | 'agent' | 'plan'): boolean {
  return item.mode === 'all' || item.mode === mode;
}

export function getSlashCommandDefinitions(mode: 'chat' | 'agent' | 'plan' = 'chat'): SlashCommandDefinition[] {
  return COMMAND_DEFINITIONS.filter((item) => !item.isHidden && modeAllows(item, mode));
}

export function getSlashMenuItems(mode: 'chat' | 'agent' | 'plan' = 'chat'): SlashMenuItem[] {
  return getSlashCommandDefinitions(mode);
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
