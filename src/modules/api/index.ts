import * as readline from 'readline';
import chalk from 'chalk';
import { interactiveSelect } from '../../utils/selector';
import { openUrl } from '../../utils/open-url';
import { API_PROVIDERS, ApiProvider } from './registry';

export { API_PROVIDERS };

const linkLabels: Record<string, string> = {
  developer: '开发者平台',
  console: '控制台',
  docs: '官方文档',
  models: '模型列表',
  pricing: '价格 / Token 计费',
  tokenPlan: 'Token Plan / 套餐',
  openaiCompatible: 'OpenAI 兼容',
  anthropicCompatible: 'Anthropic 兼容',
  unifiedApi: '统一调用 / 原生调用',
};

function askEnter(): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question('按 Enter 打开默认开发者平台，输入其他内容取消: ', (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function printLinks(provider: ApiProvider): void {
  console.log(chalk.bold.white('\n官方链接：'));
  for (const [key, value] of Object.entries(provider.links)) {
    if (!value) continue;
    console.log(chalk.blue(`- ${linkLabels[key] || key}: ${value}`));
  }
}

function printCompatibility(provider: ApiProvider): void {
  console.log(chalk.bold.white('\n兼容性说明：'));
  console.log(chalk.gray(`- 原生 / 默认：${provider.compatibility.native}`));
  console.log(chalk.gray(`- OpenAI 兼容：${provider.compatibility.openai}`));
  console.log(chalk.gray(`- Anthropic 兼容：${provider.compatibility.anthropic}`));
}

function printProvider(provider: ApiProvider): void {
  console.log(chalk.bold.cyan(`\n${provider.name}`));
  console.log(chalk.white(`当前可证实主推模型：${provider.topModel}`));
  console.log(chalk.gray(`资料核查日期：${provider.evidenceDate}`));
  console.log(chalk.gray(provider.description));
  printLinks(provider);
  printCompatibility(provider);
  if (provider.notes.length > 0) {
    console.log(chalk.bold.white('\n谨慎说明：'));
    provider.notes.forEach((note) => console.log(chalk.yellow(`- ${note}`)));
  }
}

export async function handleApiGuide(): Promise<void> {
  if (!process.stdin.isTTY) {
    API_PROVIDERS.forEach(printProvider);
    return;
  }

  let selectedKey = '';
  await interactiveSelect({
    title: '选择模型 API 平台',
    options: API_PROVIDERS.map((provider) => ({
      label: provider.name,
      value: provider.key,
      description: provider.topModel,
    })),
    onSelect: (value) => {
      selectedKey = value;
    },
  });

  const selected = API_PROVIDERS.find((provider) => provider.key === selectedKey);
  if (!selected) return;
  printProvider(selected);
  if ((await askEnter()).trim() === '') openUrl(selected.url);
}