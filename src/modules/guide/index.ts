import chalk from 'chalk';
import { interactiveSelect } from '../../utils/selector';
import { DEFAULT_GUIDE_KEY, GUIDE_CHAPTERS, renderGuideChapter } from './chapters';

export { DEFAULT_GUIDE_KEY, GUIDE_CHAPTERS, renderGuideChapter };

export async function handleGuide(): Promise<void> {
  console.log(chalk.cyan(renderGuideChapter(DEFAULT_GUIDE_KEY)));

  const chapters = GUIDE_CHAPTERS.filter((chapter) => chapter.key !== DEFAULT_GUIDE_KEY);
  if (!process.stdin.isTTY) {
    console.log(chalk.gray('\n继续学习章节：'));
    chapters.forEach((chapter) => console.log(chalk.gray(`- ${chapter.title}`)));
    return;
  }

  await interactiveSelect({
    title: '选择下一章节',
    options: chapters.map((chapter) => ({
      label: chapter.title,
      value: chapter.key,
      description: chapter.summary,
    })),
    onSelect: (value) => {
      console.log('');
      console.log(chalk.cyan(renderGuideChapter(value)));
    },
  });
}
