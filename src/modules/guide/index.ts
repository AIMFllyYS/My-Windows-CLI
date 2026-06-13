import chalk from 'chalk';
import { SelectorOption, interactiveSelect } from '../../utils/selector';
import { DEFAULT_GUIDE_KEY, GUIDE_CHAPTERS, getGuideChapter, renderGuideChapter } from './chapters';

export { DEFAULT_GUIDE_KEY, GUIDE_CHAPTERS, renderGuideChapter };

export function getGuideMenuOptions(currentKey: string): SelectorOption[] {
  return GUIDE_CHAPTERS
    .filter((chapter) => chapter.key !== currentKey)
    .map((chapter) => ({
      label: chapter.key === DEFAULT_GUIDE_KEY ? `主章节：${chapter.title}` : chapter.title,
      value: chapter.key,
      description: chapter.summary,
    }));
}

function getGuideMenuTitle(currentKey: string): string {
  if (currentKey === DEFAULT_GUIDE_KEY) {
    return '选择下一章节（Esc 退出）';
  }
  return `当前章节：${getGuideChapter(currentKey).title}；选择其他章节（Esc 退出）`;
}

function printChapter(key: string): void {
  console.log(chalk.cyan(renderGuideChapter(key)));
}

function printNonInteractiveMenu(currentKey: string): void {
  console.log(chalk.gray('\n继续学习章节：'));
  getGuideMenuOptions(currentKey).forEach((option) => {
    console.log(chalk.gray(`- ${option.label}`));
  });
}

export async function handleGuide(): Promise<void> {
  let currentKey = DEFAULT_GUIDE_KEY;
  printChapter(currentKey);

  if (!process.stdin.isTTY) {
    printNonInteractiveMenu(currentKey);
    return;
  }

  while (true) {
    let selectedKey = '';
    await interactiveSelect({
      title: getGuideMenuTitle(currentKey),
      options: getGuideMenuOptions(currentKey),
      onSelect: (value) => {
        selectedKey = value;
      },
      onCancel: () => {
        selectedKey = '';
      },
    });

    if (!selectedKey) return;
    currentKey = selectedKey;
    console.log('');
    printChapter(currentKey);
  }
}