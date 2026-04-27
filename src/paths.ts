import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = 'C:/project';

interface ProjectInfo {
  name: string;
  path: string;
  description: string;
}

function scanProjects(): ProjectInfo[] {
  const projects: ProjectInfo[] = [];
  const excludeDirs = ['node_modules', '.git', '.next', 'dist', 'build', '.cache', '__pycache__', 'venv', '.venv', '.env'];

  try {
    const entries = fs.readdirSync(PROJECT_ROOT, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (excludeDirs.some(d => entry.name.toLowerCase().includes(d.toLowerCase()))) continue;

      const fullPath = path.join(PROJECT_ROOT, entry.name);

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

  return projects.sort((a, b) => a.name.localeCompare(b.name));
}

export function getProjectPaths(): string {
  const projects = scanProjects();

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
