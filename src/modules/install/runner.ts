import { execSync } from 'child_process';
import * as readline from 'readline';
import chalk from 'chalk';
import { InstallTarget } from './types';
import { commandForPlatform, missingRequirements } from './environment';

function askConfirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`${message} [Y/n] `, (answer) => {
      rl.close();
      resolve(answer.trim() === '' || /^y$/i.test(answer.trim()));
    });
  });
}

function openUrl(url: string): void {
  const command = process.platform === 'win32'
    ? `start "" "${url}"`
    : process.platform === 'darwin'
      ? `open "${url}"`
      : `xdg-open "${url}"`;
  execSync(command, { stdio: 'ignore' });
}

export async function runInstallTarget(target: InstallTarget, latest = false): Promise<void> {
  console.log(chalk.bold.cyan(`\n${target.displayName}`));
  console.log(chalk.gray(target.description));
  if (target.notes) {
    console.log(chalk.gray(target.notes));
  }
  console.log(chalk.gray(`Source: ${target.sourceUrl}`));

  if (target.opensUrlOnly) {
    const url = target.installUrl || target.sourceUrl;
    console.log(chalk.yellow(`\nThis target opens the official page: ${url}`));
    if (await askConfirm('Open it now?')) openUrl(url);
    return;
  }

  const missing = missingRequirements(target.requirements);
  if (missing.length > 0) {
    console.log(chalk.yellow('\nMissing requirements:'));
    for (const requirement of missing) {
      console.log(chalk.yellow(`- ${requirement.name}: ${requirement.installHint}`));
    }
    return;
  }

  if (latest && target.versionCommand) {
    console.log(chalk.gray(`\nCurrent version check: ${target.versionCommand}`));
    try {
      execSync(target.versionCommand, { stdio: 'inherit' });
    } catch {
      console.log(chalk.yellow('Version command failed; the tool may not be installed yet.'));
    }
  }

  const command = latest && target.updateCommand
    ? target.updateCommand
    : commandForPlatform(target.commands);

  if (!command) {
    console.log(chalk.red('No supported install command for this platform.'));
    return;
  }

  console.log(chalk.cyan(`\nInstall command:\n${command}`));
  if (await askConfirm('Run this command?')) {
    execSync(command, { stdio: 'inherit' });
  }
}
