export interface ApiProvider {
  key: string;
  name: string;
  url: string;
  topModel: string;
  description: string;
}

export const API_PROVIDERS: ApiProvider[] = [
  { key: 'glm', name: 'Z.ai / GLM', url: 'https://docs.z.ai/guides/overview/quick-start', topModel: 'GLM-4.7 / GLM-4.5', description: '适合中文、长上下文、Agent 和代码任务，国内新手上手较友好。' },
  { key: 'kimi', name: 'Kimi / Moonshot', url: 'https://platform.kimi.ai/', topModel: 'Kimi K2.7 Code', description: '长上下文和代码能力强，适合读项目、写长文档、做代码修改。' },
  { key: 'deepseek', name: 'DeepSeek', url: 'https://platform.deepseek.com/', topModel: 'DeepSeek-V4 / DeepSeek Reasoner', description: '价格友好，适合日常编程、推理和 OpenAI 兼容接入。' },
  { key: 'mimo', name: 'Xiaomi MiMo', url: 'https://platform.xiaomimimo.com/', topModel: 'MiMo-V2-Pro', description: '小米 MiMo 开发者平台，适合尝试国产 coding agent 模型。' },
  { key: 'doubao', name: '火山方舟 / 豆包', url: 'https://www.volcengine.com/docs/82379/1099455', topModel: 'Doubao Seed 系列', description: '火山引擎模型服务平台，适合国内企业账号和多模型接入。' },
  { key: 'bailian', name: '阿里云百炼 / Model Studio', url: 'https://www.alibabacloud.com/en/product/modelstudio', topModel: 'Qwen3 / Qwen Coder', description: '阿里云模型平台，适合通义千问、企业云账号和国内云资源接入。' },
  { key: 'openai', name: 'OpenAI', url: 'https://developers.openai.com/api/docs/models', topModel: 'GPT-5.5', description: '综合能力强，适合复杂代码、工具调用、视觉和多模态任务。' },
  { key: 'google', name: 'Google AI Studio', url: 'https://aistudio.google.com/', topModel: 'Gemini 3.5 / Gemini Flash', description: '适合快速申请 Gemini API Key、体验长上下文和多模态能力。' },
  { key: 'grok', name: 'xAI / Grok', url: 'https://console.x.ai/', topModel: 'Grok-4.3', description: 'xAI Grok API 控制台，适合尝试实时信息、推理和多模态能力。' },
  { key: 'claude', name: 'Anthropic Claude', url: 'https://platform.claude.com/', topModel: 'Claude Opus / Sonnet', description: 'Claude API 控制台，适合长文档、代码审查和 agent 工作流。' },
  { key: 'minimax', name: 'MiniMax', url: 'https://platform.minimax.io/docs/api-reference/api-overview', topModel: 'MiniMax M3', description: '覆盖文本、语音、视频、图像和音乐 API，适合多模态产品探索。' },
];
