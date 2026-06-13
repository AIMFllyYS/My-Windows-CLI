import * as fs from 'fs';
import * as path from 'path';
import { AiMode, PermissionMode } from '../session';
import { getToolDefinition, ToolDefinition } from '../tools/registry';

export type PermissionDecisionValue = 'allow' | 'ask' | 'deny';

export interface PermissionDecision {
  decision: PermissionDecisionValue;
  reason: string;
}

export interface SessionPermissionMemory {
  allowedTools?: Set<string>;
  deniedTools?: Set<string>;
}

export interface PermissionRequest {
  mode: AiMode;
  permissionMode: PermissionMode;
  tool: Pick<ToolDefinition, 'name'> & Partial<Pick<ToolDefinition, 'kind' | 'allowedModes' | 'requiresPermission'>>;
  input?: { path?: string; [key: string]: unknown };
  workspaceRoot: string;
  session?: SessionPermissionMemory;
}

function comparePath(value: string): string {
  const resolved = path.resolve(value);
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
}

function isInsidePath(root: string, target: string): boolean {
  const rootCmp = comparePath(root);
  const targetCmp = comparePath(target);
  return targetCmp === rootCmp || targetCmp.startsWith(rootCmp + path.sep);
}

function nearestExistingPath(targetPath: string): string | undefined {
  let current = path.resolve(targetPath);
  while (!fs.existsSync(current)) {
    const parent = path.dirname(current);
    if (parent === current) return undefined;
    current = parent;
  }
  return current;
}

export function resolveWorkspacePath(workspaceRoot: string, targetPath?: string): string {
  const root = path.resolve(workspaceRoot);
  if (!targetPath) return root;
  return path.isAbsolute(targetPath) ? path.resolve(targetPath) : path.resolve(root, targetPath);
}

export function resolveExistingWorkspacePath(workspaceRoot: string, targetPath?: string): string | undefined {
  if (isDangerousPath(workspaceRoot, targetPath)) return undefined;
  try {
    return fs.realpathSync(resolveWorkspacePath(workspaceRoot, targetPath));
  } catch {
    return undefined;
  }
}

export function isDangerousPath(workspaceRoot: string, targetPath?: string): boolean {
  if (!targetPath) return false;
  let realRoot: string;
  try {
    realRoot = fs.realpathSync(path.resolve(workspaceRoot));
  } catch {
    return true;
  }

  const target = resolveWorkspacePath(workspaceRoot, targetPath);
  const existing = nearestExistingPath(target);
  if (!existing) return true;

  try {
    const realExisting = fs.realpathSync(existing);
    return !isInsidePath(realRoot, realExisting);
  } catch {
    return true;
  }
}

export function rememberSessionDecision(
  state: SessionPermissionMemory,
  decision: { toolName: string; decision: 'allow' | 'deny' }
): void {
  if (decision.decision === 'allow') {
    state.allowedTools ||= new Set<string>();
    state.allowedTools.add(decision.toolName);
    return;
  }
  state.deniedTools ||= new Set<string>();
  state.deniedTools.add(decision.toolName);
}

export function decidePermission(request: PermissionRequest): PermissionDecision {
  let tool: ToolDefinition;
  try {
    tool = getToolDefinition(request.tool.name);
  } catch {
    return { decision: 'deny', reason: 'unknown tool' };
  }

  if (isDangerousPath(request.workspaceRoot, request.input?.path)) {
    return { decision: 'deny', reason: 'path outside workspace' };
  }

  if (!tool.allowedModes.includes(request.mode)) {
    return { decision: 'deny', reason: `${tool.name} is not allowed in ${request.mode} mode` };
  }

  if (tool.kind === 'read') {
    return { decision: 'allow', reason: `read tool allowed in ${request.mode} mode` };
  }

  if (!tool.requiresPermission) {
    return { decision: 'allow', reason: `${tool.name} allowed in ${request.mode} mode` };
  }

  if (request.mode === 'chat') {
    return { decision: 'deny', reason: 'chat mode is read-only' };
  }
  if (request.mode === 'plan' || request.permissionMode === 'plan') {
    return { decision: 'deny', reason: 'plan mode cannot modify files or run commands' };
  }
  if (request.session?.deniedTools?.has(request.tool.name)) {
    return { decision: 'deny', reason: 'tool denied for this session' };
  }
  if (request.session?.allowedTools?.has(request.tool.name)) {
    return { decision: 'allow', reason: 'tool allowed for this session' };
  }
  if (request.mode === 'agent' && request.permissionMode === 'bypass') {
    return { decision: 'allow', reason: 'agent bypass mode' };
  }
  if (request.mode === 'agent') {
    return { decision: 'ask', reason: 'agent mode requires confirmation' };
  }

  return { decision: 'deny', reason: 'mode not allowed for tool' };
}
