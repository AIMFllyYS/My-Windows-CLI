#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { getGithubInfo } from './github';
import { getProjectPaths } from './paths';
import { getCliCommands, getCliByTool } from './cli';
import { getApps } from './apps';
import { startChat } from './chat';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// Load env from known location
const envPath = 'C:/project/1037Solo/StudySolo-Dev/backend/.env';
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const program = new Command();

program
  .name('coding')
  .description('Coding quick command tool - project paths, GitHub status, CLI commands, AI chat')
  .version('1.0.0')
  .option('-s, --short', 'Short output (key info only)')
  .option('-i, --issues', 'Show GitHub issues only')
  .option('-p, --paths', 'Show project paths only')
  .option('-a, --apps', 'Show app launch commands only')
  .option('-c, --cli <tool>', 'Show CLI commands (use: cc, kiro, codex, gemini, cursor, or "all")')
  .option('-t, --task <description>', 'Task description for CLI command generation')
  .option('-C, --chat', 'Start AI chat mode (interactive)')
  .option('-A, --ai', 'Start AI chat mode (alias for --chat)')
  .option('-m, --model <model>', 'AI model (default: deepseek-chat)')
  .action(async (opts) => {
    // Chat mode
    if (opts.chat || opts.ai) {
      await startChat(opts.model);
      return;
    }

    const isShort = opts.short || false;
    const showPaths = opts.paths || false;
    const showApps = opts.apps || false;
    const showIssues = opts.issues || false;
    const cliTool = opts.cli || null;
    const taskDesc = opts.task || null;

    // If specific CLI tool requested
    if (cliTool) {
      const toolMap: Record<string, string> = {
        '-cc': 'claude',
        'cc': 'claude',
        '-kiro': 'kiro',
        'kiro': 'kiro',
        '-codex': 'codex',
        'codex': 'codex',
        '-gemini': 'gemini',
        'gemini': 'gemini',
        '-cursor': 'cursor',
        'cursor': 'cursor'
      };
      const tool = toolMap[cliTool] || cliTool;
      if (tool === 'all') {
        console.log(chalk.bold('\n=== CLI Auto Commands ===\n'));
        console.log(getCliCommands(taskDesc));
      } else {
        console.log(chalk.bold(`\n=== ${tool.toUpperCase()} CLI ===\n`));
        console.log(getCliByTool(tool, taskDesc));
      }
      return;
    }

    // Specific filters
    if (showPaths) {
      console.log(chalk.bold('\n=== Project Paths ===\n'));
      console.log(getProjectPaths());
      return;
    }

    if (showApps) {
      console.log(chalk.bold('\n=== App Launch Commands ===\n'));
      console.log(getApps());
      return;
    }

    if (showIssues) {
      console.log(chalk.bold('\n=== GitHub Issues ===\n'));
      await getGithubInfo(true);
      return;
    }

    // Full output
    console.log(chalk.bold.cyan(`
╔══════════════════════════════════════════════════════════════╗
║                    CODING CLI v1.0.0                         ║
╚══════════════════════════════════════════════════════════════╝
    `));

    // 1. Project Paths
    console.log(chalk.bold('\n📁 Project Paths'));
    console.log(getProjectPaths());

    // 2. GitHub Info
    console.log(chalk.bold('\n🐙 GitHub Status'));
    await getGithubInfo(isShort);

    // 3. CLI Commands
    console.log(chalk.bold('\n⚡ CLI Auto Commands'));
    console.log(getCliCommands(taskDesc));

    // 4. App Launch
    console.log(chalk.bold('\n🚀 App Launch Commands'));
    console.log(getApps());

    console.log(chalk.bold.cyan('\n╔══════════════════════════════════════════════════════════════╗'));
    console.log(chalk.bold.cyan('║  Usage: coding [options]                                       ║'));
    console.log(chalk.bold.cyan('║    --short    Short output                                     ║'));
    console.log(chalk.bold.cyan('║    --paths    Project paths only                              ║'));
    console.log(chalk.bold.cyan('║    --apps     App launch commands only                         ║'));
    console.log(chalk.bold.cyan('║    --issues   GitHub issues only                              ║'));
    console.log(chalk.bold.cyan('║    --cli cc   Claude Code CLI only                            ║'));
    console.log(chalk.bold.cyan('║    --cli kiro Kiro CLI only                                  ║'));
    console.log(chalk.bold.cyan('║    --cli all  All CLI Auto commands                           ║'));
    console.log(chalk.bold.cyan('║    --chat     Start AI chat mode                              ║'));
    console.log(chalk.bold.cyan('║    --ai       Alias for --chat                               ║'));
    console.log(chalk.bold.cyan('║    --task     Add task description                             ║'));
    console.log(chalk.bold.cyan('╚══════════════════════════════════════════════════════════════╝\n'));
  });

program.parse(process.argv);
