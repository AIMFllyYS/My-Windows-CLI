#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as v8 from 'v8';
import { exec } from 'child_process';

// Limit memory footprint to avoid impacting other apps
v8.setFlagsFromString('--max-old-space-size=64');

// Lower process priority on Windows so CLI never hogs CPU
if (process.platform === 'win32') {
  exec(`wmic process where processid=${process.pid} CALL setpriority "below normal"`, { windowsHide: true });
}

// Load .env from project root (not cwd)
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { displayAccounts, interactiveSwitch, getGitHubInfo } from './modules/github';
import { getProjectPaths, ensureProjectRoot } from './modules/paths';
import { getCliCommands, getCliByTool } from './modules/cli';
import { getApps } from './modules/apps';
import { startChat } from './chat';
import { runClear } from './modules/clear';
import { handleInstall, parseInstallArgs } from './modules/install';
import { handleSkills } from './modules/skills';
import { runStatePage } from './modules/state';
import { handleGuide } from './modules/guide';
import { handleApiGuide } from './modules/api';
import { handlePayGuide } from './modules/pay';

const program = new Command();
const VERSION = '0.6.15';

program
  .name('hi')
  .description('0-1 CLI - AI CLI onboarding and development toolbox')
  .version(VERSION)
  .allowUnknownOption(true)
  // Basic info options
  .option('-s, --short', 'Short output (key info only)')
  .option('--state', 'Show GitHub/project/app status page')
  .option('--paths', 'Show project paths only')
  .option('--apps', 'Show app launch commands only')
  .option('--api', 'Open AI API provider guide')
  .option('--pay', 'Open payment/card/relay resource guide')
  // GitHub options
  .option('-g, --gh', 'Show GitHub accounts and issues')
  .option('--gh-accounts', 'Show GitHub accounts only')
  .option('--gh-switch', 'Interactive GitHub account switcher')
  .option('--gh-issues', 'Show GitHub issues only')
  // CLI reference options
  .option('-c, --cli <tool>', 'Show CLI commands (cc/kiro/codex/gemini/cursor/all)')
  .option('-t, --task <description>', 'Task description for CLI command generation')
  // AI chat options
  .option('-C, --chat', 'Start AI chat mode (interactive)')
  .option('-A, --ai', 'Start AI chat mode (alias for --chat)')
  .option('-m, --model <model>', 'AI model (default: deepseek-chat)')
  // Installer options
  .option('--install [tool]', 'Install AI CLI tools, AI IDEs, or environment tools')
  .option('--skills', 'Open the skills marketplace')
  // Cleanup options
  .option('--clear', '启用清理模式')
  .option('-p, --process', '清理无用后台进程（需配合 --clear）')
  .option('-d, --drive', '清理 C 盘硬盘空间（需配合 --clear）')
  .option('-a, --all', '同时清理进程和硬盘空间（需配合 --clear）')
  .option('--clear-a', '快捷方式：同时清理进程和硬盘空间')
  .action(async (opts) => {
    const rawArgs = process.argv.slice(2);

    if (opts.install !== undefined) {
      await handleInstall(parseInstallArgs(rawArgs));
      return;
    }
    if (opts.skills) {
      await handleSkills();
      return;
    }
    if (opts.state) {
      await runStatePage(opts.task, VERSION);
      return;
    }
    if (opts.api) {
      await handleApiGuide();
      return;
    }
    if (opts.pay) {
      await handlePayGuide();
      return;
    }

    // Clear: unified cleanup entry
    if (opts.clearA || (opts.clear && opts.all)) {
      await runClear('all');
      return;
    }
    if (opts.clear && opts.process) {
      await runClear('process');
      return;
    }
    if (opts.clear && opts.drive) {
      await runClear('drive');
      return;
    }
    if (opts.clear) {
      await runClear('all');
      return;
    }

    // AI Chat mode (takes priority)
    if (opts.chat || opts.ai) {
      await startChat(opts.model);
      return;
    }

    // GitHub account switcher
    if (opts.ghSwitch) {
      await interactiveSwitch();
      return;
    }

    // GitHub accounts only
    if (opts.ghAccounts) {
      displayAccounts();
      return;
    }

    // GitHub issues only
    if (opts.ghIssues) {
      await getGitHubInfo({ showAccounts: false, showIssues: true });
      return;
    }

    // GitHub full info
    if (opts.gh) {
      console.log(chalk.bold.cyan('\n=== GitHub Status ===\n'));
      await getGitHubInfo({ showAccounts: true, showIssues: true });
      return;
    }

    // CLI reference
    if (opts.cli) {
      const toolMap: Record<string, string> = {
        '-cc': 'claude', 'cc': 'claude',
        '-kiro': 'kiro', 'kiro': 'kiro',
        '-codex': 'codex', 'codex': 'codex',
        '-gemini': 'gemini', 'gemini': 'gemini',
        '-cursor': 'cursor', 'cursor': 'cursor',
      };
      const tool = toolMap[opts.cli] || opts.cli;
      if (tool === 'all') {
        console.log(chalk.bold('\n=== CLI Auto Commands ===\n'));
        console.log(getCliCommands(opts.task));
      } else {
        console.log(chalk.bold(`\n=== ${tool.toUpperCase()} CLI ===\n`));
        console.log(getCliByTool(tool, opts.task));
      }
      return;
    }

    // Project paths only
    if (opts.paths) {
      const root = await ensureProjectRoot();
      console.log(chalk.bold('\nProject Paths\n'));
      console.log(getProjectPaths(root));
      return;
    }

    // Apps only
    if (opts.apps) {
      console.log(chalk.bold('\nApp Launch Commands\n'));
      console.log(getApps());
      return;
    }

    if (rawArgs.length > 0) {
      program.outputHelp();
      return;
    }

    await handleGuide(VERSION);
  });

program.parse(process.argv);
