import * as https from 'https';
import { SearchResult, WebSearchResponse } from '../types';

const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY || 'cc12a53e51ea4ed082d2e42f95806df0.0PkfvBIeV7rjdBll';

/**
 * ZhiPu Web Search API - standalone search tool
 * POST https://open.bigmodel.cn/api/paas/v4/web_search
 */
export function webSearch(query: string, count: number = 5): Promise<SearchResult[]> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      search_engine: 'search-prime',
      search_query: query,
      count,
      search_recency_filter: 'noLimit',
    });

    const req = https.request({
      hostname: 'open.bigmodel.cn',
      path: '/api/paas/v4/web_search',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + ZHIPU_API_KEY,
        'Content-Length': Buffer.byteLength(data),
      },
    }, (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => {
        try {
          const parsed: WebSearchResponse = JSON.parse(body);
          resolve(parsed.search_result || []);
        } catch {
          reject(new Error('搜索响应解析失败'));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/**
 * Format search results for display
 */
export function formatSearchResults(results: SearchResult[]): string {
  if (!results.length) return '未找到相关结果。';
  return results.map((r, i) => {
    const date = r.publish_date ? ` (${r.publish_date})` : '';
    const source = r.media ? ` - ${r.media}` : '';
    return `[${i + 1}] ${r.title}${source}${date}\n    ${r.content.slice(0, 200)}${r.content.length > 200 ? '...' : ''}\n    🔗 ${r.link}`;
  }).join('\n\n');
}

/**
 * Format search results as context for AI
 */
export function formatSearchForAI(results: SearchResult[]): string {
  if (!results.length) return '未找到相关搜索结果。';
  return results.map((r, i) =>
    `[${i + 1}] ${r.title}\n${r.content}\n来源: ${r.link}`
  ).join('\n\n');
}
