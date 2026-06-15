import { app } from 'electron';
import * as path from 'path';

export type DesktopAiMode = 'chat' | 'agent' | 'plan';

export interface DesktopAiMessage {
  id?: string;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  meta?: string;
}

export interface DesktopAiMessageRequest {
  sessionId?: string;
  mode?: unknown;
  messages?: DesktopAiMessage[];
  text?: unknown;
}

export interface DesktopAiMessageResult {
  ok: boolean;
  message?: DesktopAiMessage;
  activity?: Array<{ title: string; status: string; detail: string }>;
  output?: string;
  error?: string;
}

interface RuntimeChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  tool_calls?: Array<{ id: string; type: 'function'; function: { name: string; arguments: string } }>;
}

interface RuntimeAgentResult {
  status: 'completed' | 'permission_required' | 'plan_approval_required';
  finalMessage?: RuntimeChatMessage;
  toolResults: unknown[];
  pendingToolCall?: { function: { name: string } };
  permission?: { reason?: string };
  plan?: string;
  permissions?: unknown[];
}

interface RuntimeModel {
  id: string;
  name: string;
  provider: 'deepseek' | 'zhipu' | 'custom';
  description: string;
}

interface RuntimeModules {
  runAgentTurn: (input: {
    messages: RuntimeChatMessage[];
    workspaceRoot: string;
    mode: DesktopAiMode;
    permissionMode: 'ask' | 'plan';
    maxToolRounds: number;
    complete: (turnMessages: RuntimeChatMessage[]) => Promise<RuntimeChatMessage>;
  }) => Promise<RuntimeAgentResult>;
  chatCompleteMessage: (messages: RuntimeChatMessage[], model: RuntimeModel, tools?: unknown[]) => Promise<RuntimeChatMessage>;
  resolveModelInfo: (id: string, env: NodeJS.ProcessEnv) => RuntimeModel;
  DEFAULT_MODEL_ID: string;
  parseAiEnv: (env: NodeJS.ProcessEnv) => { activeModelId?: string };
  buildProviderToolSpecs: (mode: DesktopAiMode) => unknown[];
}

function resolveRuntimeDist(): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'app.asar', 'dist', 'cli')
    : path.resolve(__dirname, '..', '..', '..', 'dist');
}

function resolveMode(value: unknown): DesktopAiMode {
  if (value === 'agent' || value === 'plan') return value;
  return 'chat';
}

function safeMessages(messages: unknown, text: unknown): DesktopAiMessage[] {
  const list = Array.isArray(messages) ? messages : [];
  const normalized = list
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .filter((item) => item.role === 'system' || item.role === 'user' || item.role === 'assistant' || item.role === 'tool')
    .map((item) => ({
      role: item.role as DesktopAiMessage['role'],
      content: typeof item.content === 'string' ? item.content : '',
    }))
    .filter((item) => item.content.trim());

  if (normalized.some((item) => item.role === 'user' && item.content === text)) {
    return normalized;
  }
  if (typeof text === 'string' && text.trim()) {
    normalized.push({ role: 'user', content: text.trim() });
  }
  return normalized;
}

export async function sendDesktopAiMessage(request: DesktopAiMessageRequest): Promise<DesktopAiMessageResult> {
  const runtimeDist = resolveRuntimeDist();
  const mode = resolveMode(request.mode);
  const messages = safeMessages(request.messages, request.text);

  if (messages.length === 0) {
    return { ok: false, error: 'Message is empty.' };
  }

  try {
    const { runAgentTurn } = require(path.join(runtimeDist, 'chat', 'agent', 'loop.js')) as Pick<RuntimeModules, 'runAgentTurn'>;
    const { chatCompleteMessage } = require(path.join(runtimeDist, 'chat', 'provider.js')) as Pick<RuntimeModules, 'chatCompleteMessage'>;
    const { resolveModelInfo, DEFAULT_MODEL_ID } = require(path.join(runtimeDist, 'chat', 'models.js')) as Pick<RuntimeModules, 'resolveModelInfo' | 'DEFAULT_MODEL_ID'>;
    const { parseAiEnv } = require(path.join(runtimeDist, 'chat', 'config.js')) as Pick<RuntimeModules, 'parseAiEnv'>;
    const { buildProviderToolSpecs } = require(path.join(runtimeDist, 'chat', 'tools', 'registry.js')) as Pick<RuntimeModules, 'buildProviderToolSpecs'>;
    const settings = parseAiEnv(process.env);
    const model = resolveModelInfo(settings.activeModelId || DEFAULT_MODEL_ID, process.env);
    const result = await runAgentTurn({
      messages,
      workspaceRoot: path.resolve(__dirname, '..', '..', '..'),
      mode,
      permissionMode: mode === 'plan' ? 'plan' : 'ask',
      maxToolRounds: 4,
      complete: (turnMessages: RuntimeChatMessage[]) => chatCompleteMessage(turnMessages, model, buildProviderToolSpecs(mode)),
    });

    if (result.status === 'permission_required') {
      return {
        ok: true,
        message: {
          role: 'assistant',
          content: `Permission required for ${result.pendingToolCall?.function.name || 'tool call'}. Open the CLI terminal bridge to review and approve this tool call.`,
          meta: 'permission',
        },
        activity: [{ title: 'Tools', status: 'permission required', detail: result.permission?.reason || result.pendingToolCall?.function.name || 'tool call' }],
      };
    }

    if (result.status === 'plan_approval_required') {
      return {
        ok: true,
        message: { role: 'assistant', content: result.plan || 'Plan approval requested.', meta: 'plan approval' },
        activity: [{ title: 'Plan', status: 'approval required', detail: `${result.permissions?.length || 0} permission groups requested` }],
      };
    }

    return {
      ok: true,
      message: {
        role: 'assistant',
        content: result.finalMessage?.content || 'Done.',
        meta: result.toolResults.length ? `${result.toolResults.length} tool results` : 'done',
      },
      activity: [
        { title: 'Thinking', status: 'complete', detail: 'Assistant response returned.' },
        { title: 'Tools', status: result.toolResults.length ? 'used' : 'idle', detail: `${result.toolResults.length} tool calls this turn.` },
        { title: 'Plan', status: mode === 'plan' ? 'reviewed' : 'idle', detail: `Mode /${mode}` },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Embedded AI request failed.';
    return {
      ok: false,
      error: message,
      message: { role: 'assistant', content: message, meta: 'error' },
      activity: [{ title: 'Thinking', status: 'error', detail: message }],
    };
  }
}
