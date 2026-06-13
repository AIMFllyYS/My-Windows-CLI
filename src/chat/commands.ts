import { ModelInfo } from '../types';
import { AiSettings } from './config';

export interface ParsedSlashCommand {
  command: string;
  args: string;
}

export function parseSlashCommand(input: string): ParsedSlashCommand | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) return null;
  const [command, ...rest] = trimmed.split(/\s+/);
  return { command: command.toLowerCase(), args: rest.join(' ') };
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
