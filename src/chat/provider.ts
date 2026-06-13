import * as https from 'https';
import { ChatMessage, ModelInfo } from '../types';

// Shared agent with keep-alive for connection reuse, limited sockets
const sharedAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 3,
  maxFreeSockets: 1,
  timeout: 30000,
});

interface StreamCallbacks {
  onToken: (token: string) => void;
  onDone: (full: string) => void;
  onError: (err: Error) => void;
  onReasoning?: (token: string) => void;
}

interface ProviderSpec {
  name: string;
  hostname: string;
  path: string;
  key: string;
  modelId: string;
}

export function getProviderConfig(model: Pick<ModelInfo, 'id' | 'provider'>): ProviderSpec {
  const customBaseUrl = process.env.AI_BASE_URL || '';
  const customKey = process.env.AI_API_KEY || '';
  const customModel = process.env.AI_MODEL || '';
  const deepseekKey = process.env.DEEPSEEK_API_KEY || '';
  const zhipuKey = process.env.ZHIPU_API_KEY || '';

  if (customBaseUrl || customKey || customModel) {
    const parsed = new URL(customBaseUrl || 'https://api.openai.com/v1');
    let apiPath = parsed.pathname.replace(/\/$/, '');
    if (!apiPath.endsWith('/chat/completions')) {
      apiPath += '/chat/completions';
    }
    return {
      name: 'custom',
      hostname: parsed.hostname,
      path: apiPath,
      key: customKey,
      modelId: customModel || model.id,
    };
  }

  if (model.provider === 'zhipu') {
    return {
      name: 'zhipu',
      hostname: 'open.bigmodel.cn',
      path: '/api/paas/v4/chat/completions',
      key: zhipuKey,
      modelId: model.id,
    };
  }
  return {
    name: 'deepseek',
    hostname: 'api.deepseek.com',
    path: '/chat/completions',
    key: deepseekKey,
    modelId: model.id,
  };
}

/**
 * Streaming chat completion - works for both DeepSeek and ZhiPu
 */
export function streamChat(
  messages: ChatMessage[],
  model: ModelInfo,
  callbacks: StreamCallbacks,
  tools?: any[]
): void {
  const provider = getProviderConfig(model);

  if (!provider.key) {
    const name = provider.name === 'custom' ? 'AI_API_KEY' : model.provider === 'zhipu' ? 'ZHIPU_API_KEY' : 'DEEPSEEK_API_KEY';
    callbacks.onError(new Error(`${name} 未配置，请检查 .env 文件`));
    return;
  }

  const body: any = {
    model: provider.modelId,
    messages,
    stream: true,
    max_tokens: 4096,
  };

  if (tools && tools.length > 0 && model.provider === 'zhipu') {
    body.tools = tools;
  }

  const data = JSON.stringify(body);

  const req = https.request({
    hostname: provider.hostname,
    path: provider.path,
    method: 'POST',
    agent: sharedAgent,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + provider.key,
      'Content-Length': Buffer.byteLength(data),
      'Accept': 'text/event-stream',
    },
  }, (res) => {
    let full = '';
    let buffer = '';
    let done = false;

    if (res.statusCode && res.statusCode >= 400) {
      let errBody = '';
      res.on('data', (c) => errBody += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(errBody);
          const msg = parsed.error?.message || `API ${res.statusCode}`;
          if (res.statusCode === 401) {
            callbacks.onError(new Error('API Key 无效或已过期，请检查 .env 文件'));
          } else {
            callbacks.onError(new Error(msg));
          }
        } catch {
          callbacks.onError(new Error(`API 错误 ${res.statusCode}`));
        }
      });
      return;
    }

    res.on('data', (chunk: Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (done) return;
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const payload = trimmed.slice(6);
        if (payload === '[DONE]') {
          done = true;
          callbacks.onDone(full);
          return;
        }
        try {
          const parsed = JSON.parse(payload);
          const delta = parsed.choices?.[0]?.delta;
          if (!delta) continue;

          if (delta.reasoning_content && callbacks.onReasoning) {
            callbacks.onReasoning(delta.reasoning_content);
          }

          if (delta.content) {
            full += delta.content;
            callbacks.onToken(delta.content);
          }
        } catch { /* skip malformed chunks */ }
      }
    });

    res.on('end', () => {
      if (done) return; // Already called onDone via [DONE] signal
      // Process remaining buffer
      if (buffer.trim()) {
        const trimmed = buffer.trim();
        if (trimmed.startsWith('data: ') && trimmed.slice(6) !== '[DONE]') {
          try {
            const parsed = JSON.parse(trimmed.slice(6));
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              full += content;
              callbacks.onToken(content);
            }
          } catch { /* ignore */ }
        }
      }
      callbacks.onDone(full);
    });
  });

  req.on('error', (e) => callbacks.onError(e));
  req.setTimeout(30000, () => {
    req.destroy();
    callbacks.onError(new Error('请求超时 (30s)'));
  });
  req.write(data);
  req.end();
}

/**
 * Non-streaming chat (for simple calls)
 */
export function chatComplete(messages: ChatMessage[], model: ModelInfo, tools?: any[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const provider = getProviderConfig(model);

    if (!provider.key) {
      const name = provider.name === 'custom' ? 'AI_API_KEY' : model.provider === 'zhipu' ? 'ZHIPU_API_KEY' : 'DEEPSEEK_API_KEY';
      reject(new Error(`${name} 未配置，请检查 .env 文件`));
      return;
    }

    const body: any = { model: provider.modelId, messages, stream: false, max_tokens: 4096 };
    if (tools && tools.length > 0 && model.provider === 'zhipu') {
      body.tools = tools;
    }
    const data = JSON.stringify(body);

    const req = https.request({
      hostname: provider.hostname,
      path: provider.path,
      method: 'POST',
      agent: sharedAgent,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + provider.key,
        'Content-Length': Buffer.byteLength(data),
      },
    }, (res) => {
      let responseData = '';
      res.on('data', (c) => responseData += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (parsed.error) {
            reject(new Error(parsed.error.message || 'API Error'));
            return;
          }
          resolve(parsed.choices?.[0]?.message?.content || '');
        } catch {
          reject(new Error('响应解析失败'));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('请求超时 (30s)'));
    });
    req.write(data);
    req.end();
  });
}
