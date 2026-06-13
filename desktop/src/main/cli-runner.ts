import { spawn } from 'child_process';
import { app } from 'electron';
import * as path from 'path';
import { isAllowedDesktopCommand, normalizeDesktopCommand } from './permissions';

export interface CliRunResult {
  ok: boolean;
  output: string;
}

export function runDesktopCli(command: string): Promise<CliRunResult> {
  const normalized = normalizeDesktopCommand(command);
  if (!isAllowedDesktopCommand(normalized)) {
    return Promise.resolve({ ok: false, output: `Command not allowed: ${command}` });
  }
  const [entrypoint, ...args] = normalized.split(/\s+/).filter(Boolean);

  const cliPath = app.isPackaged
    ? path.join(process.resourcesPath, 'app.asar', 'dist', 'cli', 'index.js')
    : path.resolve(__dirname, '..', '..', '..', 'dist', 'index.js');
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [cliPath, `--${entrypoint}`, ...args], {
      cwd: path.resolve(__dirname, '..', '..', '..'),
      windowsHide: true,
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
    });
    let output = '';
    child.stdout.on('data', (chunk) => { output += chunk.toString('utf8'); });
    child.stderr.on('data', (chunk) => { output += chunk.toString('utf8'); });
    child.on('error', (error) => resolve({ ok: false, output: error.message }));
    child.on('close', (code) => resolve({ ok: code === 0, output }));
  });
}
