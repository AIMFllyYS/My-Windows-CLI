import { AiMode, PermissionMode } from '../session';
import { getModeConfig } from '../modes';
import { line, truncateVisible, ui, UI_WIDTH, visibleLength } from './theme';

export interface StatusHeaderInput {
  project: string;
  mode: AiMode;
  permissionMode: PermissionMode;
  model: string;
  activeSkills?: number;
  runningSubagents?: number;
}

export interface PermissionBoxInput {
  tool: string;
  action: 'allow' | 'ask' | 'deny';
  reason: string;
}

export interface TimelineEntryInput {
  kind: 'tool' | 'subagent' | 'search' | 'model';
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  label: string;
  detail?: string;
}

export function renderModePill(mode: AiMode, permissionMode: PermissionMode): string {
  const config = getModeConfig(mode);
  const label = `[${config.symbol} ${config.shortTitle}]`;
  const suffix = permissionMode === 'bypass'
    ? ' bypass'
    : permissionMode === 'plan'
      ? ' no edits'
      : ` ${config.hint}`;
  const text = `${label}${suffix}`;
  if (config.color === 'plan') return ui.accent(text);
  if (config.color === 'permission') return ui.warning(text);
  if (config.color === 'danger') return ui.danger(text);
  return ui.strong(text);
}

export function renderStatusHeader(input: StatusHeaderInput): string {
  const title = `${ui.brand('0-1 CLI')} ${ui.muted('·')} ${ui.strong(truncateVisible(input.project, 28))}`;
  const meta = [
    renderModePill(input.mode, input.permissionMode),
    `model ${truncateVisible(input.model, 10)}`,
    `技能 ${input.activeSkills || 0}`,
    `子任务 ${input.runningSubagents || 0}`,
  ].join('  ');

  return [
    '',
    `  ${truncateVisible(title, UI_WIDTH)}`,
    `  ${ui.muted(truncateVisible(meta, UI_WIDTH))}`,
    `  ${line(UI_WIDTH)}`,
  ].join('\n');
}

export function renderPermissionBox(input: PermissionBoxInput): string {
  const actionColor = input.action === 'allow' ? ui.success : input.action === 'deny' ? ui.danger : ui.warning;
  return [
    '',
    `  ${ui.warning('Permission')} ${actionColor(input.action.toUpperCase())}`,
    `  ${line(48)}`,
    `  tool   ${ui.strong(truncateVisible(input.tool, 40))}`,
    `  reason ${ui.muted(truncateVisible(input.reason, 56))}`,
    `  ${ui.success('[允许]')}  ${ui.danger('[拒绝]')}  ${ui.muted('[本次会话记住]')}`,
  ].join('\n');
}

export function renderTimelineEntry(input: TimelineEntryInput): string {
  const icon = input.kind === 'subagent' ? '◇' : input.kind === 'tool' ? '◆' : '•';
  const labelText = truncateVisible(input.label, 18);
  const status = input.status === 'completed'
    ? ui.success(input.status)
    : input.status === 'failed' || input.status === 'cancelled'
      ? ui.danger(input.status)
      : ui.warning(input.status);
  const plainPrefix = `  ${icon} ${labelText} ${input.status}`;
  const maxLineWidth = UI_WIDTH + 2;
  const maxDetailWidth = Math.max(0, maxLineWidth - visibleLength(plainPrefix) - 3);
  const detail = input.detail && maxDetailWidth > 0 ? ui.muted(` - ${truncateVisible(input.detail, maxDetailWidth)}`) : '';
  return `  ${ui.muted(icon)} ${ui.strong(labelText)} ${status}${detail}`;
}
