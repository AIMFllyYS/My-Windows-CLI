import * as fs from 'fs';
import * as path from 'path';
import { isDangerousPath, PermissionDecision, resolveWorkspacePath } from '../permissions/engine';

export function writeFileTool(input: {
  path: string;
  content: string;
  workspaceRoot: string;
  permissionDecision?: PermissionDecision;
}): string {
  if (input.permissionDecision?.decision !== 'allow') return 'Error: permission required';
  const resolved = resolveWorkspacePath(input.workspaceRoot, input.path);
  if (isDangerousPath(input.workspaceRoot, resolved)) return 'Error: path outside workspace';
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, input.content, 'utf8');
  return 'OK';
}
