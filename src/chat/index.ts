import * as readline from 'readline';
import chalk from 'chalk';
import { ChatMessage, ModelInfo } from '../types';
import { MODELS, DEFAULT_MODEL_ID, getModelById } from './models';
import { streamChat } from './provider';
import { webSearch } from './search';
import { executeTool, getSystemPrompt, isToolCommand } from './tools';
import { Spinner, renderMarkdown, drawBox, printSuccess, printError, printInfo, printWarning, printDivider } from './renderer';
import { interactiveSelect } from '../utils/selector';

export async function startChat(modelId?: string): Promise<void> {
  let currentModel = getModelById(modelId || DEFAULT_MODEL_ID) || MODELS[0];
  const messages: ChatMessage[] = [{ role: 'system', content: getSystemPrompt() }];

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (): Promise<string> => new Promise(r => rl.question(chalk.cyan('\n  ❯ '), r));

  // Welcome banner
  console.log('\n' + drawBox(
    '🤖 Coding AI Chat',
    `只读安全模式 · ${currentModel.name}`
  ));
  console.log('');
  printInfo('输入问题开始对话，输入 /help 查看命令');
  printDivider();

  while (true) {
    const input = (await ask()).trim();
    if (!input) continue;

    // === Slash Commands ===
    if (input.startsWith('/')) {
      const handled = await handleCommand(input, currentModel, messages, rl);
      if (handled === 'exit') break;
      if (handled instanceof Object && 'model' in handled) {
        currentModel = handled.model;
        messages[0] = { role: 'system', content: getSystemPrompt() };
      }
      continue;
    }

    // === Direct Tool Commands ===
    if (isToolCommand(input)) {
      printInfo('执行工具...');
      const result = executeTool(input);
      console.log(chalk.gray('\n  ┌── 工具结果 ──'));
      result.split('\n').forEach(l => console.log(chalk.gray('  │ ') + chalk.white(l)));
      console.log(chalk.gray('  └' + '─'.repeat(40)));
      continue;
    }

    // === Web Search (prefix: search / 搜索) ===
    if (/^(search|搜索)\s+/i.test(input)) {
      const query = input.replace(/^(search|搜索)\s+/i, '');
      await doSearch(query);
      continue;
    }

    // === AI Chat ===
    messages.push({ role: 'user', content: input });

    const spinner = new Spinner('AI 思考中');
    spinner.start();

    try {
      const response = await new Promise<string>((resolve, reject) => {
        let reasoningText = '';
        let reasoningStarted = false;

        streamChat(messages, currentModel, {
          onToken: (token) => {
            // Collect silently - we render the full response at the end
            // Update spinner to show progress
            spinner.setText('AI 生成中');
          },
          onReasoning: (token) => {
            if (!reasoningStarted) {
              spinner.stop();
              console.log(chalk.gray('\n  💭 思考过程:'));
              reasoningStarted = true;
            }
            process.stdout.write(chalk.gray(token));
            reasoningText += token;
          },
          onDone: (full) => {
            spinner.stop();
            // End reasoning section if it was shown
            if (reasoningStarted) {
              console.log('');
              printDivider();
            }
            // Render the full response with markdown formatting
            console.log(chalk.bold.green('\n  AI '));
            printDivider();
            console.log(renderMarkdown(full));
            printDivider();
            resolve(full);
          },
          onError: (err) => {
            spinner.stop();
            reject(err);
          },
        });
      });

      messages.push({ role: 'assistant', content: response });
    } catch (e: any) {
      spinner.stop();
      printError('API 错误: ' + e.message);
      messages.pop(); // remove failed user message
    }
  }

  rl.close();
}

// === Slash Command Handler ===

interface CommandResult {
  model: ModelInfo;
}

async function handleCommand(
  input: string,
  currentModel: ModelInfo,
  messages: ChatMessage[],
  _rl: readline.Interface
): Promise<'exit' | 'continue' | CommandResult> {
  const parts = input.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1).join(' ');

  switch (cmd) {
    case '/exit':
    case '/quit':
    case '/q':
      console.log(chalk.green('\n  👋 再见！\n'));
      return 'exit';

    case '/help':
    case '/h':
      printHelp();
      return 'continue';

    case '/model':
    case '/m':
      return await switchModel(currentModel);

    case '/clear':
    case '/c':
      messages.length = 1; // keep system prompt
      printSuccess('对话已清空');
      return 'continue';

    case '/search':
    case '/s':
      if (!args) {
        printWarning('用法: /search <查询内容>');
      } else {
        await doSearch(args);
      }
      return 'continue';

    case '/info':
      printModelInfo(currentModel);
      return 'continue';

    default:
      printWarning('未知命令: ' + cmd + '，输入 /help 查看帮助');
      return 'continue';
  }
}

function printHelp(): void {
  console.log('');
  console.log(chalk.bold.cyan('  📖 命令列表'));
  printDivider();
  const cmds = [
    ['/model, /m', '切换 AI 模型'],
    ['/search, /s <query>', '网络搜索'],
    ['/clear, /c', '清空对话历史'],
    ['/info', '当前模型信息'],
    ['/help, /h', '显示此帮助'],
    ['/exit, /q', '退出对话'],
  ];
  cmds.forEach(([cmd, desc]) => {
    console.log(chalk.cyan('  ' + cmd!.padEnd(24)) + chalk.white(desc!));
  });
  console.log('');
  console.log(chalk.bold.cyan('  🔧 工具命令 (直接输入)'));
  printDivider();
  const tools = [
    ['ls <path>', '列出目录'],
    ['read <file>', '读取文件'],
    ['grep <pattern> <file>', '搜索文件内容'],
    ['search <query>', '网络搜索'],
  ];
  tools.forEach(([cmd, desc]) => {
    console.log(chalk.cyan('  ' + cmd!.padEnd(24)) + chalk.white(desc!));
  });
  console.log('');
}

async function switchModel(current: ModelInfo): Promise<'continue' | CommandResult> {
  console.log('');
  console.log(chalk.bold.cyan('  🔄 选择模型'));
  printDivider();

  const options = MODELS.map(m => ({
    label: `${m.name}${m.id === current.id ? chalk.green(' (当前)') : ''}`,
    value: m.id,
    description: `${m.description}${m.supportsSearch ? ' 🔍' : ''}`,
  }));

  let selected: ModelInfo | null = null;

  await interactiveSelect({
    title: '  选择模型:',
    options,
    onSelect: (value) => {
      selected = getModelById(value) || null;
    },
    onCancel: () => { /* do nothing */ },
  });

  if (selected) {
    printSuccess(`已切换到 ${(selected as ModelInfo).name}`);
    return { model: selected };
  }
  return 'continue';
}

function printModelInfo(model: ModelInfo): void {
  console.log('');
  console.log(chalk.bold.cyan('  📊 当前模型'));
  printDivider();
  console.log(chalk.white('  名称: ') + chalk.bold(model.name));
  console.log(chalk.white('  ID:   ') + chalk.gray(model.id));
  console.log(chalk.white('  厂商: ') + chalk.yellow(model.provider === 'deepseek' ? 'DeepSeek' : '智谱 GLM'));
  console.log(chalk.white('  搜索: ') + (model.supportsSearch ? chalk.green('支持') : chalk.gray('不支持')));
  console.log('');
}

async function doSearch(query: string): Promise<void> {
  const spinner = new Spinner('搜索中');
  spinner.start();
  try {
    const results = await webSearch(query);
    spinner.stop();
    console.log(chalk.bold.blue('\n  🔍 搜索结果: ') + chalk.white(query));
    printDivider();
    if (!results.length) {
      printWarning('未找到相关结果');
    } else {
      results.forEach((r, i) => {
        const date = r.publish_date ? chalk.gray(` (${r.publish_date})`) : '';
        console.log(chalk.cyan(`  [${i + 1}] `) + chalk.bold.white(r.title) + date);
        if (r.media) console.log(chalk.gray('      来源: ' + r.media));
        const snippet = r.content.slice(0, 150) + (r.content.length > 150 ? '...' : '');
        console.log(chalk.white('      ' + snippet));
        console.log(chalk.blue.underline('      ' + r.link));
        console.log('');
      });
    }
    printDivider();
  } catch (e: any) {
    spinner.stop();
    printError('搜索失败: ' + e.message);
  }
}

export { MODELS, DEFAULT_MODEL_ID } from './models';
