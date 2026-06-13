import { execFile } from 'child_process';
import { isDangerousPath, PermissionDecision, resolveExistingWorkspacePath, resolveWorkspacePath } from '../permissions/engine';

export function runShellTool(input: {
  command: string;
  args?: string[];
  cwd: string;
  workspaceRoot: string;
  permissionDecision?: PermissionDecision;
}): Promise<string> {
  if (input.permissionDecision?.decision !== 'allow') return Promise.resolve('Error: permission required');
  const cwd = resolveWorkspacePath(input.workspaceRoot, input.cwd);
  if (isDangerousPath(input.workspaceRoot, cwd)) return Promise.resolve('Error: cwd outside workspace');
  const realCwd = resolveExistingWorkspacePath(input.workspaceRoot, cwd);
  if (!realCwd) return Promise.resolve('Error: cwd outside workspace');
  return new Promise((resolve) => {
    execFile(input.command, input.args || [], { cwd: realCwd, encoding: 'utf8', timeout: 30000 }, (error, stdout, stderr) => {
      if (error) {
        resolve('Error: ' + (stderr || error.message));
        return;
      }
      resolve(stdout || stderr || '');
    });
  });
}
