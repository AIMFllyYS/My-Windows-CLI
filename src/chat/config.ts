import * as fs from 'fs';
import * as path from 'path';

export interface AiSettings {
  baseUrl: string;
  apiKey: string;
  modelIds: string[];
  activeModelId: string;
}

export function parseModelIds(value?: string): string[] {
  return (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseAiEnv(env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env): AiSettings {
  const modelIds = parseModelIds(env.AI_MODELS || env.AI_MODEL || '');
  const activeModelId = (env.AI_MODEL || modelIds[0] || '').trim();
  return {
    baseUrl: (env.AI_BASE_URL || '').trim(),
    apiKey: (env.AI_API_KEY || '').trim(),
    modelIds,
    activeModelId,
  };
}

export function resolveEnvPath(): string {
  return path.join(__dirname, '..', '..', '.env');
}

function parseEnvLines(content: string): { key: string; raw: string }[] {
  return content.split(/\r?\n/).map((line) => {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=.*$/);
    return { key: match ? match[1] : '', raw: line };
  });
}

export function writeAiSettings(envPath: string, settings: AiSettings): void {
  const existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const updates: Record<string, string> = {
    AI_BASE_URL: settings.baseUrl,
    AI_API_KEY: settings.apiKey,
    AI_MODELS: settings.modelIds.join(','),
    AI_MODEL: settings.activeModelId || settings.modelIds[0] || '',
  };
  const seen = new Set<string>();
  const next = parseEnvLines(existing).map((line) => {
    if (!line.key || !(line.key in updates)) return line.raw;
    seen.add(line.key);
    return `${line.key}=${updates[line.key]}`;
  });

  Object.keys(updates).forEach((key) => {
    if (!seen.has(key)) next.push(`${key}=${updates[key]}`);
  });

  fs.mkdirSync(path.dirname(envPath), { recursive: true });
  fs.writeFileSync(envPath, next.join('\n').replace(/\n*$/, '\n'), 'utf8');
}

export function getConfiguredModelIds(env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env): string[] {
  return parseAiEnv(env).modelIds;
}

export function getActiveModelId(env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env): string {
  return parseAiEnv(env).activeModelId;
}
