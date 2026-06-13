import * as readline from 'readline';
import chalk from 'chalk';
import { interactiveSelect } from '../../utils/selector';
import { openUrl } from '../../utils/open-url';
import { API_PROVIDERS, ApiProvider } from './registry';

export { API_PROVIDERS };

function askEnter(): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question('按 Enter 打开开发者平台，输入其他内容取消: ', (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function printProvider(provider: ApiProvider): void {
  console.log(chalk.bold.cyan(`\n${provider.name}`));
  console.log(chalk.white(`顶尖模型：${provider.topModel}`));
  console.log(chalk.gray(provider.description));
  console.log(chalk.blue(provider.url));
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