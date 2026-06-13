import { AiMode } from '../session';

export type ToolKind = 'read' | 'write' | 'shell' | 'network' | 'skill' | 'agent';

export interface ToolDefinition {
  name: string;
  kind: ToolKind;
  description: string;
  allowedModes: AiMode[];
  requiresPermission: boolean;
}

export const TOOL_REGISTRY: ToolDefinition[] = [
  {
    name: 'list_files',
    kind: 'read',
    description: 'List files in a directory',
    allowedModes: ['chat', 'agent', 'plan'],
    requiresPermission: false,
  },
  {
    name: 'read_file',
    kind: 'read',
    description: 'Read a UTF-8 text file',
    allowedModes: ['chat', 'agent', 'plan'],
    requiresPermission: false,
  },
  {
    name: 'search_files',
    kind: 'read',
    description: 'Search text files without invoking a shell',
    allowedModes: ['chat', 'agent', 'plan'],
    requiresPermission: false,
  },
  {
    name: 'write_file',
    kind: 'write',
    description: 'Write or edit a file',
    allowedModes: ['agent'],
    requiresPermission: true,
  },
  {
    name: 'shell',
    kind: 'shell',
    description: 'Run a shell command',
    allowedModes: ['agent'],
    requiresPermission: true,
  },
];

export function getToolDefinition(name: string): ToolDefinition {
  const found = TOOL_REGISTRY.find((tool) => tool.name === name);
  if (!found) throw new Error(`Unknown tool: ${name}`);
  return found;
}

export function toolForLegacyCommand(command: string): ToolDefinition | undefined {
  const normalized = command.toLowerCase();
  if (normalized === 'ls' || normalized === 'dir') return getToolDefinition('list_files');
  if (normalized === 'read' || normalized === 'cat' || normalized === 'type') return getToolDefinition('read_file');
  if (normalized === 'grep' || normalized === 'rg') return getToolDefinition('search_files');
  return undefined;
}
