import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { getProjectRoot } from '../utils/config';

/**
 * Read-only tools for AI chat.
 * SAFETY: No write/delete/modify operations allowed.
 */

export function executeTool(command: string): string {
  const trimmed = command.trim();
  const parts = trimmed.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1).join(' ');

  // ls / dir
  if (cmd === 'ls' || cmd === 'dir') {
    const target = args || '.';
    try {
      const resolved = path.isAbsolute(target) ? target : path.resolve(target);
      const entries = fs.readdirSync(resolved, { withFileTypes: true });
      return entries.map(e => {
        const type = e.isDirectory() ? '[DIR] ' : '      ';
        return type + e.name;
      }).join('\n') || '(empty directory)';
    } catch (e: any) {
      return 'Error: ' + e.message;
    }
  }

  // read / cat / type
  if (cmd === 'read' || cmd === 'cat' || cmd === 'type') {
    if (!args) return 'Error: 请指定文件名';
    try {
      const filepath = path.isAbsolute(args) ? args : path.resolve(args);
      const content = fs.readFileSync(filepath, 'utf-8');
      const lines = content.split('\n');
      if (lines.length > 200) {
        return lines.slice(0, 200).join('\n') + '\n... (截断，仅显示前200行)';
      }
      return content;
    } catch (e: any) {
      return 'Error: ' + e.message;
    }
  }

  // grep (read-only search)
  if (cmd === 'grep' || cmd === 'rg') {
    try {
      const result = execSync(trimmed, { cwd: process.cwd(), encoding: 'utf-8', timeout: 10000 });
      return result || '(no matches)';
    } catch (e: any) {
      if (e.status === 1) return '(no matches)';
      return 'Error: ' + e.message;
    }
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
    '4. **绝对不要在回复中输出 XML 标签、function_calls、invoke 等工具调用格式**',
    '5. 你没有直接调用工具的能力，不要假装调用工具',
    '',
    '## 你的能力',
    '- 解释代码和项目结构',
    '- 分析文件内容',
    '- 提供编程建议和技术解答',
    '',
    '## 搜索功能',
    '你无法直接执行搜索。如果用户需要搜索，告诉他们使用以下命令：',
    '- `/search <关键词>` - 网络搜索',
    '- `search <关键词>` - 网络搜索（直接输入）',
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
