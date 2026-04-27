import { ModelInfo } from '../types';

// === Model Registry ===
// DeepSeek: deepseek-chat (V4 Flash non-thinking), deepseek-reasoner (V4 Flash thinking)
// ZhiPu: Uses open.bigmodel.cn API with dot-notation model IDs

export const MODELS: ModelInfo[] = [
  // DeepSeek
  {
    id: 'deepseek-chat',
    name: 'DeepSeek V4 Flash',
    provider: 'deepseek',
    description: '快速通用对话',
  },
  {
    id: 'deepseek-reasoner',
    name: 'DeepSeek V4 Reasoner',
    provider: 'deepseek',
    description: '深度推理 (思考模式)',
  },
  // ZhiPu GLM - core models
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

export const DEFAULT_MODEL_ID = 'deepseek-chat';

export function getModelById(id: string): ModelInfo | undefined {
  return MODELS.find(m => m.id === id);
}
