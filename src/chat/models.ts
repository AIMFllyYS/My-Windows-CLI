import { ModelInfo } from '../types';
import { parseAiEnv } from './config';

export const MODELS: ModelInfo[] = [
  // DeepSeek V4
  {
    id: 'deepseek-v4-flash',
    name: 'DeepSeek V4 Flash',
    provider: 'deepseek',
    description: '快速通用对话',
  },
  {
    id: 'deepseek-v4-pro',
    name: 'DeepSeek V4 Pro',
    provider: 'deepseek',
    description: '旗舰推理模型',
  },
  // ZhiPu GLM
  {
    id: 'glm-4.7-flash',
    name: 'GLM-4.7 Flash',
    provider: 'zhipu',
    description: '免费 · 轻量高性能',
    supportsSearch: true,
  },
  {
    id: 'glm-4.5-flash',
    name: 'GLM-4.5 Flash',
    provider: 'zhipu',
    description: '免费 · 强推理',
    supportsSearch: true,
  },
  {
    id: 'glm-5',
    name: 'GLM-5',
    provider: 'zhipu',
    description: '旗舰 · 编程+规划',
    supportsSearch: true,
  },
];

export const DEFAULT_MODEL_ID = 'deepseek-v4-flash';

export function getAvailableModels(env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env): ModelInfo[] {
  const settings = parseAiEnv(env);
  const configured = settings.modelIds
    .filter((id) => !MODELS.some((model) => model.id === id))
    .map((id) => ({
      id,
      name: id,
      provider: 'custom' as const,
      description: 'Custom configured model',
      modalities: ['text'],
    }));

  return [...MODELS, ...configured];
}

export function getModelById(id: string): ModelInfo | undefined {
  return getAvailableModels().find(m => m.id === id);
}
