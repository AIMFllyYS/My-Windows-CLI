import * as readline from 'readline';
import chalk from 'chalk';
import { interactiveSelect } from '../../utils/selector';
import { openUrl } from '../../utils/open-url';
import { PAY_RESOURCES, PayResource } from './registry';

export { PAY_RESOURCES };

function askEnter(): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question('按 Enter 打开链接，输入其他内容取消: ', (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function printResource(resource: PayResource): void {
  console.log(chalk.bold.cyan(`\n${resource.name}`));
  console.log(chalk.gray(resource.description));
  console.log(chalk.blue(resource.url));
}

export async function handlePayGuide(): Promise<void> {
  if (!process.stdin.isTTY) {
    PAY_RESOURCES.forEach(printResource);
    return;
  }

  let selectedKey = '';
  await interactiveSelect({
    title: '选择支付 / 代充 / 中转资源',
    options: PAY_RESOURCES.map((resource) => ({
      label: resource.name,
      value: resource.key,
      description: resource.description,
    })),
    onSelect: (value) => {
      selectedKey = value;
    },
  });

  const selected = PAY_RESOURCES.find((resource) => resource.key === selectedKey);
  if (!selected) return;
  printResource(selected);
  if ((await askEnter()).trim() === '') openUrl(selected.url);
}