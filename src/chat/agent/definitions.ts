import * as fs from 'fs';
import * as path from 'path';
import { PermissionMode } from '../session';

export type AgentDefinitionSource = 'built-in' | 'project';

export interface AgentDefinition {
  agentType: string;
  whenToUse: string;
  tools?: string[];
  disallowedTools?: string[];
  skills?: string[];
  model?: string;
  permissionMode?: PermissionMode;
  maxTurns?: number;
  background?: boolean;
  source: AgentDefinitionSource;
  baseDir: string;
  systemPrompt: string;
}

const READ_TOOLS = ['list_files', 'read_file', 'search_files'];
const MUTATING_TOOLS = ['write_file', 'shell', 'task'];

export function getBuiltInAgentDefinitions(): AgentDefinition[] {
  return [
    {
      agentType: 'general-purpose',
      whenToUse: 'General-purpose agent for researching code, inspecting files, and executing scoped multi-step tasks.',
      tools: ['*'],
      source: 'built-in',
      baseDir: 'built-in',
      systemPrompt: [
        'You are a scoped 0-1 CLI subagent.',
        'Search broadly, read relevant files, and complete the delegated task without gold-plating.',
        'Prefer editing existing files over creating new ones. Preserve UTF-8 exactly, especially Chinese text.',
        'Return a concise report with what you did, key findings, verification, and remaining risks.',
      ].join('\n'),
    },
    {
      agentType: 'plan',
      whenToUse: 'Read-only software architect agent for exploring the codebase and designing implementation plans.',
      tools: READ_TOOLS,
      disallowedTools: MUTATING_TOOLS,
      permissionMode: 'plan',
      source: 'built-in',
      baseDir: 'built-in',
      systemPrompt: [
        'You are a planning specialist for 0-1 CLI.',
        'READ-ONLY MODE: do not create, edit, delete, move, copy, install, commit, or run commands that mutate state.',
        'Explore existing files and patterns, then produce an implementation plan.',
        'End with Critical Files for Implementation and a Verification section.',
      ].join('\n'),
    },
    {
      agentType: 'verification',
      whenToUse: 'Verification-only agent for trying to break completed implementation work before it is reported done.',
      tools: ['list_files', 'read_file', 'search_files', 'shell'],
      disallowedTools: ['write_file', 'task'],
      permissionMode: 'ask',
      background: true,
      source: 'built-in',
      baseDir: 'built-in',
      systemPrompt: [
        'You are a verification specialist for 0-1 CLI. Your job is to try to break the implementation, not rubber-stamp it.',
        'Do not modify project files, install packages, or run git write operations.',
        'Run build, tests, type checks, and at least one adversarial probe that fits the change.',
        'Report exact commands, observed output, and end with VERDICT: PASS, VERDICT: FAIL, or VERDICT: PARTIAL.',
      ].join('\n'),
    },
  ];
}

function splitCsv(value: string | undefined): string[] | undefined {
  if (!value) return undefined;
  const values = value.split(',').map((item) => item.trim()).filter(Boolean);
  return values.length ? values : undefined;
}

function parseBoolean(value: string | undefined): boolean | undefined {
  if (!value) return undefined;
  if (/^(true|yes|1)$/i.test(value.trim())) return true;
  if (/^(false|no|0)$/i.test(value.trim())) return false;
  return undefined;
}

function parsePositiveInt(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function parsePermissionMode(value: string | undefined): PermissionMode | undefined {
  if (value === 'ask' || value === 'bypass' || value === 'plan') return value;
  return undefined;
}

function parseAgentMarkdown(filePath: string, baseDir: string): AgentDefinition | null {
  const raw = fs.readFileSync(filePath, 'utf8');
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/u.exec(raw);
  const frontmatter: Record<string, string> = {};
  const body = match ? match[2] : raw;

  if (match) {
    match[1].split(/\r?\n/).forEach((line) => {
      const separator = line.indexOf(':');
      if (separator <= 0) return;
      const key = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim();
      if (key) frontmatter[key] = value.replace(/^['"]|['"]$/g, '');
    });
  }

  const agentType = path.basename(filePath, path.extname(filePath));
  const systemPrompt = body.trim();
  if (!systemPrompt) return null;

  return {
    agentType,
    whenToUse: frontmatter.description || `Project agent ${agentType}`,
    tools: splitCsv(frontmatter.tools),
    disallowedTools: splitCsv(frontmatter.disallowedTools),
    skills: splitCsv(frontmatter.skills),
    model: frontmatter.model,
    permissionMode: parsePermissionMode(frontmatter.permissionMode),
    maxTurns: parsePositiveInt(frontmatter.maxTurns),
    background: parseBoolean(frontmatter.background),
    source: 'project',
    baseDir,
    systemPrompt,
  };
}

export function listProjectAgentDefinitions(workspaceRoot: string): AgentDefinition[] {
  const baseDir = path.join(path.resolve(workspaceRoot), '.0-1-cli', 'agents');
  if (!fs.existsSync(baseDir)) return [];
  return fs.readdirSync(baseDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.md'))
    .map((entry) => parseAgentMarkdown(path.join(baseDir, entry.name), baseDir))
    .filter((agent): agent is AgentDefinition => Boolean(agent));
}

export function listAgentDefinitions(workspaceRoot: string = process.cwd()): AgentDefinition[] {
  const agents = [...getBuiltInAgentDefinitions(), ...listProjectAgentDefinitions(workspaceRoot)];
  const byType = new Map<string, AgentDefinition>();
  agents.forEach((agent) => byType.set(agent.agentType, agent));
  return Array.from(byType.values());
}

export function resolveAgentDefinition(workspaceRoot: string, agentType = 'general-purpose'): AgentDefinition {
  const agents = listAgentDefinitions(workspaceRoot);
  return agents.find((agent) => agent.agentType === agentType)
    || agents.find((agent) => agent.agentType === 'general-purpose')
    || getBuiltInAgentDefinitions()[0];
}
