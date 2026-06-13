import * as fs from 'fs';
import { getProjectRoot } from '../utils/config';
import { listFilesTool, readFileTool, searchFilesTool } from './tools/fs-read';
import { toolForLegacyCommand } from './tools/registry';

/**
 * Read-only tools for AI chat.
 * SAFETY: No write/delete/modify operations allowed.
 */

export async function executeTool(command: string): Promise<string> {
  const trimmed = command.trim();
  const parts = trimmed.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1).join(' ');
  const workspaceRoot = process.cwd();
  const tool = toolForLegacyCommand(cmd);
  if (!tool) return 'Unknown tool: ' + cmd + '\n可用工具: ls, dir, read, grep';

  if (tool.name === 'list_files') {
    return listFilesTool({ path: args || '.', workspaceRoot });
  }

  if (tool.name === 'read_file') {
    if (!args) return 'Error: 请指定文件名';
    return readFileTool({ path: args, workspaceRoot });
  }

  if (tool.name === 'search_files') {
    const [pattern, ...rest] = args.split(/\s+/);
    if (!pattern) return 'Error: 请提供搜索内容';
    return searchFilesTool({ pattern, path: rest.join(' ') || '.', workspaceRoot });
  }

  return 'Unknown tool: ' + cmd + '\n可用工具: ls, dir, read, grep';
}

export function getSystemPrompt(): string {
  const cwd = process.cwd().replace(/\\/g, '/');
  let projects = '';
  try {
    const root = getProjectRoot() || 'C:/project';
    const entries = fs.readdirSync(root, { withFileTypes: true });
    projects = entries.filter(e => e.isDirectory()).map(e => e.name).join(', ');
  } catch { /* ignore */ }

  return [
    '你是 Coding CLI 的 AI 助手，运行在只读安全模式下。',
    '',
    '## 核心规则',
    '1. 绝对禁止任何写入、修改、删除操作',
    '2. 使用中文回答',
    '3. 使用标准 markdown 格式，代码用 ``` 包裹并标注语言',
    '',
    '## 你的能力',
    '- 解释代码和项目结构',
    '- 分析文件内容',
    '- 提供编程建议和技术解答',
    '- **总结和分析搜索结果**：当对话中包含搜索结果时，你应该直接分析和总结这些内容',
    '',
    '## 搜索结果处理',
    '当系统向你提供搜索结果时，请直接根据搜索结果内容进行分析、总结和回答。',
    '不要说你无法搜索——搜索由系统完成，结果会直接提供给你。',
    '',
    '## 文件操作',
    '你无法直接读取文件。如果用户需要查看文件，告诉他们使用以下命令：',
    '- `ls <路径>` - 列出目录',
    '- `read <文件>` - 读取文件',
    '- `grep <模式> <文件>` - 搜索文件内容',
    '',
    '## 环境',
    '- 当前目录: ' + cwd,
    projects ? '- 项目列表: ' + projects : '',
  ].filter(Boolean).join('\n');
}

export function isToolCommand(input: string): boolean {
  return /^(ls|dir|read|cat|type|grep|rg)\b/i.test(input.trim());
}
