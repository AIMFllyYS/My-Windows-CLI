import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { loadConfig, saveConfig, getProjectRoot } from '../utils/config';

// In-memory cache for project scanning (30s TTL)
const scanCache = new Map<string, { projects: ProjectInfo[]; timestamp: number }>();
const CACHE_TTL = 30000;

/**
 * Prompt user to set project root on first run. Returns the configured path.
 */
export async function ensureProjectRoot(): Promise<string> {
  const existing = getProjectRoot();
  if (existing && fs.existsSync(existing)) return existing;

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q: string): Promise<string> => new Promise(r => rl.question(q, r));

  console.log(chalk.bold.yellow('\n⚙️  首次运行配置 / First Run Setup'));
  console.log(chalk.gray('  请设置存放项目的主文件夹路径'));
  console.log(chalk.gray('  Please set the root folder that contains your projects\n'));

  let root = '';
  while (!root) {
    const input = (await ask(chalk.cyan('  项目主文件夹路径 (e.g. C:/project): '))).trim().replace(/\\/g, '/').replace(/\/+$/, '');
    if (input && fs.existsSync(input)) {
      root = input;
    } else {
      console.log(chalk.red('  路径不存在，请重新输入 / Path does not exist'));
    }
  }

  const config = loadConfig();
  config.projectRoot = root;
  saveConfig(config);
  console.log(chalk.green(`\n  ✅ 已保存: ${root}\n`));
  rl.close();
  return root;
}

interface ProjectInfo {
  name: string;
  path: string;
  description: string;
}

function scanProjects(projectRoot: string): ProjectInfo[] {
  const cached = scanCache.get(projectRoot);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.projects;
  }

  const projects: ProjectInfo[] = [];
  const excludeDirs = ['node_modules', '.git', '.next', 'dist', 'build', '.cache', '__pycache__', 'venv', '.venv', '.env'];

  try {
    const entries = fs.readdirSync(projectRoot, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (excludeDirs.some(d => entry.name.toLowerCase().includes(d.toLowerCase()))) continue;

      const fullPath = path.join(projectRoot, entry.name);

      // Try to get description from package.json or README
      let description = '';
      const pkgPath = path.join(fullPath, 'package.json');
      const readmePath = path.join(fullPath, 'README.md');

      if (fs.existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
          description = pkg.description || pkg.name || '';
        } catch {}
      }

      if (!description && fs.existsSync(readmePath)) {
        const content = fs.readFileSync(readmePath, 'utf-8');
        const firstLine = content.split('\n').find(l => l.trim() && !l.startsWith('#'));
        if (firstLine) description = firstLine.trim().substring(0, 60);
      }

      projects.push({
        name: entry.name,
        path: fullPath.replace(/\\/g, '/'),
        description: description || ''
      });
    }
  } catch (error) {
    console.log(chalk.red(`Error scanning projects: ${error}`));
  }

  const sorted = projects.sort((a, b) => a.name.localeCompare(b.name));
  scanCache.set(projectRoot, { projects: sorted, timestamp: Date.now() });
  return sorted;
}

export function getProjectPaths(projectRoot?: string): string {
  const root = projectRoot || getProjectRoot();
  if (!root) {
    return chalk.yellow('  未配置项目路径，请运行 coding 进行初始化配置');
  }

  const projects = scanProjects(root);

  if (projects.length === 0) {
    return chalk.gray('  No projects found');
  }

  let output = '';
  for (const proj of projects) {
    output += chalk.green(`\n  📂 ${proj.name}`);
    output += chalk.gray(`\n     ${proj.path}`);
    if (proj.description) {
      output += chalk.gray(`\n     ${proj.description}`);
    }
  }

  return output;
}
