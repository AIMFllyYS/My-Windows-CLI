import { shell } from 'electron';
import { runDesktopCli } from './cli-runner';

export type DesktopInstallCategory = 'cli' | 'ide' | 'environment';

export interface DesktopInstallTarget {
  key: string;
  displayName: string;
  category: DesktopInstallCategory;
  description: string;
  sourceUrl: string;
  installUrl?: string;
  opensUrlOnly?: boolean;
  requiresConfirmation: true;
}

export interface DesktopInstallRunRequest {
  key: string;
  latest?: boolean;
  confirm?: boolean;
}

export interface DesktopInstallRunResult {
  ok: boolean;
  output: string;
  requiresConfirmation?: boolean;
}

const DESKTOP_INSTALL_TARGETS: DesktopInstallTarget[] = [
  {
    key: 'cc',
    displayName: 'Claude Code',
    category: 'cli',
    description: 'Anthropic Claude Code CLI.',
    sourceUrl: 'https://code.claude.com/docs/en/overview',
    requiresConfirmation: true,
  },
  {
    key: 'codex',
    displayName: 'OpenAI Codex CLI',
    category: 'cli',
    description: 'OpenAI command line coding agent.',
    sourceUrl: 'https://developers.openai.com/codex/cli',
    requiresConfirmation: true,
  },
  {
    key: 'kimi',
    displayName: 'Kimi Code',
    category: 'cli',
    description: 'Moonshot AI Kimi Code CLI.',
    sourceUrl: 'https://platform.moonshot.ai/docs/guide/kimi-cli-support',
    requiresConfirmation: true,
  },
  {
    key: 'vscode',
    displayName: 'Visual Studio Code',
    category: 'ide',
    description: 'Microsoft VS Code download page.',
    sourceUrl: 'https://code.visualstudio.com/download',
    installUrl: 'https://code.visualstudio.com/download',
    opensUrlOnly: true,
    requiresConfirmation: true,
  },
  {
    key: 'cursor',
    displayName: 'Cursor',
    category: 'ide',
    description: 'Cursor AI editor download page.',
    sourceUrl: 'https://cursor.com/download',
    installUrl: 'https://cursor.com/download',
    opensUrlOnly: true,
    requiresConfirmation: true,
  },
  {
    key: 'clash-verge',
    displayName: 'Clash Verge - Windows',
    category: 'environment',
    description: 'Windows proxy client download.',
    sourceUrl: 'https://www.sibker.com/client/Clash.Verge_2.4.7_x64-setup.exe',
    installUrl: 'https://www.sibker.com/client/Clash.Verge_2.4.7_x64-setup.exe',
    opensUrlOnly: true,
    requiresConfirmation: true,
  },
];

export function listDesktopInstallTargets(): DesktopInstallTarget[] {
  return DESKTOP_INSTALL_TARGETS;
}

export async function runDesktopInstallTarget(request: DesktopInstallRunRequest): Promise<DesktopInstallRunResult> {
  const target = DESKTOP_INSTALL_TARGETS.find((item) => item.key === request.key);
  if (!target) return { ok: false, output: `Unknown install target: ${request.key}` };

  if (request.confirm !== true) {
    return {
      ok: false,
      requiresConfirmation: true,
      output: `Confirm before installing ${target.displayName}.`,
    };
  }

  if (target.opensUrlOnly) {
    const url = target.installUrl || target.sourceUrl;
    await shell.openExternal(url);
    return { ok: true, output: `Opened ${url}` };
  }

  const latest = request.latest ? ' latest' : '';
  return runDesktopCli(`install ${target.key}${latest}`);
}
