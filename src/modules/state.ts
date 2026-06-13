import chalk from 'chalk';
import { renderHomeHeader } from './home';
import { getGitHubInfo } from './github';
import { getProjectPaths, ensureProjectRoot } from './paths';
import { getCliCommands } from './cli';
import { getApps } from './apps';

export async function runStatePage(task: string | undefined, version: string): Promise<void> {
  console.log(renderHomeHeader(version));

  const projectRoot = await ensureProjectRoot();

  console.log(chalk.bold('\nGitHub Status'));
  await getGitHubInfo({ showAccounts: true, showIssues: true });

  console.log(chalk.bold('\nProject Paths'));
  console.log(getProjectPaths(projectRoot));

  console.log(chalk.bold('\nCLI Auto Commands'));
  console.log(getCliCommands(task));

  console.log(chalk.bold('\nApp Launch Commands'));
  console.log(getApps());

  console.log(chalk.bold.cyan('\nUsage: hi [options]'));
  console.log(chalk.cyan('  --state       Show GitHub, project paths, CLI commands, and app status'));
  console.log(chalk.cyan('  --install     Install AI CLI tools, AI IDEs, and proxy environment tools'));
  console.log(chalk.cyan('  --skills      Install AI workflow skills'));
  console.log(chalk.cyan('  --api         Open AI provider API guide'));
  console.log(chalk.cyan('  --pay         Open payment, card, and relay resource guide'));
}
