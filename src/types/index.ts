// === Model & Provider Types ===

export interface ModelInfo {
  id: string;
  name: string;
  provider: 'deepseek' | 'zhipu';
  description: string;
  supportsSearch?: boolean;
}

export interface ProviderConfig {
  name: string;
  baseUrl: string;
  apiKey: string;
}

// === Chat Types ===

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

export interface SearchResult {
  title: string;
  content: string;
  link: string;
  media?: string;
  publish_date?: string;
}

export interface WebSearchResponse {
  id: string;
  search_result: SearchResult[];
}

// === Tool Execution Types ===

export interface ToolResult {
  name: string;
  content: string;
}
