import * as https from 'https';
import * as dotenv from 'dotenv';
import { ChatMessage, ModelInfo } from '../types';

dotenv.config();

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY || '';
const ZHIPU_KEY = process.env.ZHIPU_API_KEY || 'cc12a53e51ea4ed082d2e42f95806df0.0PkfvBIeV7rjdBll';

interface StreamCallbacks {
  onToken: (token: string) => void;
  onDone: (full: string) => void;
  onError: (err: Error) => void;
  onReasoning?: (token: string) => void;
}

interface ProviderSpec {
  hostname: string;
  path: string;
  key: string;
}

function getProvider(model: ModelInfo): ProviderSpec {
  if (model.provider === 'zhipu') {
    return { hostname: 'open.bigmodel.cn', path: '/api/paas/v4/chat/completions', key: ZHIPU_KEY };
  }
  return { hostname: 'api.deepseek.com', path: '/chat/completions', key: DEEPSEEK_KEY };
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
  const provider = getProvider(model);

  const body: any = {
    model: model.id,
    messages,
    stream: true,
    max_tokens: 4096,
  };

  // ZhiPu web search tool integration
  if (tools && tools.length > 0 && model.provider === 'zhipu') {
    body.tools = tools;
  }

  const data = JSON.stringify(body);

  const req = https.request({
    hostname: provider.hostname,
    path: provider.path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + provider.key,
      'Content-Length': Buffer.byteLength(data),
      'Accept': 'text/event-stream',
    },
  }, (res) => {
    let full = '';
    let buffer = '';

    if (res.statusCode && res.statusCode >= 400) {
      let errBody = '';
      res.on('data', (c) => errBody += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(errBody);
          callbacks.onError(new Error(parsed.error?.message || `API ${res.statusCode}`));
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
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const payload = trimmed.slice(6);
        if (payload === '[DONE]') {
          callbacks.onDone(full);
          return;
        }
        try {
          const parsed = JSON.parse(payload);
          const delta = parsed.choices?.[0]?.delta;
          if (!delta) continue;

          // Handle reasoning tokens (DeepSeek reasoner)
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
      if (full) callbacks.onDone(full);
    });
  });

  req.on('error', (e) => callbacks.onError(e));
  req.write(data);
  req.end();
}

/**
 * Non-streaming chat (for simple calls)
 */
export function chatComplete(messages: ChatMessage[], model: ModelInfo, tools?: any[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const provider = getProvider(model);
    const body: any = { model: model.id, messages, stream: false, max_tokens: 4096 };
    if (tools && tools.length > 0 && model.provider === 'zhipu') {
      body.tools = tools;
    }
    const data = JSON.stringify(body);

    const req = https.request({
      hostname: provider.hostname,
      path: provider.path,
      method: 'POST',
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
    req.write(data);
    req.end();
  });
}
